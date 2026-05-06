import type {Highlight as PrismaHighlight} from '@prisma/client';

export type Highlight = Omit<PrismaHighlight, 'createdAt'>;
