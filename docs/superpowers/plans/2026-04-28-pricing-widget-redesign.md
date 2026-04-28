# Pricing Widget Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat pricing list on tour detail pages with grouped transport cards (vehicle tours) and an interactive group-size stepper, with all prices normalized to per-person.

**Architecture:** The `TourPricing` component is rewritten to branch on `PricingGroup.type` — rendering radio-style selectable cards for `"vehicle"` groups and a stepper with dynamic price display for `"group-size"` groups. The selected price is lifted to the page via a callback so the mobile sticky CTA can display it. Data is migrated from `pricing: PricingTier[]` to `pricingGroups: PricingGroup[]` in `tours.json`.

**Tech Stack:** Next.js 16 (Pages Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion 12, next-intl 4, Jest 30.

---

## File Map

| Action  | File                                                 | Responsibility                                   |
| ------- | ---------------------------------------------------- | ------------------------------------------------ |
| Modify  | `src/types/index.ts`                                 | Add `PricingGroup` interface, update `Tour`      |
| Modify  | `src/data/tours.json`                                | Migrate all tour pricing data                    |
| Modify  | `src/test-utils/factories.ts`                        | Update `buildTour` factory for new shape         |
| Rewrite | `src/components/tour-pricing/index.tsx`              | Main widget: branches on group type              |
| Create  | `src/components/tour-pricing/vehicle-pricing.tsx`    | Vehicle-type radio cards                         |
| Create  | `src/components/tour-pricing/group-size-pricing.tsx` | Stepper + dynamic price                          |
| Modify  | `src/pages/tours/[slug].tsx`                         | Wire `onPriceChange` callback, update mobile CTA |
| Modify  | `src/messages/en.json`                               | Add new translation keys                         |
| Modify  | `src/messages/vi.json`                               | Add new translation keys                         |

---

### Task 1: Add Types and Translation Keys

**Files:**

- Modify: `src/types/index.ts:18-42`
- Modify: `src/messages/en.json:48-72`
- Modify: `src/messages/vi.json:48-72`

- [ ] **Step 1: Add `PricingGroup` interface and update `Tour` type**

In `src/types/index.ts`, replace the existing `PricingTier` and update the `Tour` interface:

```typescript
export interface PricingTier {
  label: LocalizedText;
  description?: LocalizedText;
  price: number;
  minGroupSize?: number;
  maxGroupSize?: number;
}

export interface PricingGroup {
  type: 'group-size' | 'vehicle';
  label: LocalizedText;
  icon?: string;
  tiers: PricingTier[];
}
```

In the `Tour` interface, replace `pricing: PricingTier[];` with `pricingGroups: PricingGroup[];`.

- [ ] **Step 2: Add translation keys to `en.json`**

Add these keys inside the `tourDetail` object in `src/messages/en.json`:

```json
"pricingPerPerson": "/ person",
"howManyPeople": "How many people?",
"people": "people",
"largerGroupBetterPrice": "Larger group = better price!",
"pax": "pax"
```

- [ ] **Step 3: Add translation keys to `vi.json`**

Add these keys inside the `tourDetail` object in `src/messages/vi.json`:

```json
"pricingPerPerson": "/ người",
"howManyPeople": "Bao nhiêu người?",
"people": "người",
"largerGroupBetterPrice": "Nhóm lớn hơn = giá tốt hơn!",
"pax": "người"
```

- [ ] **Step 4: Update the test factory**

In `src/test-utils/factories.ts`, replace the `pricing` line (line 30) with:

```typescript
pricingGroups: [
  {
    type: 'vehicle' as const,
    label: {en: 'By Motorbike', vi: 'Xe Máy'},
    icon: 'motorcycle',
    tiers: [
      {
        label: {en: 'Ride as passenger', vi: 'Ngồi sau'},
        description: {en: 'Sit back and enjoy the ride', vi: 'Ngồi sau và tận hưởng'},
        price: 65,
      },
    ],
  },
],
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `pnpm build`
Expected: Build succeeds (will fail until data + components are updated — this is expected if running tasks sequentially; if running in parallel with Task 2, both must complete before build passes).

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/messages/en.json src/messages/vi.json src/test-utils/factories.ts
git commit -m "feat: add PricingGroup types and translation keys for pricing widget redesign"
```

---

### Task 2: Migrate Tour Data

**Files:**

- Modify: `src/data/tours.json`

This task migrates all 7 tours from `pricing: PricingTier[]` to `pricingGroups: PricingGroup[]`. "Sharing" prices that represent a pair total are halved to per-person.

- [ ] **Step 1: Migrate Tour 1 (Da Lat Tour, id:1) — group-size**

Replace the `"pricing"` key with `"pricingGroups"`:

```json
"pricingGroups": [
  {
    "type": "group-size",
    "label": {"en": "Per Person", "vi": "Mỗi Người"},
    "tiers": [
      {"label": {"en": "Group of 2", "vi": "Nhóm 2"}, "price": 80, "minGroupSize": 2, "maxGroupSize": 2},
      {"label": {"en": "Group of 3", "vi": "Nhóm 3"}, "price": 75, "minGroupSize": 3, "maxGroupSize": 3},
      {"label": {"en": "Group of 4-5", "vi": "Nhóm 4-5"}, "price": 70, "minGroupSize": 4, "maxGroupSize": 5},
      {"label": {"en": "Group of 6-7", "vi": "Nhóm 6-7"}, "price": 65, "minGroupSize": 6, "maxGroupSize": 7},
      {"label": {"en": "Group of 8+", "vi": "Nhóm 8+"}, "price": 60, "minGroupSize": 8}
    ]
  },
  {
    "type": "group-size",
    "label": {"en": "Children (110-140cm)", "vi": "Trẻ em (110-140cm)"},
    "tiers": [
      {"label": {"en": "Any group size", "vi": "Mọi nhóm"}, "price": 20}
    ]
  }
]
```

- [ ] **Step 2: Migrate Tour 2 (2d Explore Da Lat, id:2) — vehicle (motorbike only)**

Replace `"pricing"` with `"pricingGroups"`. The sharing price $360 is halved to $180/person:

```json
"pricingGroups": [
  {
    "type": "vehicle",
    "label": {"en": "By Motorbike", "vi": "Xe Máy"},
    "icon": "motorcycle",
    "tiers": [
      {
        "label": {"en": "Ride as passenger", "vi": "Ngồi sau"},
        "description": {"en": "Sit back and enjoy the ride", "vi": "Ngồi sau và tận hưởng"},
        "price": 130
      },
      {
        "label": {"en": "Drive yourself", "vi": "Tự lái"},
        "description": {"en": "You ride your own bike", "vi": "Bạn tự lái xe"},
        "price": 160
      },
      {
        "label": {"en": "Share a bike", "vi": "Chia sẻ xe"},
        "description": {"en": "2 people, 1 motorbike", "vi": "2 người, 1 xe"},
        "price": 180
      }
    ]
  }
]
```

- [ ] **Step 3: Migrate Tour 3 (Ba Ho Waterfall, id:3) — vehicle (motorbike + car)**

Replace `"pricing"` with `"pricingGroups"`. Sharing price $110 halved to $55/person:

```json
"pricingGroups": [
  {
    "type": "vehicle",
    "label": {"en": "By Motorbike", "vi": "Xe Máy"},
    "icon": "motorcycle",
    "tiers": [
      {
        "label": {"en": "Ride as passenger", "vi": "Ngồi sau"},
        "description": {"en": "Sit back and enjoy the ride", "vi": "Ngồi sau và tận hưởng"},
        "price": 65
      },
      {
        "label": {"en": "Drive yourself", "vi": "Tự lái"},
        "description": {"en": "You ride your own bike", "vi": "Bạn tự lái xe"},
        "price": 75
      },
      {
        "label": {"en": "Share a bike", "vi": "Chia sẻ xe"},
        "description": {"en": "2 people, 1 motorbike", "vi": "2 người, 1 xe"},
        "price": 55
      }
    ]
  },
  {
    "type": "vehicle",
    "label": {"en": "By Car", "vi": "Xe Hơi"},
    "icon": "car",
    "tiers": [
      {
        "label": {"en": "Private car", "vi": "Xe riêng"},
        "description": {"en": "Min. 2 passengers", "vi": "Tối thiểu 2 người"},
        "price": 70
      }
    ]
  }
]
```

- [ ] **Step 4: Migrate Tour 4 (1d Motor NT-DL, id:4) — vehicle (motorbike only)**

Replace `"pricing"` with `"pricingGroups"`. Sharing price $120 halved to $60/person:

```json
"pricingGroups": [
  {
    "type": "vehicle",
    "label": {"en": "By Motorbike", "vi": "Xe Máy"},
    "icon": "motorcycle",
    "tiers": [
      {
        "label": {"en": "Ride as passenger", "vi": "Ngồi sau"},
        "description": {"en": "Sit back and enjoy the ride", "vi": "Ngồi sau và tận hưởng"},
        "price": 70
      },
      {
        "label": {"en": "Drive yourself", "vi": "Tự lái"},
        "description": {"en": "You ride your own bike", "vi": "Bạn tự lái xe"},
        "price": 90
      },
      {
        "label": {"en": "Share a bike", "vi": "Chia sẻ xe"},
        "description": {"en": "2 people, 1 motorbike", "vi": "2 người, 1 xe"},
        "price": 60
      }
    ]
  }
]
```

- [ ] **Step 5: Migrate Tour 5 (Nha Trang Tour, id:5) — vehicle (motorbike + car)**

Replace `"pricing"` with `"pricingGroups"`. Sharing price $50 halved to $25/person:

```json
"pricingGroups": [
  {
    "type": "vehicle",
    "label": {"en": "By Motorbike", "vi": "Xe Máy"},
    "icon": "motorcycle",
    "tiers": [
      {
        "label": {"en": "Ride as passenger", "vi": "Ngồi sau"},
        "description": {"en": "Sit back and enjoy the ride", "vi": "Ngồi sau và tận hưởng"},
        "price": 30
      },
      {
        "label": {"en": "Drive yourself", "vi": "Tự lái"},
        "description": {"en": "You ride your own bike", "vi": "Bạn tự lái xe"},
        "price": 40
      },
      {
        "label": {"en": "Share a bike", "vi": "Chia sẻ xe"},
        "description": {"en": "2 people, 1 motorbike", "vi": "2 người, 1 xe"},
        "price": 25
      }
    ]
  },
  {
    "type": "vehicle",
    "label": {"en": "By Car", "vi": "Xe Hơi"},
    "icon": "car",
    "tiers": [
      {
        "label": {"en": "Private car", "vi": "Xe riêng"},
        "description": {"en": "Min. 2 passengers", "vi": "Tối thiểu 2 người"},
        "price": 40
      }
    ]
  }
]
```

- [ ] **Step 6: Migrate Tour 6 (Honba Waterfall, id:6) — vehicle (motorbike + car)**

Replace `"pricing"` with `"pricingGroups"`. Sharing price $110 halved to $55/person:

```json
"pricingGroups": [
  {
    "type": "vehicle",
    "label": {"en": "By Motorbike", "vi": "Xe Máy"},
    "icon": "motorcycle",
    "tiers": [
      {
        "label": {"en": "Ride as passenger", "vi": "Ngồi sau"},
        "description": {"en": "Sit back and enjoy the ride", "vi": "Ngồi sau và tận hưởng"},
        "price": 65
      },
      {
        "label": {"en": "Drive yourself", "vi": "Tự lái"},
        "description": {"en": "You ride your own bike", "vi": "Bạn tự lái xe"},
        "price": 75
      },
      {
        "label": {"en": "Share a bike", "vi": "Chia sẻ xe"},
        "description": {"en": "2 people, 1 motorbike", "vi": "2 người, 1 xe"},
        "price": 55
      }
    ]
  },
  {
    "type": "vehicle",
    "label": {"en": "By Car", "vi": "Xe Hơi"},
    "icon": "car",
    "tiers": [
      {
        "label": {"en": "Private car", "vi": "Xe riêng"},
        "description": {"en": "Min. 2 passengers", "vi": "Tối thiểu 2 người"},
        "price": 70
      }
    ]
  }
]
```

- [ ] **Step 7: Migrate Tour 7 (Eco Day Tour, id:7) — group-size**

Replace `"pricing"` with `"pricingGroups"`:

```json
"pricingGroups": [
  {
    "type": "group-size",
    "label": {"en": "Per Person", "vi": "Mỗi Người"},
    "tiers": [
      {"label": {"en": "Group of 2", "vi": "Nhóm 2"}, "price": 85, "minGroupSize": 2, "maxGroupSize": 2},
      {"label": {"en": "Group of 3", "vi": "Nhóm 3"}, "price": 80, "minGroupSize": 3, "maxGroupSize": 3},
      {"label": {"en": "Group of 4", "vi": "Nhóm 4"}, "price": 75, "minGroupSize": 4, "maxGroupSize": 4},
      {"label": {"en": "Group of 5-6", "vi": "Nhóm 5-6"}, "price": 70, "minGroupSize": 5, "maxGroupSize": 6},
      {"label": {"en": "Group of 7", "vi": "Nhóm 7"}, "price": 65, "minGroupSize": 7, "maxGroupSize": 7},
      {"label": {"en": "Group of 8+", "vi": "Nhóm 8+"}, "price": 60, "minGroupSize": 8}
    ]
  },
  {
    "type": "group-size",
    "label": {"en": "Children (110-140cm)", "vi": "Trẻ em (110-140cm)"},
    "tiers": [
      {"label": {"en": "Any group size", "vi": "Mọi nhóm"}, "price": 20}
    ]
  }
]
```

- [ ] **Step 8: Commit**

```bash
git add src/data/tours.json
git commit -m "feat: migrate tour pricing data to pricingGroups structure

All prices normalized to per-person. Sharing prices halved.
Group-size tiers get minGroupSize/maxGroupSize for stepper mapping."
```

---

### Task 3: Build Vehicle Pricing Component

**Files:**

- Create: `src/components/tour-pricing/vehicle-pricing.tsx`

- [ ] **Step 1: Create the vehicle pricing component**

Create `src/components/tour-pricing/vehicle-pricing.tsx`:

```tsx
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
          <div className="flex flex-col rounded-lg border border-border-subtle overflow-hidden">
            {group.tiers.map((tier, tIdx) => {
              const isSelected =
                selectedIndex.groupIdx === gIdx &&
                selectedIndex.tierIdx === tIdx;
              return (
                <button
                  key={tIdx}
                  type="button"
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
```

- [ ] **Step 2: Verify file created, no syntax errors**

Run: `npx tsc --noEmit --pretty`
Expected: No errors in `vehicle-pricing.tsx` (may have errors in other files not yet updated — that's fine).

- [ ] **Step 3: Commit**

```bash
git add src/components/tour-pricing/vehicle-pricing.tsx
git commit -m "feat: add VehiclePricing component with radio-style transport cards"
```

---

### Task 4: Build Group Size Pricing Component

**Files:**

- Create: `src/components/tour-pricing/group-size-pricing.tsx`

- [ ] **Step 1: Create the group size pricing component**

Create `src/components/tour-pricing/group-size-pricing.tsx`:

```tsx
import {useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {PricingGroup} from '@/types';

interface GroupSizePricingProps {
  group: PricingGroup;
  childrenGroup?: PricingGroup;
  locale: 'en' | 'vi';
  onPriceChange: (price: number, count: number) => void;
}

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
          onClick={() => handleChange(count - 1)}
          disabled={count <= minSize}
          className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-border-subtle text-on-surface type-title-sm font-semibold transition-colors hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          -
        </button>
        <span className="type-title-lg text-on-surface font-semibold min-w-[5rem] text-center">
          {count} {t('people')}
        </span>
        <button
          type="button"
          onClick={() => handleChange(count + 1)}
          disabled={count >= maxSize}
          className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-border-subtle text-on-surface type-title-sm font-semibold transition-colors hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
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
              {childrenGroup.label[locale]}
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
```

- [ ] **Step 2: Verify file created, no syntax errors**

Run: `npx tsc --noEmit --pretty`
Expected: No errors in `group-size-pricing.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/tour-pricing/group-size-pricing.tsx
git commit -m "feat: add GroupSizePricing component with stepper and animated price"
```

---

### Task 5: Rewrite Main TourPricing Component

**Files:**

- Rewrite: `src/components/tour-pricing/index.tsx`

- [ ] **Step 1: Rewrite the TourPricing component**

Replace the entire contents of `src/components/tour-pricing/index.tsx`:

```tsx
import {useState, useCallback, useEffect} from 'react';
import {useTranslations} from 'next-intl';
import type {PricingGroup} from '@/types';
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

  const hasVehicle = pricingGroups.some((g) => g.type === 'vehicle');
  const vehicleGroups = pricingGroups.filter((g) => g.type === 'vehicle');
  const groupSizeGroups = pricingGroups.filter((g) => g.type === 'group-size');

  // For group-size: first group with multiple tiers is the main one, single-tier groups are extras (children)
  const mainGroupSize = groupSizeGroups.find((g) => g.tiers.length > 1);
  const childrenGroup = groupSizeGroups.find((g) => g.tiers.length === 1);

  // Vehicle selection state
  const cheapest = hasVehicle
    ? findCheapestTier(vehicleGroups)
    : {groupIdx: 0, tierIdx: 0, price: 0};
  const [selectedVehicle, setSelectedVehicle] = useState(cheapest);

  const handleVehicleSelect = useCallback(
    (groupIdx: number, tierIdx: number) => {
      setSelectedVehicle({groupIdx, tierIdx, price: 0});
      const tier = vehicleGroups[groupIdx].tiers[tierIdx];
      onPriceChange?.(tier.price, tier.label[localeKey]);
    },
    [vehicleGroups, localeKey, onPriceChange],
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
      onPriceChange?.(tier.price, tier.label[localeKey]);
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
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty`
Expected: No errors in tour-pricing components.

- [ ] **Step 3: Commit**

```bash
git add src/components/tour-pricing/index.tsx
git commit -m "feat: rewrite TourPricing to branch on vehicle/group-size rendering"
```

---

### Task 6: Wire Up Tour Detail Page

**Files:**

- Modify: `src/pages/tours/[slug].tsx`

- [ ] **Step 1: Update the tour detail page**

Replace the entire contents of `src/pages/tours/[slug].tsx`:

```tsx
import {useState, useCallback} from 'react';
import {useTranslations} from 'next-intl';
import type {GetStaticPaths, GetStaticPropsContext} from 'next';
import Head from 'next/head';
import {useRouter} from 'next/router';
import {toursData} from '@/data';
import type {Tour} from '@/types';
import {contactInfo} from '@/utils';
import {TourHero} from '@/components/tour-hero';
import {TourDescription} from '@/components/tour-description';
import {TourHighlights} from '@/components/tour-highlights';
import {TourItinerary} from '@/components/tour-itinerary';
import {TourIncluded} from '@/components/tour-included';
import {TourPricing} from '@/components/tour-pricing';
import {TourCTA} from '@/components/tour-cta';
import {TourDetails} from '@/components/tour-details';
import {TourPayment} from '@/components/tour-payment';
import {TourNotes} from '@/components/tour-notes';

interface TourDetailProps {
  tour: Tour;
}

export default function TourDetail({tour}: TourDetailProps) {
  const router = useRouter();
  const locale = (router.locale ?? 'vi') as 'en' | 'vi';
  const t = useTranslations('tourDetail');
  const tMeta = useTranslations('meta');

  const metaDescription = tour.description[locale].slice(0, 160);

  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in the "${tour.title}" tour.`,
  );
  const whatsappUrl = `https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  const [selectedPrice, setSelectedPrice] = useState<{
    price: number;
    label: string;
  }>({price: tour.price, label: ''});

  const handlePriceChange = useCallback((price: number, label: string) => {
    setSelectedPrice({price, label});
  }, []);

  return (
    <>
      <Head>
        <title>{tMeta('tourDetailTitle', {tourTitle: tour.title})}</title>
        <meta name="description" content={metaDescription} />
      </Head>

      <TourHero tour={tour} />

      <article className="py-10 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:gap-10">
            {/* Main content */}
            <div className="lg:w-2/3">
              <TourDescription description={tour.description} locale={locale} />
              <TourHighlights highlights={tour.highlights} locale={locale} />

              {/* On mobile: pricing + details between highlights and itinerary */}
              <div className="lg:hidden mb-10">
                <TourPricing
                  pricingGroups={tour.pricingGroups}
                  locale={locale}
                  onPriceChange={handlePriceChange}
                />
                <TourDetails tour={tour} />
              </div>

              <TourItinerary itinerary={tour.itinerary} locale={locale} />
              <TourIncluded
                included={tour.included}
                excluded={tour.excluded}
                locale={locale}
              />

              {/* On mobile: payment + notes after included */}
              <div className="lg:hidden">
                <TourPayment
                  paymentDetails={tour.paymentDetails}
                  locale={locale}
                />
                <TourNotes
                  notes={tour.notes}
                  mealsInfo={tour.mealsInfo}
                  locale={locale}
                />
              </div>
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden lg:block lg:w-1/3">
              <div className="sticky top-24">
                <TourPricing
                  pricingGroups={tour.pricingGroups}
                  locale={locale}
                  onPriceChange={handlePriceChange}
                />
                <TourCTA tourTitle={tour.title} />
                <TourDetails tour={tour} />
                <TourPayment
                  paymentDetails={tour.paymentDetails}
                  locale={locale}
                />
                <TourNotes
                  notes={tour.notes}
                  mealsInfo={tour.mealsInfo}
                  locale={locale}
                />
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* Mobile sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface-elevated border-t border-border shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <span className="type-title-sm text-on-surface">
              ${selectedPrice.price}
            </span>
            <span className="type-label-sm text-on-surface-secondary ml-1">
              {t('pricingPerPerson')}
            </span>
            {selectedPrice.label && (
              <p className="type-label-sm text-on-surface-secondary">
                {selectedPrice.label}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white px-4 py-2 rounded-lg type-label-sm font-semibold"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:${contactInfo.email}?subject=${encodeURIComponent(`Inquiry: ${tour.title}`)}`}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg type-label-sm font-semibold"
            >
              Email
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = toursData.flatMap((tour) =>
    ['vi', 'en'].map((locale) => ({
      params: {slug: tour.slug},
      locale,
    })),
  );

  return {
    paths,
    fallback: false,
  };
};

