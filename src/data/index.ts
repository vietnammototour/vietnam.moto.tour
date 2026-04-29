import type {Destination, Tour} from '@/types';
import destinationsJson from './destinations.json';
import toursJson from './tours.json';

// Raw data
export const destinationsData: Destination[] =
  destinationsJson as Destination[];

export const toursData: Tour[] = toursJson as Tour[];

// Helpers

/** Destination lookup by ID */
export function getDestinationById(id: number): Destination | undefined {
  return destinationsData.find((d) => d.id === id);
}

/** Get destination name for display (tour cards, hero, etc.) */
export function getDestinationName(destinationId: number): string {
  const destination = getDestinationById(destinationId);
  if (!destination) {
    console.warn(`Destination with id ${destinationId} not found`);
    return '';
  }
  return destination.name;
}

/** All tours for a given destination */
export function getToursByDestination(destinationId: number): Tour[] {
  return toursData.filter((t) => t.destinationId === destinationId);
}

/** Only destinations that have >= 1 tour, with computed tour count.
 *  Preserves the original order from destinations.json. */
export function getActiveDestinations(): (Destination & {
  tourCount: number;
})[] {
  const countMap = new Map<number, number>();
  for (const tour of toursData) {
    countMap.set(
      tour.destinationId,
      (countMap.get(tour.destinationId) ?? 0) + 1,
    );
  }

  return destinationsData
    .filter((d) => countMap.has(d.id))
    .map((d) => ({...d, tourCount: countMap.get(d.id)!}));
}
