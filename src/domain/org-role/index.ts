import type {OrgRole as PrismaOrgRole} from '@prisma/client';

export type OrgRole = Omit<PrismaOrgRole, 'createdAt'>;
