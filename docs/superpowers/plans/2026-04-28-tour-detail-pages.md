# Tour Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich tours.json with full tour content from raw .docx files and build dedicated tour detail pages at `/tours/[slug]`.

**Architecture:** Extend the existing Tour type with bilingual fields (LocalizedText), populate tours.json with all content from 7 raw tour documents, create 10 section components for the detail page, and add a dynamic `[slug].tsx` page using `getStaticPaths`/`getStaticProps`. Single enriched JSON file, monolithic data approach.

**Tech Stack:** Next.js 16 (Pages Router), TypeScript, Tailwind CSS v4, Framer Motion, next-intl, React 19.

**Note on Vietnamese translations:** The raw tour documents are in English. Long-form content (descriptions, itinerary narratives) is populated with English in both `en` and `vi` fields initially. Short strings (highlights, included/excluded, notes, pricing labels, payment terms) have Vietnamese translations provided. A translation pass for long-form `vi` content should follow implementation.

**Spec:** `docs/superpowers/specs/2026-04-28-tour-detail-pages-design.md`

---

### Task 1: Extend Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add new types and extend Tour interface**

Add the following types BEFORE the existing `Tour` interface, and extend `Tour` with new fields. All existing fields and interfaces remain unchanged.

```typescript
// Add these new types before the Tour interface:

export type LocalizedText = {
  en: string;
  vi: string;
};

export interface ItineraryItem {
  time: string;
  description: LocalizedText;
}

export interface ItineraryDay {
  dayLabel: LocalizedText;
  items: ItineraryItem[];
}

export interface PricingTier {
  label: LocalizedText;
  price: number;
}
```

Then extend the `Tour` interface — keep all 8 existing fields, add these after `location`:

```typescript
  slug: string;
  description: LocalizedText;
  transportation: string;
  groupSize: string;
  hotel: string;
  guided: string;
  heroImage: string;
  images: string[];
  highlights: LocalizedText[];
  itinerary: ItineraryDay[];
  pricing: PricingTier[];
  included: LocalizedText[];
  excluded: LocalizedText[];
  paymentDetails: LocalizedText;
  notes: LocalizedText[];
  mealsInfo: LocalizedText;
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: Type errors in `src/data/index.ts` because tours.json doesn't match the new Tour type yet. That's expected — we'll fix it in Task 3.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: extend Tour type with detail page fields (LocalizedText, ItineraryDay, PricingTier)"
```

---

