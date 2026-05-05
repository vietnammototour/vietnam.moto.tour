/**
 * Server-only Prisma queries for data fetching in getStaticProps / getServerSideProps.
 *
 * IMPORTANT: Do NOT import this file from client-side components.
 * It pulls in the Prisma client which depends on Node.js-only modules (pg, tls).
 * Pages should import these functions only inside getStaticProps / getStaticPaths.
 */
import type {Destination, Tour} from '@/types';
import {prisma} from '@/lib/prisma';
import {toursData, destinationsData} from '@/data';

// ---------------------------------------------------------------------------
// DB row -> frontend type converters
// ---------------------------------------------------------------------------

type DbTour = {
  id: string;
  slug: string;
  status: string;
  title: string;
  imageUrl: string;
  price: number;
  duration: number;
  distance: number;
  destinationId: string;
  descriptionVi: string;
  descriptionEn: string;
  transportation: string;
  groupSize: number;
  hotel: string;
  guided: string;
  images: unknown;
  itinerary: unknown;
  pricingGroups: unknown;
  included: unknown;
  excluded: unknown;
  paymentDetails: unknown;
  notes: unknown;
  mealsInfo: unknown;
};

type DbDestination = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  heroImage: string;
  size: string;
};

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

function dbTourToTour(
  row: DbTour & {
    highlights?: Array<{
      id: string;
      destinationId: string;
      textEn: string;
      textVi: string;
      imageUrl: string | null;
    }>;
  },
  destinationName?: string,
): Tour {
  // Use the JSON numeric destination ID so getDestinationName() works on the client
  const destNumericId = destinationName
    ? (destNameToJsonId.get(destinationName) ?? 0)
    : 0;

  return {
    id: tourSlugToJsonId.get(row.slug) ?? 0,
    title: row.title,
    imageUrl: row.imageUrl,
    price: row.price,
    duration: row.duration,
    distance: row.distance,
    destinationId: destNumericId,
    slug: row.slug,
    status: row.status as Tour['status'],
    description: {en: row.descriptionEn, vi: row.descriptionVi},
    transportation: row.transportation,
    groupSize: row.groupSize,
    hotel: row.hotel,
    guided: row.guided,
    destinationHeroImage: '',
    images: row.images as string[],
    highlights: (row.highlights ?? []).map((h) => ({
      id: h.id,
      destinationId: h.destinationId,
      textEn: h.textEn,
      textVi: h.textVi,
      imageUrl: h.imageUrl,
    })),
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

/** All active tours from DB */
export async function getAllTours(isAdmin = false): Promise<Tour[]> {
  try {
    const rows = await prisma.tour.findMany({
      where: isAdmin ? {} : {status: {in: ['PUBLISHED', 'FEATURED']}},
      include: {destination: true, highlights: true},
    });

    return rows.map((row: any) => {
      const tour = dbTourToTour(row as unknown as DbTour, row.destination.name);
      tour.destinationHeroImage = row.destination.heroImage ?? '';
      return tour;
    });
  } catch (error) {
    console.error('getAllTours: DB query failed', error);
    return [];
  }
}

/** Single tour by slug from DB */
export async function getTourBySlug(
  slug: string,
  isAdmin = false,
): Promise<Tour | undefined> {
  try {
    const row = await prisma.tour.findFirst({
      where: isAdmin ? {slug} : {slug, status: {in: ['PUBLISHED', 'FEATURED']}},
      include: {destination: true, highlights: true},
    });
    if (!row) return undefined;
    const tour = dbTourToTour(row as unknown as DbTour, row.destination.name);
    tour.destinationHeroImage = row.destination.heroImage ?? '';
    return tour;
  } catch (error) {
    console.error('getTourBySlug: DB query failed', error);
    return undefined;
  }
}

/** All tour slugs (for getStaticPaths) */
export async function getAllTourSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.tour.findMany({
      where: {status: {in: ['PUBLISHED', 'FEATURED']}},
      select: {slug: true},
    });
    return rows.map((r: any) => r.slug);
  } catch (error) {
    console.error('getAllTourSlugs: DB query failed', error);
    return [];
  }
}

/** Active destinations with tour count and transport flags from DB */
export async function getActiveDestinationsFromDb(
  isAdmin = false,
): Promise<
  (Destination & {tourCount: number; hasCar: boolean; hasBike: boolean})[]
> {
  try {
    const tourFilter = isAdmin
      ? {}
      : {status: {in: ['PUBLISHED' as const, 'FEATURED' as const]}};
    const destinations = await prisma.destination.findMany({
      where: {isActive: true},
      include: {
        tours: {
          where: tourFilter,
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
    console.error('getActiveDestinationsFromDb: DB query failed', error);
    return [];
  }
}

/** Load translations from DB, reconstructing the nested structure next-intl expects */
export async function getMessagesFromDb(
  locale: string,
): Promise<Record<string, unknown> | null> {
  try {
    const rows = await prisma.translation.findMany();
    if (rows.length === 0) {
      console.warn('getMessagesFromDb: Translation table is empty');
      return {};
    }

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
    return {};
  }
}
