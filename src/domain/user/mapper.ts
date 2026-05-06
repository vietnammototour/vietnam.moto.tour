import type {User as PrismaUser} from '@prisma/client';
import type {User} from './index';

export function toUser(row: PrismaUser): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}
