import type {
  ImageCollection as PrismaCollection,
  CollectionImage as PrismaImage,
} from '@prisma/client';

export type CollectionImage = Omit<PrismaImage, 'createdAt'>;

export type ImageCollection = Omit<
  PrismaCollection,
  'createdAt' | 'updatedAt'
> & {
  images: CollectionImage[];
};
