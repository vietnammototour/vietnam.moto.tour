/**
 * Auto-assign Perk rows to Tour records.
 *
 * Splits each tour's text into INCLUDED and EXCLUDED segments using common
 * heading markers (English + Vietnamese), then matches Perks by token against
 * each segment.
 *
 * Run on VPS:
 *   npx tsx scripts/auto-assign-perks.ts              # dry-run preview
 *   npx tsx scripts/auto-assign-perks.ts --apply      # wipe TourPerk rows for
 *                                                     #   every tour and rewrite
 *
 * --apply NEVER touches the Perk catalog table. Only TourPerk join rows are
 * replaced (per tour, full overwrite).
 *
 * Flags:
 *   --apply        commit changes (default: dry-run)
 *   --strict       require ALL perk tokens to appear in segment (default: any)
 *   --tour <slug>  limit to a single tour slug (repeatable)
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

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const STRICT = argv.includes('--strict');
const TOUR_FILTERS: string[] = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--tour' && argv[i + 1]) {
    TOUR_FILTERS.push(argv[i + 1]);
    i++;
  }
}

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
  'have',
  'has',
  'are',
  'not',
  'will',
  'cua',
  'cho',
  'voi',
  'theo',
  'toi',
  'den',
  'trong',
  'mot',
  'va',
  'cac',
  'khi',
  'nhu',
  'co',
]);

// Tour copy aliases that aren't covered by perk labels themselves.
// Keys are matched case-insensitively against perk labels (en+vi).
const ALIASES: Record<string, string[]> = {
  helmet: ['helmet', 'mu bao hiem'],
  fuel: ['fuel', 'gas', 'petrol', 'xang'],
  guide: ['guide', 'guided', 'huong dan vien', 'tour leader'],
  motorbike: ['motorbike', 'bike', 'xe may', 'motor'],
  hotel: ['hotel', 'homestay', 'guesthouse', 'lodging', 'khach san', 'nghi'],
  breakfast: ['breakfast', 'sang'],
  lunch: ['lunch', 'trua'],
  dinner: ['dinner', 'toi'],
  water: ['water', 'bottled', 'nuoc'],
  insurance: ['insurance', 'bao hiem'],
  pickup: ['pickup', 'pick up', 'transfer', 'don'],
  fee: ['entrance', 'ticket', 'admission', 'phi vao cua', 'phi'],
};

// Heading markers that delimit included vs excluded sections.
const INCLUDED_HEADERS = [
  'whats included',
  'what is included',
  'what s included',
  'included',
  'inclusions',
  'tour includes',
  'price includes',
  'bao gom',
  'gia bao gom',
  'tour bao gom',
];
const EXCLUDED_HEADERS = [
  'not included',
  'whats not included',
  'what is not included',
  'excluded',
  'exclusions',
  'tour excludes',
  'price excludes',
  'extra cost',
  'own expense',
  'khong bao gom',
  'gia khong bao gom',
  'tour khong bao gom',
  'chi phi them',
];

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

function flatten(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (Array.isArray(value)) return value.map(flatten).join('\n');
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(flatten)
      .join('\n');
  }
  return '';
}

type Segments = {included: string; excluded: string};

/**
 * Walks a normalized text body and assigns each line to the included or
 * excluded bucket based on the most recent heading marker. Lines before the
 * first marker default to "included" (most tour copy describes inclusions
 * implicitly).
 */
function splitSegments(rawText: string): Segments {
  const lines = rawText.split(/\r?\n/);
  let bucket: 'included' | 'excluded' = 'included';
  const incChunks: string[] = [];
  const excChunks: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const norm = normalize(line);
    let switched = false;
    for (const h of EXCLUDED_HEADERS) {
      if (norm.startsWith(h) || norm === h || norm.includes(h)) {
        bucket = 'excluded';
        switched = true;
        break;
      }
    }
    if (!switched) {
      for (const h of INCLUDED_HEADERS) {
        if (norm.startsWith(h) || norm === h || norm.includes(h)) {
          bucket = 'included';
          switched = true;
          break;
        }
      }
    }
    if (switched) continue;
    if (bucket === 'included') incChunks.push(norm);
    else excChunks.push(norm);
  }
  return {
    included: incChunks.join(' \n '),
    excluded: excChunks.join(' \n '),
  };
}

function buildTourSegments(tour: {
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
}): Segments {
  // Headers and section splits typically live in description fields.
  const descriptionBlob = [tour.descriptionEn, tour.descriptionVi].join('\n');
  const descriptionSegments = splitSegments(descriptionBlob);

  // Other fields are inclusion-by-definition (transport offered, hotel listed,
  // meals served, etc). Append to included segment.
  const inclusionExtras = [
    tour.title,
    tour.titleEn,
    tour.titleVi,
    tour.transportation,
    tour.hotel,
    tour.guided,
    flatten(tour.mealsInfo),
    flatten(tour.itinerary),
    tour.highlights.map((h) => `${h.titleEn} ${h.titleVi}`).join(' '),
  ]
    .map(normalize)
    .join(' \n ');

  return {
    included: `${descriptionSegments.included} \n ${inclusionExtras}`,
    excluded: descriptionSegments.excluded,
  };
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
  return [...new Set([...base, ...aliasHits])].filter((t) => t.length >= 3);
}

function matches(text: string, tokens: string[]): boolean {
  if (!text || tokens.length === 0) return false;
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
    where: TOUR_FILTERS.length > 0 ? {slug: {in: TOUR_FILTERS}} : undefined,
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
      perks: {select: {perkId: true, bucket: true}},
    },
  });

  let processed = 0;
  let totalIncluded = 0;
  let totalExcluded = 0;

  for (const tour of tours) {
    const segments = buildTourSegments(tour);

    const excludedMatches = perkIndex.filter((p) =>
      matches(segments.excluded, p.tokens),
    );
    const excludedIds = new Set(excludedMatches.map((p) => p.id));

    // Included = matches in included segment, minus anything explicitly
    // marked excluded (exclusion wins on conflict).
    const includedMatches = perkIndex
      .filter((p) => matches(segments.included, p.tokens))
      .filter((p) => !excludedIds.has(p.id));

    console.log(`\n${tour.slug}`);
    console.log(
      `  INCLUDED (${includedMatches.length}): ${includedMatches.map((p) => p.labelEn).join(', ') || '—'}`,
    );
    console.log(
      `  EXCLUDED (${excludedMatches.length}): ${excludedMatches.map((p) => p.labelEn).join(', ') || '—'}`,
    );

    if (APPLY) {
      await prisma.$transaction([
        prisma.tourPerk.deleteMany({where: {tourId: tour.id}}),
        prisma.tourPerk.createMany({
          data: [
            ...includedMatches.map((p) => ({
              tourId: tour.id,
              perkId: p.id,
              bucket: 'INCLUDED' as const,
            })),
            ...excludedMatches.map((p) => ({
              tourId: tour.id,
              perkId: p.id,
              bucket: 'EXCLUDED' as const,
            })),
          ],
          skipDuplicates: true,
        }),
      ]);
    }

    processed += 1;
    totalIncluded += includedMatches.length;
    totalExcluded += excludedMatches.length;
  }

  console.log('\n---');
  console.log(
    `${APPLY ? 'Applied' : 'Dry-run'}: tours=${processed} included=${totalIncluded} excluded=${totalExcluded}`,
  );
  if (!APPLY) console.log('Re-run with --apply to overwrite TourPerk rows.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