export async function getStaticProps({params, locale}: GetStaticPropsContext) {
  const tour = toursData.find((t) => t.slug === params?.slug);

  if (!tour) {
    return {notFound: true};
  }

  return {
    props: {
      tour,
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 2: Build the project**

Run: `pnpm build`
Expected: Build succeeds with no TypeScript errors. All pages generate successfully.

- [ ] **Step 3: Commit**

```bash
git add src/pages/tours/[slug].tsx
git commit -m "feat: wire TourPricing into tour detail page with dynamic mobile CTA"
```

---

### Task 7: Verify and Fix

**Files:**

- All modified files

- [ ] **Step 1: Run linting**

Run: `pnpm lint`
Expected: No lint errors. Fix any that appear.

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: All tests pass. If any fail due to the `pricing` → `pricingGroups` change, update the test to use the new shape.

- [ ] **Step 3: Run full build**

Run: `pnpm build`
Expected: Build succeeds. All 7 tour pages generate without errors.

- [ ] **Step 4: Start dev server and manually verify**

Run: `pnpm dev`
Check in browser:

- `/tours/dalat-car-excursion` — should show group-size stepper (2-8+ range), children below divider
- `/tours/ba-ho-waterfall` — should show motorbike cards + car card, radio selection works
- `/tours/2d-explore-dalat` — should show motorbike cards only
- Mobile view: sticky CTA updates when selection changes
- Both English and Vietnamese locales work

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address lint/test/build issues from pricing widget migration"
```
