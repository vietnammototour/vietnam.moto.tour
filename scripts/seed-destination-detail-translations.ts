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

type Entry = {namespace: string; key: string; valueVi: string; valueEn: string};

const entries: Entry[] = [
  {
    namespace: 'destinationDetail',
    key: 'toursTitle',
    valueEn: 'Tours at this destination',
    valueVi: 'Tour tại điểm đến này',
  },
  {
    namespace: 'destinationDetail',
    key: 'highlightsTitle',
    valueEn: 'Highlights',
    valueVi: 'Điểm nổi bật',
  },
  {
    namespace: 'destinationDetail.cta',
    key: 'title',
    valueEn: 'Ready to explore this destination?',
    valueVi: 'Sẵn sàng khám phá điểm đến này?',
  },
  {
    namespace: 'destinationDetail.cta',
    key: 'button',
    valueEn: 'Contact us',
    valueVi: 'Liên hệ với chúng tôi',
  },
];

async function main(): Promise<void> {
  let created = 0;
  let skipped = 0;
  for (const e of entries) {
    const existing = await prisma.translation.findUnique({
      where: {namespace_key: {namespace: e.namespace, key: e.key}},
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.translation.create({data: e});
    created++;
    console.log(`+ ${e.namespace}::${e.key}`);
  }
  console.log(
    `\nDone. created=${created} skipped=${skipped} total=${entries.length}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
