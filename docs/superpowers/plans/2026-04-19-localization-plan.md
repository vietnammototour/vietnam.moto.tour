# Localization (i18n) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add English/Vietnamese localization to the site using `next-intl`, extracting all user-visible static text into per-locale JSON files, with a language switcher in the header.

**Architecture:** `next-intl` provides the translation infrastructure. Next.js built-in `i18n` routing handles path prefixes (`/en/*` for English, unprefixed for Vietnamese default). Each page loads messages via `getStaticProps`. A `LanguageSwitcher` component in the Header toggles locale and persists choice via `NEXT_LOCALE` cookie.

**Tech Stack:** Next.js 16 (Pages Router), next-intl, TypeScript, React 19

---

### Task 1: Install `next-intl` and configure Next.js i18n routing

**Files:**

- Modify: `package.json`
- Modify: `next.config.mjs`

- [ ] **Step 1: Install next-intl**

```bash
pnpm add next-intl
```

- [ ] **Step 2: Add i18n config to next.config.mjs**

Replace the contents of `next.config.mjs` with:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ["vi", "en"],
    defaultLocale: "vi",
  },
};

export default nextConfig;
```

- [ ] **Step 3: Verify dev server starts**

```bash
pnpm dev
```

Expected: Server starts without errors. Visiting `http://localhost:3000` serves the site with `locale: 'vi'`.

- [ ] **Step 4: Commit**

```bash
git add next.config.mjs package.json pnpm-lock.yaml
git commit -m "feat(i18n): install next-intl and configure i18n routing"
```

---

### Task 2: Create translation JSON files

**Files:**

- Create: `src/messages/en.json`
- Create: `src/messages/vi.json`

- [ ] **Step 1: Create `src/messages/en.json`**

```json
{
  "header": {
    "home": "Home",
    "tours": "Tours",
    "rental": "Rental",
    "aboutUs": "About Us",
    "contact": "Contact",
    "motorbike": "Motorbike",
    "car": "Car"
  },
  "footer": {
    "aboutText": "Our Guides have many years of experience motorcycling and was established in 2008",
    "company": "Company",
    "explore": "Explore",
    "newsletter": "Newsletter",
    "aboutUs": "About Us",
    "contactUs": "Contact Us",
    "rental": "Rental",
    "tours": "Tours",
    "legal": "Legal",
    "privacyPolicy": "Privacy Policy",
    "emailPlaceholder": "Email address",
    "subscribe": "Subscribe",
    "agreeTerms": "I agree to all terms and policies",
    "copyright": "\u00a9 All Copyright {year}",
    "contact": "Contact"
  },
  "home": {
    "heroTitle": "Travel & Adventures",
    "heroSubtitle": "Your Next Adventure Starts Here",
    "destinationLists": "Destination lists",
    "goExoticPlaces": "Go Exotic Places",
    "getToKnowUs": "Get to know us",
    "planYourTrip": "Plan Your Trip with Us",
    "aboutDescription": "We are leading day tour and multi-day tour on organizer in Nha Trang, Vietnam",
    "bulletMotorbike": "Motorbike and car tour",
    "bulletFriendly": "Friendly team and expert local guide",
    "bulletExperience": "Experience in truly remarkable land",
    "bookWithUsNow": "Book with us now",
    "bookTourNow": "Book Tour Now",
    "featuredTours": "Featured tours",
    "mostPopularTours": "Most Popular Tours",
    "readyToTravel": "Are you ready to travel?",
    "videoSectionHeading": "We are leading day tour and multi-day tour on organizer in Nha Trang",
    "wildlifeTours": "Wildlife\nTours",
    "bikeTours": "Bike\nTours",
    "adventureTours": "Adventure\nTours",
    "fullDayTours": "Full day\nTours"
  },
  "tours": {
    "title": "Popular Tours",
    "breadcrumbHome": "Home",
    "breadcrumbTours": "Tours"
  },
  "contact": {
    "title": "Contact",
    "breadcrumbHome": "Home",
    "breadcrumbContact": "Contact",
    "talkWithTeam": "Talk with our team",
    "anyQuestion": "Any Question? Feel Free to Contact",
    "namePlaceholder": "Your name",
    "emailPlaceholder": "Email address",
    "messagePlaceholder": "Write your message",
    "sendMessage": "Send a message"
  },
  "about": {
    "title": "About",
    "breadcrumbHome": "Home",
    "breadcrumbPages": "Pages",
    "breadcrumbAbout": "About",
    "learnAboutUs": "Learn about us",
    "dareToExplore": "Dare to Explore with Us",
    "perfectPlace": "A Simply Perfect Place to Get Lost",
    "aboutDescription": "We are trusted by our clients and have a reputation for the best services in the field. Our team is highly skilled in crafting and leading motorcycle tours. With over 10 years of varied riding experience, we know these roads inside and out.",
    "bestServices": "Best Services",
    "tourAgents": "Tour Agents",
    "planYourTrip": "Plan your trip with us",
    "readyForTour": "Ready for an unforgettable tour?",
    "bookTourNow": "Book tour now",
    "readyToTravel": "Are you ready to travel?",
    "platformDescription": "Vietnam Motorcycle Tour \u2014 A World Leading Adventure Platform",
    "totalTours": "Total Tours",
    "happyRiders": "Happy Riders",
    "happyPeople": "Happy People",
    "yearsExperience": "Years Experience"
  },
  "rental": {
    "title": "Rental",
    "breadcrumbHome": "Home",
    "breadcrumbRental": "Rental",
    "perDay": "/ Per Day"
  },
  "common": {
    "perPerson": "/ Per Person",
    "tours": "tours"
  },
  "meta": {
    "homeTitle": "Vietnam Motorcycle Tour \u2014 Adventure Tours in Nha Trang",
    "homeDescription": "Vietnam Motorcycle Tour \u2014 Adventure tours in Nha Trang and beyond. Day tours, multi-day tours, motorbike and car rental.",
    "toursTitle": "Popular Tours \u2014 Vietnam Motorcycle Tour",
    "toursDescription": "Explore our popular motorcycle and adventure tours in Vietnam. Day trips and multi-day tours from Nha Trang.",
    "contactTitle": "Contact Us \u2014 Vietnam Motorcycle Tour",
    "contactDescription": "Get in touch with Vietnam Motorcycle Tour. Book your adventure tour in Nha Trang and beyond.",
    "aboutTitle": "About Us \u2014 Vietnam Motorcycle Tour",
    "aboutDescription": "Learn about Vietnam Motorcycle Tour \u2014 experienced guides, over 10 years of motorcycle touring in Vietnam.",
    "rentalTitle": "Motorbike & Car Rental \u2014 Vietnam Motorcycle Tour",
    "rentalDescription": "Rent motorbikes and cars in Nha Trang, Vietnam. Honda, Yamaha, Toyota and more."
  }
}
```

