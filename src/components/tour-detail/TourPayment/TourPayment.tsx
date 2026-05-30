import {useTranslations} from 'next-intl';
import {Callout} from '@/components/ui';
import type * as VMT from '@/domain';

type TourPaymentProps = {
  paymentDetails: VMT.LocalizedText;
  locale: string;
};

export function TourPayment({paymentDetails, locale}: TourPaymentProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  return (
    <Callout tone="danger" title={t('payment')} className="mb-5">
      {paymentDetails[localeKey]}
    </Callout>
  );
}
