/**
 * Server-only Prisma queries for data fetching in getStaticProps / getServerSideProps.
 *
 * IMPORTANT: Do NOT import this file from client-side components.
 * It pulls in the Prisma client which depends on Node.js-only modules (pg, tls).
 * Pages should import these functions only inside getStaticProps / getStaticPaths.
 */
import type {Destination, Tour} from '@/types';
import {prisma} from '@/lib/prisma';
import {toursData, destinationsData, getActiveDestinations} from '@/data';

// ---------------------------------------------------------------------------
// DB row -> frontend type converters
// ---------------------------------------------------------------------------

interface DbTour {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  rating: string;
  price: number;
  duration: string;
  distance: string;
  destinationId: string;
  descriptionVi: string;
  descriptionEn: string;
  transportation: string;
  groupSize: string;
  hotel: string;
  guided: string;
  images: unknown;
  highlights: unknown;
  itinerary: unknown;
  pricingGroups: unknown;
  included: unknown;
  excluded: unknown;
  paymentDetails: unknown;
  notes: unknown;
  mealsInfo: unknown;
}

interface DbDestination {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  heroImage: string;
  size: string;
}

// Build lookup maps from JSON data for mapping DB UUIDs back to JSON numeric IDs.
// This ensures components using sync helpers (getDestinationName, etc.) keep working.
const destNameToJsonId = new Map<string, number>();
for (const d of destinationsData) {
  destNameToJsonId.set(d.name, d.id);
}

const tourSlugToJsonId = new Map<string, number>();
for (const t of toursData) {
  tourSlugToJsonId.set(t.slug, t.id);
}

function dbTourToTour(row: DbTour, destinationName?: string): Tour {
  // Use the JSON numeric destination ID so getDestinationName() works on the client
  const destNumericId = destinationName
    ? (destNameToJsonId.get(destinationName) ?? 0)
    : 0;

  return {
    id: tourSlugToJsonId.get(row.slug) ?? 0,
    title: row.title,
    imageUrl: row.imageUrl,
    rating: row.rating,
    price: row.price,
    duration: row.duration,
    distance: row.distance,
    destinationId: destNumericId,
    slug: row.slug,
    description: {en: row.descriptionEn, vi: row.descriptionVi},
    transportation: row.transportation,
    groupSize: row.groupSize,
    hotel: row.hotel,
    guided: row.guided,
    destinationHeroImage: '',
    images: row.images as string[],
    highlights: row.highlights as Tour['highlights'],
    itinerary: row.itinerary as Tour['itinerary'],
    pricingGroups: row.pricingGroups as Tour['pricingGroups'],
    included: row.included as Tour['included'],
    excluded: row.excluded as Tour['excluded'],
    paymentDetails: row.paymentDetails as Tour['paymentDetails'],
    notes: row.notes as Tour['notes'],
    mealsInfo: row.mealsInfo as Tour['mealsInfo'],
  };
}

function dbDestToDestination(row: DbDestination): Destination {
  return {
    id: destNameToJsonId.get(row.name) ?? 0,
    name: row.name,
    imageUrl: row.imageUrl,
    heroImage: row.heroImage ?? '',
    size: row.size as 'small' | 'large',
  };
}

// ---------------------------------------------------------------------------
// Async Prisma queries (server-side only, with JSON fallback)
// ---------------------------------------------------------------------------

/** All active tours from DB, falling back to JSON on error */
export async function getAllTours(): Promise<Tour[]> {
  try {
    const rows = await prisma.tour.findMany({
      where: {isActive: true},
      include: {destination: true},
    });

    return rows.map((row: any) => {
      const tour = dbTourToTour(row as unknown as DbTour, row.destination.name);
      tour.destinationHeroImage = row.destination.heroImage ?? '';
      return tour;
    });
  } catch (error) {
    console.error('getAllTours: DB query failed, using JSON fallback', error);
    return toursData.map((t) => ({...t, destinationHeroImage: ''}));
  }
}

/** Single tour by slug from DB */
export async function getTourBySlug(slug: string): Promise<Tour | undefined> {
  try {
    const row = await prisma.tour.findUnique({
      where: {slug, isActive: true},
      include: {destination: true},
    });
    if (!row) return undefined;
    const tour = dbTourToTour(row as unknown as DbTour, row.destination.name);
    tour.destinationHeroImage = row.destination.heroImage ?? '';
    return tour;
  } catch (error) {
    console.error('getTourBySlug: DB query failed, using JSON fallback', error);
    const fallback = toursData.find((t) => t.slug === slug);
    if (fallback) return {...fallback, destinationHeroImage: ''};
    return undefined;
  }
}

/** All tour slugs (for getStaticPaths) */
export async function getAllTourSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.tour.findMany({
      where: {isActive: true},
      select: {slug: true},
    });
    return rows.map((r: any) => r.slug);
  } catch (error) {
    console.error(
      'getAllTourSlugs: DB query failed, using JSON fallback',
      error,
    );
    return toursData.map((t) => t.slug);
  }
}

/** Active destinations with tour count and transport flags from DB */
export async function getActiveDestinationsFromDb(): Promise<
  (Destination & {tourCount: number; hasCar: boolean; hasBike: boolean})[]
> {
  try {
    const destinations = await prisma.destination.findMany({
      where: {isActive: true},
      include: {
        tours: {
          where: {isActive: true},
          select: {transportation: true},
        },
      },
    });

    return destinations
      .filter((d: any) => d.tours.length > 0)
      .map((d: any) => ({
        ...dbDestToDestination(d as unknown as DbDestination),
        tourCount: d.tours.length,
        hasCar: d.tours.some((t: any) => /car/i.test(t.transportation)),
        hasBike: d.tours.some((t: any) => /motorbike/i.test(t.transportation)),
      }));
  } catch (error) {
    console.error(
      'getActiveDestinationsFromDb: DB query failed, using JSON fallback',
      error,
    );
    return getActiveDestinations();
  }
}

/** Load translations from DB, reconstructing the nested structure next-intl expects */
export async function getMessagesFromDb(
  locale: string,
): Promise<Record<string, unknown> | null> {
  try {
    const rows = await prisma.translation.findMany();
    if (rows.length === 0) return null;

    const valueKey = locale === 'en' ? 'valueEn' : 'valueVi';
    const messages: Record<string, unknown> = {};

    for (const row of rows) {
      if (!messages[row.namespace]) {
        messages[row.namespace] = {};
      }

      const parts = row.key.split('.');
      let current = messages[row.namespace] as Record<string, unknown>;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
          current[parts[i]] = {};
        }
        current = current[parts[i]] as Record<string, unknown>;
      }

      current[parts[parts.length - 1]] =
        (row as Record<string, unknown>)[valueKey] ?? '';
    }

    return messages;
  } catch (error) {
    console.error('getMessagesFromDb: DB query failed', error);
    return null;
  }
}
