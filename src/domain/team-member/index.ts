import type {OrgRole} from '../org-role';

export type TeamPhoto = {
  url: string | null;
  altVi: string;
  altEn: string;
};

export type TeamMember = {
  id: string;
  name: string;
  bioVi: string;
  bioEn: string;
  age: number | null;
  teamOrder: number;
  role: OrgRole;
  photo: TeamPhoto | null;
};