- [ ] **Step 2: Create `src/messages/vi.json`**

```json
{
  "header": {
    "home": "Trang Ch\u1ee7",
    "tours": "Tour",
    "rental": "Cho Thu\u00ea",
    "aboutUs": "V\u1ec1 Ch\u00fang T\u00f4i",
    "contact": "Li\u00ean H\u1ec7",
    "motorbike": "Xe M\u00e1y",
    "car": "\u00d4 T\u00f4"
  },
  "footer": {
    "aboutText": "H\u01b0\u1edbng d\u1eabn vi\u00ean c\u1ee7a ch\u00fang t\u00f4i c\u00f3 nhi\u1ec1u n\u0103m kinh nghi\u1ec7m \u0111i xe m\u00e1y v\u00e0 \u0111\u01b0\u1ee3c th\u00e0nh l\u1eadp t\u1eeb n\u0103m 2008",
    "company": "C\u00f4ng Ty",
    "explore": "Kh\u00e1m Ph\u00e1",
    "newsletter": "B\u1ea3n Tin",
    "aboutUs": "V\u1ec1 Ch\u00fang T\u00f4i",
    "contactUs": "Li\u00ean H\u1ec7",
    "rental": "Cho Thu\u00ea",
    "tours": "Tour",
    "legal": "Ph\u00e1p L\u00fd",
    "privacyPolicy": "Ch\u00ednh S\u00e1ch B\u1ea3o M\u1eadt",
    "emailPlaceholder": "\u0110\u1ecba ch\u1ec9 email",
    "subscribe": "\u0110\u0103ng K\u00fd",
    "agreeTerms": "T\u00f4i \u0111\u1ed3ng \u00fd v\u1edbi t\u1ea5t c\u1ea3 \u0111i\u1ec1u kho\u1ea3n v\u00e0 ch\u00ednh s\u00e1ch",
    "copyright": "\u00a9 B\u1ea3n quy\u1ec1n {year}",
    "contact": "Li\u00ean H\u1ec7"
  },
  "home": {
    "heroTitle": "Du L\u1ecbch & Phi\u00eau L\u01b0u",
    "heroSubtitle": "Cu\u1ed9c Phi\u00eau L\u01b0u Ti\u1ebfp Theo C\u1ee7a B\u1ea1n B\u1eaft \u0110\u1ea7u T\u1eeb \u0110\u00e2y",
    "destinationLists": "Danh s\u00e1ch \u0111i\u1ec3m \u0111\u1ebfn",
    "goExoticPlaces": "Kh\u00e1m Ph\u00e1 Nh\u1eefng \u0110i\u1ec3m \u0110\u1ebfn K\u1ef3 Th\u00fa",
    "getToKnowUs": "T\u00ecm hi\u1ec3u v\u1ec1 ch\u00fang t\u00f4i",
    "planYourTrip": "L\u00ean K\u1ebf Ho\u1ea1ch Chuy\u1ebfn \u0110i C\u00f9ng Ch\u00fang T\u00f4i",
    "aboutDescription": "Ch\u00fang t\u00f4i l\u00e0 \u0111\u01a1n v\u1ecb t\u1ed5 ch\u1ee9c tour trong ng\u00e0y v\u00e0 nhi\u1ec1u ng\u00e0y h\u00e0ng \u0111\u1ea7u t\u1ea1i Nha Trang, Vi\u1ec7t Nam",
    "bulletMotorbike": "Tour xe m\u00e1y v\u00e0 \u00f4 t\u00f4",
    "bulletFriendly": "\u0110\u1ed9i ng\u0169 th\u00e2n thi\u1ec7n v\u00e0 h\u01b0\u1edbng d\u1eabn vi\u00ean \u0111\u1ecba ph\u01b0\u01a1ng gi\u1ecfi",
    "bulletExperience": "Tr\u1ea3i nghi\u1ec7m tr\u00ean v\u00f9ng \u0111\u1ea5t tuy\u1ec7t v\u1eddi",
    "bookWithUsNow": "\u0110\u1eb7t tour ngay",
    "bookTourNow": "\u0110\u1eb7t Tour Ngay",
    "featuredTours": "Tour n\u1ed5i b\u1eadt",
    "mostPopularTours": "Tour Ph\u1ed5 Bi\u1ebfn Nh\u1ea5t",
    "readyToTravel": "B\u1ea1n \u0111\u00e3 s\u1eb5n s\u00e0ng du l\u1ecbch?",
    "videoSectionHeading": "Ch\u00fang t\u00f4i l\u00e0 \u0111\u01a1n v\u1ecb t\u1ed5 ch\u1ee9c tour trong ng\u00e0y v\u00e0 nhi\u1ec1u ng\u00e0y h\u00e0ng \u0111\u1ea7u t\u1ea1i Nha Trang",
    "wildlifeTours": "Tour\nThi\u00ean Nhi\u00ean",
    "bikeTours": "Tour\nXe M\u00e1y",
    "adventureTours": "Tour\nPhi\u00eau L\u01b0u",
    "fullDayTours": "Tour\nC\u1ea3 Ng\u00e0y"
  },
  "tours": {
    "title": "Tour Ph\u1ed5 Bi\u1ebfn",
    "breadcrumbHome": "Trang Ch\u1ee7",
    "breadcrumbTours": "Tour"
  },
  "contact": {
    "title": "Li\u00ean H\u1ec7",
    "breadcrumbHome": "Trang Ch\u1ee7",
    "breadcrumbContact": "Li\u00ean H\u1ec7",
    "talkWithTeam": "Tr\u00f2 chuy\u1ec7n v\u1edbi \u0111\u1ed9i ng\u0169 c\u1ee7a ch\u00fang t\u00f4i",
    "anyQuestion": "C\u00f3 C\u00e2u H\u1ecfi? H\u00e3y Li\u00ean H\u1ec7 V\u1edbi Ch\u00fang T\u00f4i",
    "namePlaceholder": "T\u00ean c\u1ee7a b\u1ea1n",
    "emailPlaceholder": "\u0110\u1ecba ch\u1ec9 email",
    "messagePlaceholder": "Vi\u1ebft tin nh\u1eafn c\u1ee7a b\u1ea1n",
    "sendMessage": "G\u1eedi tin nh\u1eafn"
  },
  "about": {
    "title": "Gi\u1edbi Thi\u1ec7u",
    "breadcrumbHome": "Trang Ch\u1ee7",
    "breadcrumbPages": "Trang",
    "breadcrumbAbout": "Gi\u1edbi Thi\u1ec7u",
    "learnAboutUs": "T\u00ecm hi\u1ec3u v\u1ec1 ch\u00fang t\u00f4i",
    "dareToExplore": "D\u00e1m Kh\u00e1m Ph\u00e1 C\u00f9ng Ch\u00fang T\u00f4i",
    "perfectPlace": "M\u1ed9t N\u01a1i Ho\u00e0n H\u1ea3o \u0110\u1ec3 L\u1ea1c L\u1ed1i",
    "aboutDescription": "Ch\u00fang t\u00f4i \u0111\u01b0\u1ee3c kh\u00e1ch h\u00e0ng tin t\u01b0\u1edfng v\u00e0 c\u00f3 danh ti\u1ebfng v\u1ec1 d\u1ecbch v\u1ee5 t\u1ed1t nh\u1ea5t trong l\u0129nh v\u1ef1c. \u0110\u1ed9i ng\u0169 c\u1ee7a ch\u00fang t\u00f4i c\u00f3 tay ngh\u1ec1 cao trong vi\u1ec7c t\u1ed5 ch\u1ee9c v\u00e0 d\u1eabn \u0111o\u00e0n tour xe m\u00e1y. V\u1edbi h\u01a1n 10 n\u0103m kinh nghi\u1ec7m l\u00e1i xe \u0111a d\u1ea1ng, ch\u00fang t\u00f4i thu\u1ed9c l\u00f2ng nh\u1eefng con \u0111\u01b0\u1eddng n\u00e0y.",
    "bestServices": "D\u1ecbch V\u1ee5 T\u1ed1t Nh\u1ea5t",
    "tourAgents": "\u0110\u1ea1i L\u00fd Tour",
    "planYourTrip": "L\u00ean k\u1ebf ho\u1ea1ch chuy\u1ebfn \u0111i c\u00f9ng ch\u00fang t\u00f4i",
    "readyForTour": "S\u1eb5n s\u00e0ng cho m\u1ed9t chuy\u1ebfn tour kh\u00f3 qu\u00ean?",
    "bookTourNow": "\u0110\u1eb7t tour ngay",
    "readyToTravel": "B\u1ea1n \u0111\u00e3 s\u1eb5n s\u00e0ng du l\u1ecbch?",
    "platformDescription": "Vietnam Motorcycle Tour \u2014 N\u1ec1n T\u1ea3ng Phi\u00eau L\u01b0u H\u00e0ng \u0110\u1ea7u Th\u1ebf Gi\u1edbi",
    "totalTours": "T\u1ed5ng S\u1ed1 Tour",
    "happyRiders": "T\u00e0i X\u1ebf H\u00e0i L\u00f2ng",
    "happyPeople": "Kh\u00e1ch H\u00e0ng H\u1ea1nh Ph\u00fac",
    "yearsExperience": "N\u0103m Kinh Nghi\u1ec7m"
  },
  "rental": {
    "title": "Cho Thu\u00ea",
    "breadcrumbHome": "Trang Ch\u1ee7",
    "breadcrumbRental": "Cho Thu\u00ea",
    "perDay": "/ M\u1ed7i Ng\u00e0y"
  },
  "common": {
    "perPerson": "/ M\u1ed7i Ng\u01b0\u1eddi",
    "tours": "tour"
  },
  "meta": {
    "homeTitle": "Vietnam Motorcycle Tour \u2014 Tour Phi\u00eau L\u01b0u T\u1ea1i Nha Trang",
    "homeDescription": "Vietnam Motorcycle Tour \u2014 Tour phi\u00eau l\u01b0u t\u1ea1i Nha Trang v\u00e0 c\u00e1c v\u00f9ng l\u00e2n c\u1eadn. Tour trong ng\u00e0y, tour nhi\u1ec1u ng\u00e0y, cho thu\u00ea xe m\u00e1y v\u00e0 \u00f4 t\u00f4.",
    "toursTitle": "Tour Ph\u1ed5 Bi\u1ebfn \u2014 Vietnam Motorcycle Tour",
    "toursDescription": "Kh\u00e1m ph\u00e1 c\u00e1c tour xe m\u00e1y v\u00e0 phi\u00eau l\u01b0u ph\u1ed5 bi\u1ebfn t\u1ea1i Vi\u1ec7t Nam. Tour trong ng\u00e0y v\u00e0 nhi\u1ec1u ng\u00e0y t\u1eeb Nha Trang.",
    "contactTitle": "Li\u00ean H\u1ec7 \u2014 Vietnam Motorcycle Tour",
    "contactDescription": "Li\u00ean h\u1ec7 v\u1edbi Vietnam Motorcycle Tour. \u0110\u1eb7t tour phi\u00eau l\u01b0u t\u1ea1i Nha Trang v\u00e0 c\u00e1c v\u00f9ng l\u00e2n c\u1eadn.",
    "aboutTitle": "Gi\u1edbi Thi\u1ec7u \u2014 Vietnam Motorcycle Tour",
    "aboutDescription": "T\u00ecm hi\u1ec3u v\u1ec1 Vietnam Motorcycle Tour \u2014 h\u01b0\u1edbng d\u1eabn vi\u00ean gi\u00e0u kinh nghi\u1ec7m, h\u01a1n 10 n\u0103m tour xe m\u00e1y t\u1ea1i Vi\u1ec7t Nam.",
    "rentalTitle": "Cho Thu\u00ea Xe M\u00e1y & \u00d4 T\u00f4 \u2014 Vietnam Motorcycle Tour",
    "rentalDescription": "Cho thu\u00ea xe m\u00e1y v\u00e0 \u00f4 t\u00f4 t\u1ea1i Nha Trang, Vi\u1ec7t Nam. Honda, Yamaha, Toyota v\u00e0 nhi\u1ec1u h\u00e3ng kh\u00e1c."
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/messages/en.json src/messages/vi.json
git commit -m "feat(i18n): add English and Vietnamese translation files"
```

