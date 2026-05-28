# Home Page — Apex Tactical Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/` (home) to match the Stitch "Apex Cinematic Tactical" mockups, keeping all dynamic data flow and Framer-Motion entrance animations.

**Architecture:** Hybrid visual reskin. Gut visual layer of `src/pages/index.tsx`, keep `getServerSideProps` and prop wiring. Reskin shared components (`TourCarousel`, `DestinationCard`, `GalleryItem`, `VideoModal`) in-place to Apex tokens. Add `StatsStrip` (new). All-caps Hanken Grotesk for headlines; JetBrains Mono for labels/data; `#131313` page bg; `#ffdb00` hazard mustard CTA; 1px `#989177` borders; zero radius.

**Tech Stack:** Next.js 16 Pages Router, React 19, TypeScript strict, Tailwind 4, Framer-Motion 12, next-intl 4, Prisma + Postgres for translations, Playwright MCP for verification.

**Spec:** `docs/superpowers/specs/2026-05-28-home-apex-redesign-design.md`

---

## File Structure

| File                                                       | Action                                          |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `src/pages/index.tsx`                                      | Modify — gut visual layer, keep SSR + data flow |
| `src/components/home/StatsStrip/index.ts`                  | Create                                          |
| `src/components/home/StatsStrip/StatsStrip.tsx`            | Create                                          |
| `src/components/home/StatsStrip/StatsStrip.spec.tsx`       | Create                                          |
| `src/components/home/TourCarousel/TourCarousel.tsx`        | Modify — Apex reskin                            |
| `src/components/home/TourCarousel/TourCarousel.module.css` | Modify — Apex tokens                            |
| `src/components/home/GalleryItem/GalleryItem.tsx`          | Modify — Apex reskin                            |
| `src/components/DestinationCard/DestinationCard.tsx`       | Modify — Apex reskin                            |
| `src/components/VideoModal.tsx`                            | Modify — restyle frame                          |
| `prisma/seed-home-translations.ts`                         | Create — DB translation seed                    |
| `.design-snapshots/stitch/home-desktop-apex.png`           | Create (one-time via Playwright MCP)            |
| `.design-snapshots/stitch/home-mobile-apex.png`            | Create (one-time via Playwright MCP)            |

Branch: `feat/home-apex-redesign` off `main`.

---

## Task 0: Branch + Stitch reference pull

**Files:**

- Create: `.design-snapshots/stitch/home-desktop-apex.png`
- Create: `.design-snapshots/stitch/home-mobile-apex.png`

- [ ] **Step 1: Create branch**

```bash
git checkout -b feat/home-apex-redesign
```

- [ ] **Step 2: Pull Stitch mockup screenshots via Playwright MCP**

Use `mcp__stitch__get_screen` to fetch the screenshot `downloadUrl` for both screens. Project: `4683768170577706110`. Screens: `8fd0909540c5434caab81f5ebb029abc` (desktop), `ec40dbc5b8284cdf870b6ae05a1b2c69` (mobile).

For each, `mcp__playwright__browser_navigate` to the `downloadUrl`, then `mcp__playwright__browser_take_screenshot` saved to the respective path under `.design-snapshots/stitch/`. The PNGs are gitignored; they're local reference only.

- [ ] **Step 3: Confirm mockups present**

```bash
ls -lh .design-snapshots/stitch/
```

Expected: `home-desktop-apex.png` and `home-mobile-apex.png` both present, non-zero bytes.

- [ ] **Step 4: Start dev server in background**

```bash
pnpm dev
```

Confirm `http://localhost:3000` returns 200.

---

## Task 1: Hero — Apex overlay + tokens

**Files:**

- Modify: `src/pages/index.tsx:88-146`

- [ ] **Step 1: Replace hero section JSX**

Replace the `{/* Hero */}` block (lines ~88-146) with:

```tsx
{
  /* Hero */
}
<section className="relative h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem-36px)] min-h-[600px] flex items-center overflow-hidden bg-[#131313]">
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
  <div className="absolute inset-0 bg-[#131313]/65" />

  {/* Corner crosshair marks */}
  <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
    <div className="absolute top-6 left-6 w-6 h-6 border-t border-l border-[#ffdb00]" />
    <div className="absolute top-6 right-6 w-6 h-6 border-t border-r border-[#ffdb00]" />
    <div className="absolute bottom-6 left-6 w-6 h-6 border-b border-l border-[#ffdb00]" />
    <div className="absolute bottom-6 right-6 w-6 h-6 border-b border-r border-[#ffdb00]" />
  </div>

  <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
    <div className="max-w-2xl">
      <motion.p
        variants={slideFromLeft}
        initial="hidden"
        animate="visible"
        className="font-mono text-xs uppercase tracking-[0.05em] text-[#ffdb00] mb-6"
      >
        {t('heroTimestamp')}
      </motion.p>
      <motion.h1
        variants={clipReveal}
        initial="hidden"
        animate="visible"
        className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight leading-[1.05] text-[#e5e2e1] mb-8"
      >
        {t('heroTitle')}
      </motion.h1>
      <motion.p
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="text-base lg:text-lg text-[#cfc6ab] mb-10 max-w-xl leading-relaxed"
      >
        {t('heroSubtitle')}
      </motion.p>
      <motion.div
        variants={riseWithOvershoot}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap gap-3"
      >
        <Link
          href={routes.tours.list.path()}
          className="inline-flex items-center gap-2 bg-[#ffdb00] hover:bg-[#e6c500] text-[#393000] font-mono text-xs font-medium uppercase tracking-[0.05em] px-6 py-3 cursor-pointer transition-colors"
        >
          {t('bookWithUsNow')}
          <i className="fa fa-arrow-right" />
        </Link>
        <Link
          href={routes.tours.list.path()}
          className="inline-flex items-center gap-2 border border-[#989177] hover:border-[#ffdb00] text-[#e5e2e1] hover:text-[#ffdb00] font-mono text-xs font-medium uppercase tracking-[0.05em] px-6 py-3 cursor-pointer transition-colors"
        >
          {t('viewFleet')}
        </Link>
      </motion.div>
    </div>
  </div>
</section>;
```

