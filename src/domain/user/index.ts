import type {User as PrismaUser, Role as PrismaRole} from '@prisma/client';

export type Role = PrismaRole;

export type User = Omit<
  PrismaUser,
  'passwordHash' | 'updatedAt' | 'createdAt'
> & {
  createdAt: string;
};
