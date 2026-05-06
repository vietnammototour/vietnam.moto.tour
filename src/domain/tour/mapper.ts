import type {
  Tour as PrismaTour,
  Destination as PrismaDestination,
  Highlight as PrismaHighlight,
} from '@prisma/client';
import {toHighlight} from '../highlight/mapper';
import type {LocalizedText} from '../shared/localized-text';
import type {ItineraryDay} from './itinerary';
import type {PricingGroup} from './pricing';
import type {Tour} from './index';

export type PrismaTourWithRelations = PrismaTour & {
  destination: PrismaDestination;
  highlights: PrismaHighlight[];
};

export function toTour(row: PrismaTourWithRelations): Tour {
  return {
    id: row.id,
    slug: row.slug,
    destinationId: row.destinationId,
    title: {vi: row.titleVi, en: row.titleEn},
    description: {vi: row.descriptionVi, en: row.descriptionEn},
    images: row.images as unknown as string[],
    itinerary: row.itinerary as unknown as ItineraryDay[],
    pricingGroups: row.pricingGroups as unknown as PricingGroup[],
    included: row.included as unknown as LocalizedText[],
    excluded: row.excluded as unknown as LocalizedText[],
    paymentDetails: row.paymentDetails as unknown as LocalizedText,
    notes: row.notes as unknown as LocalizedText[],
    mealsInfo: row.mealsInfo as unknown as LocalizedText,
    destinationName: row.destination.name,
    destinationHeroImage: row.destination.heroImage ?? '',
    highlights: row.highlights.map(toHighlight),
    status: row.status,
    imageUrl: row.imageUrl ?? '',
    price: row.price,
    duration: row.duration,
    distance: row.distance,
    transportation: row.transportation,
    groupSize: row.groupSize,
    hotel: row.hotel,
    guided: row.guided,
  };
}
