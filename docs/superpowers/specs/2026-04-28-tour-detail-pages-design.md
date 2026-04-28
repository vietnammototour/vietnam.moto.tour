# Tour Detail Pages — Design Spec

## Overview

Integrate real tour program data from raw `.docx` documents into the website's JSON data layer by extending the `Tour` schema, and implement dedicated tour detail pages at `/tours/[slug]`.

**Scope:** 7 tours, all content from raw docs, bilingual (EN/VI), no booking forms (WhatsApp + Email CTA only).

---

## 1. Extended Tour Schema

### New Types

```typescript
type LocalizedText = {
  en: string;
  vi: string;
};

interface ItineraryItem {
  time: string;              // "7:00 a.m", "10:15 a.m"
  description: LocalizedText;
}

interface ItineraryDay {
  dayLabel: LocalizedText;   // "Day 1: Dalat" or "Itinerary"
  items: ItineraryItem[];
}

interface PricingTier {
  label: LocalizedText;      // "1 Pillion", "Single Rider", "Group of 2"
  price: number;             // USD amount
}
```

### Extended Tour Interface

All existing fields remain unchanged. New fields added:

```typescript
interface Tour {
  // ── Existing fields (unchanged) ──
  id: number;
  title: string;
  imageUrl: string;
  rating: string;
  price: number;             // "from" price shown on cards
  duration: string;
  distance: string;
  location: string;

  // ── New fields ──
  slug: string;              // URL identifier, e.g. "ba-ho-waterfall"
  description: LocalizedText;
  transportation: string;    // "Motorbike", "Private Car A/C", "Motorbike or Private Car"
  groupSize: string;         // "Min 1 Person", "Min 2 Person"
  hotel: string;             // "Pick up & Drop off"
  guided: string;            // "Fully Guided Tour"
  heroImage: string;         // large banner image for detail page
  images: string[];          // gallery array (empty for now, future use)
  highlights: LocalizedText[];
  itinerary: ItineraryDay[];
  pricing: PricingTier[];
  included: LocalizedText[];
  excluded: LocalizedText[];
  paymentDetails: LocalizedText;
  notes: LocalizedText[];
  mealsInfo: LocalizedText;
}
```

### Design Decisions

- **Existing fields unchanged** — TourCard, TourCarousel, and all listing components continue to work with zero changes.
- **`LocalizedText`** on all display strings — `{ en, vi }` inline bilingual. Resolved in components via `tour.field[locale]`.
- **Structural fields stay plain strings** — `transportation`, `groupSize`, `hotel`, `guided` are short labels that don't need localization in the JSON (can be localized via UI labels in translation files if needed).
- **`highlights` optional in practice** — some tours have them, some don't. Empty array = section not rendered.
- **`pricing` is flat** — `[{ label, price }]` works for both rider-type pricing (motorbike tours) and group-size pricing (car tours).
- **`images[]` ready but empty** — schema supports future gallery, no fake data populated now.
- **`heroImage` initially same as `imageUrl`** — reuses the existing card image until dedicated hero images are provided.
- **`title` stays a plain string** — tour names are proper nouns / brand names (e.g. "Ba Ho Waterfall"), not translated. Localized marketing copy lives in `description`.
- **Single `tours.json`** — all 7 tours enriched in-place. Tour count is fixed and small; schema can be restructured if it grows significantly.

---

## 2. Tour-to-Slug Mapping

| ID | Current Title | Slug | Source Doc |
|----|--------------|------|------------|
| 1 | Da Lat Tour | `dalat-car-excursion` | Full day car tour dalat excursion.docx |
| 2 | 2d Explore Da Lat | `2d-explore-dalat` | 2D Explore dalat.docx |
| 3 | Baho Waterfall | `ba-ho-waterfall` | Full day ba ho waterfall.docx |
| 4 | 1d Motor NT-DL | `1d-nha-trang-to-dalat` | 1D Nha trang to dalat.docx |
| 5 | Nha Trang Tour | `nha-trang-half-day` | Nha trang half day moorbike tour.docx |
| 6 | Honba Waterfall | `hon-ba-waterfall` | Full day hon ba nature waterfall.docx |
| 7 | Eco Day Tour | `mui-ne-car-excursion` | Full day car tour mui ne excursion.docx |

