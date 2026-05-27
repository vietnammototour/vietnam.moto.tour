import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';

type TourPaymentProps = {
  paymentDetails: VMT.LocalizedText;
  locale: string;
};

export function TourPayment({paymentDetails, locale}: TourPaymentProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  return (
    <div className="border border-border-subtle p-5 mb-5">
      <h3 className="type-title-lg text-on-surface mb-3">{t('payment')}</h3>
      <p className="type-label-sm text-on-surface-secondary leading-relaxed">
        {paymentDetails[localeKey]}
      </p>
    </div>
  );
}
