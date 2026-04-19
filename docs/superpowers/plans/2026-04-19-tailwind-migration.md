# Tailwind Migration & Visual Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Bootstrap/Tevily/jQuery stack with Tailwind CSS v4, modernize visual identity, and eliminate `overflow-x: hidden` to restore native macOS elastic scrolling.

**Architecture:** Tailwind v4 with PostCSS integration. All layout via CSS Grid/Flexbox utilities. React hooks replace jQuery interactions. Framer Motion replaces WOW.js/jarallax animations. Font loading via `next/font`.

**Tech Stack:** Tailwind CSS v4, framer-motion, Next.js 16 (Pages Router), React 19, Swiper (existing)

---

## File Map

### Created
- `postcss.config.mjs` — PostCSS config with Tailwind plugin
- `src/hooks/useScrollDirection.ts` — scroll direction detection hook
- `src/components/scroll-to-top/index.tsx` — floating scroll-to-top button
- `src/components/video-modal/index.tsx` — YouTube video popup (replaces magnific-popup)
- `src/components/page-header/index.tsx` — reusable page header with breadcrumb

### Modified
- `package.json` — add tailwindcss, @tailwindcss/postcss, framer-motion
- `src/styles/globals.css` — Tailwind entry point + theme tokens + custom keyframes
- `src/pages/_document.tsx` — strip all vendor CSS links
- `src/pages/_app.tsx` — add font class wrappers
- `src/types/index.ts` — update Destination type, add PageHeaderProps, VideoModalProps
- `src/data/destinations.json` — remove colClass/width/height, add size field
- `src/data/index.ts` — no changes needed
- `src/components/layout/index.tsx` — add font variables
- `src/components/header/index.tsx` — full rewrite with Tailwind + mobile nav
- `src/components/footer/index.tsx` — full rewrite with Tailwind
- `src/components/tour-card/index.tsx` — rewrite with Tailwind
- `src/components/destination-card/index.tsx` — rewrite, remove colClass prop
- `src/components/gallery-item/index.tsx` — rewrite with Tailwind
- `src/components/tour-carousel/index.tsx` — restyle with Tailwind, remove CSS Module import
- `src/pages/index.tsx` — full rewrite
- `src/pages/tours.tsx` — full rewrite
- `src/pages/contact.tsx` — full rewrite
- `src/pages/about-us.tsx` — full rewrite
- `src/pages/rental.tsx` — full rewrite

### Deleted
- `src/components/header-mobile/index.tsx` — merged into Header
- `src/components/tour-carousel/TourCarousel.module.css` — replaced by Tailwind
- `src/styles/Home.module.css` — unused
- `public/assets/vendors/` — all directories except `fontawesome/` and `tevily-icons/`
- `public/assets/css/tevily.css`
- `public/assets/css/tevily-responsive.css`
- `public/assets/js/tevily.js`

---

### Task 1: Install Dependencies & Configure Tailwind

**Files:**
- Modify: `package.json`
- Create: `postcss.config.mjs`
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Install Tailwind CSS v4, PostCSS plugin, and framer-motion**

```bash
pnpm add tailwindcss @tailwindcss/postcss framer-motion
```

- [ ] **Step 2: Create PostCSS config**

Create `postcss.config.mjs`:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 3: Replace globals.css with Tailwind entry point and theme tokens**

Replace contents of `src/styles/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary: #C2491D;
  --color-primary-light: #E8604C;
  --color-secondary: #1B4332;
  --color-secondary-light: #2D6A4F;
  --color-neutral-900: #1A1A2E;
  --color-neutral-700: #374151;
  --color-neutral-500: #6B7280;
  --color-neutral-200: #E5E7EB;
  --color-neutral-100: #F3F4F6;
  --color-overlay: rgba(26, 26, 46, 0.55);

  --font-display: var(--font-outbrave), sans-serif;
  --font-sans: var(--font-dm-sans), "DM Sans", sans-serif;
}

@layer base {
  body {
    font-family: var(--font-sans);
    color: var(--color-neutral-700);
    @apply text-base leading-relaxed antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    color: var(--color-neutral-900);
    @apply font-bold;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
}

/* Float bob animation — kept from original template */
@keyframes float-bob-y {
  0% { transform: translateY(-20px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(-20px); }
}

.animate-float-bob-y {
  animation: float-bob-y 3s linear infinite;
}
```

- [ ] **Step 4: Verify Tailwind compiles**

```bash
pnpm build
```