---

### Task 3: Wire up `next-intl` provider in `_app.tsx`

**Files:**

- Modify: `src/pages/_app.tsx`

- [ ] **Step 1: Update `_app.tsx` to wrap with NextIntlClientProvider**

Replace the contents of `src/pages/_app.tsx` with:

```tsx
import type { AppProps } from "next/app";
import { NextIntlClientProvider } from "next-intl";
import { useRouter } from "next/router";
import { DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import { Layout } from "../components/layout/index";
import "@/styles/globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const outBrave = localFont({
  src: [
    {
      path: "../../public/assets/fonts/outbrave.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/assets/fonts/outbrave.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-outbrave",
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <NextIntlClientProvider
      locale={router.locale}
      messages={pageProps.messages}
      timeZone="Asia/Ho_Chi_Minh"
    >
      <div className={`${dmSans.variable} ${outBrave.variable} font-sans`}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </div>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 2: Verify dev server starts without errors**

```bash
pnpm dev
```

Expected: Server starts. Pages render (translations not yet wired to components — that's next tasks).

- [ ] **Step 3: Commit**

```bash
git add src/pages/_app.tsx
git commit -m "feat(i18n): wire NextIntlClientProvider in _app.tsx"
```

---

### Task 4: Create LanguageSwitcher component

**Files:**

- Create: `src/components/language-switcher/index.tsx`

- [ ] **Step 1: Create the LanguageSwitcher component**

Create `src/components/language-switcher/index.tsx`:

```tsx
"use client";

