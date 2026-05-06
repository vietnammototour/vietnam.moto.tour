import type {Translation as PrismaTranslation} from '@prisma/client';

export type Translation = Omit<PrismaTranslation, 'updatedAt'>;
