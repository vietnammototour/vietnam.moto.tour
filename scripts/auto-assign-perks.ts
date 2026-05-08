/**
 * Auto-assign Perk rows to Tour records based on keyword matches against
 * tour text fields (title, transportation, hotel, guided, descriptions,
 * mealsInfo). Perks themselves must already exist in the DB.
 *
 * Run on VPS:
 *   npx tsx scripts/auto-assign-perks.ts            # dry-run summary
 *   npx tsx scripts/auto-assign-perks.ts --apply    # write TourPerk rows
 *   npx tsx scripts/auto-assign-perks.ts --apply --force   # overwrite even tours that already have perks
 *
 * Default behavior:
 *   - Skip tours that already have any TourPerk rows (unless --force).
 *   - Only assigns INCLUDED perks. Explicit exclusions stay manual.
 *   - For each perk, derive keyword tokens from labelEn + labelVi (length >= 3,
 *     stopwords removed). A perk matches when any of its significant tokens
 *     is found in the combined tour text (case-insensitive, accent-insensitive
 *     for Vietnamese). Tweak STRICT to require all tokens.
 */

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

const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');
const FORCE = args.has('--force');
const STRICT = args.has('--strict');

const dbUrl = process.env.DATABASE_URL.split('?')[0];
const adapter = new PrismaPg(dbUrl);
const prisma = new PrismaClient({adapter});

const STOPWORDS = new Set([
  'and',
  'the',
  'with',
  'for',
  'per',
  'from',
  'into',
  'your',
  'our',
  'all',
  'any',
  'one',
  'two',
  'của',
  'cho',
  'với',
  'theo',
  'tới',
  'đến',
  'trong',
  'một',
  'và',
  'các',
  'khi',
  'như',
]);

// Hand-curated keyword → perk-labelEn boosts. Add aliases tour copy uses but
// perk labels do not. Match is case-insensitive on the tour text.
const ALIASES: Record<string, string[]> = {
  helmet: ['helmet', 'mũ bảo hiểm'],
  fuel: ['fuel', 'gas', 'petrol', 'xăng'],
  guide: ['guide', 'guided', 'hướng dẫn viên', 'tour leader'],
  motorbike: ['motorbike', 'bike', 'xe máy', 'motor'],
  hotel: ['hotel', 'homestay', 'guesthouse', 'lodging', 'khách sạn', 'nghỉ'],
  breakfast: ['breakfast', 'sáng'],
  lunch: ['lunch', 'trưa'],
  dinner: ['dinner', 'tối'],
  water: ['water', 'bottled', 'nước'],
  insurance: ['insurance', 'bảo hiểm'],
  pickup: ['pickup', 'pick up', 'transfer', 'đón'],
  fee: ['entrance', 'ticket', 'admission', 'phí'],
};

function stripDiacritics(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function normalize(s: string) {
  return stripDiacritics(s).toLowerCase();
}

function tokenize(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

type LocalizedText = {en?: string; vi?: string} | null | undefined;

function flatten(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (Array.isArray(value)) return value.map(flatten).join(' ');
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(flatten)
      .join(' ');
  }
  return '';
}

function buildTourText(tour: {
  title: string;
  titleEn: string;
  titleVi: string;
  transportation: string;
  hotel: string;
  guided: string;
  descriptionEn: string;
  descriptionVi: string;
  mealsInfo: unknown;
  itinerary: unknown;
  highlights: {titleEn: string; titleVi: string}[];
}) {
  return [
    tour.title,
    tour.titleEn,
    tour.titleVi,
    tour.transportation,
    tour.hotel,
    tour.guided,
    tour.descriptionEn,
    tour.descriptionVi,
    flatten(tour.mealsInfo),
    flatten(tour.itinerary),
    tour.highlights.map((h) => `${h.titleEn} ${h.titleVi}`).join(' '),
  ]
    .map(normalize)
    .join(' \n ');
}

function perkTokens(labelEn: string, labelVi: string): string[] {
  const base = [...tokenize(labelEn), ...tokenize(labelVi)];
  const aliasHits = new Set<string>();
  const labelLower = `${normalize(labelEn)} ${normalize(labelVi)}`;
  for (const [key, list] of Object.entries(ALIASES)) {
    if (labelLower.includes(key)) {
      for (const a of list) aliasHits.add(normalize(a));
    }
  }
  return [...new Set([...base, ...aliasHits])];
}

function matches(text: string, tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  if (STRICT) return tokens.every((t) => text.includes(t));
  return tokens.some((t) => text.includes(t));
}

async function main() {
  const perks = await prisma.perk.findMany({where: {archived: false}});
  if (perks.length === 0) {
    console.error('No perks in DB — aborting.');
    process.exit(1);
  }

  const perkIndex = perks.map((p) => ({
    id: p.id,
    labelEn: p.labelEn,
    labelVi: p.labelVi,
    tokens: perkTokens(p.labelEn, p.labelVi),
  }));

  const tours = await prisma.tour.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      titleEn: true,
      titleVi: true,
      transportation: true,
      hotel: true,
      guided: true,
      descriptionEn: true,
      descriptionVi: true,
      mealsInfo: true,
      itinerary: true,
      highlights: {select: {titleEn: true, titleVi: true}},
      perks: {select: {perkId: true}},
    },
  });

  let touched = 0;
  let skipped = 0;
  let totalAssignments = 0;

  for (const tour of tours) {
    if (tour.perks.length > 0 && !FORCE) {
      skipped += 1;
      continue;
    }

    const text = buildTourText(tour);
    const matched = perkIndex.filter((p) => matches(text, p.tokens));

    if (matched.length === 0) {
      console.log(`- ${tour.slug}: no matches`);
      continue;
    }

    console.log(
      `+ ${tour.slug}: ${matched.length} match(es): ${matched
        .map((p) => p.labelEn)
        .join(', ')}`,
    );

    if (APPLY) {
      const ops = [];
      if (FORCE) {
        ops.push(prisma.tourPerk.deleteMany({where: {tourId: tour.id}}));
      }
      ops.push(
        prisma.tourPerk.createMany({
          data: matched.map((p) => ({
            tourId: tour.id,
            perkId: p.id,
            bucket: 'INCLUDED' as const,
          })),
          skipDuplicates: true,
        }),
      );
      await prisma.$transaction(ops);
    }

    touched += 1;
    totalAssignments += matched.length;
  }

  console.log('---');
  console.log(
    `${APPLY ? 'Applied' : 'Dry-run'}: tours touched=${touched} skipped=${skipped} assignments=${totalAssignments}`,
  );
  if (!APPLY) console.log('Re-run with --apply to write changes.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Suppress unused-type lint for documentation-only alias.
export type {LocalizedText};