Remove the now-unused `useCursorSpotlight` import, the `useMotionTemplate` import, the `spotlightRef`/`spotlightX`/`spotlightY`/`onSpotlightMove`/`onSpotlightLeave`/`spotlightBg` block (lines 52-59), and `texture-grain-warm` class from this section. Keep `useTranslations`, `useRef`, `useState`, `useEffect`, `motion`, and the Framer variants imports — still used by other sections.

- [ ] **Step 2: Capture rendered hero via Playwright MCP**

`mcp__playwright__browser_navigate http://localhost:3000`, set viewport to 1440×900, `mcp__playwright__browser_take_screenshot` clipped to hero (`{x:0,y:0,width:1440,height:864}`). Save reference for diff.

- [ ] **Step 3: Side-by-side diff vs Stitch mockup**

Read both PNGs. Check: type scale, mustard CTA color exact `#ffdb00`, corner crosshairs visible, no rounded corners, no gradient bleed, video legibility under 65% black scrim.

If diff exists, adjust Tailwind utilities (font sizes, spacing, scrim opacity) and re-screenshot.

- [ ] **Step 4: Mobile viewport check**

Resize to 390×844 via Playwright, screenshot hero, diff against mobile mockup. Adjust responsive breakpoints if hero text overflows.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat(home): rebuild hero with Apex Tactical overlay"
```

---

## Task 2: StatsStrip component

**Files:**

- Create: `src/components/home/StatsStrip/index.ts`
- Create: `src/components/home/StatsStrip/StatsStrip.tsx`
- Test: `src/components/home/StatsStrip/StatsStrip.spec.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// StatsStrip.spec.tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {StatsStrip} from './StatsStrip';

const messages = {
  home: {
    stats: {
      years: {label: 'YEARS', value: '12'},
      routes: {label: 'ROUTES', value: '47'},
      km: {label: 'KM RIDDEN', value: '1.2M'},
      riders: {label: 'RIDERS', value: '4500+'},
    },
  },
};

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <StatsStrip />
    </NextIntlClientProvider>,
  );
}

