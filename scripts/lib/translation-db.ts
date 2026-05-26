// scripts/lib/translation-db.ts
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

function loadDotenvIfMissing() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.substring(0, eq);
    let value = trimmed.substring(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

export function createPrisma(): PrismaClient {
  loadDotenvIfMissing();
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }
  const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
  return new PrismaClient({adapter});
}
