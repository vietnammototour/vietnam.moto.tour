# Localization (i18n) Design Spec

## Overview

Add English/Vietnamese localization to the Vietnam Moto Tour site using `next-intl`. All user-visible static text is extracted into per-locale JSON files. A language switcher in the header allows users to toggle between languages, with preference persisted via cookie.

## Scope

- **In scope:** All user-visible static text in components and pages (~80-90 keys), SEO meta tags, language switcher UI, locale persistence
- **Out of scope:** Tour/destination JSON data translation (handled later), aria-labels/accessibility text, dynamic content from future APIs

## Locales

- `vi` (Vietnamese) — default locale, served without URL prefix (`/tours`, `/contact`)
- `en` (English/USA) — served with `/en` prefix (`/en/tours`, `/en/contact`)

## Library

**`next-intl`** — handles routing, translation loading, and provides `useTranslations()` hook. Works with Next.js Pages Router.

## Routing & Locale Configuration

### next.config

Add `i18n` block to `next.config.ts`:

```ts
i18n: {
  locales: ['vi', 'en'],
  defaultLocale: 'vi',
}
```

Next.js automatically:

- Routes `/en/*` requests with `locale: 'en'`
- Routes unprefixed requests with `locale: 'vi'`
- Sets `<html lang="...">` accordingly

### \_app.tsx

Wrap with `NextIntlClientProvider`, receiving messages from page-level `getStaticProps`:

```tsx
import {NextIntlClientProvider} from 'next-intl';

function App({Component, pageProps}) {
  return (
    <NextIntlClientProvider
      locale={pageProps.locale}
      messages={pageProps.messages}
    >
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </NextIntlClientProvider>
  );
}
```

### Locale Persistence

On language switch, set a `NEXT_LOCALE` cookie. Next.js reads this cookie on subsequent visits and redirects to the user's preferred locale when they visit a non-prefixed URL.

## Translation File Structure

```
src/
  messages/
    vi.json
    en.json
```

Single flat file per locale. Keys grouped by namespace:

```json
{
  "header": {
    "home": "Trang chu",
    "tours": "Tour",
    "rental": "Cho thue",
    "aboutUs": "Ve chung toi",
    "contact": "Lien he",
    "motorbike": "Xe may",
    "car": "O to"
  },
  "footer": {
    "company": "Cong ty",
    "explore": "Kham pha",
    "newsletter": "Ban tin",
    "aboutUs": "Ve chung toi",
    "contactUs": "Lien he",
    "rental": "Cho thue",
    "tours": "Tour",
    "legal": "Phap ly",
    "privacyPolicy": "Chinh sach bao mat",
    "emailPlaceholder": "Dia chi email",
    "subscribe": "Dang ky",
    "agreeTerms": "Toi dong y voi tat ca dieu khoan va chinh sach",
    "copyright": "Tat ca ban quyen {year}",
    "aboutText": "..."
  },
  "home": {
    "heroTitle": "...",
    "heroSubtitle": "...",
    "destinationLists": "...",
    "goExoticPlaces": "...",
    "getToKnowUs": "...",
    "planYourTrip": "...",
    "bookTourNow": "...",
    "featuredTours": "...",
    "mostPopularTours": "...",
    "readyToTravel": "...",
    "wildlifeTours": "...",
    "bikeTours": "...",
    "adventureTours": "...",
    "fullDayTours": "..."
  },
  "tours": {
    "title": "...",
    "breadcrumbHome": "...",
    "breadcrumbTours": "..."
  },
  "contact": {
    "title": "...",
    "talkWithTeam": "...",
    "anyQuestion": "...",
    "namePlaceholder": "...",
    "emailPlaceholder": "...",
    "messagePlaceholder": "...",
    "sendMessage": "..."
  },
  "about": {
    "title": "...",
    "learnAboutUs": "...",
    "dareToExplore": "...",
    "perfectPlace": "...",
    "bestServices": "...",
    "tourAgents": "...",
    "readyForTour": "...",
    "bookTourNow": "...",
    "platformDescription": "...",
    "totalTours": "{count}+ Total Tours",
    "happyRiders": "{count}+ Happy Riders",
    "happyPeople": "{count}+ Happy People",
    "yearsExperience": "{count}+ Years Experience"
  },
  "rental": {
    "title": "...",
    "breadcrumbHome": "...",
    "breadcrumbRental": "..."
  },
  "common": {
    "bookNow": "...",
    "perPerson": "/ Per Person",
    "tours": "tours"
  },
  "meta": {
    "homeTitle": "...",
    "homeDescription": "...",
    "toursTitle": "...",
    "toursDescription": "...",
    "contactTitle": "...",
    "contactDescription": "...",
    "aboutTitle": "...",
    "aboutDescription": "...",
    "rentalTitle": "...",
    "rentalDescription": "..."
  }
}
```

