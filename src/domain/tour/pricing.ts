import type {LocalizedText} from '../shared/localized-text';

export type PricingTier = {
  label: LocalizedText;
  description?: LocalizedText;
  price: number;
  minGroupSize?: number;
  maxGroupSize?: number;
};

export type PricingGroup = {
  type: 'group-size' | 'vehicle';
  label: LocalizedText;
  icon?: string;
  tiers: PricingTier[];
};
