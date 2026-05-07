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

export function getMinPrice(groups: PricingGroup[] | undefined): number {
  if (!groups?.length) return 0;
  let min = Infinity;
  for (const g of groups) {
    for (const t of g.tiers) {
      if (typeof t.price === 'number' && t.price < min) min = t.price;
    }
  }
  return Number.isFinite(min) ? min : 0;
}

export function getMaxGroupSize(groups: PricingGroup[] | undefined): number {
  if (!groups?.length) return 0;
  let max = 0;
  for (const g of groups) {
    if (g.type !== 'group-size') continue;
    for (const t of g.tiers) {
      const candidate = t.maxGroupSize ?? t.minGroupSize ?? 0;
      if (candidate > max) max = candidate;
    }
  }
  return max;
}
