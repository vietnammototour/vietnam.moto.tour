// src/types/index.ts

// Re-exports from VMT (transitional shim — to be removed once all consumers
// migrate to `import * as VMT from '@/domain'`).
export type {
  LocalizedText,
  Tour,
  TourStatus,
  ItineraryDay,
  ItineraryItem,
  PricingGroup,
  PricingTier,
  Destination,
  Highlight,
} from '@/domain';
export type {User as AdminUser} from '@/domain';
export type {Translation as TranslationRow} from '@/domain';