### Task 2: Add i18n Keys

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/vi.json`

- [ ] **Step 1: Add tourDetail namespace to en.json**

Add this new `tourDetail` key at the top level of the JSON (after `tours` or wherever fits alphabetically):

```json
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
  "guided": "Guided",
  "breadcrumbHome": "Home",
  "breadcrumbTours": "Tours",
  "day": "Day"
}
```

Also add to the `meta` section:

```json
"tourDetailTitle": "{tourTitle} — Vietnam Motorcycle Tour",
"tourDetailDescription": "{description}"
```

- [ ] **Step 2: Add tourDetail namespace to vi.json**

Add the same structure with Vietnamese translations:

```json
"tourDetail": {
  "aboutThisTour": "Về Tour Này",
  "highlights": "Điểm Nổi Bật",
  "itinerary": "Lịch Trình",
  "pricing": "Bảng Giá",
  "whatsIncluded": "Bao Gồm",
  "whatsNotIncluded": "Không Bao Gồm",
  "tourDetails": "Chi Tiết Tour",
  "payment": "Thanh Toán",
  "importantNotes": "Lưu Ý Quan Trọng",
  "meals": "Bữa Ăn",
  "whatsappUs": "Nhắn WhatsApp",
  "emailInquiry": "Gửi Email",
  "from": "Từ",
  "perPerson": "/ mỗi người",
  "transportation": "Phương tiện",
  "duration": "Thời gian",
  "distance": "Khoảng cách",
  "group": "Nhóm",
  "hotel": "Khách sạn",
  "guided": "Hướng dẫn",
  "breadcrumbHome": "Trang Chủ",
  "breadcrumbTours": "Tour",
  "day": "Ngày"
}
```

Also add to `meta`:

```json
"tourDetailTitle": "{tourTitle} — Vietnam Motorcycle Tour",
"tourDetailDescription": "{description}"
```

- [ ] **Step 3: Commit**

```bash
git add src/messages/en.json src/messages/vi.json
git commit -m "feat: add tourDetail i18n keys for tour detail page"
```

---

### Task 3: Enrich tours.json

**Files:**
- Modify: `src/data/tours.json`
- Modify: `src/data/index.ts`

**Important:** Extract all content from the raw .docx files in `src/data/tours-program/`. Read each file using `unzip -p "<file>" word/document.xml | sed 's/<[^>]*>//g'` to get the text content. Structure the extracted data according to the Tour type from Task 1.

Vietnamese translations: Short strings (highlights, included, excluded, notes, pricing labels) have Vietnamese provided. Long-form content (description, itinerary descriptions) uses English in the `vi` field — mark with a comment that translation is needed.

- [ ] **Step 1: Replace tours.json with enriched data**

Write the complete enriched `src/data/tours.json` file. The file is an array of 7 Tour objects. Each tour keeps its existing `id`, `title`, `imageUrl`, `rating`, `price`, `duration`, `distance`, and `location` fields, and adds all new fields from the extended Tour type.

Source mapping for each tour:

| id | slug | Source .docx |
|----|------|-------------|
| 1 | `dalat-car-excursion` | Full day car tour dalat excursion.docx |
| 2 | `2d-explore-dalat` | 2D Explore dalat.docx |
| 3 | `ba-ho-waterfall` | Full day ba ho waterfall.docx |
| 4 | `1d-nha-trang-to-dalat` | 1D Nha trang to dalat.docx |
| 5 | `nha-trang-half-day` | Nha trang half day moorbike tour.docx |
| 6 | `hon-ba-waterfall` | Full day hon ba nature waterfall.docx |
| 7 | `mui-ne-car-excursion` | Full day car tour mui ne excursion.docx |

For each tour, extract:
- `description` — the marketing paragraph from the DETAIL section
- `transportation` — from the details block
- `groupSize` — from the details block
- `hotel` — "Pick up & Drop off"
- `guided` — "Fully Guided Tour"
- `heroImage` — same as `imageUrl` initially
- `images` — empty array `[]`
- `highlights` — bullet points from the Highlights section (empty array if none listed)
- `itinerary` — parse the ITINERARY section into `ItineraryDay[]` with `ItineraryItem[]`
- `pricing` — parse the PRICES section into `PricingTier[]`
- `included` — parse the WHATS INCLUDED section
- `excluded` — parse the NOT INCLUDED section
- `paymentDetails` — extract from PAYMENT DETAILS section
- `notes` — extract from NOTE section
- `mealsInfo` — extract from MORE INFO > Meals section

Here is the complete Tour object for **Tour 1 (dalat-car-excursion)** as a reference pattern. Follow this exact structure for all 7 tours:

```json
{
  "id": 1,
  "title": "Da Lat Tour",
  "imageUrl": "https://cdnen.thesaigontimes.vn/wp-content/uploads/2024/07/Mot-thoang-Ho-Ba-Be_Thong-Lam.jpg",
  "rating": "8.1 Superb",
  "price": 60,
  "duration": "1 Day",
  "distance": "186 Miles",
  "location": "Da Lat",
  "slug": "dalat-car-excursion",
  "description": {
    "en": "Da Lat is 150 km from Nha Trang. Known as the \"City of Eternal Spring\" for its distinctive temperate climate, Da Lat was developed as a resort by the French in the early 1900s, and many reminders of its colonial heritage remain. Da Lat holds unique European-influenced architecture and a cooler climate than surrounding areas. Today it is famed as the city of Love and flowers, and has become a popular holiday retreat for young Vietnamese couples.",
    "vi": "Da Lat is 150 km from Nha Trang. Known as the \"City of Eternal Spring\" for its distinctive temperate climate, Da Lat was developed as a resort by the French in the early 1900s, and many reminders of its colonial heritage remain. Da Lat holds unique European-influenced architecture and a cooler climate than surrounding areas. Today it is famed as the city of Love and flowers, and has become a popular holiday retreat for young Vietnamese couples."
  },
  "transportation": "Private Car A/C",
  "groupSize": "Min 2 Person",
  "hotel": "Pick up & Drop off",
  "guided": "Fully Guided Tour",
  "heroImage": "https://cdnen.thesaigontimes.vn/wp-content/uploads/2024/07/Mot-thoang-Ho-Ba-Be_Thong-Lam.jpg",
  "images": [],
  "highlights": [
    { "en": "Stairway to Heaven", "vi": "Cầu thang lên thiên đường" },
    { "en": "Crazy House (Top 10 strangest houses in the world)", "vi": "Ngôi nhà điên (Top 10 ngôi nhà kỳ lạ nhất thế giới)" },
    { "en": "Domain De Marie Church", "vi": "Nhà thờ Domain De Marie" },
    { "en": "Dalat Old Railway Station", "vi": "Ga xe lửa Đà Lạt" }
  ],
  "itinerary": [
    {
      "dayLabel": { "en": "Itinerary", "vi": "Lịch trình" },
      "items": [
        { "time": "7:00 AM", "description": { "en": "Our guide will pick you up and depart from your Hotel to Dalat (3 hours). Enjoy stunning views along the way on the mountain.", "vi": "Our guide will pick you up and depart from your Hotel to Dalat (3 hours). Enjoy stunning views along the way on the mountain." } },
        { "time": "10:15 AM", "description": { "en": "Arriving at the garden for photos.", "vi": "Arriving at the garden for photos." } },
        { "time": "11:30 AM", "description": { "en": "Visit Crazy House — a joyously designed, outrageously artistic private home, recognized as one of the top 10 strangest houses in the world.", "vi": "Visit Crazy House — a joyously designed, outrageously artistic private home, recognized as one of the top 10 strangest houses in the world." } },
        { "time": "12:30 PM", "description": { "en": "Lunch at Ngoc Duy Restaurant.", "vi": "Lunch at Ngoc Duy Restaurant." } },
        { "time": "1:45 PM", "description": { "en": "Visit the old railway station, designed in 1932 by French architects Moncet & Reveron, opened in 1938.", "vi": "Visit the old railway station, designed in 1932 by French architects Moncet & Reveron, opened in 1938." } },
        { "time": "2:30 PM", "description": { "en": "Visit Domain De Marie Church — a Catholic convent built in 1940, combining French and Vietnamese architectural styles.", "vi": "Visit Domain De Marie Church — a Catholic convent built in 1940, combining French and Vietnamese architectural styles." } },
        { "time": "3:00 PM", "description": { "en": "Take photos at Stairway to Heaven and try Vietnamese coffee.", "vi": "Take photos at Stairway to Heaven and try Vietnamese coffee." } },
        { "time": "3:45 PM", "description": { "en": "After sightseeing, our driver will transfer you back to your hotel in Nha Trang (~3 hours).", "vi": "After sightseeing, our driver will transfer you back to your hotel in Nha Trang (~3 hours)." } },
        { "time": "7:00 PM", "description": { "en": "Arriving at restaurant for dinner. End of the trip at your Hotel around 7:30 PM.", "vi": "Arriving at restaurant for dinner. End of the trip at your Hotel around 7:30 PM." } }
      ]
    }
  ],
  "pricing": [
    { "label": { "en": "Per Person (Group of 2)", "vi": "Mỗi người (Nhóm 2)" }, "price": 80 },
    { "label": { "en": "Per Person (Group of 3)", "vi": "Mỗi người (Nhóm 3)" }, "price": 75 },
    { "label": { "en": "Per Person (Group of 4-5)", "vi": "Mỗi người (Nhóm 4-5)" }, "price": 70 },
    { "label": { "en": "Per Person (Group of 6-7)", "vi": "Mỗi người (Nhóm 6-7)" }, "price": 65 },
    { "label": { "en": "Per Person (Group of 8+)", "vi": "Mỗi người (Nhóm 8+)" }, "price": 60 },
    { "label": { "en": "Children (110-140cm)", "vi": "Trẻ em (110-140cm)" }, "price": 20 }
  ],
  "included": [
    { "en": "Hotel Pick up & Drop off", "vi": "Đón và trả khách sạn" },
    { "en": "Vehicle A/C, Petrol & Tolls", "vi": "Xe có điều hòa, xăng & phí cầu đường" },
    { "en": "First Aid Kits", "vi": "Bộ sơ cứu" },
    { "en": "All Entrance Fees", "vi": "Tất cả vé vào cửa" },
    { "en": "Service of local guide", "vi": "Hướng dẫn viên địa phương" },
    { "en": "Full mechanical support", "vi": "Hỗ trợ kỹ thuật" },
    { "en": "Lunch & Dinner", "vi": "Bữa trưa & Bữa tối" }
  ],
  "excluded": [
    { "en": "Flights", "vi": "Vé máy bay" },
    { "en": "Travel insurance", "vi": "Bảo hiểm du lịch" },
    { "en": "Personal Expenses", "vi": "Chi phí cá nhân" },
    { "en": "Play ATV-Quad", "vi": "Chơi ATV-Quad" }
  ],
  "paymentDetails": {
    "en": "Deposit to secure your booking: 20% of the total tour price. Balance due: pay by cash on departure date. Prices include VAT @ 10%. Exchange rate based on 23,000 VND.",
    "vi": "Đặt cọc 20% tổng giá tour để giữ chỗ. Số dư thanh toán bằng tiền mặt vào ngày khởi hành. Giá đã bao gồm VAT 10%. Tỷ giá dựa trên 23.000 VND."
  },
  "notes": [
    { "en": "If you decide to make a reservation 24 hours before travel date, please inquire to check availability first.", "vi": "Nếu đặt trước 24 giờ trước ngày đi, vui lòng kiểm tra chỗ trống." },
    { "en": "The itinerary can be changed due to weather, tide levels and operating conditions.", "vi": "Lịch trình có thể thay đổi do thời tiết và điều kiện hoạt động." },
    { "en": "Special requests (diet or vegetarian) should be sent before your departure date.", "vi": "Yêu cầu đặc biệt (ăn kiêng, chay) nên gửi trước ngày khởi hành." },
    { "en": "Children under 110cm tall free of charge.", "vi": "Trẻ em dưới 110cm miễn phí." }
  ],
  "mealsInfo": {
    "en": "2 meals included (Lunch & Dinner) as well as bottled water and soft drinks each day. Vietnamese cuisine available. Dietary requirements easily catered for.",
    "vi": "2 meals included (Lunch & Dinner) as well as bottled water and soft drinks each day. Vietnamese cuisine available. Dietary requirements easily catered for."
  }
}
```

Follow this exact pattern for the remaining 6 tours. Extract data from each .docx source. Key differences per tour:

**Tour 2 (2d-explore-dalat)** — 2-day tour with 2 `ItineraryDay` entries. Motorbike pricing (Pillion $130, Single Rider $160, Rider+Pillion $360). Duration should be "2 Days". Included: Breakfast, Accommodation, Bike Hire, Fuel, Guide, Support vehicle.

**Tour 3 (ba-ho-waterfall)** — Has 4 highlights. Motorbike/Car pricing (Car $70, Pillion $65, Single $75, Sharing $110). Included: Bike Hire, Fuel, Lunch, Guide, Support vehicle.

**Tour 4 (1d-nha-trang-to-dalat)** — Motorbike pricing (Pillion $70, Single $90, Sharing $120). Included: Bike Hire, Fuel, Breakfast, Guide, Support vehicle.

**Tour 5 (nha-trang-half-day)** — Half day tour. Has 3 highlights. Motorbike/Car pricing (Car $40, Pillion $30, Single $40, Sharing $50). Included: Bike Hire, Fuel, Lunch, Guide.

**Tour 6 (hon-ba-waterfall)** — Has 4 highlights (includes BBQ). Same pricing as Tour 3. Included: Bike Hire, Fuel, Lunch, Guide, Support vehicle.

**Tour 7 (mui-ne-car-excursion)** — Group-based car pricing like Tour 1 ($85/2, $80/3, $75/4, $70/5-6, $65/7, $60/8+, $20 children). Distance is 310 Miles. Has 4 highlights. Included: same vehicle/guide package as Tour 1.

- [ ] **Step 2: Update data/index.ts type assertion**

The current `src/data/index.ts` has `export const toursData: Tour[] = toursJson;`. Since `toursJson` now has the enriched shape, this should continue to work. However, if TypeScript complains about the JSON import matching the extended type, add an assertion:

```typescript
export const toursData: Tour[] = toursJson as Tour[];
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | head -30`

Expected: No errors (or only unrelated errors). The enriched JSON should satisfy the extended Tour type.

- [ ] **Step 4: Commit**

```bash
git add src/data/tours.json src/data/index.ts
git commit -m "feat: enrich tours.json with full content from raw tour documents"
```

---

### Task 4: Update TourCard Link

**Files:**
- Modify: `src/components/tour-card/index.tsx`

- [ ] **Step 1: Update link href**

In `src/components/tour-card/index.tsx`, change the destructuring to include `slug` and update the Link href.

Change:
```typescript
const {title, imageUrl, rating, price, duration, distance, location} = tour;
```
To:
```typescript
const {title, imageUrl, rating, price, duration, distance, location, slug} = tour;
```

Change:
```typescript
<Link href="/tours">{title}</Link>
```
To:
```typescript
<Link href={`/tours/${slug}`}>{title}</Link>
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit 2>&1 | head -10`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/tour-card/index.tsx
git commit -m "feat: link tour cards to individual tour detail pages"
```

