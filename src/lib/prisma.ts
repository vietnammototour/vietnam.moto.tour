const {PrismaClient} = require('@prisma/client') as {PrismaClient: any};
import {PrismaPg} from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {prisma: any};

// Strip Prisma-specific query params (like ?schema=public) that pg doesn't understand.
// Tolerate an unset DATABASE_URL at module load (e.g. Next build's page-data
// collection phase when no .env file is present) — the adapter will only be
// exercised at runtime where the env var is guaranteed to be set.
const dbUrl = (process.env.DATABASE_URL ?? '').split('?')[0];
const adapter = new PrismaPg(dbUrl);
export const prisma = globalForPrisma.prisma || new PrismaClient({adapter});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
