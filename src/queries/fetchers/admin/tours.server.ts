// Server-only — never import from src/queries/admin/*.ts.
// Imported only from getServerSideProps prefetch flows.
import {getToursForAdmin, getTourByIdForAdmin} from '@/data/queries';

// JSON round-trip mirrors res.json() behavior on the API route — converts
// Date/Decimal/etc. to JSON-serializable forms so dehydrated cache matches
// what the client-side fetcher receives.
const serialize = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const fetchToursServer = async (filters: {archived?: boolean} = {}) =>
  serialize(await getToursForAdmin(filters));

export const fetchTourServer = async (id: string) =>
  serialize(await getTourByIdForAdmin(id));
