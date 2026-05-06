import type {Highlight as PrismaHighlight} from '@prisma/client';
import type {Highlight} from './index';

export function toHighlight(row: PrismaHighlight): Highlight {
  return {
    id: row.id,
    destinationId: row.destinationId,
    textEn: row.textEn,
    textVi: row.textVi,
    imageUrl: row.imageUrl,
  };
}
