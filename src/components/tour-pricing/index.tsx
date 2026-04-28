import {useTranslations} from 'next-intl';
import type {PricingTier} from '@/types';

interface TourPricingProps {
  pricing: PricingTier[];
  locale: string;
}

export function TourPricing({pricing, locale}: TourPricingProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  return (
    <div className="border-2 border-primary rounded-xl p-5 mb-5">
      <h3 className="type-title-lg text-on-surface mb-4">{t('pricing')}</h3>
      <div className="flex flex-col gap-1">
        {pricing.map((tier, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-2.5 border-b border-border-subtle last:border-b-0"
          >
            <span className="type-body-sm text-on-surface-secondary">
              {tier.label[localeKey]}
            </span>
            <span className="type-title-sm text-on-surface font-semibold">
              ${tier.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
