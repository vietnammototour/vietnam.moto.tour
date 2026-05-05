import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          // Strip surrounding quotes
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

// Strip Prisma-specific query params (like ?schema=public) that pg doesn't understand
const dbUrl = process.env.DATABASE_URL.split('?')[0];
const adapter = new PrismaPg(dbUrl);
const prisma = new PrismaClient({adapter});

interface RawDestination {
  id: number;
  name: string;
  imageUrl: string;
  heroImage: string;
  size: string;
}

interface RawTour {
  id: number;
  title: string;
  imageUrl: string;
  rating: string;
  price: number;
  duration: string;
  distance: string;
  destinationId: number;
  slug: string;
  description: {en: string; vi: string};
  transportation: string;
  groupSize: string;
  hotel: string;
  guided: string;
  images: string[];
  highlights: Array<{en: string; vi: string}>;
  itinerary: unknown[];
  pricingGroups: unknown[];
  included: Array<{en: string; vi: string}>;
  excluded: Array<{en: string; vi: string}>;
  paymentDetails: {en: string; vi: string};
  notes: Array<{en: string; vi: string}>;
  mealsInfo: {en: string; vi: string};
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main(): Promise<void> {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  // Read source data
  const destinations: RawDestination[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'destinations.json'), 'utf-8'),
  );
  const tours: RawTour[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'tours.json'), 'utf-8'),
  );

  console.log(
    `Read ${destinations.length} destinations, ${tours.length} tours`,
  );

  // --- Seed Destinations ---
  const destinationIdMap = new Map<number, string>(); // old numeric ID -> new UUID

  // Build heroImage map: destinationId -> heroImage from first matching tour
  const destHeroImageMap = new Map<number, string>();
  for (const tour of tours) {
    if (!destHeroImageMap.has(tour.destinationId)) {
      destHeroImageMap.set(tour.destinationId, '');
    }
  }

  for (const dest of destinations) {
    const slug = slugify(dest.name);
    const heroImage = dest.heroImage || destHeroImageMap.get(dest.id) || '';
    const created = await prisma.destination.upsert({
      where: {slug},
      update: {},
      create: {
        slug,
        name: dest.name,
        nameVi: dest.name,
        nameEn: dest.name,
        imageUrl: dest.imageUrl,
        heroImage,
        size: dest.size,
      },
    });
    destinationIdMap.set(dest.id, created.id);
    console.log(`  Destination: ${dest.name} -> ${created.id}`);
  }

  console.log(`Seeded ${destinations.length} destinations`);

  // --- Seed Tours ---
  for (const tour of tours) {
    const destinationUuid = destinationIdMap.get(tour.destinationId);
    if (!destinationUuid) {
      console.error(
        `  ERROR: No destination mapping for destinationId=${tour.destinationId} (tour: ${tour.title})`,
      );
      continue;
    }

    await prisma.tour.upsert({
      where: {slug: tour.slug},
      update: {},
      create: {
        slug: tour.slug,
        title: tour.title,
        titleVi: tour.title,
        titleEn: tour.title,
        destinationId: destinationUuid,
        imageUrl: tour.imageUrl,
        rating: tour.rating,
        price: tour.price,
        duration: tour.duration,
        distance: tour.distance,
        descriptionVi: tour.description.vi,
        descriptionEn: tour.description.en,
        transportation: tour.transportation,
        groupSize: tour.groupSize,
        hotel: tour.hotel,
        guided: tour.guided,
        images: tour.images,
        highlights: tour.highlights,
        itinerary: tour.itinerary,
        pricingGroups: tour.pricingGroups,
        included: tour.included,
        excluded: tour.excluded,
        paymentDetails: tour.paymentDetails,
        notes: tour.notes,
        mealsInfo: tour.mealsInfo,
      },
    });
    console.log(`  Tour: ${tour.title} -> destination ${destinationUuid}`);
  }

  console.log(`Seeded ${tours.length} tours`);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
