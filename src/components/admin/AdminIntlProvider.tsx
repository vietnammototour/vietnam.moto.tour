'use client';

import {NextIntlClientProvider} from 'next-intl';

/**
 * Wraps public-facing components used in admin previews with
 * hardcoded English translations so keys render as readable text.
 */

const adminMessages = {
  tourDetail: {
    pricing: 'Pricing',
    pricingPerPerson: 'per person',
    howManyPeople: 'How many people?',
    decreasePeople: 'Decrease',
    increasePeople: 'Increase',
    people: 'people',
    pax: 'pax',
    largerGroupBetterPrice: 'Larger group = better price',
    itinerary: 'Itinerary',
    days: 'days',
    transportation: 'Transportation',
    duration: 'Duration',
    distance: 'Distance',
    group: 'Group Size',
    hotel: 'Hotel',
    guided: 'Guided',
  },
  common: {
    perPerson: 'per person',
  },
};

export function AdminIntlProvider({children}: {children: React.ReactNode}) {
  return (
    <NextIntlClientProvider locale="en" messages={adminMessages}>
      {children}
    </NextIntlClientProvider>
  );
}
