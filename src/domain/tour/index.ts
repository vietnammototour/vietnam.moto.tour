import type {
  Tour as PrismaTour,
  TourStatus as PrismaTourStatus,
} from '@prisma/client';
import type {LocalizedText} from '../shared/localized-text';
import type {Highlight} from '../highlight';
import type {Perk} from '../perk';
import type {ItineraryDay} from './itinerary';
import type {PricingGroup} from './pricing';

export type TourStatus = PrismaTourStatus;

export type Tour = Omit<
  PrismaTour,
  | 'title'
  | 'titleVi'
  | 'titleEn'
  | 'description'
  | 'descriptionVi'
  | 'descriptionEn'
  | 'images'
  | 'itinerary'
  | 'pricingGroups'
  | 'paymentDetails'
  | 'notes'
  | 'mealsInfo'
  | 'createdAt'
  | 'updatedAt'
  | 'imageUrl'
> & {
  imageUrl: string;
  title: LocalizedText;
  description: LocalizedText;
  images: string[];
  itinerary: ItineraryDay[];
  pricingGroups: PricingGroup[];
  paymentDetails: LocalizedText;
  notes: LocalizedText[];
  mealsInfo: LocalizedText;
  destinationName: string;
  destinationHeroImage: string;
  highlights: Highlight[];
  included: Perk[];
  excluded: Perk[];
};