---

## 3. Tour Detail Page Layout

### Route

- **File:** `src/pages/tours/[slug].tsx`
- **URL:** `/tours/ba-ho-waterfall`, `/tours/2d-explore-dalat`, etc.
- **Static generation:** `getStaticPaths` generates all 7 pages at build time, `getStaticProps` loads tour data + locale messages. Returns 404 for unknown slugs.

### Desktop Layout (lg+)

```
┌──────────────────────────────────────────────────────┐
│  Hero Banner                                         │
│  Breadcrumb · Title · Stats Row · From Price         │
├──────────────────────────────┬───────────────────────┤
│  Main Column (65%)           │  Sidebar (35%, sticky)│
│                              │                       │
│  ┌─ Description ───────────┐ │  ┌─ Pricing ────────┐│
│  └─────────────────────────┘ │  │  label — $price   ││
│                              │  │  label — $price   ││
│  ┌─ Highlights (pills) ───┐ │  └──────────────────-─┘│
│  └─────────────────────────┘ │                       │
│                              │  ┌─ CTA ────────────┐│
│  ┌─ Itinerary (timeline) ─┐ │  │  WhatsApp button  ││
│  │  ● 8:30 AM — Stop 1    │ │  │  Email button     ││
│  │  ● 9:30 AM — Stop 2    │ │  └───────────────────┘│
│  │  ● 11:30 AM — Stop 3   │ │                       │
│  │  ...                    │ │  ┌─ Tour Details ───┐│
│  └─────────────────────────┘ │  │  Transport: ...   ││
│                              │  │  Duration: ...    ││
│  ┌─ Included ─┬─ Excluded ┐ │  │  Distance: ...    ││
│  │  ✓ Bike    │  ✗ Flight │ │  └───────────────────┘│
│  │  ✓ Fuel    │  ✗ Tips   │ │                       │
│  │  ...       │  ...      │ │  ┌─ Payment ────────┐│
│  └────────────┴───────────┘ │  └───────────────────┘│
│                              │                       │
│                              │  ┌─ Notes + Meals ──┐│
│                              │  └───────────────────┘│
├──────────────────────────────┴───────────────────────┤
│  Meals Info Footer                                   │
└──────────────────────────────────────────────────────┘
```

### Mobile Layout (< lg)

Single column. Sidebar content interleaved at logical positions:

1. Hero Banner
2. Description
3. Highlights (pills)
4. **Pricing** (moved up — users want to see price before long itinerary)
5. **Tour Details** (moved up)
6. Itinerary (timeline)
7. Included / Excluded (stacked vertically)
8. Payment
9. Notes + Meals

**Sticky bottom CTA bar:** Always visible — shows "From $XX" + WhatsApp/Email buttons.

---

## 4. Component Architecture

### New Components

| Component | Location | Props | Purpose |
|-----------|----------|-------|---------|
| `TourHero` | `src/components/tour-hero/` | `tour: Tour, locale: string` | Hero image, title, stats row, from-price |
| `TourDescription` | `src/components/tour-description/` | `description: LocalizedText, locale: string` | Marketing description text |
| `TourHighlights` | `src/components/tour-highlights/` | `highlights: LocalizedText[], locale: string` | Pill badges, hidden if empty array |
| `TourItinerary` | `src/components/tour-itinerary/` | `itinerary: ItineraryDay[], locale: string` | Visual timeline with day groups and time dots |
| `TourIncluded` | `src/components/tour-included/` | `included: LocalizedText[], excluded: LocalizedText[], locale: string` | Two-column (desktop) / stacked (mobile) lists |
| `TourPricing` | `src/components/tour-pricing/` | `pricing: PricingTier[], locale: string` | Pricing tiers table with label-price rows |
| `TourCTA` | `src/components/tour-cta/` | `tourTitle: string` | WhatsApp + Email buttons using contact info from `src/utils` |
| `TourDetails` | `src/components/tour-details/` | `tour: Tour` | Sidebar info grid (transport, duration, distance, group, hotel, guided) |
| `TourPayment` | `src/components/tour-payment/` | `paymentDetails: LocalizedText, locale: string` | Payment terms text |
| `TourNotes` | `src/components/tour-notes/` | `notes: LocalizedText[], mealsInfo: LocalizedText, locale: string` | Notes list + meals description |

