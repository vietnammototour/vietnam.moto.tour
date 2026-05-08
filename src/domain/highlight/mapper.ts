import type {Highlight as PrismaHighlight} from '@prisma/client';
import type {Highlight} from './index';

export function toHighlight(row: PrismaHighlight): Highlight {
  return {
    id: row.id,
    destinationId: row.destinationId,
    titleEn: row.titleEn,
    titleVi: row.titleVi,
    descriptionEn: row.descriptionEn,
    descriptionVi: row.descriptionVi,
    imageUrl: row.imageUrl,
  };
}