Expected: Build succeeds (pages will look broken since vendor CSS is still loaded — that's fine).

- [ ] **Step 5: Commit**

```bash
git add postcss.config.mjs src/styles/globals.css package.json pnpm-lock.yaml
git commit -m "feat: install Tailwind CSS v4 and configure theme tokens"
```

---

### Task 2: Strip _document.tsx & Clean _app.tsx

**Files:**
- Modify: `src/pages/_document.tsx`
- Modify: `src/pages/_app.tsx`
- Delete: `src/styles/Home.module.css`

- [ ] **Step 1: Rewrite _document.tsx — remove all vendor CSS links**

Replace `src/pages/_document.tsx`:

```tsx
import { Html, Head, Main, NextScript } from "next/document";
import { getUrl } from "@/utils";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <link rel="apple-touch-icon" sizes="180x180" href={getUrl("assets/images/favicons/apple-touch-icon.png")} />
        <link rel="icon" type="image/png" sizes="32x32" href={getUrl("assets/images/favicons/favicon-32x32.png")} />
        <link rel="icon" type="image/png" sizes="16x16" href={getUrl("assets/images/favicons/favicon-16x16.png")} />
        <link rel="manifest" href={getUrl("assets/images/favicons/site.webmanifest")} />
        <meta name="description" content="Vietnam Motorcycle Tour — Adventure tours in Nha Trang and beyond" />

        <link rel="stylesheet" href={getUrl("assets/vendors/fontawesome/css/all.min.css")} />
        <link rel="stylesheet" href={getUrl("assets/vendors/tevily-icons/style.css")} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

- [ ] **Step 2: Update _app.tsx to load fonts via next/font**

Replace `src/pages/_app.tsx`:

```tsx
import type { AppProps } from 'next/app';
import { DM_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import { Layout } from '../components/layout/index';
import "@/styles/globals.css";

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const outBrave = localFont({
  src: [
    { path: '../../public/assets/fonts/outbrave.ttf', weight: '400', style: 'normal' },
    { path: '../../public/assets/fonts/outbrave.otf', weight: '400', style: 'normal' },
  ],
  variable: '--font-outbrave',
  display: 'swap',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${dmSans.variable} ${outBrave.variable} font-sans`}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </div>
  );
}
```

- [ ] **Step 3: Delete unused Home.module.css**

```bash
rm src/styles/Home.module.css
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/_document.tsx src/pages/_app.tsx
git rm src/styles/Home.module.css
git commit -m "feat: strip vendor CSS from _document, add font loading to _app"
```

---

### Task 3: Update Data Layer & Types

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/data/destinations.json`

- [ ] **Step 1: Update types**

Replace `src/types/index.ts`:

```ts
import type { ReactNode } from 'react';

export interface Tour {
  id: number;
  title: string;
  imageUrl: string;
  rating: string;
  price: number;
  duration: string;
  distance: string;
  location: string;
}

export interface Destination {
  id: number;
  name: string;
  imageUrl: string;
  tours: number;
  size: 'small' | 'large';
}

export interface ContactInfo {
  phone: string;
  email: string;
  youtubeLink: string;
  tripadvisorLink: string;
  instagramLink: string;
  whatsApp: string;
  address: string;
  city: string;
}

export interface LayoutProps {
  children: ReactNode;
}

export interface TourCardProps {
  tour: Tour;
}

export interface TourCarouselProps {
  tours: Tour[];
}

export interface DestinationCardProps {
  destination: Destination;
}

export interface GalleryItemProps {
  imageSrc: string;
  delay: number;
}

export interface PageHeaderProps {
  title: string;
  breadcrumbs: { label: string; href?: string }[];
  backgroundImage: string;
}

export interface VideoModalProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
}
```

- [ ] **Step 2: Update destinations.json**

Replace `src/data/destinations.json`:

```json
[
  {
    "id": 1,
    "name": "Nha Trang",
    "imageUrl": "https://www.agoda.com/wp-content/uploads/2024/02/Nha-Trang-Cable-Vietnam-1244x700.jpg",
    "tours": 12,
    "size": "small"
  },
  {
    "id": 2,
    "name": "Dalat",
    "imageUrl": "https://localvietnam.de/wp-content/uploads/2023/09/tuyen-lam-see-1-1024x683.jpg",
    "tours": 5,
    "size": "large"
  },
  {
    "id": 3,
    "name": "Mui Ne",
    "imageUrl": "https://images.ctfassets.net/wv75stsetqy3/6gzFoj0ORIEj3yIGsB1Q08/5797e277832264a11c9bae10fb2f7772/Retire_in_Mui_Ne.jpg?q=60&fit=fill&fm=webp",
    "tours": 12,
    "size": "small"
  },
  {
    "id": 4,
    "name": "Sai Gon",
    "imageUrl": "https://cdnen.thesaigontimes.vn/wp-content/uploads/2024/07/Mot-thoang-Ho-Ba-Be_Thong-Lam.jpg",
    "tours": 12,
    "size": "large"
  },
  {
    "id": 5,
    "name": "Hoi An",
    "imageUrl": "https://cdn.kimkim.com/files/a/content_articles/featured_photos/5022fa3d9e45c25486f8bcc9adcfdb44a09ded12/big-94f2b85fd88b035fb52518c04d9cfd63.jpg",
    "tours": 12,
    "size": "large"
  }
]
```

- [ ] **Step 3: Verify types compile**

```bash
pnpm build
```

Expected: Type errors in components referencing `colClass`, `width`, `height` — expected, will be fixed in component rewrites.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/data/destinations.json
git commit -m "refactor: update Destination type — remove presentational fields, add semantic size"
```

---

### Task 4: Create Utility Hooks & Shared Components

**Files:**
- Create: `src/hooks/useScrollDirection.ts`
- Create: `src/components/scroll-to-top/index.tsx`
- Create: `src/components/video-modal/index.tsx`
- Create: `src/components/page-header/index.tsx`

- [ ] **Step 1: Create useScrollDirection hook**

Create `src/hooks/useScrollDirection.ts`:

```ts
import { useState, useEffect } from 'react';

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollDirection, scrollY };
}
```

- [ ] **Step 2: Create ScrollToTop component**

Create `src/components/scroll-to-top/index.tsx`:

```tsx
'use client';

import { useScrollDirection } from '@/hooks/useScrollDirection';

export function ScrollToTop() {
  const { scrollY } = useScrollDirection();
  const visible = scrollY > 400;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-300 hover:bg-primary-light ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
      aria-label="Scroll to top"
    >
      <i className="fa fa-arrow-up" />
    </button>
  );
}
```

- [ ] **Step 3: Create VideoModal component**

Create `src/components/video-modal/index.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import type { VideoModalProps } from '@/types';

export function VideoModal({ videoUrl, isOpen, onClose }: VideoModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Convert YouTube watch URL to embed URL
  const embedUrl = videoUrl.replace('watch?v=', 'embed/') + '?autoplay=1';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl aspect-video mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-2xl hover:text-neutral-200 transition-colors"
          aria-label="Close video"
        >
          <i className="fa fa-times" />
        </button>
        <iframe
          src={embedUrl}
          className="w-full h-full rounded-lg"
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Video"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create PageHeader component**

Create `src/components/page-header/index.tsx`:

```tsx
import Link from 'next/link';
import type { PageHeaderProps } from '@/types';

export function PageHeader({ title, breadcrumbs, backgroundImage }: PageHeaderProps) {
  return (
    <section className="relative">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        <div className="absolute inset-0 bg-overlay" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center h-full">
          <h2 className="text-4xl md:text-5xl font-bold text-white">{title}</h2>
        </div>
      </div>
      <div className="bg-neutral-100 py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-neutral-300">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-primary transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-neutral-900 font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useScrollDirection.ts src/components/scroll-to-top/index.tsx src/components/video-modal/index.tsx src/components/page-header/index.tsx
git commit -m "feat: add useScrollDirection hook, ScrollToTop, VideoModal, PageHeader components"
```

---

### Task 5: Rewrite Header (Merge Desktop + Mobile)

**Files:**
- Modify: `src/components/header/index.tsx`
- Delete: `src/components/header-mobile/index.tsx`

- [ ] **Step 1: Rewrite Header with Tailwind + integrated mobile nav**

Replace `src/components/header/index.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { getUrl } from '@/utils';
import { contactInfo } from '@/utils';
import destinationsData from '@/data/destinations.json';

export const Header = () => {
  const router = useRouter();
  const { scrollDirection, scrollY } = useScrollDirection();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSticky = scrollY > 100;
  const isHidden = scrollDirection === 'down' && scrollY > 200;

  const navLinks = [
    { href: '/', label: 'Home', active: router.pathname === '/' },
    {
      href: '/tours',
      label: 'Tours',
      active: router.pathname.startsWith('/tours'),
      children: destinationsData.map((d) => ({ href: '/tours', label: d.name })),
    },
    {
      href: '/rental',
      label: 'Rental',
      active: router.pathname.startsWith('/rental'),
      children: [
        { href: '/rental', label: 'Motorbike' },
        { href: '/rental', label: 'Car' },
      ],
    },
    { href: '/about-us', label: 'About Us', active: router.pathname === '/about-us' },
    { href: '/contact', label: 'Contact', active: router.pathname === '/contact' },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="bg-neutral-900 text-white text-sm hidden lg:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2">
          <div className="flex items-center gap-6">
            <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-2 hover:text-primary-light transition-colors">
              <span className="icon-phone-call" />
              {contactInfo.phone}
            </a>
            <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2 hover:text-primary-light transition-colors">
              <span className="icon-at" />
              {contactInfo.email}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href={contactInfo.youtubeLink} className="hover:text-primary-light transition-colors"><i className="fab fa-youtube" /></a>
            <a href={contactInfo.tripadvisorLink} className="hover:text-primary-light transition-colors"><i className="fab fa-tripadvisor" /></a>
            <a href={`https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}`} className="hover:text-primary-light transition-colors"><i className="fab fa-whatsapp" /></a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isSticky ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white'
        } ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <img
                src={getUrl('assets/images/logo/logo.jpeg')}
                alt="Vietnam Motorcycle Tour"
                className="h-11 lg:h-14"
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <div key={link.href + link.label} className="relative group">
                  <Link
                    href={link.href}
                    className={`text-sm font-semibold uppercase tracking-wide transition-colors py-6 ${
                      link.active ? 'text-primary' : 'text-neutral-900 hover:text-primary'
                    }`}
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="bg-white rounded-lg shadow-lg py-2 min-w-[180px] border border-neutral-200">
                        {link.children.map((child, i) => (
                          <Link
                            key={i}
                            href={child.href}
                            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-primary transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden flex flex-col gap-1.5 p-2"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <span className="block w-6 h-0.5 bg-neutral-900" />
              <span className="block w-6 h-0.5 bg-neutral-900" />
              <span className="block w-6 h-0.5 bg-neutral-900" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile nav panel */}
      <div
        className={`fixed top-0 right-0 z-[70] h-full w-72 bg-neutral-900 text-white transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <img
            src={getUrl('assets/images/logo/logo-white.png')}
            alt="Logo"
            className="h-10"
          />
          <button
            onClick={() => setMobileOpen(false)}
            className="text-white text-xl hover:text-primary-light transition-colors"
            aria-label="Close menu"
          >
            <i className="fa fa-times" />
          </button>
        </div>
        <nav className="p-4">
          {navLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block py-3 border-b border-white/10 text-sm font-medium uppercase tracking-wide transition-colors ${
                link.active ? 'text-primary-light' : 'text-white hover:text-primary-light'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 mt-4">
          <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-3">
            <i className="fa fa-envelope" /> {contactInfo.email}
          </a>
          <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-4">
            <i className="fa fa-phone-alt" /> {contactInfo.phone}
          </a>
          <div className="flex gap-4">
            <a href={contactInfo.youtubeLink} className="text-neutral-400 hover:text-white"><i className="fab fa-youtube" /></a>
            <a href={contactInfo.tripadvisorLink} className="text-neutral-400 hover:text-white"><i className="fab fa-tripadvisor" /></a>
            <a href={`https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}`} className="text-neutral-400 hover:text-white"><i className="fab fa-whatsapp" /></a>
          </div>
        </div>
      </div>
    </>
  );
};
```

- [ ] **Step 2: Delete header-mobile component**

```bash
rm -rf src/components/header-mobile
```

- [ ] **Step 3: Commit**

```bash
git add src/components/header/index.tsx
git rm -rf src/components/header-mobile
git commit -m "feat: rewrite Header with Tailwind, merge mobile nav into single responsive component"
```

---

### Task 6: Rewrite Footer

**Files:**
- Modify: `src/components/footer/index.tsx`

- [ ] **Step 1: Rewrite Footer with Tailwind**

Replace `src/components/footer/index.tsx`:

```tsx
import Link from 'next/link';
import { getUrl } from '@/utils';
import { contactInfo } from '@/utils';

export const Footer = () => (
  <footer className="bg-neutral-900 text-neutral-400">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-10">
        {/* About */}
        <div className="xl:col-span-4">
          <Link href="/" className="inline-block mb-6">
            <img
              src={getUrl('assets/images/logo/logo-white.png')}
              alt="Logo"
              className="h-11 opacity-90"
            />
          </Link>
          <p className="text-sm leading-relaxed mb-6">
            Our Guides have many years of experience motorcycling and was established in 2008
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <i className="fas fa-phone-square-alt text-primary" />
              <a href={`tel:${contactInfo.phone}`} className="hover:text-white transition-colors">{contactInfo.phone}</a>
            </li>
            <li className="flex items-center gap-3">
              <i className="fas fa-envelope text-primary" />
              <a href={`mailto:${contactInfo.email}`} className="hover:text-white transition-colors">{contactInfo.email}</a>
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
          <h3 className="text-white font-bold text-lg mb-6">Company</h3>
          <ul className="space-y-3 text-sm">
            <li><Link href="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link href="/rental" className="hover:text-white transition-colors">Rental</Link></li>
            <li><Link href="/tours" className="hover:text-white transition-colors">Tours</Link></li>
          </ul>
        </div>

        {/* Explore links */}
        <div className="xl:col-span-2">
          <h3 className="text-white font-bold text-lg mb-6">Explore</h3>
          <ul className="space-y-3 text-sm">
            <li><Link href="/tours" className="hover:text-white transition-colors">Tours</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Legal</a></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="xl:col-span-4">
          <h3 className="text-white font-bold text-lg mb-6">Newsletter</h3>
          <form className="flex gap-0">
            <input
              type="email"
              placeholder="Email address"
              className="flex-1 bg-white/10 border border-white/10 rounded-l-lg px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-r-lg transition-colors"
            >
              Subscribe
            </button>
          </form>
          <label className="flex items-center gap-2 mt-4 text-xs">
            <i className="fa fa-check text-primary" />
            I agree to all terms and policies
          </label>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <a href={contactInfo.youtubeLink} className="hover:text-white transition-colors"><i className="fab fa-youtube" /></a>
          <a href={contactInfo.tripadvisorLink} className="hover:text-white transition-colors"><i className="fab fa-tripadvisor" /></a>
          <a href={`https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}`} className="hover:text-white transition-colors"><i className="fab fa-whatsapp" /></a>
        </div>
        <p className="text-sm">&copy; All Copyright {new Date().getFullYear()}</p>
      </div>
    </div>
  </footer>
);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/footer/index.tsx
git commit -m "feat: rewrite Footer with Tailwind grid layout"
```

---

### Task 7: Rewrite Layout & Update Component Exports

**Files:**
- Modify: `src/components/layout/index.tsx`

- [ ] **Step 1: Update Layout to include ScrollToTop**

Replace `src/components/layout/index.tsx`:

```tsx
import type { LayoutProps } from '@/types';
import { Header } from '../header/index';
import { Footer } from '../footer/index';
import { ScrollToTop } from '../scroll-to-top/index';

export function Layout({ children }: LayoutProps) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/index.tsx
git commit -m "feat: add ScrollToTop to Layout"
```

---

### Task 8: Rewrite TourCard

**Files:**
- Modify: `src/components/tour-card/index.tsx`

- [ ] **Step 1: Rewrite TourCard with Tailwind**

Replace `src/components/tour-card/index.tsx`:

```tsx
import Link from 'next/link';
import type { TourCardProps } from '@/types';

export const TourCard = ({ tour }: TourCardProps) => {
  const { title, imageUrl, rating, price, duration, distance, location } = tour;

  return (
    <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col">
      <div className="relative overflow-hidden aspect-[3/2]">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10" />
        <button
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center text-neutral-500 hover:text-primary hover:bg-white transition-all"
          aria-label="Add to favorites"
        >
          <i className="fa fa-heart text-sm" />
        </button>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-sm text-primary font-semibold mb-2">
          <i className="fa fa-star text-xs" /> {rating}
        </div>
        <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary transition-colors">
          <Link href="/tours">{title}</Link>
        </h3>
        <p className="text-neutral-500 text-sm mb-4">
          <span className="text-primary font-bold text-lg">${price}</span> / Per Person
        </p>
        <ul className="flex items-center gap-4 text-xs text-neutral-500 mt-auto pt-4 border-t border-neutral-100">
          <li className="flex items-center gap-1"><i className="fa fa-clock text-primary" /> {duration}</li>
          <li className="flex items-center gap-1"><i className="fa fa-road text-primary" /> {distance}</li>
          <li className="flex items-center gap-1"><i className="fa fa-map-marker-alt text-primary" /> {location}</li>
        </ul>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tour-card/index.tsx
git commit -m "feat: rewrite TourCard with Tailwind"
```

---

### Task 9: Rewrite DestinationCard

**Files:**
- Modify: `src/components/destination-card/index.tsx`

- [ ] **Step 1: Rewrite DestinationCard with Tailwind — no colClass prop**

Replace `src/components/destination-card/index.tsx`:

```tsx
import Link from 'next/link';
import type { DestinationCardProps } from '@/types';

export const DestinationCard = ({ destination }: DestinationCardProps) => {
  const { name, imageUrl, tours } = destination;

  return (
    <div className="group relative rounded-lg overflow-hidden aspect-square">
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h2 className="text-xl font-bold text-white mb-1">
          <Link href="/tours" className="hover:text-primary-light transition-colors">{name}</Link>
        </h2>
        <span className="inline-block bg-primary/90 text-white text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
          {tours} tours
        </span>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/destination-card/index.tsx
git commit -m "feat: rewrite DestinationCard with Tailwind, remove colClass coupling"
```

---

### Task 10: Rewrite GalleryItem

**Files:**
- Modify: `src/components/gallery-item/index.tsx`

- [ ] **Step 1: Rewrite GalleryItem with Tailwind**

Replace `src/components/gallery-item/index.tsx`:

```tsx
'use client';

import { useState } from 'react';
import type { GalleryItemProps } from '@/types';

export const GalleryItem = ({ imageSrc }: GalleryItemProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setLightboxOpen(true)}
        className="group relative block overflow-hidden rounded-lg aspect-square cursor-pointer"
      >
        <img
          src={imageSrc}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-neutral-900">
            <i className="fa fa-expand" />
          </span>
        </div>
      </button>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-6 right-6 text-white text-2xl hover:text-neutral-300 transition-colors"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            <i className="fa fa-times" />
          </button>
          <img
            src={imageSrc}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/gallery-item/index.tsx
git commit -m "feat: rewrite GalleryItem with Tailwind + built-in lightbox"
```

---

### Task 11: Rewrite TourCarousel

**Files:**
- Modify: `src/components/tour-carousel/index.tsx`
- Delete: `src/components/tour-carousel/TourCarousel.module.css`

- [ ] **Step 1: Rewrite TourCarousel — remove CSS Module, style with Tailwind**

Replace `src/components/tour-carousel/index.tsx`:

```tsx
'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';

import { TourCard } from '../tour-card';
import type { TourCarouselProps } from '@/types';

export const TourCarousel = ({ tours }: TourCarouselProps) => {
  return (
    <div className="relative [&_.swiper-button-prev]:text-primary [&_.swiper-button-prev]:after:text-lg [&_.swiper-button-next]:text-primary [&_.swiper-button-next]:after:text-lg">
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={24}
        slidesPerView={1}
        navigation
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        loop={true}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 20 },
          768: { slidesPerView: 2, spaceBetween: 24 },
          1024: { slidesPerView: 3, spaceBetween: 24 },
          1280: { slidesPerView: 4, spaceBetween: 24 },
        }}
      >
        {tours.map((tour) => (
          <SwiperSlide key={tour.id} className="h-auto pb-2">
            <TourCard tour={tour} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
```

- [ ] **Step 2: Delete CSS Module**

```bash
rm src/components/tour-carousel/TourCarousel.module.css
```

- [ ] **Step 3: Commit**

```bash
git add src/components/tour-carousel/index.tsx
git rm src/components/tour-carousel/TourCarousel.module.css
git commit -m "feat: rewrite TourCarousel with Tailwind, remove CSS Module"
```

---

### Task 12: Rewrite Home Page

**Files:**
- Modify: `src/pages/index.tsx`

- [ ] **Step 1: Rewrite index.tsx — full Tailwind, no vendor scripts, no page-wrapper**

Replace `src/pages/index.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { DestinationCard } from '@/components/destination-card';
import { TourCarousel } from '@/components/tour-carousel';
import { GalleryItem } from '@/components/gallery-item';
import { VideoModal } from '@/components/video-modal';

import { destinationsData, toursData } from '@/data';
import { getUrl } from '@/utils';

const galleryImages = [
  getUrl('assets/images/gallery/gallery-one-img-1.jpeg'),
  getUrl('assets/images/gallery/gallery-one-img-2.jpeg'),
  getUrl('assets/images/gallery/gallery-one-img-3.jpeg'),
  getUrl('assets/images/gallery/gallery-one-img-4.jpeg'),
  getUrl('assets/images/gallery/gallery-one-img-5.jpeg'),
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Home() {
  const bannerVideoRef = useRef<HTMLVideoElement>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  useEffect(() => {
    if (bannerVideoRef.current) {
      bannerVideoRef.current.playbackRate = 0.8;
    }
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          ref={bannerVideoRef}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={getUrl('assets/videos/banner-0.MOV')} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-overlay" />
        <div className="relative z-10 text-center text-white px-4">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4">
            Travel & Adventures
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl font-light opacity-90">
            Your Next Adventure Starts Here
          </p>
        </div>
      </section>

      {/* Destinations */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Destination lists
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mt-2">Go Exotic Places</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            {destinationsData.map((destination, i) => (
              <motion.div
                key={destination.id}
                className={destination.size === 'large' ? 'lg:col-span-6' : 'lg:col-span-3'}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ ...fadeInUp, visible: { ...fadeInUp.visible, transition: { duration: 0.6, delay: i * 0.1 } } }}
              >
                <DestinationCard destination={destination} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 lg:py-24 bg-neutral-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
            <motion.div
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="rounded-lg overflow-hidden aspect-[4/3]">
                <img
                  src="https://i0.wp.com/jolandblog.com/wp-content/uploads/2015/11/ninh-binh-vietname.jpg?fit=1000%2C667&ssl=1"
                  alt="Vietnam landscape"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-6 left-6 bg-white rounded-lg p-4 shadow-lg flex items-center gap-3">
                <span className="icon-phone-call text-2xl text-primary" />
                <div>
                  <p className="text-xs text-neutral-500">Book Tour Now</p>
                  <a href="tel:+84-935-797-550" className="font-bold text-neutral-900 hover:text-primary transition-colors">
                    +84 935 797 550
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Get to know us
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold mt-2 mb-6">Plan Your Trip with Us</h2>
              <p className="text-neutral-500 mb-6">
                We are leading day tour and multi-day tour on organizer in Nha Trang, Vietnam
              </p>
              <ul className="space-y-4 mb-8">
                {['Motorbike and car tour', 'Friendly team and expert local guide', 'Experience in truly remarkable land'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <i className="fa fa-check text-primary text-xs" />
                    </span>
                    <span className="text-neutral-700">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="inline-block bg-primary hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider px-8 py-3 rounded-lg transition-colors"
              >
                Book with us now
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Popular Tours */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Featured tours
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mt-2">Most Popular Tours</h2>
          </motion.div>
          <TourCarousel tours={toursData} />
        </div>
      </section>

      {/* Video / CTA */}
      <section className="relative py-24 lg:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${getUrl('assets/images/backgrounds/video-one-bg-0.jpeg')})` }}
        />
        <div className="absolute inset-0 bg-overlay" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <button
                onClick={() => setVideoModalOpen(true)}
                className="mb-6 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-light transition-colors animate-pulse"
                aria-label="Play video"
              >
                <i className="fa fa-play ml-1" />
              </button>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary-light mb-2">
                Are you ready to travel?
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                We are leading day tour and multi-day tour on organizer in Nha Trang
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: 'icon-travel-map', label: 'Wildlife\nTours' },
                { icon: 'icon-place', label: 'Bike\nTours' },
                { icon: 'icon-flag', label: 'Adventure\nTours' },
                { icon: 'icon-clock', label: 'Full day\nTours' },
              ].map((item) => (
                <div
                  key={item.icon}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center text-white hover:bg-white/20 transition-colors"
                >
                  <span className={`${item.icon} text-3xl text-primary-light block mb-3`} />
                  <h4 className="text-sm font-semibold whitespace-pre-line">{item.label}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <VideoModal
        videoUrl="https://www.youtube.com/watch?v=fXvp76BQ2Fk"
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
      />

      {/* Gallery */}
      <section className="py-16 lg:py-24 bg-neutral-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {galleryImages.map((imageSrc, index) => (
              <GalleryItem key={index} imageSrc={imageSrc} delay={(index + 1) * 100} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat: rewrite Home page with Tailwind + framer-motion, remove all vendor scripts"
```

---

### Task 13: Rewrite Tours Page

**Files:**
- Modify: `src/pages/tours.tsx`

- [ ] **Step 1: Rewrite tours.tsx**

Replace `src/pages/tours.tsx`:

```tsx
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/page-header';
import { TourCard } from '@/components/tour-card';
import { toursData } from '@/data';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Tours() {
  return (
    <>
      <PageHeader
        title="Popular Tours"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Tours' },
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
                variants={{ ...fadeInUp, visible: { ...fadeInUp.visible, transition: { duration: 0.6, delay: i * 0.1 } } }}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tours.tsx
git commit -m "feat: rewrite Tours page with Tailwind + PageHeader"
```

---

### Task 14: Rewrite Contact Page

**Files:**
- Modify: `src/pages/contact.tsx`

- [ ] **Step 1: Rewrite contact.tsx**

Replace `src/pages/contact.tsx`:

```tsx
import { PageHeader } from '@/components/page-header';
import { contactInfo } from '@/utils';

export default function Contact() {
  return (
    <>
      <PageHeader
        title="Contact"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Contact' },
        ]}
        backgroundImage="https://media.gadventures.com/media-server/cache/59/d0/59d0b4d7c98928e2b9bf2e208409d5d6.jpg"
      />

      {/* Contact form */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Talk with our team
              </span>
              <h2 className="text-3xl font-bold mt-2 mb-6">
                Any Question? Feel Free to Contact
              </h2>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-neutral-100 hover:bg-primary hover:text-white rounded-full flex items-center justify-center text-neutral-500 transition-all">
                  <i className="fab fa-facebook" />
                </a>
                <a href="#" className="w-10 h-10 bg-neutral-100 hover:bg-primary hover:text-white rounded-full flex items-center justify-center text-neutral-500 transition-all">
                  <i className="fab fa-twitter" />
                </a>
                <a href="#" className="w-10 h-10 bg-neutral-100 hover:bg-primary hover:text-white rounded-full flex items-center justify-center text-neutral-500 transition-all">
                  <i className="fab fa-instagram" />
                </a>
              </div>
            </div>
            <div className="lg:col-span-8">
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full bg-neutral-100 border-0 rounded-lg px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    className="w-full bg-neutral-100 border-0 rounded-lg px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <textarea
                  placeholder="Write your message"
                  rows={6}
                  className="w-full bg-neutral-100 border-0 rounded-lg px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-lg transition-colors"
                >
                  Send a message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Information cards */}
      <section className="py-16 bg-neutral-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: 'icon-place', lines: [contactInfo.address, `${contactInfo.city}, Vietnam`] },
              { icon: 'icon-phone-call', lines: [contactInfo.phone] },
              { icon: 'icon-at', lines: [contactInfo.email] },
            ].map((info, i) => (
              <div key={i} className="bg-white rounded-lg p-8 text-center shadow-sm">
                <span className={`${info.icon} text-4xl text-primary block mb-4`} />
                {info.lines.map((line, j) => (
                  <p key={j} className="text-neutral-700 text-sm">{line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map */}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/contact.tsx
git commit -m "feat: rewrite Contact page with Tailwind"
```

---

### Task 15: Rewrite About Us Page

**Files:**
- Modify: `src/pages/about-us.tsx`

- [ ] **Step 1: Rewrite about-us.tsx**

Replace `src/pages/about-us.tsx`:

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/page-header';
import { VideoModal } from '@/components/video-modal';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function AboutUs() {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="About"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Pages' },
          { label: 'About' },
        ]}
        backgroundImage="https://vietnamamazingtours.com/uploads/Northern-Vietnam-Tours.jpeg"
      />

      {/* About section */}
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
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Learn about us</span>
              <h2 className="text-3xl lg:text-4xl font-bold mt-2 mb-4">Dare to Explore with Us</h2>
              <p className="text-primary font-semibold mb-4">A Simply Perfect Place to Get Lost</p>
              <p className="text-neutral-500 mb-8">
                We are trusted by our clients and have a reputation for the best services in the field.
                Our team is highly skilled in crafting and leading motorcycle tours. With over 10 years
                of varied riding experience, we know these roads inside and out.
              </p>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <h4 className="text-sm font-bold text-neutral-900">Best Services</h4>
                    <span className="text-sm font-bold text-primary">77%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '77%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <h4 className="text-sm font-bold text-neutral-900">Tour Agents</h4>
                    <span className="text-sm font-bold text-primary">38%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '38%' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-primary py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-white text-center lg:text-left">
            <p className="text-sm opacity-80 mb-1">Plan your trip with us</p>
            <h2 className="text-2xl lg:text-3xl font-bold">Ready for an unforgettable tour?</h2>
          </div>
          <a
            href="/contact"
            className="bg-white text-primary hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-lg transition-colors flex-shrink-0"
          >
            Book tour now
          </a>
        </div>
      </section>

      {/* Video section */}
      <section className="relative py-24 lg:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: 'url(assets/images/backgrounds/video-one-two-bg.jpg)' }}
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
            Are you ready to travel?
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold max-w-2xl mx-auto leading-tight">
            Vietnam Motorcycle Tour — A World Leading Adventure Platform
          </h2>
        </div>
      </section>
      <VideoModal
        videoUrl="https://www.youtube.com/watch?v=Get7rqXYrbQ"
        isOpen={videoOpen}
        onClose={() => setVideoOpen(false)}
      />

      {/* Stats */}
      <section className="bg-secondary py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: '870+', label: 'Total Tours' },
              { value: '480+', label: 'Happy Riders' },
              { value: '930+', label: 'Happy People' },
              { value: '15+', label: 'Years Experience' },
            ].map((stat) => (
              <div key={stat.label}>
                <h3 className="text-3xl lg:text-4xl font-bold mb-1">{stat.value}</h3>
                <p className="text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/about-us.tsx
git commit -m "feat: rewrite About Us page with Tailwind"
```

---

### Task 16: Rewrite Rental Page

**Files:**
- Modify: `src/pages/rental.tsx`

- [ ] **Step 1: Rewrite rental.tsx**

Replace `src/pages/rental.tsx`:

```tsx
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/page-header';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const rentalItems = [
  { title: 'Honda Winner X', price: 25, image: 'assets/images/resources/popular-tours-two__img-1.jpg', rating: '8.0 Superb', category: 'Motorbike' },
  { title: 'Honda XR 150', price: 30, image: 'assets/images/resources/popular-tours-two__img-2.jpg', rating: '8.5 Superb', category: 'Motorbike' },
  { title: 'Yamaha Exciter', price: 20, image: 'assets/images/resources/popular-tours-two__img-3.jpg', rating: '8.0 Superb', category: 'Motorbike' },
  { title: 'Honda CB500X', price: 55, image: 'assets/images/resources/popular-tours-two__img-4.jpg', rating: '9.0 Superb', category: 'Motorbike' },
  { title: 'Toyota Vios', price: 45, image: 'assets/images/resources/popular-tours-two__img-5.jpg', rating: '8.0 Superb', category: 'Car' },
  { title: 'Ford Ranger', price: 65, image: 'assets/images/resources/popular-tours-two__img-6.jpg', rating: '8.2 Superb', category: 'Car' },
];

export default function Rental() {
  return (
    <>
      <PageHeader
        title="Rental"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Rental' },
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
                variants={{ ...fadeInUp, visible: { ...fadeInUp.visible, transition: { duration: 0.6, delay: i * 0.1 } } }}
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
                    <span className="text-primary font-bold text-lg">${item.price}</span> / Per Day
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
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/rental.tsx
git commit -m "feat: rewrite Rental page with Tailwind"
```

---

### Task 17: Delete Vendor Files

**Files:**
- Delete: multiple directories and files under `public/assets/`

- [ ] **Step 1: Delete vendor directories (keep fontawesome and tevily-icons)**

```bash
cd /Users/wentris/Documents/typescript/vietnam.moto.tour

rm -rf public/assets/vendors/bootstrap
rm -rf public/assets/vendors/animate
rm -rf public/assets/vendors/jarallax
rm -rf public/assets/vendors/jquery
rm -rf public/assets/vendors/jquery-ajaxchimp
rm -rf public/assets/vendors/jquery-appear
rm -rf public/assets/vendors/jquery-circle-progress
rm -rf public/assets/vendors/jquery-magnific-popup
rm -rf public/assets/vendors/jquery-ui
rm -rf public/assets/vendors/jquery-validate
rm -rf public/assets/vendors/nouislider
rm -rf public/assets/vendors/odometer
rm -rf public/assets/vendors/owl-carousel
rm -rf public/assets/vendors/tiny-slider
rm -rf public/assets/vendors/twentytwenty
rm -rf public/assets/vendors/bxslider
rm -rf public/assets/vendors/bootstrap-select
rm -rf public/assets/vendors/vegas
rm -rf public/assets/vendors/countdown
rm -rf public/assets/vendors/wnumb
rm -rf public/assets/vendors/wow
rm -rf public/assets/vendors/isotope
rm -rf public/assets/vendors/swiper
rm -rf public/assets/vendors/timepicker
rm -rf public/assets/vendors/reey-font/specimen_files
```

- [ ] **Step 2: Delete template CSS and JS**

```bash
rm public/assets/css/tevily.css
rm public/assets/css/tevily-responsive.css
rm public/assets/js/tevily.js
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete all vendor CSS/JS — Bootstrap, jQuery, Tevily template files"
```

---

### Task 18: Build Verification & Fix

**Files:**
- Potentially any file from previous tasks

- [ ] **Step 1: Run type check and build**

```bash
pnpm build
```

Expected: Build succeeds. If there are type errors or build errors, fix them.

- [ ] **Step 2: Run linter**

```bash
pnpm lint
```

Expected: No new lint errors. Fix any that appear.

- [ ] **Step 3: Start dev server and visually verify**

```bash
pnpm dev
```

Open `http://localhost:3000` and verify:
- Home page loads with video hero, destinations grid, about section, tour carousel, video CTA, gallery
- All pages navigate correctly
- Mobile nav opens/closes
- Sticky header works
- Scroll-to-top button appears
- No horizontal overflow — test by checking `document.documentElement.scrollWidth <= window.innerWidth` in browser console
- Elastic scroll works on macOS (pull past top/bottom of page)

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build errors from migration"
```