### Modified Components

| Component | Change |
|-----------|--------|
| `TourCard` | Link target changes from `/tours` to `/tours/${tour.slug}` |

### Unchanged Components

All existing components (TourCarousel, DestinationCard, PageHeader, Header, Footer, Layout, etc.) remain untouched.

---

## 5. Data Flow

```
tours.json (enriched)
    ↓
src/data/index.ts (exports toursData)
    ↓
getStaticPaths → generates /tours/[slug] for all 7 tours
    ↓
getStaticProps({ params.slug, locale })
    → finds tour by slug
    → loads locale messages
    → returns { tour, messages }
    ↓
TourDetailPage component
    → resolves LocalizedText via locale
    → passes slices to section components
    → section components use useTranslations() for UI labels
```

---

## 6. i18n Strategy

**Tour content:** Bilingual inline in `tours.json` via `LocalizedText` (`{ en, vi }`). Resolved in components using the current locale from router/props.

**UI labels** (section headings, button text, "per person", etc.): Added to `src/messages/{en,vi}.json` under a `tourDetail` namespace:

```json
{
  "tourDetail": {
    "aboutThisTour": "About This Tour",
    "highlights": "Highlights",
    "itinerary": "Itinerary",
    "pricing": "Pricing",
    "whatsIncluded": "What's Included",
    "whatsNotIncluded": "What's Not Included",
    "tourDetails": "Tour Details",
    "payment": "Payment",
    "importantNotes": "Important Notes",
    "meals": "Meals",
    "whatsappUs": "WhatsApp Us",
    "emailInquiry": "Email Inquiry",
    "from": "From",
    "perPerson": "/ per person",
    "transportation": "Transportation",
    "duration": "Duration",
    "distance": "Distance",
    "group": "Group",
    "hotel": "Hotel",
    "guided": "Guided"
  }
}
```

---

## 7. File Changes Summary

### Modified Files

- `src/types/index.ts` — add `LocalizedText`, `ItineraryItem`, `ItineraryDay`, `PricingTier`, extend `Tour`
- `src/data/tours.json` — enrich all 7 tours with full content from raw docs
- `src/components/tour-card/index.tsx` — link to `/tours/${tour.slug}` instead of `/tours`
- `src/messages/en.json` — add `tourDetail.*` UI label keys
- `src/messages/vi.json` — add `tourDetail.*` UI label keys

### New Files

- `src/pages/tours/[slug].tsx` — tour detail page
- `src/components/tour-hero/index.tsx`
- `src/components/tour-description/index.tsx`
- `src/components/tour-highlights/index.tsx`
- `src/components/tour-itinerary/index.tsx`
- `src/components/tour-included/index.tsx`
- `src/components/tour-pricing/index.tsx`
- `src/components/tour-cta/index.tsx`
- `src/components/tour-details/index.tsx`
- `src/components/tour-payment/index.tsx`
- `src/components/tour-notes/index.tsx`

---

## 8. Animations

Consistent with existing site patterns using Framer Motion:

- **Section fade-in** — each section animates in on scroll (staggered `y: 20, opacity: 0` → `y: 0, opacity: 1`)
- **Itinerary timeline** — dots and lines animate sequentially on scroll
- **Highlight pills** — staggered pop-in animation
- **Page transition** — follows existing Framer Motion page transition pattern from `_app.tsx`

---

## 9. SEO

- Dynamic `<title>` and `<meta description>` per tour using `next/head`
- `<title>`: `"{tour.title} | Vietnam Moto Tour"` (localized)
- `<meta description>`: first ~160 chars of `tour.description[locale]`
- Hreflang tags handled by existing `HrefLang` component
- Semantic HTML: `<article>`, `<section>`, `<h1>` for tour title, `<h2>` for section headings
- Structured data (JSON-LD `TouristTrip` schema) can be added as a future enhancement

---

## 10. Out of Scope

- Booking forms / payment integration (future)
- Image gallery with real photos (images[] is schema-ready but empty)
- Map integration
- Reviews / testimonials per tour
- Related tours / "you might also like" section
- JSON-LD structured data
