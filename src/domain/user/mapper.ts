import type {
  User as PrismaUser,
  OrgRole as PrismaOrgRole,
  CollectionImage as PrismaCollectionImage,
} from '@prisma/client';
import {toOrgRole} from '../org-role/mapper';
import type {UserAdmin} from './index';

type PrismaUserWithRelations = PrismaUser & {
  orgRole: PrismaOrgRole;
  image: PrismaCollectionImage | null;
};

export function toUserAdmin(row: PrismaUserWithRelations): UserAdmin {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    bioVi: row.bioVi,
    bioEn: row.bioEn,
    birthDate: row.birthDate ? row.birthDate.toISOString() : null,
    imageId: row.imageId,
    isCoreTeam: row.isCoreTeam,
    allowAuth: row.allowAuth,
    teamOrder: row.teamOrder,
    orgRole: toOrgRole(row.orgRole),
    photo: row.image
      ? {url: row.image.url, altVi: row.image.altVi, altEn: row.image.altEn}
      : null,
  };
}
