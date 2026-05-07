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

const IN_PATH = path.join(__dirname, '..', 'perks-data.json');

type PerkRow = {
  id: string;
  labelEn: string;
  labelVi: string;
  icon: string;
  category: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

type TranslationRow = {
  id: string;
  namespace: string;
  key: string;
  valueVi: string;
  valueEn: string;
  updatedAt: string;
};

async function main(): Promise<void> {
  if (!fs.existsSync(IN_PATH)) {
    console.error(
      `Missing ${IN_PATH} — run export-perks-data first and scp the file.`,
    );
    process.exit(1);
  }
  const raw = fs.readFileSync(IN_PATH, 'utf-8');
  const {perks, translations} = JSON.parse(raw) as {
    perks: PerkRow[];
    translations: TranslationRow[];
  };

  let perksCreated = 0;
  let perksUpdated = 0;
  for (const p of perks) {
    const data = {
      labelEn: p.labelEn,
      labelVi: p.labelVi,
      icon: p.icon,
      category: p.category as never,
      archived: p.archived,
    };
    const result = await prisma.perk.upsert({
      where: {id: p.id},
      update: data,
      create: {id: p.id, ...data},
    });
    if (result.createdAt.toISOString() === p.createdAt) perksCreated++;
    else perksUpdated++;
  }

  let translationsCreated = 0;
  let translationsUpdated = 0;
  for (const t of translations) {
    const existing = await prisma.translation.findUnique({
      where: {namespace_key: {namespace: t.namespace, key: t.key}},
    });
    if (existing) {
      await prisma.translation.update({
        where: {id: existing.id},
        data: {valueVi: t.valueVi, valueEn: t.valueEn},
      });
      translationsUpdated++;
    } else {
      await prisma.translation.create({
        data: {
          namespace: t.namespace,
          key: t.key,
          valueVi: t.valueVi,
          valueEn: t.valueEn,
        },
      });
      translationsCreated++;
    }
  }

  console.log(
    `Done.\n  perks: total=${perks.length}\n  translations: created=${translationsCreated} updated=${translationsUpdated} total=${translations.length}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
