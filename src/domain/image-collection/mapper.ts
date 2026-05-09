import type {
  ImageCollection as PrismaCollection,
  CollectionImage as PrismaImage,
} from '@prisma/client';
import type {ImageCollection, CollectionImage} from './index';

export function toCollectionImage(row: PrismaImage): CollectionImage {
  return {
    id: row.id,
    collectionId: row.collectionId,
    url: row.url,
    altEn: row.altEn,
    altVi: row.altVi,
    order: row.order,
  };
}

export function toImageCollection(
  row: PrismaCollection & {images: PrismaImage[]},
): ImageCollection {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    images: row.images.map(toCollectionImage),
  };
}
