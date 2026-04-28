import type {Destination, Tour} from '@/types';
import destinationsJson from './destinations.json';
import toursJson from './tours.json';

// Destinations data
export const destinationsData: Destination[] =
  destinationsJson as Destination[];

// Tours data
// TODO(Task 2): migrate tours.json from `pricing` to `pricingGroups` and remove the `unknown` cast
export const toursData: Tour[] = toursJson as unknown as Tour[];