---

### Task 5: Create TourHero Component

**Files:**
- Create: `src/components/tour-hero/index.tsx`

- [ ] **Step 1: Create the component**

```typescript
import {useTranslations} from 'next-intl';
import type {Tour} from '@/types';

interface TourHeroProps {
  tour: Tour;
}

export function TourHero({tour}: TourHeroProps) {
  const t = useTranslations('tourDetail');

  return (
    <section className="relative">
      <div className="relative h-72 md:h-96 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{backgroundImage: `url(${tour.heroImage})`}}
        />
        <div className="absolute inset-0 bg-overlay" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col justify-end h-full pb-8">
          <h1 className="type-display-sm md:type-display-lg text-on-surface-inverse mb-3">
            {tour.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-on-surface-inverse/80 type-body-sm">
            <span className="flex items-center gap-1.5">
              <i className="fa fa-map-marker-alt" /> {tour.location}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa fa-clock" /> {tour.duration}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa fa-road" /> {tour.distance}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa fa-motorcycle" /> {tour.transportation}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa fa-star" /> {tour.rating}
            </span>
          </div>
          <div className="mt-4 text-on-surface-inverse">
            <span className="type-headline-lg">{t('from')} ${tour.price}</span>
            <span className="type-body-sm ml-1 opacity-80">{t('perPerson')}</span>
          </div>
        </div>
      </div>
      <div className="bg-surface-alt py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 type-body-sm text-on-surface-secondary">
            <a href="/" className="hover:text-primary transition-colors">{t('breadcrumbHome')}</a>
            <span>/</span>
            <a href="/tours" className="hover:text-primary transition-colors">{t('breadcrumbTours')}</a>
            <span>/</span>
            <span className="text-on-surface type-label-lg">{tour.title}</span>
          </nav>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tour-hero/index.tsx
git commit -m "feat: create TourHero component with hero banner and breadcrumb"
```

