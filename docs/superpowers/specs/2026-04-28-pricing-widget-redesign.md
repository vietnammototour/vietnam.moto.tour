# Pricing Widget Redesign

## Problem

The current pricing widget on `/tours/[slug]` is a flat list of `PricingTier[]` (label + price) that creates two UX problems:

1. **Vehicle-type pricing is confusing.** Labels like "1 Pillion by Motorbike" and "1 Rider + 1 Pillion (sharing)" use motorcycle jargon that tourists don't understand. Some prices are per-person, others per-pair, with no indication which is which.
2. **Group-size pricing is repetitive.** 7 near-identical rows ("Per Person (Group of X)") to communicate one simple idea: bigger group = cheaper per person.

## Design Decisions

- All prices are per-person. Tour data will be adjusted so every `price` value represents a single person's cost.
- Vehicle-type options are grouped by transport type (motorbike/car) with plain-language labels and short descriptions.
- Group-size pricing is replaced by an interactive stepper ("How many people?") that shows the matching per-person price.

## Data Model

### Current

```typescript
interface PricingTier {
  label: LocalizedText;
  price: number;
}

// Tour.pricing: PricingTier[]
```

### Proposed

```typescript
interface PricingTier {
  label: LocalizedText;
  description?: LocalizedText;
  price: number; // always per-person
  minGroupSize?: number; // for group-size type only
  maxGroupSize?: number; // for group-size type only, omit for "8+"
}

interface PricingGroup {
  type: 'group-size' | 'vehicle';
  label: LocalizedText;
  icon?: string; // FontAwesome icon name
  tiers: PricingTier[];
}

// Tour.pricing: PricingTier[]  -->  Tour.pricingGroups: PricingGroup[]
// Tour.pricing is removed
```

### Example: Vehicle-Type Tour (Ba Ho Waterfall)

```json
"pricingGroups": [
  {
    "type": "vehicle",
    "label": { "en": "By Motorbike", "vi": "Xe May" },
    "icon": "motorcycle",
    "tiers": [
      {
        "label": { "en": "Ride as passenger", "vi": "Ngoi sau" },
        "description": { "en": "Sit back and enjoy the ride", "vi": "Ngoi sau va tan huong" },
        "price": 65
      },
      {
        "label": { "en": "Drive yourself", "vi": "Tu lai" },
        "description": { "en": "You ride your own bike", "vi": "Ban tu lai xe" },
        "price": 75
      },
      {
        "label": { "en": "Share a bike", "vi": "Chia se xe" },
        "description": { "en": "2 people, 1 motorbike", "vi": "2 nguoi, 1 xe" },
        "price": 55
      }
    ]
  },
  {
    "type": "vehicle",
    "label": { "en": "By Car", "vi": "Xe Hoi" },
    "icon": "car",
    "tiers": [
      {
        "label": { "en": "Private car", "vi": "Xe rieng" },
        "description": { "en": "Min. 2 passengers", "vi": "Toi thieu 2 nguoi" },
        "price": 70
      }
    ]
  }
]
```

### Example: Group-Size Tour (Da Lat Tour)

```json
"pricingGroups": [
  {
    "type": "group-size",
    "label": { "en": "Per Person", "vi": "Moi Nguoi" },
    "tiers": [
      { "label": { "en": "Group of 2", "vi": "Nhom 2" }, "price": 85, "minGroupSize": 2, "maxGroupSize": 2 },
      { "label": { "en": "Group of 3", "vi": "Nhom 3" }, "price": 80, "minGroupSize": 3, "maxGroupSize": 3 },
      { "label": { "en": "Group of 4", "vi": "Nhom 4" }, "price": 75, "minGroupSize": 4, "maxGroupSize": 4 },
      { "label": { "en": "Group of 5-6", "vi": "Nhom 5-6" }, "price": 70, "minGroupSize": 5, "maxGroupSize": 6 },
      { "label": { "en": "Group of 7", "vi": "Nhom 7" }, "price": 65, "minGroupSize": 7, "maxGroupSize": 7 },
      { "label": { "en": "Group of 8+", "vi": "Nhom 8+" }, "price": 60, "minGroupSize": 8 }
    ]
  },
  {
    "type": "group-size",
    "label": { "en": "Children (110-140cm)", "vi": "Tre em (110-140cm)" },
    "tiers": [
      { "label": { "en": "Any group size", "vi": "Moi nhom" }, "price": 20 }
    ]
  }
]
```

## UI Design

