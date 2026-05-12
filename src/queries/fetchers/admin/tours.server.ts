// Server-only — never import from src/queries/admin/*.ts.
// Imported only from getServerSideProps prefetch flows.
import {getToursForAdmin, getTourByIdForAdmin} from '@/data/queries';

export const fetchToursServer = (filters: {archived?: boolean} = {}) =>
  getToursForAdmin(filters);

export const fetchTourServer = (id: string) => getTourByIdForAdmin(id);