describe('StatsStrip', () => {
  it('renders all four stat values', () => {
    renderWithIntl();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
    expect(screen.getByText('1.2M')).toBeInTheDocument();
    expect(screen.getByText('4500+')).toBeInTheDocument();
  });

  it('renders all four stat labels', () => {
    renderWithIntl();
    expect(screen.getByText('YEARS')).toBeInTheDocument();
    expect(screen.getByText('ROUTES')).toBeInTheDocument();
    expect(screen.getByText('KM RIDDEN')).toBeInTheDocument();
    expect(screen.getByText('RIDERS')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm test -- StatsStrip.spec --watchAll=false
```

Expected: FAIL with module-not-found for `./StatsStrip`.

- [ ] **Step 3: Implement StatsStrip**

```tsx
// StatsStrip.tsx
import {useTranslations} from 'next-intl';

const STAT_KEYS = ['years', 'routes', 'km', 'riders'] as const;

export function StatsStrip() {
  const t = useTranslations('home.stats');

  return (
    <section
      aria-label="Headline statistics"
      className="border-y border-[#989177] bg-[#1c1b1b]"
    >
      <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 divide-x divide-[#4c4732]">
        {STAT_KEYS.map((key) => (
          <div key={key} className="px-6 py-8 flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.05em] text-[#cfc6ab]">
              {t(`${key}.label`)}
            </span>
            <span className="font-mono text-3xl lg:text-4xl text-[#ffdb00] tabular-nums">
              {t(`${key}.value`)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

```ts
// index.ts
export {StatsStrip} from './StatsStrip';
```

- [ ] **Step 4: Run test, verify it passes**

```bash
pnpm test -- StatsStrip.spec --watchAll=false
```

Expected: PASS, 2/2.

- [ ] **Step 5: Mount StatsStrip in page**

In `src/pages/index.tsx`, add import:

```tsx
import {StatsStrip} from '@/components/home/StatsStrip';
```

Insert `<StatsStrip />` immediately after the `{/* Hero */}` `</section>` close (between hero and destinations).

- [ ] **Step 6: Screenshot check via Playwright MCP**

Navigate, scroll to stats section, screenshot, diff vs mockup stats band.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/StatsStrip src/pages/index.tsx
git commit -m "feat(home): add StatsStrip tactical stats band"
```

---

## Task 3: Destinations section restyle

**Files:**

- Modify: `src/pages/index.tsx` — destinations section (~lines 148-233)

- [ ] **Step 1: Replace destinations section JSX**

Replace the `{/* Destinations */}` block with:

```tsx
{
  /* Destinations */
}
<section className="bg-[#131313] py-20 lg:py-28">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-12 border-l-2 border-[#ffdb00] pl-4">
      <motion.span
        className="font-mono text-xs uppercase tracking-[0.05em] text-[#cfc6ab] block"
        variants={slideFromLeft}
        initial="hidden"
        whileInView="visible"
        viewport={{once: true}}
      >
        {t('destinationLists')}
      </motion.span>
      <motion.h2
        className="font-display text-2xl lg:text-4xl font-bold uppercase tracking-[0.05em] text-[#e5e2e1] mt-2"
        variants={clipReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{once: true}}
      >
        {t('goExoticPlaces')}
      </motion.h2>
    </div>

    {(() => {
      const usedSlots = destinations.reduce(
        (sum, d) => sum + (d.size === 'large' ? 4 : 1),
        0,
      );
      const minSlots = 8;
      const slotsToFill = Math.max(0, minSlots - usedSlots);
      const placeholders = Array.from({length: slotsToFill});
      return (
        <div className="grid grid-flow-dense grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#4c4732] border border-[#4c4732]">
          {destinations.map((destination, i) => {
            const isLarge = destination.size === 'large';
            return (
              <motion.div
                key={destination.id}
                className={`bg-[#1c1b1b] ${isLarge ? 'sm:col-span-2 sm:row-span-2' : ''}`}
                custom={i}
                variants={waveStagger(0.08)}
                initial="hidden"
                whileInView="visible"
                viewport={{once: true}}
              >
                <DestinationCard
                  destination={destination}
                  className={isLarge ? 'h-full' : undefined}
                />
              </motion.div>
            );
          })}
          {placeholders.map((_, i) => (
            <motion.div
              key={`placeholder-${i}`}
              className="bg-[#1c1b1b]"
              initial="hidden"
              whileInView="visible"
              viewport={{once: true}}
              variants={{
                ...fadeInUp,
                visible: {
                  ...fadeInUp.visible,
                  transition: {
                    duration: 0.6,
                    delay: (destinations.length + i) * 0.1,
                  },
                },
              }}
            >
              <div className="relative aspect-[3/2] flex flex-col items-center justify-center text-[#4c4732] h-full">
                <i className="fa fa-motorcycle text-3xl opacity-40 mb-2" />
                <span className="font-mono text-xs uppercase tracking-[0.05em] opacity-60">
                  {t('comingSoon')}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      );
    })()}
  </div>
</section>;
```

Drop the `<div className="absolute bottom-0 ...border-pattern.svg...">` decorator at the section bottom — not part of Apex.

- [ ] **Step 2: Screenshot diff**

Playwright MCP scroll to destinations, screenshot, compare to Stitch mockup destinations band. Check: 1px hairline grid (gap-px on `#4c4732` bg), no card shadow, sharp corners on cards.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.tsx
git commit -m "refactor(home): apex destinations grid with hairline borders"
```

---

## Task 4: DestinationCard reskin

**Files:**

- Modify: `src/components/DestinationCard/DestinationCard.tsx`

- [ ] **Step 1: Replace component body**

Replace the JSX in `DestinationCard.tsx` (keeping the chips logic intact) with:

```tsx
return (
  <motion.div
    whileHover={{scale: 1.01}}
    transition={{duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94]}}
    className={className ?? 'aspect-[3/2]'}
  >
    <Link
      href={routes.destinations.detail.path({slug})}
      data-testid="destination-card"
      className="group relative overflow-hidden block cursor-pointer w-full h-full"
    >
      <Image
        src={imageUrl}
        alt={displayName}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        unoptimized
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e]/90 via-[#0e0e0e]/40 to-transparent" />
      <div className="absolute top-3 left-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-[#ffdb00] bg-[#0e0e0e]/80 px-2 py-1 border border-[#989177]">
          {displayName.slice(0, 3).toUpperCase()}-
          {String(carOnlyCount + bikeOnlyCount + bikeAndCarCount).padStart(
            2,
            '0',
          )}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-[#4c4732]/50">
        <h2 className="font-display text-lg lg:text-xl font-bold uppercase tracking-[0.05em] text-[#e5e2e1] mb-2 group-hover:text-[#ffdb00] transition-colors">
          {displayName}
        </h2>
        <div className="flex items-center flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 h-6 px-2 font-mono text-[10px] uppercase tracking-[0.05em] bg-[#0e0e0e]/80 border border-[#4c4732] text-[#cfc6ab]"
              aria-label={chip.ariaLabel}
            >
              {chip.icon}
              <span className="leading-none tabular-nums">
                {chip.count} {t('tours', {count: chip.count})}
              </span>
            </span>
          ))}
        </div>
      </div>
    </Link>
  </motion.div>
);
```

Strip the `colorClass` field from each chip (no longer used). Update the `chips` array entries to drop `colorClass`.

- [ ] **Step 2: Run existing card test**

```bash
pnpm test -- DestinationCard.spec --watchAll=false
```

Expected: PASS (tests assert text/links, not styling).

- [ ] **Step 3: Visual diff via Playwright MCP**

Navigate to `/destinations`, screenshot one card, diff vs Stitch destination-card mockup.

- [ ] **Step 4: Commit**

```bash
git add src/components/DestinationCard
git commit -m "refactor(destination-card): apex tactical reskin"
```

---

## Task 5: About section restyle

**Files:**

- Modify: `src/pages/index.tsx` — about section (~lines 235-310)

- [ ] **Step 1: Replace about section JSX**

Replace the `{/* About */}` block with:

```tsx
{
  /* About */
}
<section className="bg-[#0e0e0e] py-20 lg:py-28 border-y border-[#989177]">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-px bg-[#4c4732] border border-[#4c4732]">
      <motion.div
        className="relative bg-[#1c1b1b]"
        initial="hidden"
        whileInView="visible"
        viewport={{once: true}}
        variants={fadeInUp}
      >
        <div className="relative aspect-[4/3]">
          <Image
            src="https://i0.wp.com/jolandblog.com/wp-content/uploads/2015/11/ninh-binh-vietname.jpg?fit=1000%2C667&ssl=1"
            alt="Vietnam landscape"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            unoptimized
            className="object-cover"
          />
        </div>
        <div className="absolute bottom-4 left-4 bg-[#0e0e0e] border border-[#989177] p-4 flex items-center gap-3">
          <i className="fa fa-phone text-[#ffdb00] text-xl" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.05em] text-[#cfc6ab]">
              {tc('bookTourNow')}
            </p>
            <a
              href={`tel:${contactInfo.phone}`}
              className="font-mono text-base text-[#e5e2e1] hover:text-[#ffdb00] transition-colors cursor-pointer"
            >
              {contactInfo.phone}
            </a>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="bg-[#131313] p-10 lg:p-14"
        initial="hidden"
        whileInView="visible"
        viewport={{once: true}}
        variants={fadeInUp}
      >
        <span className="font-mono text-xs uppercase tracking-[0.05em] text-[#ffdb00]">
          {t('getToKnowUs')}
        </span>
        <h2 className="font-display text-2xl lg:text-4xl font-bold uppercase tracking-[0.05em] text-[#e5e2e1] mt-2 mb-6">
          {tc('planYourTrip')}
        </h2>
        <p className="text-base text-[#cfc6ab] mb-6 leading-relaxed">
          {t('aboutDescription')}
        </p>
        <ul className="space-y-3 mb-8 border-y border-[#4c4732] divide-y divide-[#4c4732]">
          {[
            t('bulletMotorbike'),
            t('bulletFriendly'),
            t('bulletExperience'),
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 py-3">
              <span className="flex-shrink-0 w-2 h-2 bg-[#ffdb00]" />
              <span className="text-[#e5e2e1]">{item}</span>
            </li>
          ))}
        </ul>
        <Link
          href={routes.tours.list.path()}
          className="inline-flex items-center gap-2 bg-[#ffdb00] hover:bg-[#e6c500] text-[#393000] font-mono text-xs font-medium uppercase tracking-[0.05em] px-6 py-3 cursor-pointer transition-colors"
        >
          {t('bookWithUsNow')}
          <i className="fa fa-arrow-right" />
        </Link>
      </motion.div>
    </div>
  </div>
</section>;
```

- [ ] **Step 2: Screenshot diff**

Playwright MCP, scroll to about section, diff vs mockup.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.tsx
git commit -m "refactor(home): apex about section with hairline panels"
```

---

## Task 6: Popular Tours section + tactical chip filter row

**Files:**

- Modify: `src/pages/index.tsx` — popular tours section (~lines 312-328)

- [ ] **Step 1: Replace popular tours section JSX**

Replace the `{/* Popular Tours */}` block with:

```tsx
{
  /* Popular Tours */
}
<section className="bg-[#131313] py-20 lg:py-28">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <motion.div
      className="mb-8 border-l-2 border-[#ffdb00] pl-4"
      initial="hidden"
      whileInView="visible"
      viewport={{once: true}}
      variants={fadeInUp}
    >
      <span className="font-mono text-xs uppercase tracking-[0.05em] text-[#cfc6ab] block">
        {t('toursEyebrow')}
      </span>
      <h2 className="font-display text-2xl lg:text-4xl font-bold uppercase tracking-[0.05em] text-[#e5e2e1] mt-2">
        {t('mostPopularTours')}
      </h2>
    </motion.div>

    {/* Tactical chip filter row — visual only */}
    <div
      role="list"
      aria-label={t('toursFilterLabel')}
      className="mb-8 flex flex-wrap gap-px bg-[#4c4732] border border-[#4c4732]"
    >
      {[
        t('tours.filterAll'),
        t('tours.filterMountain'),
        t('tours.filterCoastal'),
        t('tours.filterNorth'),
        t('tours.filterSouth'),
      ].map((label, idx) => (
        <span
          key={label}
          role="listitem"
          className={`font-mono text-xs uppercase tracking-[0.05em] px-4 py-2 bg-[#131313] ${
            idx === 0 ? 'text-[#ffdb00] bg-[#1c1b1b]' : 'text-[#cfc6ab]'
          }`}
        >
          {label}
        </span>
      ))}
    </div>

    <TourCarousel tours={tours} />
  </div>
</section>;
```

- [ ] **Step 2: Screenshot diff**

Playwright, scroll to tours, screenshot, diff. Chip row must use hairline separators; first chip highlighted with hazard mustard.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat(home): apex tours section with tactical chip filter row"
```

---

## Task 7: TourCarousel reskin

**Files:**

- Modify: `src/components/home/TourCarousel/TourCarousel.tsx`
- Modify: `src/components/home/TourCarousel/TourCarousel.module.css`

- [ ] **Step 1: Read current component**

```bash
cat src/components/home/TourCarousel/TourCarousel.tsx
cat src/components/home/TourCarousel/TourCarousel.module.css
```

Note current class names, Swiper config, and tour-card JSX so the reskin preserves slide structure + nav arrows.

- [ ] **Step 2: Apply Apex reskin**

For each tour card slide, replace card container classes with:

```tsx
// container
className =
  'group relative bg-[#1c1b1b] border border-[#989177] flex flex-col h-full overflow-hidden';

// image wrapper (keep aspect ratio if present)
className = 'relative aspect-[4/3] overflow-hidden border-b border-[#4c4732]';

// price/duration tag overlay (top-right of image)
className =
  'absolute top-3 right-3 font-mono text-xs uppercase tracking-[0.05em] text-[#ffdb00] bg-[#0e0e0e]/85 border border-[#989177] px-2 py-1';

// body padding
className = 'p-5 flex flex-col flex-1';

// title
className =
  'font-display text-base lg:text-lg font-bold uppercase tracking-[0.05em] text-[#e5e2e1] mb-2 group-hover:text-[#ffdb00] transition-colors';

// excerpt
className = 'text-sm text-[#cfc6ab] mb-4 line-clamp-2';

// cta button
className =
  'mt-auto inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.05em] text-[#ffdb00] border-t border-[#4c4732] pt-3';
```

Remove any `rounded-*`, `shadow-*`, `bg-white`, `text-on-surface-secondary` classes — replace with the Apex equivalents above.

- [ ] **Step 3: Update CSS module**

In `TourCarousel.module.css`, replace nav arrow colors with `#ffdb00`, replace pagination dot styling with 8×2px hazard-mustard rectangles (no rounded), set Swiper container bg to transparent. Exact updates depend on current module contents — keep selectors, swap colors and shapes.

- [ ] **Step 4: Visual diff**

Playwright MCP, screenshot tours carousel section, diff vs mockup. Cards: sharp corners, 1px mustard-warm border, mono tags.

- [ ] **Step 5: Regression on `/tours` page**

`mcp__playwright__browser_navigate http://localhost:3000/tours`, screenshot, confirm no broken layout (cards now Apex, page header still light — expected; that page is next on Apex roadmap, log issue but do not fix here).

- [ ] **Step 6: Commit**

```bash
git add src/components/home/TourCarousel
git commit -m "refactor(tour-carousel): apex tactical card reskin"
```

---

## Task 8: Video / CTA section restyle

**Files:**

- Modify: `src/pages/index.tsx` — video/CTA section (~lines 330-402)

- [ ] **Step 1: Replace video section JSX**

Replace the `{/* Video / CTA */}` block with:

```tsx
{
  /* Video / CTA */
}
<section className="relative bg-[#0e0e0e] py-24 lg:py-32 border-y border-[#989177]">
  <div
    className="absolute inset-0 bg-cover bg-center bg-fixed opacity-25"
    style={{
      backgroundImage: `url(${getUrl('assets/images/backgrounds/video-one-bg-0.jpeg')})`,
    }}
  />
  <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0e] via-[#0e0e0e]/80 to-transparent" />
  <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="lg:flex lg:gap-12 lg:items-center">
      <div className="lg:w-3/5 mb-10 lg:mb-0">
        <span className="font-mono text-xs uppercase tracking-[0.05em] text-[#ffdb00] block mb-4">
          {t('videoEyebrow')}
        </span>
        <h2 className="font-display text-3xl lg:text-5xl font-bold uppercase tracking-[0.05em] text-[#e5e2e1] mb-8 max-w-2xl leading-tight">
          {t('videoSectionHeading')}
        </h2>
        <button
          onClick={() => setVideoModalOpen(true)}
          className="inline-flex items-center gap-3 bg-[#ffdb00] hover:bg-[#e6c500] text-[#393000] font-mono text-xs font-medium uppercase tracking-[0.05em] px-6 py-3 cursor-pointer transition-colors"
          aria-label={t('watchFieldReport')}
        >
          <i className="fa fa-play" />
          {t('watchFieldReport')}
        </button>
      </div>
      <div className="lg:w-2/5">
        {(() => {
          const features = [
            {icon: 'fas fa-user-tie', label: t('localExperts')},
            {icon: 'fas fa-route', label: t('hiddenRoutes')},
            {icon: 'fas fa-medal', label: t('yearsOnRoad')},
            {icon: 'fas fa-calendar-alt', label: t('dayAndMultiDay')},
            {icon: 'fas fa-users', label: t('smallGroups')},
            {icon: 'fas fa-hand-holding-usd', label: t('allInclusive')},
          ];
          return (
            <ul className="border border-[#989177] divide-y divide-[#4c4732] bg-[#131313]/70 backdrop-blur-sm">
              {features.map((item, index) => (
                <motion.li
                  key={item.icon}
                  custom={index}
                  variants={waveStagger(0.1)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{once: true}}
                  data-testid="feature-card"
                  className="grid grid-cols-[auto_auto_1fr] items-center gap-x-4 px-4 py-3.5 text-[#e5e2e1]"
                >
                  <span className="font-mono text-xs text-[#ffdb00] tabular-nums">
                    {String(index + 1).padStart(2, '0')}/
                    {String(features.length).padStart(2, '0')}
                  </span>
                  <span
                    className={`${item.icon} text-lg text-[#cfc6ab] w-6 text-center`}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs uppercase tracking-[0.05em]">
                    {item.label}
                  </span>
                </motion.li>
              ))}
            </ul>
          );
        })()}
      </div>
    </div>
  </div>
</section>;
```

- [ ] **Step 2: Screenshot diff**

Playwright, scroll to CTA, diff. Confirm mustard play button, ledger-row feature list, dimmed parallax bg.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.tsx
git commit -m "refactor(home): apex video CTA section"
```

---

## Task 9: Gallery section + GalleryItem reskin

**Files:**

- Modify: `src/pages/index.tsx` — gallery section (~lines 404-420)
- Modify: `src/components/home/GalleryItem/GalleryItem.tsx`

- [ ] **Step 1: Replace gallery section JSX in index.tsx**

```tsx
{
  /* Gallery */
}
{
  galleryImages.length > 0 && (
    <section className="bg-[#131313] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-l-2 border-[#ffdb00] pl-4">
          <span className="font-mono text-xs uppercase tracking-[0.05em] text-[#cfc6ab] block">
            {t('galleryEyebrow')}
          </span>
          <h2 className="font-display text-2xl lg:text-4xl font-bold uppercase tracking-[0.05em] text-[#e5e2e1] mt-2">
            {t('galleryTitle')}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-[#4c4732] border border-[#4c4732]">
          {galleryImages.map(({src, alt}, index) => (
            <GalleryItem
              key={index}
              imageSrc={src}
              alt={alt}
              delay={(index + 1) * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Reskin GalleryItem button + lightbox**

In `src/components/home/GalleryItem/GalleryItem.tsx`, replace the trigger button JSX with:

```tsx
<button
  data-testid="gallery-item"
  onClick={() => setLightboxOpen(true)}
  aria-label={alt}
  className="group relative block overflow-hidden aspect-square cursor-pointer bg-[#1c1b1b]"
>
  <Image
    src={imageSrc}
    alt={alt}
    fill
    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
    unoptimized
    className="object-cover transition-transform duration-500 group-hover:scale-105"
  />
  <div className="absolute inset-0 bg-[#0e0e0e]/0 group-hover:bg-[#0e0e0e]/70 transition-colors duration-300 flex items-center justify-center">
    <span className="w-10 h-10 border border-[#ffdb00] flex items-center justify-center text-[#ffdb00] opacity-0 group-hover:opacity-100 transition-opacity">
      <i className="fa fa-expand" />
    </span>
  </div>
</button>
```

Replace the lightbox JSX with:

```tsx
{
  lightboxOpen && (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0e0e0e]/95"
      onClick={() => setLightboxOpen(false)}
    >
      <button
        className="absolute top-6 right-6 w-10 h-10 border border-[#ffdb00] text-[#ffdb00] hover:bg-[#ffdb00] hover:text-[#393000] transition-colors cursor-pointer flex items-center justify-center"
        onClick={() => setLightboxOpen(false)}
        aria-label="Close lightbox"
      >
        <i className="fa fa-times" />
      </button>
      <Image
        src={imageSrc}
        alt={alt}
        width={1600}
        height={1200}
        unoptimized
        className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain border border-[#989177]"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
```

- [ ] **Step 3: Screenshot diff (gallery grid + open lightbox)**

Playwright: scroll to gallery, screenshot grid. Then `mcp__playwright__browser_click` on first item, screenshot lightbox, close.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.tsx src/components/home/GalleryItem
git commit -m "refactor(home): apex gallery grid + lightbox reskin"
```

---

## Task 10: VideoModal reskin

**Files:**

- Modify: `src/components/VideoModal.tsx`

- [ ] **Step 1: Read current modal**

```bash
cat src/components/VideoModal.tsx
```

- [ ] **Step 2: Apply Apex tokens**

Replace modal backdrop class: `bg-[#0e0e0e]/95` (was likely `bg-black/80` or similar).
Replace close button styling with the same `border border-[#ffdb00] text-[#ffdb00] hover:bg-[#ffdb00] hover:text-[#393000]` square button used in GalleryItem.
Replace any modal frame/border with `border border-[#989177]`.
Remove any `rounded-*` utilities.

- [ ] **Step 3: Manual test via Playwright MCP**

Navigate to home, click "WATCH FIELD REPORT", screenshot the open modal, close it.

- [ ] **Step 4: Commit**

```bash
git add src/components/VideoModal.tsx
git commit -m "refactor(video-modal): apex tokens"
```

---

## Task 11: i18n — seed translations

**Files:**

- Create: `prisma/seed-home-translations.ts`

- [ ] **Step 1: Create seed script**

```ts
// prisma/seed-home-translations.ts
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL.split('?')[0];
const adapter = new PrismaPg(dbUrl);
const prisma = new PrismaClient({adapter});

type Entry = {namespace: string; key: string; valueVi: string; valueEn: string};

const ENTRIES: Entry[] = [
  {
    namespace: 'home',
    key: 'heroTimestamp',
    valueVi: 'THÀNH LẬP 2014 · HÀ NỘI 21.0285°N',
    valueEn: 'EST. 2014 · HANOI 21.0285°N',
  },
  {
    namespace: 'home',
    key: 'viewFleet',
    valueVi: 'XEM ĐỘI XE',
    valueEn: 'VIEW FLEET',
  },
  {
    namespace: 'home',
    key: 'toursEyebrow',
    valueVi: 'Hành trình',
    valueEn: 'Field Routes',
  },
  {
    namespace: 'home',
    key: 'toursFilterLabel',
    valueVi: 'Lọc tour',
    valueEn: 'Filter tours',
  },
  {
    namespace: 'home',
    key: 'tours.filterAll',
    valueVi: 'TẤT CẢ',
    valueEn: 'ALL',
  },
  {
    namespace: 'home',
    key: 'tours.filterMountain',
    valueVi: 'NÚI',
    valueEn: 'MOUNTAIN',
  },
  {
    namespace: 'home',
    key: 'tours.filterCoastal',
    valueVi: 'BIỂN',
    valueEn: 'COASTAL',
  },
  {
    namespace: 'home',
    key: 'tours.filterNorth',
    valueVi: 'MIỀN BẮC',
    valueEn: 'NORTH',
  },
  {
    namespace: 'home',
    key: 'tours.filterSouth',
    valueVi: 'MIỀN NAM',
    valueEn: 'SOUTH',
  },
  {
    namespace: 'home',
    key: 'videoEyebrow',
    valueVi: 'Tư liệu',
    valueEn: 'Field Report',
  },
  {
    namespace: 'home',
    key: 'watchFieldReport',
    valueVi: 'XEM TƯ LIỆU',
    valueEn: 'WATCH FIELD REPORT',
  },
  {
    namespace: 'home',
    key: 'galleryEyebrow',
    valueVi: 'Tư liệu hình ảnh',
    valueEn: 'Photo Log',
  },
  {
    namespace: 'home',
    key: 'galleryTitle',
    valueVi: 'KHOẢNH KHẮC TRÊN ĐƯỜNG',
    valueEn: 'FIELD CAPTURES',
  },
  {
    namespace: 'home',
    key: 'stats.years.label',
    valueVi: 'NĂM HOẠT ĐỘNG',
    valueEn: 'YEARS',
  },
  {namespace: 'home', key: 'stats.years.value', valueVi: '12', valueEn: '12'},
  {
    namespace: 'home',
    key: 'stats.routes.label',
    valueVi: 'CUNG ĐƯỜNG',
    valueEn: 'ROUTES',
  },
  {namespace: 'home', key: 'stats.routes.value', valueVi: '47', valueEn: '47'},
  {
    namespace: 'home',
    key: 'stats.km.label',
    valueVi: 'KM ĐÃ ĐI',
    valueEn: 'KM RIDDEN',
  },
  {namespace: 'home', key: 'stats.km.value', valueVi: '1.2M', valueEn: '1.2M'},
  {
    namespace: 'home',
    key: 'stats.riders.label',
    valueVi: 'TAY LÁI',
    valueEn: 'RIDERS',
  },
  {
    namespace: 'home',
    key: 'stats.riders.value',
    valueVi: '4500+',
    valueEn: '4500+',
  },
];

async function main() {
  for (const e of ENTRIES) {
    await prisma.translation.upsert({
      where: {namespace_key: {namespace: e.namespace, key: e.key}},
      create: e,
      update: {valueVi: e.valueVi, valueEn: e.valueEn},
    });
    console.log(`✓ ${e.namespace}.${e.key}`);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run seed against local DB**

```bash
npx tsx prisma/seed-home-translations.ts
```

Expected output: a ✓ line per entry, no errors.

- [ ] **Step 3: Visual smoke — labels appear in page**

Restart dev server, navigate to `/`, confirm new labels render (hero timestamp, stats values, filter chips, video CTA label, gallery eyebrow). Toggle locale to `vi` and confirm Vietnamese values render.

- [ ] **Step 4: Run i18n duplicate scan**

```bash
pnpm i18n:scan
```

Expected: no new duplicates flagged for the keys added under `home.*`. If a generic UI string slipped in, refactor to `common.*` per CLAUDE.md.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed-home-translations.ts
git commit -m "feat(i18n): seed home apex translations"
```

---

## Task 12: Final verification + cleanup

**Files:**

- N/A (verification only)

- [ ] **Step 1: Token-purity lint**

```bash
pnpm lint:design
```

Expected: PASS. If off-palette hex flagged, fix by switching to the exact Apex hex from `DESIGN.md` token table.

- [ ] **Step 2: ESLint**

```bash
pnpm lint
```

Expected: PASS.

- [ ] **Step 3: Typecheck + build**

```bash
pnpm build
```

Expected: PASS. Fix any TS errors from removed `useCursorSpotlight`/`useMotionTemplate` imports or unused vars.

- [ ] **Step 4: Test suite**

```bash
pnpm test -- --watchAll=false
```

Expected: PASS. `StatsStrip` tests + existing `DestinationCard` test pass.

- [ ] **Step 5: Regenerate full snapshot set**

```bash
pnpm design:verify
```

Expected: 12 PNGs in `.design-snapshots/` regenerated.

- [ ] **Step 6: Manual headed pass via Playwright MCP**

Navigate `/` at 1440×900 and 390×844. Screenshot full page each. Compare to Stitch desktop + mobile mockups end-to-end. Note any drift.

- [ ] **Step 7: Regression smoke on `/tours` and `/destinations`**

Headed visits to both. Components are Apex now while page chrome isn't — log any glaring breakage (overlap, unreadable contrast). Fix only if blocking; otherwise note in PR description as expected and queued for those pages' own redesign PRs.

- [ ] **Step 8: Push branch + open PR**

```bash
git push -u origin feat/home-apex-redesign
gh pr create --title "feat(home): apex tactical redesign" --body "$(cat <<'EOF'
## Summary
- Rebuild /home with Apex Tactical visual language (dark #131313, hazard mustard #ffdb00 CTA, 1px borders, zero radius, all-caps Hanken Grotesk, JetBrains Mono labels).
- New StatsStrip component (4 mono-data stats under hero).
- Tactical chip filter row above TourCarousel (visual only).
- In-place Apex reskin of shared TourCarousel, DestinationCard, GalleryItem, VideoModal — auto-restyles /tours and /destinations (those pages get their own redesign PRs).
- Hero keeps video; drops cursor spotlight + warm gradient + texture grain.
- All Framer-Motion entrance animations preserved.
- New i18n keys under `home.*` seeded to DB.

## Test plan
- [x] pnpm lint
- [x] pnpm lint:design
- [x] pnpm build
- [x] pnpm test
- [x] pnpm design:verify
- [x] Playwright MCP side-by-side diff per section vs Stitch mockups (desktop + mobile)
- [x] Regression smoke on /tours and /destinations (component reskin spillover noted; expected)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 9: Invoke superpowers:finishing-a-development-branch**

After PR merges, invoke the finishing skill per project CLAUDE.md workflow rule.

---

## Self-Review Notes

- Spec section "Stats strip" → Task 2. ✓
- Spec section "Hero" → Task 1. ✓
- Spec section "Destinations" → Task 3 + Task 4 (card reskin). ✓
- Spec section "About" → Task 5. ✓
- Spec section "Popular Tours" → Task 6 + Task 7 (carousel reskin). ✓
- Spec section "Video / CTA" → Task 8. ✓
- Spec section "Gallery" → Task 9 (section + item). ✓
- Spec component table: `VideoModal` → Task 10. ✓
- Spec i18n keys → Task 11 (seed + JSON via revalidate-on-rebuild handled by `getMessagesFromDb`). ✓
- Spec verification loop → Task 0 (pull) + per-task Playwright diffs + Task 12 (final). ✓
- Spec delivery → Task 12 step 8. ✓

No placeholders, no "TBD". Code blocks complete per step. Tailwind utility strings spelled out exactly. Type/property names consistent across tasks. Test names + commands explicit.
