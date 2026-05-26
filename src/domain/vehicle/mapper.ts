import type {Vehicle as PrismaVehicle} from '@prisma/client';
import type {LocalizedText} from '../shared/localized-text';
import type {Vehicle} from './index';

function toLocalized(value: unknown): LocalizedText {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    return {
      en: typeof v.en === 'string' ? v.en : '',
      vi: typeof v.vi === 'string' ? v.vi : '',
    };
  }
  return {en: '', vi: ''};
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

export function toVehicle(row: PrismaVehicle): Vehicle {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    brand: row.brand,
    model: row.model,
    cc: row.cc,
    quantity: row.quantity,
    priceUsdPerDay: row.priceUsdPerDay,
    imageUrl: row.imageUrl,
    images: toStringArray(row.images),
    description: toLocalized(row.description),
    status: row.status,
    order: row.order,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