## Component Integration Pattern

### Hook usage

Each component/page calls `useTranslations()` with its namespace:

```tsx
const t = useTranslations('header');
return <a>{t('home')}</a>;
```

### Page-level data loading

Every page exports `getStaticProps` to load messages:

```tsx
export async function getStaticProps({locale}: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
}
```

### Interpolation

For dynamic values (stats, counts):

```json
{"totalTours": "{count}+ Total Tours"}
```

```tsx
t('totalTours', {count: 870});
```

### Components affected

All components that contain user-visible text will be modified to use `useTranslations()`:

- Header — `header` namespace
- Footer — `footer` namespace
- TourCard — `common` namespace
- DestinationCard — `common` namespace
- All 5 page files (index, tours, contact, about-us, rental) — their respective namespaces
- \_document.tsx — no change needed (Next.js handles `<html lang>`)

## Language Switcher

### Component

New file: `src/components/language-switcher/index.tsx`

Minimal functional switcher — two clickable text links (`VI | EN`), placed in the Header nav bar. Active locale is visually distinguished (e.g., bold or different color).

### Behavior

1. On click/change, call `router.push(router.asPath, router.asPath, { locale: newLocale })`
2. Set `NEXT_LOCALE` cookie with the selected locale
3. Page re-renders with new translations

### Placement

Rendered inside the Header component, visible on both desktop and mobile views.

## SEO

### Per-page meta tags

Each page renders translated `<title>` and `<meta name="description">` via the `meta` namespace:

```tsx
const t = useTranslations('meta');
<Head>
  <title>{t('toursTitle')}</title>
  <meta name="description" content={t('toursDescription')} />
</Head>;
```

### hreflang alternate links

Each page includes alternate links for both locales:

```html
<link rel="alternate" hreflang="vi" href="https://domain.com/tours" />
<link rel="alternate" hreflang="en" href="https://domain.com/en/tours" />
<link rel="alternate" hreflang="x-default" href="https://domain.com/tours" />
```

`x-default` points to the Vietnamese (default locale) URL.

### html lang attribute

Handled automatically by Next.js `i18n` config — sets `<html lang="vi">` or `<html lang="en">`.

## Files to Create

| File                                         | Purpose                        |
| -------------------------------------------- | ------------------------------ |
| `src/messages/vi.json`                       | Vietnamese translation strings |
| `src/messages/en.json`                       | English translation strings    |
| `src/components/language-switcher/index.tsx` | Language toggle component      |

## Files to Modify

| File                                        | Change                                                        |
| ------------------------------------------- | ------------------------------------------------------------- |
| `next.config.ts`                            | Add `i18n` block                                              |
| `src/pages/_app.tsx`                        | Wrap with `NextIntlClientProvider`                            |
| `src/pages/index.tsx`                       | Add `getStaticProps`, replace hardcoded text with `t()` calls |
| `src/pages/tours.tsx`                       | Same                                                          |
| `src/pages/contact.tsx`                     | Same                                                          |
| `src/pages/about-us.tsx`                    | Same                                                          |
| `src/pages/rental.tsx`                      | Same                                                          |
| `src/components/header/index.tsx`           | Use `t()` for nav labels, render `LanguageSwitcher`           |
| `src/components/footer/index.tsx`           | Use `t()` for all visible text                                |
| `src/components/tour-card/index.tsx`        | Use `t()` for "/ Per Person"                                  |
| `src/components/destination-card/index.tsx` | Use `t()` for "tours"                                         |

## Dependencies

- `next-intl` — the only new dependency required (requires user approval to install)
