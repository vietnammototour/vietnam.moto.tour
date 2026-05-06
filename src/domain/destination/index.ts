import type {Destination as PrismaDestination} from '@prisma/client';

export type Destination = Omit<
  PrismaDestination,
  | 'nameVi'
  | 'nameEn'
  | 'descriptionVi'
  | 'descriptionEn'
  | 'createdAt'
  | 'updatedAt'
  | 'imageUrl'
  | 'heroImage'
> & {
  size: 'small' | 'large';
  imageUrl: string;
  heroImage: string;
};

export type DestinationWithStats = Destination & {
  tourCount: number;
  hasCar: boolean;
  hasBike: boolean;
};
