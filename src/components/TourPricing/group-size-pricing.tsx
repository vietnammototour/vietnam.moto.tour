import {useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {PricingGroup} from '@/types';
import {useEditable} from '@/components/Admin/EditableContext';

type GroupSizePricingProps = {
  group: PricingGroup;
  childrenGroup?: PricingGroup;
  locale: 'en' | 'vi';
  onPriceChange: (price: number, count: number) => void;
};

function findPriceForSize(group: PricingGroup, size: number): number {
  for (const tier of group.tiers) {
    if (tier.minGroupSize === undefined) continue;
    const min = tier.minGroupSize;
    const max = tier.maxGroupSize ?? Infinity;
    if (size >= min && size <= max) return tier.price;
  }
  const last = group.tiers[group.tiers.length - 1];
  return last.price;
}

function getMinSize(group: PricingGroup): number {
  return group.tiers.reduce((min, t) => {
    if (t.minGroupSize === undefined) return min;
    return Math.min(min, t.minGroupSize);
  }, Infinity);
}

function getMaxSize(group: PricingGroup): number {
  return group.tiers.reduce((max, t) => {
    if (t.minGroupSize === undefined) return max;
    const tierMax = t.maxGroupSize ?? t.minGroupSize;
    return Math.max(max, tierMax);
  }, 0);
}

export function GroupSizePricing({
  group,
  childrenGroup,
  locale,
  onPriceChange,
}: GroupSizePricingProps) {
  const t = useTranslations('tourDetail');
  const ctx = useEditable();
  const activeLocale = ctx?.locale ?? locale;
  const minSize = getMinSize(group);
  const maxSize = getMaxSize(group);
  const [count, setCount] = useState(minSize);
  const price = findPriceForSize(group, count);

  const handleChange = (newCount: number) => {
    const clamped = Math.max(minSize, Math.min(maxSize, newCount));
    setCount(clamped);
    onPriceChange(findPriceForSize(group, clamped), clamped);
  };

  const firstTier = group.tiers[0];
  const lastTier = group.tiers[group.tiers.length - 1];
  const highestPrice = firstTier.price;
  const lowestPrice = lastTier.price;
  const highestLabel = firstTier.minGroupSize ?? minSize;
  const lowestLabel =
    lastTier.maxGroupSize === undefined
      ? `${lastTier.minGroupSize}+`
      : lastTier.minGroupSize;

  return (
    <div className="flex flex-col gap-4">
      <p className="type-body-sm text-on-surface-secondary">
        {t('howManyPeople')}
      </p>
      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label={t('decreasePeople')}
          onClick={() => handleChange(count - 1)}
          disabled={count <= minSize}
          className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-border-subtle text-on-surface type-title-sm font-semibold transition-colors hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          -
        </button>
        <span className="type-title-lg text-on-surface font-semibold min-w-[5rem] text-center">
          {count} {t('people')}
        </span>
        <button
          type="button"
          aria-label={t('increasePeople')}
          onClick={() => handleChange(count + 1)}
          disabled={count >= maxSize}
          className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-border-subtle text-on-surface type-title-sm font-semibold transition-colors hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          +
        </button>
      </div>

      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={price}
            initial={{opacity: 0, y: 4}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -4}}
            transition={{duration: 0.15}}
            className="type-title-xl text-primary font-bold"
          >
            ${price}
          </motion.span>
        </AnimatePresence>
        <span className="type-body-sm text-on-surface-secondary ml-1">
          {t('pricingPerPerson')}
        </span>
      </div>

      <div className="rounded-lg bg-surface-elevated p-3 text-center">
        <p className="type-label-sm text-on-surface-secondary">
          {t('largerGroupBetterPrice')}
        </p>
        <p className="type-label-sm text-on-surface-secondary mt-1">
          {highestLabel} {t('pax')}: ${highestPrice} → {lowestLabel} {t('pax')}:
          ${lowestPrice}
        </p>
      </div>

      {childrenGroup && childrenGroup.tiers.length > 0 && (
        <>
          <div className="border-t border-border-subtle" />
          <div className="flex justify-between items-center">
            <span className="type-body-sm text-on-surface-secondary">
              {childrenGroup.label[activeLocale]}
            </span>
            <span className="type-title-sm text-on-surface font-semibold">
              ${childrenGroup.tiers[0].price}
              <span className="type-label-sm text-on-surface-secondary font-normal">
                {t('pricingPerPerson')}
              </span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
