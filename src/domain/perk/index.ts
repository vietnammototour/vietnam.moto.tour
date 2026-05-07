import type {
  Perk as PrismaPerk,
  PerkCategory as PrismaPerkCategory,
  PerkBucket as PrismaPerkBucket,
} from '@prisma/client';

export type PerkCategory = PrismaPerkCategory;
export type PerkBucket = PrismaPerkBucket;
export type Perk = Omit<PrismaPerk, 'createdAt'>;
