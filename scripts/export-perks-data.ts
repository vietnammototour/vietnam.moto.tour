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

const OUT_PATH = path.join(__dirname, '..', 'perks-data.json');

async function main(): Promise<void> {
  const perks = await prisma.perk.findMany({orderBy: {labelEn: 'asc'}});
  const translations = await prisma.translation.findMany({
    orderBy: [{namespace: 'asc'}, {key: 'asc'}],
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    perks,
    translations,
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(
    `Wrote ${OUT_PATH}\n  perks=${perks.length} translations=${translations.length}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
