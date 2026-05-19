import type {Destination as PrismaDestination} from '@prisma/client';
import type {Highlight} from '../highlight';
import type {Tour} from '../tour';
import type {LocalizedText} from '../shared/localized-text';

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
  name: LocalizedText;
  size: 'small' | 'large';
  imageUrl: string;
  heroImage: string;
};

export type DestinationWithStats = Destination & {
  tourCount: number;
  carOnlyCount: number;
  bikeOnlyCount: number;
  bikeAndCarCount: number;
};

export type DestinationDetail = Destination & {
  description: {en: string; vi: string};
  highlights: Highlight[];
  highlightsTotal: number;
  tours: Tour[];
};

export const HIGHLIGHTS_PAGE_SIZE = 6;
