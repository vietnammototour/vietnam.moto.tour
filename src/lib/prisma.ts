import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {prisma: PrismaClient};

// Strip Prisma-specific query params (like ?schema=public) that pg doesn't understand
const dbUrl = (process.env.DATABASE_URL as string).split('?')[0];
const adapter = new PrismaPg(dbUrl);
export const prisma = globalForPrisma.prisma || new PrismaClient({adapter});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
