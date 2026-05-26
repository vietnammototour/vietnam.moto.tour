import type {NextAuthOptions} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import {prisma} from './prisma';

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (!nextAuthSecret) {
  throw new Error(
    'NEXTAUTH_SECRET is not set. Configure it in the environment before starting the server.',
  );
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
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
          include: {orgRole: true},
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
      if (user)
        token.orgRoleKey = (user as {orgRoleKey?: string}).orgRoleKey ?? null;
      return token;
    },
    async session({session, token}) {
      session.user = {
        ...session.user,
        id: token.sub as string,
        orgRoleKey: (token.orgRoleKey as string | null) ?? null,
      };
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};
