import {useTranslations} from 'next-intl';
import type {LocalizedText} from '@/types';

type TourPaymentProps = {
  paymentDetails: LocalizedText;
  locale: string;
};

export function TourPayment({paymentDetails, locale}: TourPaymentProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  return (
    <div className="border border-border-subtle rounded-xl p-5 mb-5">
      <h3 className="type-title-lg text-on-surface mb-3">{t('payment')}</h3>
      <p className="type-label-sm text-on-surface-secondary leading-relaxed">
        {paymentDetails[localeKey]}
      </p>
    </div>
  );
}
