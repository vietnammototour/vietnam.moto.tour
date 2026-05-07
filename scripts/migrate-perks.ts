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

const DEFAULT_ICON = 'fa-solid fa-circle-check';

type LegacyEntry = {en: string; vi: string};

function dedupeKey(en: string) {
  return en.trim().toLowerCase();
}

async function ensurePerk(en: string, vi: string): Promise<string | null> {
  const key = dedupeKey(en);
  if (!key) return null;
  const existing = await prisma.perk.findFirst({
    where: {labelEn: {equals: en.trim(), mode: 'insensitive'}},
  });
  if (existing) {
    if (!existing.labelVi && vi) {
      await prisma.perk.update({
        where: {id: existing.id},
        data: {labelVi: vi.trim()},
      });
    }
    return existing.id;
  }
  const created = await prisma.perk.create({
    data: {
      labelEn: en.trim(),
      labelVi: vi?.trim() ?? '',
      icon: DEFAULT_ICON,
      category: 'OTHER',
    },
  });
  return created.id;
}

async function main() {
  const tours = await prisma.tour.findMany({
    select: {id: true, included: true, excluded: true},
  });

  let toursProcessed = 0;
  let assignmentsCreated = 0;

  for (const tour of tours) {
    const inc = (tour.included as LegacyEntry[] | null) ?? [];
    const exc = (tour.excluded as LegacyEntry[] | null) ?? [];

    const includedIds: string[] = [];
    const excludedIds: string[] = [];

    for (const e of inc) {
      const id = await ensurePerk(e.en ?? '', e.vi ?? '');
      if (id) includedIds.push(id);
    }
    for (const e of exc) {
      const id = await ensurePerk(e.en ?? '', e.vi ?? '');
      if (id) excludedIds.push(id);
    }

    const incSet = [...new Set(includedIds)];
    const excSet = [...new Set(excludedIds)].filter(
      (id) => !incSet.includes(id),
    );

    await prisma.$transaction([
      prisma.tourPerk.deleteMany({where: {tourId: tour.id}}),
      prisma.tourPerk.createMany({
        data: [
          ...incSet.map((perkId) => ({
            tourId: tour.id,
            perkId,
            bucket: 'INCLUDED' as const,
          })),
          ...excSet.map((perkId) => ({
            tourId: tour.id,
            perkId,
            bucket: 'EXCLUDED' as const,
          })),
        ],
      }),
    ]);

    toursProcessed += 1;
    assignmentsCreated += incSet.length + excSet.length;
  }

  console.log(
    `Processed ${toursProcessed} tours, created ${assignmentsCreated} assignments.`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
