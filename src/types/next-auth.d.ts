import 'next-auth';

declare module 'next-auth' {
  interface User {
    orgRoleKey?: string | null;
    roleLabel?: string | null;
    imageUrl?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      orgRoleKey: string | null;
      roleLabel: string | null;
      imageUrl: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    orgRoleKey?: string | null;
    roleLabel?: string | null;
    imageUrl?: string | null;
  }
}
