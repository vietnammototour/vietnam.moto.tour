import type {Destination as PrismaDestination} from '@prisma/client';
import type {Destination} from './index';

export function toDestination(row: PrismaDestination): Destination {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    imageUrl: row.imageUrl,
    heroImage: row.heroImage,
    size: row.size === 'large' ? 'large' : 'small',
    isActive: row.isActive,
  };
}
