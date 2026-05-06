// src/data/queries.ts
/**
 * Server-only Prisma queries for data fetching in getStaticProps / getServerSideProps.
 *
 * IMPORTANT: Do NOT import this file from client-side components.
 * It pulls in the Prisma client which depends on Node.js-only modules (pg, tls).
 */
import {prisma} from '@/lib/prisma';
import type {Tour, DestinationWithStats} from '@/domain';
import {toTour} from '@/domain/tour/mapper';
import {toDestination} from '@/domain/destination/mapper';

export async function getAllTours(isAdmin = false): Promise<Tour[]> {
  try {
    const rows = await prisma.tour.findMany({
      where: isAdmin ? {} : {status: {in: ['PUBLISHED', 'FEATURED']}},
      include: {destination: true, highlights: true},
    });
    return rows.map(toTour);
  } catch (error) {
    console.error('getAllTours: DB query failed', error);
    return [];
  }
}

export async function getTourBySlug(
  slug: string,
  isAdmin = false,
): Promise<Tour | undefined> {
  try {
    const row = await prisma.tour.findFirst({
      where: isAdmin ? {slug} : {slug, status: {in: ['PUBLISHED', 'FEATURED']}},
      include: {destination: true, highlights: true},
    });
    return row ? toTour(row) : undefined;
  } catch (error) {
    console.error('getTourBySlug: DB query failed', error);
    return undefined;
  }
}

export async function getAllTourSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.tour.findMany({
      where: {status: {in: ['PUBLISHED', 'FEATURED']}},
      select: {slug: true},
    });
    return rows.map((r: {slug: string}) => r.slug);
  } catch (error) {
    console.error('getAllTourSlugs: DB query failed', error);
    return [];
  }
}

export async function getActiveDestinationsFromDb(
  isAdmin = false,
): Promise<DestinationWithStats[]> {
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
    type DestRow = (typeof destinations)[number];
    return destinations
      .filter((d: DestRow) => d.tours.length > 0)
      .map((d: DestRow) => ({
        ...toDestination(d),
        tourCount: d.tours.length,
        hasCar: d.tours.some((t: {transportation: string}) =>
          /car/i.test(t.transportation),
        ),
        hasBike: d.tours.some((t: {transportation: string}) =>
          /motorbike/i.test(t.transportation),
        ),
      }));
  } catch (error) {
    console.error('getActiveDestinationsFromDb: DB query failed', error);
    return [];
  }
}

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
