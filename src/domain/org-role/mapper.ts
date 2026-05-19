import type {OrgRole as PrismaOrgRole} from '@prisma/client';
import type {OrgRole} from './index';

export function toOrgRole(row: PrismaOrgRole): OrgRole {
  return {
    id: row.id,
    key: row.key,
    labelVi: row.labelVi,
    labelEn: row.labelEn,
    order: row.order,
  };
}