---

### Task 6: Create TourDescription + TourHighlights Components

**Files:**
- Create: `src/components/tour-description/index.tsx`
- Create: `src/components/tour-highlights/index.tsx`

- [ ] **Step 1: Create TourDescription**

```typescript
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {LocalizedText} from '@/types';

interface TourDescriptionProps {
  description: LocalizedText;
  locale: string;
}

export function TourDescription({description, locale}: TourDescriptionProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
    >
      <h2 className="type-headline-sm text-on-surface mb-4">{t('aboutThisTour')}</h2>
      <p className="type-body-sm text-on-surface-secondary leading-relaxed">
        {description[localeKey]}
      </p>
    </motion.section>
  );
}
```

- [ ] **Step 2: Create TourHighlights**

```typescript
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {LocalizedText} from '@/types';

interface TourHighlightsProps {
  highlights: LocalizedText[];
  locale: string;
}

export function TourHighlights({highlights, locale}: TourHighlightsProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  if (highlights.length === 0) return null;

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
    >
      <h2 className="type-headline-sm text-on-surface mb-4">{t('highlights')}</h2>
      <div className="flex flex-wrap gap-2">
        {highlights.map((highlight, i) => (
          <motion.span
            key={i}
            initial={{opacity: 0, scale: 0.9}}
            whileInView={{opacity: 1, scale: 1}}
            viewport={{once: true}}
            transition={{duration: 0.3, delay: i * 0.08}}
            className="bg-primary/10 text-primary px-4 py-1.5 rounded-full type-label-sm"
          >
            {highlight[localeKey]}
          </motion.span>
        ))}
      </div>
    </motion.section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/tour-description/index.tsx src/components/tour-highlights/index.tsx
git commit -m "feat: create TourDescription and TourHighlights components"
```