import { useRouter } from "next/router";

export const LanguageSwitcher = () => {
  const router = useRouter();
  const { locale, asPath } = router;

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.push(asPath, asPath, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1 text-sm font-semibold">
      <button
        onClick={() => switchLocale("vi")}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "vi"
            ? "text-primary font-bold"
            : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        VI
      </button>
      <span className="text-neutral-300">|</span>
      <button
        onClick={() => switchLocale("en")}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "en"
            ? "text-primary font-bold"
            : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        EN
      </button>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/language-switcher/index.tsx
git commit -m "feat(i18n): create LanguageSwitcher component"
```

---

### Task 5: Localize Header component

**Files:**

- Modify: `src/components/header/index.tsx`

- [ ] **Step 1: Add imports and translation hook to Header**

At the top of `src/components/header/index.tsx`, add the `useTranslations` import and `LanguageSwitcher` import:

```tsx
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
```

Inside the `Header` component, add right after `const [mobileOpen, setMobileOpen] = useState(false);`:

```tsx
const t = useTranslations("header");
```

- [ ] **Step 2: Replace hardcoded nav labels with `t()` calls**

Replace the `navLinks` array with:

```tsx
const navLinks = [
  { href: "/", label: t("home"), active: router.pathname === "/" },
  {
    href: "/tours",
    label: t("tours"),
    active: router.pathname.startsWith("/tours"),
    children: destinationsData.map((d) => ({ href: "/tours", label: d.name })),
  },
  {
    href: "/rental",
    label: t("rental"),
    active: router.pathname.startsWith("/rental"),
    children: [
      { href: "/rental", label: t("motorbike") },
      { href: "/rental", label: t("car") },
    ],
  },
  {
    href: "/about-us",
    label: t("aboutUs"),
    active: router.pathname === "/about-us",
  },
  {
    href: "/contact",
    label: t("contact"),
    active: router.pathname === "/contact",
  },
];
```

- [ ] **Step 3: Add LanguageSwitcher to desktop nav**

In the desktop nav section, right after the closing `</nav>` tag (the `<nav className="hidden lg:flex...">` block), add the LanguageSwitcher before the mobile hamburger button:

```tsx
<div className="hidden lg:flex items-center ml-4">
  <LanguageSwitcher />
</div>
```

- [ ] **Step 4: Add LanguageSwitcher to mobile nav panel**

In the mobile nav panel, right after the social links `<div className="flex gap-4">...</div>` block (inside the `<div className="p-4 mt-4">` section), add:

```tsx
<div className="mt-4 pt-4 border-t border-white/10">
  <LanguageSwitcher />
</div>
```

- [ ] **Step 5: Verify header renders with translations**

```bash
pnpm dev
```

Expected: Navigation labels render correctly. Clicking VI/EN switches language. Verify at `http://localhost:3000` (Vietnamese) and `http://localhost:3000/en` (English).

- [ ] **Step 6: Commit**

```bash
git add src/components/header/index.tsx
git commit -m "feat(i18n): localize Header component and add LanguageSwitcher"
```

---

### Task 6: Localize Footer component

**Files:**

- Modify: `src/components/footer/index.tsx`

- [ ] **Step 1: Convert Footer from arrow function to regular function and add translations**

The Footer is currently an arrow function component (`export const Footer = () => (`), which makes it hard to add hooks. Convert it and add translations. Replace the entire file with:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getUrl, contactInfo } from "@/utils";

export const Footer = () => {
  const t = useTranslations("footer");

  return (
    <footer className="bg-neutral-900 text-neutral-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-10">
          {/* About */}
          <div className="xl:col-span-4">
            <Link href="/" className="inline-block mb-6">
              <img
                src={getUrl("assets/images/logo/logo-white.png")}
                alt="Logo"
                className="h-11 opacity-90"
              />
            </Link>
            <p className="text-sm leading-relaxed mb-6">{t("aboutText")}</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <i className="fas fa-phone-square-alt text-primary" />
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="hover:text-white transition-colors"
                >
                  {contactInfo.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-envelope text-primary" />
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="hover:text-white transition-colors"
                >
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-map-marker-alt text-primary" />
                <span>{contactInfo.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-map-marker-alt text-primary" />
                <span>{contactInfo.city}, Vietnam</span>
              </li>
            </ul>
          </div>

          {/* Company links */}
          <div className="xl:col-span-2">
            <h3 className="text-white font-bold text-lg mb-6">
              {t("company")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/about-us"
                  className="hover:text-white transition-colors"
                >
                  {t("aboutUs")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  {t("contactUs")}
                </Link>
              </li>
              <li>
                <Link
                  href="/rental"
                  className="hover:text-white transition-colors"
                >
                  {t("rental")}
                </Link>
              </li>
              <li>
                <Link
                  href="/tours"
                  className="hover:text-white transition-colors"
                >
                  {t("tours")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Explore links */}
          <div className="xl:col-span-2">
            <h3 className="text-white font-bold text-lg mb-6">
              {t("explore")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/tours"
                  className="hover:text-white transition-colors"
                >
                  {t("tours")}
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("legal")}
                </a>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  {t("contact")}
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("privacyPolicy")}
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="xl:col-span-4">
            <h3 className="text-white font-bold text-lg mb-6">
              {t("newsletter")}
            </h3>
            <form className="flex gap-0">
              <input
                type="email"
                placeholder={t("emailPlaceholder")}
                className="flex-1 bg-white/10 border border-white/10 rounded-l-lg px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-r-lg transition-colors"
              >
                {t("subscribe")}
              </button>
            </form>
            <label className="flex items-center gap-2 mt-4 text-xs">
              <i className="fa fa-check text-primary" />
              {t("agreeTerms")}
            </label>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a
              href={contactInfo.youtubeLink}
              className="hover:text-white transition-colors"
            >
              <i className="fab fa-youtube" />
            </a>
            <a
              href={contactInfo.tripadvisorLink}
              className="hover:text-white transition-colors"
            >
              <i className="fab fa-tripadvisor" />
            </a>
            <a
              href={`https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, "")}`}
              className="hover:text-white transition-colors"
            >
              <i className="fab fa-whatsapp" />
            </a>
          </div>
          <p className="text-sm">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
};
```

- [ ] **Step 2: Verify footer renders**

```bash
pnpm dev
```

Expected: Footer renders with translated text in both locales.

- [ ] **Step 3: Commit**

```bash
git add src/components/footer/index.tsx
git commit -m "feat(i18n): localize Footer component"
```

---

### Task 7: Localize TourCard and DestinationCard components

**Files:**

- Modify: `src/components/tour-card/index.tsx`
- Modify: `src/components/destination-card/index.tsx`

- [ ] **Step 1: Localize TourCard**

Replace the contents of `src/components/tour-card/index.tsx` with:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { TourCardProps } from "@/types";

export const TourCard = ({ tour }: TourCardProps) => {
  const { title, imageUrl, rating, price, duration, distance, location } = tour;
  const t = useTranslations("common");

  return (
    <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col">
      <div className="relative overflow-hidden aspect-[3/2]">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary transition-colors">
          <Link href="/tours">{title}</Link>
        </h3>
        <p className="text-neutral-500 text-sm mb-4">
          <span className="text-primary font-bold text-lg">${price}</span>{" "}
          {t("perPerson")}
        </p>
        <ul className="flex items-center gap-4 text-xs text-neutral-500 mt-auto pt-4 border-t border-neutral-100">
          <li className="flex items-center gap-1">
            <i className="fa fa-clock text-neutral-400" /> {duration}
          </li>
          <li className="flex items-center gap-1">
            <i className="fa fa-road text-neutral-400" /> {distance}
          </li>
          <li className="flex items-center gap-1">
            <i className="fa fa-map-marker-alt text-neutral-400" /> {location}
          </li>
        </ul>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Localize DestinationCard**

Replace the contents of `src/components/destination-card/index.tsx` with:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { DestinationCardProps } from "@/types";

export const DestinationCard = ({
  destination,
  className,
}: DestinationCardProps & { className?: string }) => {
  const { name, imageUrl, tours } = destination;
  const t = useTranslations("common");

  return (
    <div
      className={`group relative rounded-lg overflow-hidden ${className ?? "aspect-[3/2]"}`}
    >
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h2 className="text-xl font-bold text-white mb-1">
          <Link
            href="/tours"
            className="hover:text-primary-light transition-colors"
          >
            {name}
          </Link>
        </h2>
        <span className="inline-block bg-primary/90 text-white text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
          {tours} {t("tours")}
        </span>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Verify both components render**

```bash
pnpm dev
```

Expected: Tour cards show "/ Per Person" in English, "/ Mỗi Người" in Vietnamese. Destination cards show "tours"/"tour" respectively.

- [ ] **Step 4: Commit**

```bash
git add src/components/tour-card/index.tsx src/components/destination-card/index.tsx
git commit -m "feat(i18n): localize TourCard and DestinationCard components"
```

---

### Task 8: Localize Home page (`src/pages/index.tsx`)

**Files:**

- Modify: `src/pages/index.tsx`

- [ ] **Step 1: Add imports and getStaticProps**

At the top of `src/pages/index.tsx`, add the import:

```tsx
import { useTranslations } from "next-intl";
import type { GetStaticPropsContext } from "next";
import Head from "next/head";
```

At the bottom of the file (after the component), add:

```tsx
export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 2: Add translation hooks inside the Home component**

Inside the `Home` function, right after `const [videoModalOpen, setVideoModalOpen] = useState(false);`, add:

```tsx
const t = useTranslations("home");
const tMeta = useTranslations("meta");
```

- [ ] **Step 3: Add Head with meta tags**

Right after the opening `<>` fragment, add:

```tsx
<Head>
  <title>{tMeta("homeTitle")}</title>
  <meta name="description" content={tMeta("homeDescription")} />
</Head>
```

- [ ] **Step 4: Replace all hardcoded strings in the JSX**

Replace each hardcoded string with its `t()` call:

- `"Travel & Adventures"` → `{t('heroTitle')}`
- `"Your Next Adventure Starts Here"` → `{t('heroSubtitle')}`
- `"Destination lists"` → `{t('destinationLists')}`
- `"Go Exotic Places"` → `{t('goExoticPlaces')}`
- `"Book Tour Now"` → `{t('bookTourNow')}`
- `"Get to know us"` → `{t('getToKnowUs')}`
- `"Plan Your Trip with Us"` → `{t('planYourTrip')}`
- The paragraph `"We are leading day tour..."` → `{t('aboutDescription')}`
- The bullet items array `['Motorbike and car tour', 'Friendly team...', 'Experience in...']` → `[t('bulletMotorbike'), t('bulletFriendly'), t('bulletExperience')]`
- `"Book with us now"` → `{t('bookWithUsNow')}`
- `"Featured tours"` → `{t('featuredTours')}`
- `"Most Popular Tours"` → `{t('mostPopularTours')}`
- `"Are you ready to travel?"` → `{t('readyToTravel')}`
- `"We are leading day tour and multi-day tour on organizer in Nha Trang"` → `{t('videoSectionHeading')}`
- The tour type labels: replace the array with:

  ```tsx
  {[
    { icon: 'icon-travel-map', label: t('wildlifeTours') },
    { icon: 'icon-place', label: t('bikeTours') },
    { icon: 'icon-flag', label: t('adventureTours') },
    { icon: 'icon-clock', label: t('fullDayTours') },
  ].map((item) => (
  ```

- [ ] **Step 5: Verify home page renders in both locales**

```bash
pnpm dev
```

Visit `http://localhost:3000` (Vietnamese) and `http://localhost:3000/en` (English). All text should be translated.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat(i18n): localize Home page"
```

---

### Task 9: Localize Tours page

**Files:**

- Modify: `src/pages/tours.tsx`

- [ ] **Step 1: Add imports, translations, and getStaticProps**

Replace the contents of `src/pages/tours.tsx` with:

```tsx
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { GetStaticPropsContext } from "next";
import Head from "next/head";
import { PageHeader } from "@/components/page-header";
import { TourCard } from "@/components/tour-card";
import { toursData } from "@/data";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Tours() {
  const t = useTranslations("tours");
  const tMeta = useTranslations("meta");

  return (
    <>
      <Head>
        <title>{tMeta("toursTitle")}</title>
        <meta name="description" content={tMeta("toursDescription")} />
      </Head>

      <PageHeader
        title={t("title")}
        breadcrumbs={[
          { label: t("breadcrumbHome"), href: "/" },
          { label: t("breadcrumbTours") },
        ]}
        backgroundImage="https://data.agatetravel.com/images/photogallery/2025/halong-bay-hanoi-vietnam.jpg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {toursData.map((tour, i) => (
              <motion.div
                key={tour.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  ...fadeInUp,
                  visible: {
                    ...fadeInUp.visible,
                    transition: { duration: 0.6, delay: i * 0.1 },
                  },
                }}
              >
                <TourCard tour={tour} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 2: Verify tours page renders in both locales**

```bash
pnpm dev
```

Expected: Page header and breadcrumbs show translated text.

- [ ] **Step 3: Commit**

```bash
git add src/pages/tours.tsx
git commit -m "feat(i18n): localize Tours page"
```

---

### Task 10: Localize Contact page

**Files:**

- Modify: `src/pages/contact.tsx`

- [ ] **Step 1: Replace contact.tsx with localized version**

Replace the contents of `src/pages/contact.tsx` with:

```tsx
import { useTranslations } from "next-intl";
import type { GetStaticPropsContext } from "next";
import Head from "next/head";
import { PageHeader } from "@/components/page-header";
import { contactInfo } from "@/utils";

export default function Contact() {
  const t = useTranslations("contact");
  const tMeta = useTranslations("meta");

  return (
    <>
      <Head>
        <title>{tMeta("contactTitle")}</title>
        <meta name="description" content={tMeta("contactDescription")} />
      </Head>

      <PageHeader
        title={t("title")}
        breadcrumbs={[
          { label: t("breadcrumbHome"), href: "/" },
          { label: t("breadcrumbContact") },
        ]}
        backgroundImage="https://media.gadventures.com/media-server/cache/59/d0/59d0b4d7c98928e2b9bf2e208409d5d6.jpg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {t("talkWithTeam")}
              </span>
              <h2 className="text-3xl font-bold mt-2 mb-6">
                {t("anyQuestion")}
              </h2>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 bg-neutral-100 hover:bg-primary hover:text-white rounded-full flex items-center justify-center text-neutral-500 transition-all"
                >
                  <i className="fab fa-facebook" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-neutral-100 hover:bg-primary hover:text-white rounded-full flex items-center justify-center text-neutral-500 transition-all"
                >
                  <i className="fab fa-twitter" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-neutral-100 hover:bg-primary hover:text-white rounded-full flex items-center justify-center text-neutral-500 transition-all"
                >
                  <i className="fab fa-instagram" />
                </a>
              </div>
            </div>
            <div className="lg:col-span-8">
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input
                    type="text"
                    placeholder={t("namePlaceholder")}
                    className="w-full bg-neutral-100 border-0 rounded-lg px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    className="w-full bg-neutral-100 border-0 rounded-lg px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <textarea
                  placeholder={t("messagePlaceholder")}
                  rows={6}
                  className="w-full bg-neutral-100 border-0 rounded-lg px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-lg transition-colors"
                >
                  {t("sendMessage")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-neutral-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "icon-place",
                lines: [contactInfo.address, `${contactInfo.city}, Vietnam`],
              },
              { icon: "icon-phone-call", lines: [contactInfo.phone] },
              { icon: "icon-at", lines: [contactInfo.email] },
            ].map((info, i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-8 text-center shadow-sm"
              >
                <span
                  className={`${info.icon} text-4xl text-primary block mb-4`}
                />
                {info.lines.map((line, j) => (
                  <p key={j} className="text-neutral-700 text-sm">
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4562.753041141002!2d-118.80123790098536!3d34.152323469614075!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80e82469c2162619%3A0xba03efb7998eef6d!2sCostco+Wholesale!5e0!3m2!1sbn!2sbd!4v1562518641290!5m2!1sbn!2sbd"
          className="w-full h-96 border-0"
          allowFullScreen
          title="Location map"
        />
      </section>
    </>
  );
}

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 2: Verify and commit**

```bash
pnpm dev
```

Expected: Contact page renders with translated text in both locales.

```bash
git add src/pages/contact.tsx
git commit -m "feat(i18n): localize Contact page"
```

---

### Task 11: Localize About Us page

**Files:**

- Modify: `src/pages/about-us.tsx`

- [ ] **Step 1: Replace about-us.tsx with localized version**

Replace the contents of `src/pages/about-us.tsx` with:

```tsx
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { GetStaticPropsContext } from "next";
import Head from "next/head";
import { PageHeader } from "@/components/page-header";
import { VideoModal } from "@/components/video-modal";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function AboutUs() {
  const [videoOpen, setVideoOpen] = useState(false);
  const t = useTranslations("about");
  const tMeta = useTranslations("meta");

  return (
    <>
      <Head>
        <title>{tMeta("aboutTitle")}</title>
        <meta name="description" content={tMeta("aboutDescription")} />
      </Head>

      <PageHeader
        title={t("title")}
        breadcrumbs={[
          { label: t("breadcrumbHome"), href: "/" },
          { label: t("breadcrumbPages") },
          { label: t("breadcrumbAbout") },
        ]}
        backgroundImage="https://vietnamamazingtours.com/uploads/Northern-Vietnam-Tours.jpeg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="rounded-lg overflow-hidden">
                <img
                  src="assets/images/resources/about-page-img.jpg"
                  alt="About us"
                  className="w-full object-cover"
                />
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {t("learnAboutUs")}
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold mt-2 mb-4">
                {t("dareToExplore")}
              </h2>
              <p className="text-primary font-semibold mb-4">
                {t("perfectPlace")}
              </p>
              <p className="text-neutral-500 mb-8">{t("aboutDescription")}</p>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <h4 className="text-sm font-bold text-neutral-900">
                      {t("bestServices")}
                    </h4>
                    <span className="text-sm font-bold text-primary">77%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: "77%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <h4 className="text-sm font-bold text-neutral-900">
                      {t("tourAgents")}
                    </h4>
                    <span className="text-sm font-bold text-primary">38%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: "38%" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-primary py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-white text-center lg:text-left">
            <p className="font-display text-sm opacity-80 mb-1">
              {t("planYourTrip")}
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold">
              {t("readyForTour")}
            </h2>
          </div>
          <Link
            href="/contact"
            className="bg-white text-primary hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-lg transition-colors flex-shrink-0"
          >
            {t("bookTourNow")}
          </Link>
        </div>
      </section>

      <section className="relative py-24 lg:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage:
              "url(assets/images/backgrounds/video-one-two-bg.jpg)",
          }}
        />
        <div className="absolute inset-0 bg-overlay" />
        <div className="relative z-10 text-center text-white">
          <button
            onClick={() => setVideoOpen(true)}
            className="mx-auto mb-6 w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-light transition-colors animate-pulse"
            aria-label="Play video"
          >
            <i className="fa fa-play text-xl ml-1" />
          </button>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-light mb-2">
            {t("readyToTravel")}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold max-w-2xl mx-auto leading-tight">
            {t("platformDescription")}
          </h2>
        </div>
      </section>
      <VideoModal
        videoUrl="https://www.youtube.com/watch?v=Get7rqXYrbQ"
        isOpen={videoOpen}
        onClose={() => setVideoOpen(false)}
      />

      <section className="bg-secondary py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: "870+", label: t("totalTours") },
              { value: "480+", label: t("happyRiders") },
              { value: "930+", label: t("happyPeople") },
              { value: "15+", label: t("yearsExperience") },
            ].map((stat) => (
              <div key={stat.label}>
                <h3 className="text-3xl lg:text-4xl font-bold mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 2: Verify and commit**

```bash
pnpm dev
```

Expected: About page renders with translated text in both locales.

```bash
git add src/pages/about-us.tsx
git commit -m "feat(i18n): localize About Us page"
```

---

### Task 12: Localize Rental page

**Files:**

- Modify: `src/pages/rental.tsx`

- [ ] **Step 1: Replace rental.tsx with localized version**

Replace the contents of `src/pages/rental.tsx` with:

```tsx
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { GetStaticPropsContext } from "next";
import Head from "next/head";
import { PageHeader } from "@/components/page-header";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const rentalItems = [
  {
    title: "Honda Winner X",
    price: 25,
    image: "assets/images/resources/popular-tours-two__img-1.jpg",
    rating: "8.0 Superb",
    category: "Motorbike",
  },
  {
    title: "Honda XR 150",
    price: 30,
    image: "assets/images/resources/popular-tours-two__img-2.jpg",
    rating: "8.5 Superb",
    category: "Motorbike",
  },
  {
    title: "Yamaha Exciter",
    price: 20,
    image: "assets/images/resources/popular-tours-two__img-3.jpg",
    rating: "8.0 Superb",
    category: "Motorbike",
  },
  {
    title: "Honda CB500X",
    price: 55,
    image: "assets/images/resources/popular-tours-two__img-4.jpg",
    rating: "9.0 Superb",
    category: "Motorbike",
  },
  {
    title: "Toyota Vios",
    price: 45,
    image: "assets/images/resources/popular-tours-two__img-5.jpg",
    rating: "8.0 Superb",
    category: "Car",
  },
  {
    title: "Ford Ranger",
    price: 65,
    image: "assets/images/resources/popular-tours-two__img-6.jpg",
    rating: "8.2 Superb",
    category: "Car",
  },
];

export default function Rental() {
  const t = useTranslations("rental");
  const tMeta = useTranslations("meta");

  return (
    <>
      <Head>
        <title>{tMeta("rentalTitle")}</title>
        <meta name="description" content={tMeta("rentalDescription")} />
      </Head>

      <PageHeader
        title={t("title")}
        breadcrumbs={[
          { label: t("breadcrumbHome"), href: "/" },
          { label: t("breadcrumbRental") },
        ]}
        backgroundImage="https://vietnammotorcycletours.com/storage/2022/04/AR500963-1920x1280.jpg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {rentalItems.map((item, i) => (
              <motion.div
                key={i}
                className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  ...fadeInUp,
                  visible: {
                    ...fadeInUp.visible,
                    transition: { duration: 0.6, delay: i * 0.1 },
                  },
                }}
              >
                <div className="relative overflow-hidden aspect-[3/2]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                  <span className="absolute top-3 left-3 bg-secondary text-white text-xs font-bold uppercase px-3 py-1 rounded-full">
                    {item.category}
                  </span>
                  <button
                    className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center text-neutral-500 hover:text-primary hover:bg-white transition-all"
                    aria-label="Add to favorites"
                  >
                    <i className="fa fa-heart text-sm" />
                  </button>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1 text-sm text-primary font-semibold mb-2">
                    <i className="fa fa-star text-xs" /> {item.rating}
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-neutral-500 text-sm">
                    <span className="text-primary font-bold text-lg">
                      ${item.price}
                    </span>{" "}
                    {t("perDay")}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 2: Verify and commit**

```bash
pnpm dev
```

Expected: Rental page renders with translated breadcrumbs, title, and "/ Per Day" text.

```bash
git add src/pages/rental.tsx
git commit -m "feat(i18n): localize Rental page"
```

---

### Task 13: Add hreflang SEO tags and remove hardcoded lang from `_document.tsx`

**Files:**

- Modify: `src/pages/_document.tsx`

- [ ] **Step 1: Update \_document.tsx**

Replace the contents of `src/pages/_document.tsx` with:

```tsx
import { Html, Head, Main, NextScript } from "next/document";
import { getUrl } from "@/utils";

export default function Document() {
  return (
    <Html>
      <Head>
        <meta charSet="UTF-8" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={getUrl("assets/images/favicons/apple-touch-icon.png")}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={getUrl("assets/images/favicons/favicon-32x32.png")}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={getUrl("assets/images/favicons/favicon-16x16.png")}
        />
        <link
          rel="manifest"
          href={getUrl("assets/images/favicons/site.webmanifest")}
        />

        <link
          rel="stylesheet"
          href={getUrl("assets/vendors/fontawesome/css/all.min.css")}
        />
        <link
          rel="stylesheet"
          href={getUrl("assets/vendors/tevily-icons/style.css")}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

Key changes:

- Removed `lang="en"` from `<Html>` — Next.js `i18n` config sets this automatically based on the current locale.
- Removed the hardcoded meta description — each page now provides its own translated meta description via `<Head>`.

- [ ] **Step 2: Create a shared HrefLang component for pages**

Create `src/components/hreflang/index.tsx`:

```tsx
import Head from "next/head";
import { useRouter } from "next/router";

const SITE_URL = "https://vietnammototour.com";

export const HrefLang = () => {
  const { asPath } = useRouter();
  const pathWithoutLocale = asPath;

  const viUrl = `${SITE_URL}${pathWithoutLocale}`;
  const enUrl = `${SITE_URL}/en${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;

  return (
    <Head>
      <link rel="alternate" hrefLang="vi" href={viUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={viUrl} />
    </Head>
  );
};
```

- [ ] **Step 3: Add HrefLang to Layout so it's on every page**

In `src/components/layout/index.tsx`, add the import and render `<HrefLang />`:

Add at the top:

```tsx
import { HrefLang } from "@/components/hreflang";
```

Render `<HrefLang />` at the start of the Layout's return JSX (inside the fragment or wrapper, before the Header).

- [ ] **Step 4: Verify and commit**

```bash
pnpm dev
```

Expected: View source shows correct `lang` attribute on `<html>`, hreflang tags in `<head>`, and no hardcoded meta description in `_document`.

```bash
git add src/pages/_document.tsx src/components/hreflang/index.tsx src/components/layout/index.tsx
git commit -m "feat(i18n): add hreflang tags and fix html lang attribute"
```

---

### Task 14: Build verification

**Files:** None (verification only)

- [ ] **Step 1: Run production build**

```bash
pnpm build
```

Expected: Build succeeds with no TypeScript errors and no warnings related to i18n.

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: No new lint errors.

- [ ] **Step 3: Manual verification checklist**

Start the dev server and verify:

1. `http://localhost:3000` — Vietnamese text, `<html lang="vi">`
2. `http://localhost:3000/en` — English text, `<html lang="en">`
3. Click VI/EN switcher — page re-renders in new language, URL updates
4. Refresh after switching — preference is remembered (cookie)
5. All 5 pages (home, tours, contact, about, rental) show translated text
6. Header nav labels translate
7. Footer text translates
8. Tour cards show "/ Per Person" / "/ Mỗi Người"
9. Destination cards show "tours" / "tour"
10. Page titles and meta descriptions are translated (view source)
11. hreflang tags present in `<head>`
12. Rental page shows "/ Per Day" / "/ Mỗi Ngày"

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(i18n): address build verification issues"
```
