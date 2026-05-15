import type {
  User as PrismaUser,
  OrgRole as PrismaOrgRole,
  CollectionImage as PrismaCollectionImage,
} from '@prisma/client';
import {toOrgRole} from '../org-role/mapper';
import type {TeamMember} from './index';

type PrismaUserWithRelations = PrismaUser & {
  orgRole: PrismaOrgRole;
  image: PrismaCollectionImage | null;
};

function ageFromBirthDate(d: Date | null): number | null {
  if (!d) return null;
  const ms = Date.now() - d.getTime();
  const years = ms / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, Math.floor(years));
}

export function toTeamMember(row: PrismaUserWithRelations): TeamMember {
  return {
    id: row.id,
    name: row.name,
    bioVi: row.bioVi,
    bioEn: row.bioEn,
    age: ageFromBirthDate(row.birthDate),
    teamOrder: row.teamOrder,
    role: toOrgRole(row.orgRole),
    photo: row.image
      ? {url: row.image.url, altVi: row.image.altVi, altEn: row.image.altEn}
      : null,
  };
}
