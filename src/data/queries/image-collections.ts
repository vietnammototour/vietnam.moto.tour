import {prisma} from '@/lib/prisma';
import {toImageCollection} from '@/domain/image-collection/mapper';
import type {ImageCollection} from '@/domain';

export async function getImageCollection(
  key: string,
): Promise<ImageCollection | null> {
  const row = await prisma.imageCollection.findUnique({
    where: {key},
    include: {images: {orderBy: {order: 'asc'}}},
  });
  return row ? toImageCollection(row) : null;
}

export async function listImageCollections(): Promise<
  Array<{id: string; key: string; label: string; imageCount: number}>
> {
  const rows = await prisma.imageCollection.findMany({
    orderBy: {label: 'asc'},
    include: {_count: {select: {images: true}}},
  });
  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    label: r.label,
    imageCount: r._count.images,
  }));
}
