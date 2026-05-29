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

const dbUrl = process.env.DATABASE_URL!.split('?')[0];
const adapter = new PrismaPg(dbUrl);
const prisma = new PrismaClient({adapter});

const updates = [
  {namespace: 'home', key: 'stats.km.value', valueVi: '48k+', valueEn: '48k+'},
  {namespace: 'home', key: 'stats.riders.value', valueVi: '3.7k+', valueEn: '3.7k+'},
];

async function main() {
  for (const u of updates) {
    await prisma.translation.upsert({
      where: {namespace_key: {namespace: u.namespace, key: u.key}},
      create: u,
      update: {valueVi: u.valueVi, valueEn: u.valueEn},
    });
    console.log(`updated ${u.namespace}.${u.key} → vi="${u.valueVi}" en="${u.valueEn}"`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
