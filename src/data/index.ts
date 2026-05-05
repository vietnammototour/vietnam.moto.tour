import type {Destination, Tour} from '@/types';
import destinationsJson from './destinations.json';
import toursJson from './tours.json';

// ---------------------------------------------------------------------------
// JSON fallback data (kept for sync helpers used by client components & tests)
// ---------------------------------------------------------------------------

export const destinationsData: Destination[] =
  destinationsJson as Destination[];

export const toursData: Tour[] = toursJson as unknown as Tour[];

// ---------------------------------------------------------------------------
// Sync helpers (used by client-side components like TourCard, TourHero)
// ---------------------------------------------------------------------------

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

/** All tours for a given destination (sync, from JSON) */
export function getToursByDestination(destinationId: number): Tour[] {
  return toursData.filter((t) => t.destinationId === destinationId);
}

/** Only destinations that have >= 1 tour, with computed tour count
 *  and aggregated transport types.
 *  Preserves the original order from destinations.json. */
export function getActiveDestinations(): (Destination & {
  tourCount: number;
  hasCar: boolean;
  hasBike: boolean;
})[] {
  const countMap = new Map<number, number>();
  const carSet = new Set<number>();
  const bikeSet = new Set<number>();
  for (const tour of toursData) {
    countMap.set(
      tour.destinationId,
      (countMap.get(tour.destinationId) ?? 0) + 1,
    );
    if (/car/i.test(tour.transportation)) carSet.add(tour.destinationId);
    if (/motorbike/i.test(tour.transportation)) bikeSet.add(tour.destinationId);
  }

  return destinationsData
    .filter((d) => countMap.has(d.id))
    .map((d) => ({
      ...d,
      tourCount: countMap.get(d.id)!,
      hasCar: carSet.has(d.id),
      hasBike: bikeSet.has(d.id),
    }));
}
