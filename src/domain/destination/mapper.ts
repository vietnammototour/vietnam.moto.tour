import type {Destination as PrismaDestination} from '@prisma/client';
import type {Destination} from './index';

export function toDestination(row: PrismaDestination): Destination {
  return {
    id: row.id,
    slug: row.slug,
    name: {vi: row.nameVi, en: row.nameEn},
    imageUrl: row.imageUrl ?? '',
    heroImage: row.heroImage ?? '',
    size: row.size === 'large' ? 'large' : 'small',
    isActive: row.isActive,
  };
}
