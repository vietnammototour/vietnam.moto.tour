import type {
  Tour as PrismaTour,
  Destination as PrismaDestination,
  Highlight as PrismaHighlight,
  Perk as PrismaPerk,
  TourPerk as PrismaTourPerk,
} from '@prisma/client';
import {toHighlight} from '../highlight/mapper';
import type {Perk} from '../perk';
import type {LocalizedText} from '../shared/localized-text';
import type {ItineraryDay} from './itinerary';
import type {PricingGroup} from './pricing';
import type {Tour} from './index';

type PrismaTourPerkWithPerk = PrismaTourPerk & {perk: PrismaPerk};

export type PrismaTourWithRelations = PrismaTour & {
  destination: PrismaDestination;
  highlights: PrismaHighlight[];
  perks: PrismaTourPerkWithPerk[];
};

function toPerk(p: PrismaPerk): Perk {
  const {createdAt: _c, updatedAt: _u, ...rest} = p;
  return rest;
}

function sortPerks(perks: Perk[]): Perk[] {
  return [...perks].sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.labelEn.localeCompare(b.labelEn),
  );
}

export function toTour(row: PrismaTourWithRelations): Tour {
  const included = sortPerks(
    row.perks
      .filter((tp) => tp.bucket === 'INCLUDED')
      .map((tp) => toPerk(tp.perk)),
  );
  const excluded = sortPerks(
    row.perks
      .filter((tp) => tp.bucket === 'EXCLUDED')
      .map((tp) => toPerk(tp.perk)),
  );

  return {
    id: row.id,
    slug: row.slug,
    destinationId: row.destinationId,
    title: {vi: row.titleVi, en: row.titleEn},
    description: {vi: row.descriptionVi, en: row.descriptionEn},
    images: row.images as unknown as string[],
    itinerary: row.itinerary as unknown as ItineraryDay[],
    pricingGroups: row.pricingGroups as unknown as PricingGroup[],
    paymentDetails: row.paymentDetails as unknown as LocalizedText,
    notes: row.notes as unknown as LocalizedText[],
    mealsInfo: row.mealsInfo as unknown as LocalizedText,
    destinationName: {
      vi: row.destination.nameVi,
      en: row.destination.nameEn,
    },
    destinationHeroImage: row.destination.heroImage ?? '',
    highlights: row.highlights.map(toHighlight),
    included,
    excluded,
    status: row.status,
    imageUrl: row.imageUrl ?? '',
    duration: row.duration,
    distance: row.distance,
    transportation: row.transportation,
    hotel: row.hotel,
    guided: row.guided,
    tripAdvisorUrl: row.tripAdvisorUrl,
  };
}
