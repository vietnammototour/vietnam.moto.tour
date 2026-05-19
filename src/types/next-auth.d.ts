import 'next-auth';

declare module 'next-auth' {
  interface User {
    orgRoleKey?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      orgRoleKey: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    orgRoleKey?: string | null;
  }
}
