import {useState, useCallback, useEffect, useMemo} from 'react';
import {useTranslations} from 'next-intl';
import type {PricingGroup} from '@/types';
import {useEditable} from '@/components/admin/EditableContext';
import {VehiclePricing} from './vehicle-pricing';
import {GroupSizePricing} from './group-size-pricing';

interface TourPricingProps {
  pricingGroups: PricingGroup[];
  locale: string;
  onPriceChange?: (price: number, label: string) => void;
}

function findCheapestTier(groups: PricingGroup[]): {
  groupIdx: number;
  tierIdx: number;
  price: number;
} {
  let best = {groupIdx: 0, tierIdx: 0, price: Infinity};
  groups.forEach((g, gIdx) => {
    g.tiers.forEach((t, tIdx) => {
      if (t.price < best.price) {
        best = {groupIdx: gIdx, tierIdx: tIdx, price: t.price};
      }
    });
  });
  return best;
}

export function TourPricing({
  pricingGroups,
  locale,
  onPriceChange,
}: TourPricingProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';
  const ctx = useEditable();
  const activeLocale = ctx?.locale ?? localeKey;

  const vehicleGroups = useMemo(
    () => pricingGroups.filter((g) => g.type === 'vehicle'),
    [pricingGroups],
  );
  const hasVehicle = vehicleGroups.length > 0;

  const groupSizeGroups = useMemo(
    () => pricingGroups.filter((g) => g.type === 'group-size'),
    [pricingGroups],
  );

  // For group-size: first group with multiple tiers is the main one, single-tier groups are extras (children)
  const mainGroupSize = useMemo(
    () => groupSizeGroups.find((g) => g.tiers.length > 1),
    [groupSizeGroups],
  );
  const childrenGroup = useMemo(
    () => groupSizeGroups.find((g) => g.tiers.length === 1),
    [groupSizeGroups],
  );

  // Vehicle selection state
  const cheapest = hasVehicle
    ? findCheapestTier(vehicleGroups)
    : {groupIdx: 0, tierIdx: 0, price: 0};
  const [selectedVehicle, setSelectedVehicle] = useState(cheapest);

  const handleVehicleSelect = useCallback(
    (groupIdx: number, tierIdx: number) => {
      setSelectedVehicle({groupIdx, tierIdx, price: 0});
      const tier = vehicleGroups[groupIdx].tiers[tierIdx];
      onPriceChange?.(tier.price, tier.label[activeLocale]);
    },
    [vehicleGroups, activeLocale, onPriceChange],
  );

  const handleGroupSizePriceChange = useCallback(
    (price: number, count: number) => {
      onPriceChange?.(price, `${count} ${t('people')}`);
    },
    [onPriceChange, t],
  );

  // Fire initial price on mount
  useEffect(() => {
    if (hasVehicle && vehicleGroups.length > 0) {
      const tier = vehicleGroups[cheapest.groupIdx].tiers[cheapest.tierIdx];
      onPriceChange?.(tier.price, tier.label[activeLocale]);
    } else if (mainGroupSize) {
      const firstTier = mainGroupSize.tiers[0];
      onPriceChange?.(
        firstTier.price,
        `${firstTier.minGroupSize ?? 2} ${t('people')}`,
      );
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="border-2 border-primary rounded-xl p-5 mb-5">
      <h3 className="type-title-lg text-on-surface mb-4">{t('pricing')}</h3>

      {hasVehicle && (
        <VehiclePricing
          groups={vehicleGroups}
          locale={localeKey}
          selectedIndex={selectedVehicle}
          onSelect={handleVehicleSelect}
        />
      )}

      {mainGroupSize && (
        <GroupSizePricing
          group={mainGroupSize}
          childrenGroup={childrenGroup}
          locale={localeKey}
          onPriceChange={handleGroupSizePriceChange}
        />
      )}
    </div>
  );
}
