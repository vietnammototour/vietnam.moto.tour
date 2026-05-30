import type {NextAuthOptions} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import {prisma} from './prisma';

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (!nextAuthSecret) {
  // Module-load must not throw — that breaks `next build` page-data
  // collection and `next dev` route compilation in worktrees that
  // don't pre-load the env. NextAuth itself raises a clear error at
  // request time if the secret is missing when actually verifying a
  // JWT, so the credential flow still fails loudly when misconfigured.
  console.warn(
    '[auth] NEXTAUTH_SECRET is not set. Sign-in will fail until it is configured.',
  );
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret ?? '',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {label: 'Email', type: 'email'},
        password: {label: 'Password', type: 'password'},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: {email: credentials.email},
          include: {orgRole: true, image: true},
        });

        if (!user) return null;
        if (!user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!isValid) return null;
        if (!user.allowAuth) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          orgRoleKey: user.orgRole?.key ?? null,
          roleLabel: user.orgRole?.labelEn ?? user.orgRole?.key ?? null,
          imageUrl: user.image?.url ?? null,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({token, user}) {
      if (user) {
        const u = user as {
          orgRoleKey?: string | null;
          roleLabel?: string | null;
          imageUrl?: string | null;
        };
        token.orgRoleKey = u.orgRoleKey ?? null;
        token.roleLabel = u.roleLabel ?? null;
        token.imageUrl = u.imageUrl ?? null;
      } else if (token.sub) {
        // Subsequent requests: refresh volatile fields (avatar, role) from DB
        // so changes appear without forcing a re-login. Tokens minted before an
        // avatar was attached would otherwise keep a stale null imageUrl.
        const fresh = await prisma.user.findUnique({
          where: {id: token.sub},
          select: {
            orgRole: {select: {key: true, labelEn: true}},
            image: {select: {url: true}},
          },
        });
        if (fresh) {
          token.orgRoleKey = fresh.orgRole?.key ?? null;
          token.roleLabel = fresh.orgRole?.labelEn ?? fresh.orgRole?.key ?? null;
          token.imageUrl = fresh.image?.url ?? null;
        }
      }
      return token;
    },
    async session({session, token}) {
      session.user = {
        ...session.user,
        id: token.sub as string,
        orgRoleKey: (token.orgRoleKey as string | null) ?? null,
        roleLabel: (token.roleLabel as string | null) ?? null,
        imageUrl: (token.imageUrl as string | null) ?? null,
      };
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};
