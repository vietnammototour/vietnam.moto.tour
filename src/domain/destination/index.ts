import type {Destination as PrismaDestination} from '@prisma/client';

export type Destination = Omit<
  PrismaDestination,
  | 'nameVi'
  | 'nameEn'
  | 'descriptionVi'
  | 'descriptionEn'
  | 'createdAt'
  | 'updatedAt'
> & {
  size: 'small' | 'large';
};

export type DestinationWithStats = Destination & {
  tourCount: number;
  hasCar: boolean;
  hasBike: boolean;
};
