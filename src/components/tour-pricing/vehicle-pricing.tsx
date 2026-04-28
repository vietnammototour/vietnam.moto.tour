import {useTranslations} from 'next-intl';
import type {PricingGroup} from '@/types';

interface VehiclePricingProps {
  groups: PricingGroup[];
  locale: 'en' | 'vi';
  selectedIndex: {groupIdx: number; tierIdx: number};
  onSelect: (groupIdx: number, tierIdx: number) => void;
}

export function VehiclePricing({
  groups,
  locale,
  selectedIndex,
  onSelect,
}: VehiclePricingProps) {
  const t = useTranslations('tourDetail');

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group, gIdx) => (
        <div key={gIdx}>
          <div className="flex items-center gap-2 mb-3">
            {group.icon && (
              <i className={`fas fa-${group.icon} text-primary`} />
            )}
            <h4 className="type-title-sm text-on-surface font-semibold">
              {group.label[locale]}
            </h4>
          </div>
          <div
            role="radiogroup"
            aria-label={group.label[locale]}
            className="flex flex-col rounded-lg border border-border-subtle overflow-hidden"
          >
            {group.tiers.map((tier, tIdx) => {
              const isSelected =
                selectedIndex.groupIdx === gIdx &&
                selectedIndex.tierIdx === tIdx;
              return (
                <button
                  key={tIdx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelect(gIdx, tIdx)}
                  className={`flex items-start gap-3 p-3 text-left transition-colors border-b border-border-subtle last:border-b-0 ${
                    isSelected
                      ? 'bg-primary/10 border-l-2 border-l-primary'
                      : 'hover:bg-surface-elevated'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? 'border-primary'
                        : 'border-on-surface-secondary'
                    }`}
                  >
                    {isSelected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="type-body-sm text-on-surface font-medium">
                        {tier.label[locale]}
                      </span>
                      <span className="type-title-sm text-on-surface font-semibold ml-2 shrink-0">
                        ${tier.price}
                        <span className="type-label-sm text-on-surface-secondary font-normal">
                          {t('pricingPerPerson')}
                        </span>
                      </span>
                    </div>
                    {tier.description && (
                      <p className="type-label-sm text-on-surface-secondary mt-0.5">
                        {tier.description[locale]}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
