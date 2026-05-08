import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

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

const dbUrl = process.env.DATABASE_URL.split('?')[0];
const adapter = new PrismaPg(dbUrl);
const prisma = new PrismaClient({adapter});

type Entry = {
  namespace: string;
  key: string;
  valueEn: string;
  valueVi: string;
};

const entries: Entry[] = [
  {
    namespace: 'common',
    key: 'durationLabel',
    valueEn: 'Duration',
    valueVi: 'Thời gian',
  },
  {
    namespace: 'common',
    key: 'distanceLabel',
    valueEn: 'Distance',
    valueVi: 'Quãng đường',
  },
  {
    namespace: 'common',
    key: 'locationLabel',
    valueEn: 'Location',
    valueVi: 'Điểm đến',
  },
  {
    namespace: 'common',
    key: 'daysCount',
    valueEn: '{count, plural, one {# day} other {# days}}',
    valueVi: '{count} ngày',
  },
  {
    namespace: 'common',
    key: 'kilometersCount',
    valueEn: '{count} km',
    valueVi: '{count} km',
  },
  {
    namespace: 'admin.tours.tabs',
    key: 'general',
    valueEn: 'General',
    valueVi: 'Tổng quan',
  },
  {
    namespace: 'admin.tours.tabs',
    key: 'itinerary',
    valueEn: 'Itinerary',
    valueVi: 'Lịch trình',
  },
  {
    namespace: 'admin.tours.tabs',
    key: 'pricing',
    valueEn: 'Pricing',
    valueVi: 'Giá',
  },
  {
    namespace: 'admin.tours.tabs',
    key: 'highlights',
    valueEn: 'Highlights',
    valueVi: 'Điểm nổi bật',
  },
  {
    namespace: 'admin.tours.tabs',
    key: 'perks',
    valueEn: 'Perks',
    valueVi: 'Tiện ích',
  },
];

async function main(): Promise<void> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const entry of entries) {
    const existing = await prisma.translation.findUnique({
      where: {
        namespace_key: {namespace: entry.namespace, key: entry.key},
      },
    });

    if (!existing) {
      await prisma.translation.create({data: entry});
      created++;
      console.log(`  + ${entry.namespace}.${entry.key}`);
      continue;
    }

    const isEmpty =
      (existing.valueEn ?? '') === '' && (existing.valueVi ?? '') === '';

    if (isEmpty) {
      await prisma.translation.update({
        where: {id: existing.id},
        data: {valueEn: entry.valueEn, valueVi: entry.valueVi},
      });
      updated++;
      console.log(`  ~ ${entry.namespace}.${entry.key} (filled empty values)`);
    } else {
      skipped++;
      console.log(
        `  = ${entry.namespace}.${entry.key} (already populated, skipped)`,
      );
    }
  }

  console.log(
    `\nDone. Created: ${created}, updated: ${updated}, skipped: ${skipped}.`,
  );
}

main()
  .catch((e) => {
    console.error('Seed tour-card translations failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
