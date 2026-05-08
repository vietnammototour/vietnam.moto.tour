'use client';

import {NextIntlClientProvider} from 'next-intl';

const messagesByLocale = {
  en: {
    tourDetail: {
      tourDetails: 'Tour details',
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
      perVehicle: 'per vehicle',
      priceUnitPerson: 'Per person',
      priceUnitVehicle: 'Per vehicle',
    },
  },
  vi: {
    tourDetail: {
      tourDetails: 'Chi tiết tour',
      pricing: 'Giá',
      pricingPerPerson: 'mỗi người',
      howManyPeople: 'Bao nhiêu người?',
      decreasePeople: 'Giảm',
      increasePeople: 'Tăng',
      people: 'người',
      pax: 'khách',
      largerGroupBetterPrice: 'Nhóm lớn hơn = giá tốt hơn',
      itinerary: 'Lịch trình',
      days: 'ngày',
      transportation: 'Di chuyển',
      duration: 'Thời lượng',
      distance: 'Khoảng cách',
      group: 'Nhóm',
      hotel: 'Khách sạn',
      guided: 'Hướng dẫn',
    },
    common: {
      perPerson: 'mỗi người',
      perVehicle: 'mỗi xe',
      priceUnitPerson: 'Mỗi người',
      priceUnitVehicle: 'Mỗi xe',
    },
  },
};

type Props = {
  children: React.ReactNode;
  locale?: 'en' | 'vi';
};

export function AdminIntlProvider({children, locale = 'en'}: Props) {
  return (
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}
