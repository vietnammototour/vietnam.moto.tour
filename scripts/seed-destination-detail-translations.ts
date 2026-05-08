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

type Row = {
  namespace: string;
  key: string;
  valueEn: string;
  valueVi: string;
};

const rows: Row[] = [
  {
    namespace: 'destinationDetail',
    key: 'highlightsTitle',
    valueEn: 'Highlights',
    valueVi: 'Điểm nổi bật',
  },
  {
    namespace: 'destinationDetail',
    key: 'noHighlights',
    valueEn: 'No highlights yet',
    valueVi: 'Chưa có điểm nổi bật',
  },
  {
    namespace: 'destinationDetail',
    key: 'toursTitle',
    valueEn: 'Tours in this destination',
    valueVi: 'Tour tại điểm đến này',
  },
  {
    namespace: 'destinationDetail',
    key: 'noTours',
    valueEn: 'No tours available yet',
    valueVi: 'Chưa có tour nào',
  },
  {
    namespace: 'destinationDetail',
    key: 'cta.title',
    valueEn: 'Ready to explore?',
    valueVi: 'Sẵn sàng khám phá?',
  },
  {
    namespace: 'destinationDetail',
    key: 'cta.button',
    valueEn: 'Contact us',
    valueVi: 'Liên hệ',
  },
];

async function main(): Promise<void> {
  for (const row of rows) {
    await prisma.translation.upsert({
      where: {namespace_key: {namespace: row.namespace, key: row.key}},
      update: {valueEn: row.valueEn, valueVi: row.valueVi},
      create: row,
    });
    console.log(`upserted ${row.namespace}.${row.key}`);
  }
  console.log(`done: ${rows.length} translations`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
