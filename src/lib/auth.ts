import type {NextAuthOptions} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import {prisma} from './prisma';

export const authOptions: NextAuthOptions = {
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
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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
        token.role = user.role;
        token.userId = user.id;
      }
      return token;
    },
    async session({session, token}) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};
