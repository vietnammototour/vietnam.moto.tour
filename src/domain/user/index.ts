import type {OrgRole} from '../org-role';
import type {TeamPhoto} from '../team-member';

export type UserAdmin = {
  id: string;
  name: string;
  email: string | null;
  bioVi: string;
  bioEn: string;
  birthDate: string | null;
  imageId: string | null;
  isCoreTeam: boolean;
  allowAuth: boolean;
  teamOrder: number;
  orgRole: OrgRole;
  photo: TeamPhoto | null;
};