---

### Task 7: Create TourItinerary Component

**Files:**
- Create: `src/components/tour-itinerary/index.tsx`

- [ ] **Step 1: Create the component**

```typescript
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {ItineraryDay} from '@/types';

interface TourItineraryProps {
  itinerary: ItineraryDay[];
  locale: string;
}

export function TourItinerary({itinerary, locale}: TourItineraryProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
    >
      <h2 className="type-headline-sm text-on-surface mb-6">{t('itinerary')}</h2>
      {itinerary.map((day, dayIndex) => (
        <div key={dayIndex} className="mb-8 last:mb-0">
          {itinerary.length > 1 && (
            <h3 className="type-title-lg text-on-surface mb-4">{day.dayLabel[localeKey]}</h3>
          )}
          <div className="relative border-l-2 border-primary/30 ml-3 pl-6">
            {day.items.map((item, itemIndex) => (
              <motion.div
                key={itemIndex}
                initial={{opacity: 0, x: -10}}
                whileInView={{opacity: 1, x: 0}}
                viewport={{once: true}}
                transition={{duration: 0.4, delay: itemIndex * 0.1}}
                className="relative mb-6 last:mb-0"
              >
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-surface" />
                <div className="type-label-lg text-primary font-semibold mb-1">
                  {item.time}
                </div>
                <p className="type-body-sm text-on-surface-secondary leading-relaxed">
                  {item.description[localeKey]}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </motion.section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tour-itinerary/index.tsx
git commit -m "feat: create TourItinerary timeline component"
```