### Vehicle-Type Rendering

Transport options displayed as radio-style selectable rows, grouped under transport headings with icons.

```
┌─────────────────────────────────────┐
│  Pricing              (all /person) │
│                                     │
│  motorcycle-icon  By Motorbike      │
│  ┌─────────────────────────────────┐│
│  │ (o) Ride as passenger    $65   ││
│  │     Sit back and enjoy…        ││
│  ├─────────────────────────────────┤│
│  │ ( ) Drive yourself       $75   ││
│  │     You ride your own bike     ││
│  ├─────────────────────────────────┤│
│  │ ( ) Share a bike         $55   ││
│  │     2 people, 1 motorbike      ││
│  └─────────────────────────────────┘│
│                                     │
│  car-icon  By Car                   │
│  ┌─────────────────────────────────┐│
│  │ ( ) Private car          $70   ││
│  │     Min. 2 passengers          ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

- One option selected at a time across all groups (radio behavior).
- Selected state: subtle primary background tint + primary border.
- Default selection on mount: cheapest option.
- Description text: secondary/muted color, one line, smaller font.

### Group-Size Rendering

Interactive stepper replaces the flat list.

```
┌─────────────────────────────────────┐
│  Pricing              (all /person) │
│                                     │
│  How many people?                   │
│       [ - ]    4 people    [ + ]    │
│                                     │
│            $75 / person             │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Larger group = better price!    ││
│  │ 2 pax: $85  -->  8+ pax: $60   ││
│  └─────────────────────────────────┘│
│                                     │
│  - - - - - - - - - - - - - - - - - │
│  Children (110-140cm)         $20  │
└─────────────────────────────────────┘
```

- Stepper: `-` and `+` buttons, current count centered between them.
- Range: min 2 (smallest group tier), max 8 (treated as 8+).
- Price displayed large and bold, centered, updates immediately on count change.
- Hint row below price shows the savings gradient (cheapest to most expensive).
- Children pricing: static row below a subtle divider, does not change with stepper.
- Mapping: stepper value matched to tier via `minGroupSize`/`maxGroupSize` fields.

## Responsive Behavior

### Desktop (lg+) — Sticky Sidebar

- Widget stays in existing sidebar position with existing sticky behavior.
- Selected option's price updates the CTA button below: "Book Now -- $65/person".

### Mobile (<lg) — Inline + Sticky CTA

- Full widget renders inline (between highlights and itinerary, same as today).
- Mobile sticky CTA bar at bottom updates based on selection:
  - Vehicle tours: selected option name + price ("Ride as passenger -- $65/person").
  - Group-size tours: count + price ("4 people -- $75/person").
- All interactive elements have minimum 44px tap targets.

### Mixed Pricing Tours

- Component renders each `PricingGroup` in order. The `type` field determines which UI variant (vehicle cards or group-size stepper) to use per group.
- Standalone groups with a single tier (like children) render as simple static rows below a divider.

## Animations

- **Price change (stepper):** Subtle number crossfade using Framer Motion (already a project dependency).
- **Card selection:** Border/background transition via Tailwind `transition-colors`.

## Translation Keys

New keys needed in `src/messages/{en,vi}.json` under `tourDetail`:

| Key                      | English                        | Vietnamese                    |
| ------------------------ | ------------------------------ | ----------------------------- |
| `pricingPerPerson`       | "/ person"                     | "/ nguoi"                     |
| `howManyPeople`          | "How many people?"             | "Bao nhieu nguoi?"            |
| `people`                 | "people"                       | "nguoi"                       |
| `largerGroupBetterPrice` | "Larger group = better price!" | "Nhom lon hon = gia tot hon!" |
| `pax`                    | "pax"                          | "nguoi"                       |

Existing keys retained: `pricing`, `from`, `perPerson`.

## Files Changed

- `src/types/index.ts` — Add `PricingGroup` interface, update `Tour` type
- `src/data/tours.json` — Migrate `pricing` to `pricingGroups` for all tours
- `src/components/tour-pricing/index.tsx` — Rewrite component with vehicle/group-size variants
- `src/pages/tours/[slug].tsx` — Update props passed to `TourPricing`, update mobile sticky CTA
- `src/messages/en.json` — Add new translation keys
- `src/messages/vi.json` — Add new translation keys

## Out of Scope

- Currency conversion or multi-currency support.
- Booking/checkout flow changes.
- Tour card pricing display on the tours listing page (keeps showing `tour.price` as "From $X").
