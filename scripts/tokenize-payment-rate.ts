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

// One-off migration: replace any literal exchange-rate figure in every tour's
// paymentDetails with the `{rate}` token, so the number lives only in code
// (src/utils EXCHANGE_RATE_VND) and TourPayment substitutes it at render time.
// Idempotent — text already using {rate} is left untouched.
const RATE_LITERALS = [
  '23,000',
  '23.000',
  '23000',
  '26,000',
  '26.000',
  '26000',
];

function replaceRate(text: string): string {
  let out = text;
  for (const literal of RATE_LITERALS) {
    out = out.split(literal).join('{rate}');
  }
  return out;
}

async function main() {
  const tours = await prisma.tour.findMany({
    select: {id: true, slug: true, paymentDetails: true},
  });

  let changed = 0;
  for (const tour of tours) {
    const pd = tour.paymentDetails as {en?: string; vi?: string} | null;
    if (!pd || typeof pd !== 'object') continue;

    const en = typeof pd.en === 'string' ? replaceRate(pd.en) : pd.en;
    const vi = typeof pd.vi === 'string' ? replaceRate(pd.vi) : pd.vi;

    if (en === pd.en && vi === pd.vi) continue;

    await prisma.tour.update({
      where: {id: tour.id},
      data: {paymentDetails: {...pd, en, vi}},
    });
    changed += 1;
    console.log(`Updated ${tour.slug}`);
  }

  console.log(`Done. Updated ${changed}/${tours.length} tours.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