---

### Task 8: Create TourPricing + TourCTA Components

**Files:**
- Create: `src/components/tour-pricing/index.tsx`
- Create: `src/components/tour-cta/index.tsx`

- [ ] **Step 1: Create TourPricing**

```typescript
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
            <span className="type-body-sm text-on-surface-secondary">{tier.label[localeKey]}</span>
            <span className="type-title-sm text-on-surface font-semibold">${tier.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create TourCTA**

```typescript
import {useTranslations} from 'next-intl';
import {contactInfo} from '@/utils';

interface TourCTAProps {
  tourTitle: string;
}

export function TourCTA({tourTitle}: TourCTAProps) {
  const t = useTranslations('tourDetail');

  const whatsappMessage = encodeURIComponent(`Hi! I'm interested in the "${tourTitle}" tour.`);
  const whatsappUrl = `https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  const emailSubject = encodeURIComponent(`Inquiry: ${tourTitle}`);
  const emailUrl = `mailto:${contactInfo.email}?subject=${emailSubject}`;

  return (
    <div className="flex flex-col gap-3 mb-5">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 px-4 rounded-lg type-title-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <i className="fab fa-whatsapp text-lg" />
        {t('whatsappUs')}
      </a>
      <a
        href={emailUrl}
        className="flex items-center justify-center gap-2 bg-primary text-on-primary py-3 px-4 rounded-lg type-title-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <i className="fa fa-envelope" />
        {t('emailInquiry')}
      </a>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/tour-pricing/index.tsx src/components/tour-cta/index.tsx
git commit -m "feat: create TourPricing and TourCTA components"
```

---

### Task 9: Create TourIncluded Component

**Files:**
- Create: `src/components/tour-included/index.tsx`

- [ ] **Step 1: Create the component**

```typescript
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {LocalizedText} from '@/types';

interface TourIncludedProps {
  included: LocalizedText[];
  excluded: LocalizedText[];
  locale: string;
}

export function TourIncluded({included, excluded, locale}: TourIncludedProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="type-headline-sm text-on-surface mb-4">{t('whatsIncluded')}</h2>
          <ul className="space-y-2.5">
            {included.map((item, i) => (
              <li key={i} className="flex items-start gap-2 type-body-sm text-on-surface-secondary">
                <i className="fa fa-check text-secondary mt-1 shrink-0" />
                {item[localeKey]}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="type-headline-sm text-on-surface mb-4">{t('whatsNotIncluded')}</h2>
          <ul className="space-y-2.5">
            {excluded.map((item, i) => (
              <li key={i} className="flex items-start gap-2 type-body-sm text-on-surface-secondary">
                <i className="fa fa-times text-red-500 mt-1 shrink-0" />
                {item[localeKey]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tour-included/index.tsx
git commit -m "feat: create TourIncluded component with included/excluded lists"
```

---

### Task 10: Create TourDetails + TourPayment + TourNotes Components

**Files:**
- Create: `src/components/tour-details/index.tsx`
- Create: `src/components/tour-payment/index.tsx`
- Create: `src/components/tour-notes/index.tsx`

- [ ] **Step 1: Create TourDetails**

```typescript
import {useTranslations} from 'next-intl';
import type {Tour} from '@/types';

interface TourDetailsProps {
  tour: Tour;
}

export function TourDetails({tour}: TourDetailsProps) {
  const t = useTranslations('tourDetail');

  const details = [
    {label: t('transportation'), value: tour.transportation},
    {label: t('duration'), value: tour.duration},
    {label: t('distance'), value: tour.distance},
    {label: t('group'), value: tour.groupSize},
    {label: t('hotel'), value: tour.hotel},
    {label: t('guided'), value: tour.guided},
  ];

  return (
    <div className="border border-border-subtle rounded-xl p-5 mb-5">
      <h3 className="type-title-lg text-on-surface mb-4">{t('tourDetails')}</h3>
      <div className="flex flex-col gap-1">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="flex justify-between items-center py-2 border-b border-border-subtle last:border-b-0"
          >
            <span className="type-body-sm text-on-surface-secondary">{detail.label}</span>
            <span className="type-label-lg text-on-surface font-semibold">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create TourPayment**

```typescript
import {useTranslations} from 'next-intl';
import type {LocalizedText} from '@/types';

interface TourPaymentProps {
  paymentDetails: LocalizedText;
  locale: string;
}

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
```

- [ ] **Step 3: Create TourNotes**

```typescript
import {useTranslations} from 'next-intl';
import type {LocalizedText} from '@/types';

interface TourNotesProps {
  notes: LocalizedText[];
  mealsInfo: LocalizedText;
  locale: string;
}

export function TourNotes({notes, mealsInfo, locale}: TourNotesProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  return (
    <>
      <div className="border border-border-subtle rounded-xl p-5 mb-5">
        <h3 className="type-title-lg text-on-surface mb-3">{t('importantNotes')}</h3>
        <ul className="space-y-2">
          {notes.map((note, i) => (
            <li key={i} className="type-label-sm text-on-surface-secondary leading-relaxed flex items-start gap-2">
              <span className="text-primary mt-0.5 shrink-0">•</span>
              {note[localeKey]}
            </li>
          ))}
        </ul>
      </div>
      <div className="border border-border-subtle rounded-xl p-5">
        <h3 className="type-title-lg text-on-surface mb-3">{t('meals')}</h3>
        <p className="type-label-sm text-on-surface-secondary leading-relaxed">
          {mealsInfo[localeKey]}
        </p>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/tour-details/index.tsx src/components/tour-payment/index.tsx src/components/tour-notes/index.tsx
git commit -m "feat: create TourDetails, TourPayment, and TourNotes sidebar components"
```

---

### Task 11: Create Tour Detail Page

**Files:**
- Create: `src/pages/tours/[slug].tsx`

- [ ] **Step 1: Create the page**

```typescript
import {motion} from 'framer-motion';
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

  const whatsappMessage = encodeURIComponent(`Hi! I'm interested in the "${tour.title}" tour.`);
  const whatsappUrl = `https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

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
                <TourPricing pricing={tour.pricing} locale={locale} />
                <TourDetails tour={tour} />
              </div>

              <TourItinerary itinerary={tour.itinerary} locale={locale} />
              <TourIncluded included={tour.included} excluded={tour.excluded} locale={locale} />

              {/* On mobile: payment + notes after included */}
              <div className="lg:hidden">
                <TourPayment paymentDetails={tour.paymentDetails} locale={locale} />
                <TourNotes notes={tour.notes} mealsInfo={tour.mealsInfo} locale={locale} />
              </div>
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden lg:block lg:w-1/3">
              <div className="sticky top-24">
                <TourPricing pricing={tour.pricing} locale={locale} />
                <TourCTA tourTitle={tour.title} />
                <TourDetails tour={tour} />
                <TourPayment paymentDetails={tour.paymentDetails} locale={locale} />
                <TourNotes notes={tour.notes} mealsInfo={tour.mealsInfo} locale={locale} />
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* Mobile sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface-elevated border-t border-border shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <span className="type-title-sm text-on-surface">{t('from')} ${tour.price}</span>
            <span className="type-label-sm text-on-surface-secondary ml-1">{t('perPerson')}</span>
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
    }))
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

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/tours/[slug].tsx
git commit -m "feat: create tour detail page with [slug] dynamic routing"
```

---

### Task 12: Build Verification

- [ ] **Step 1: Run full build**

Run: `pnpm build 2>&1 | tail -40`

Expected: Build succeeds. All 7 tour detail pages are statically generated. Output should show `/tours/dalat-car-excursion`, `/tours/ba-ho-waterfall`, etc. in the generated pages list.

- [ ] **Step 2: Start dev server and spot-check**

Run: `pnpm dev` and verify in browser:
- `/tours` page loads, cards link to `/tours/[slug]`
- `/tours/ba-ho-waterfall` loads with all sections
- `/tours/2d-explore-dalat` loads with 2-day itinerary
- `/tours/dalat-car-excursion` loads with group pricing
- Mobile responsive: sidebar content moves inline at mobile breakpoint
- Sticky bottom CTA visible on mobile
- Both `/en/tours/ba-ho-waterfall` and `/tours/ba-ho-waterfall` (Vietnamese) work

- [ ] **Step 3: Fix any build or rendering issues found**

If build fails or pages don't render correctly, debug and fix. Common issues:
- JSON import type mismatch: ensure `tours.json` matches Tour interface exactly
- Missing translations: check both en.json and vi.json have all `tourDetail.*` keys
- Broken images: verify `heroImage` URLs are accessible

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete tour detail pages implementation"
```
