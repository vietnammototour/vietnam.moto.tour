# Travel Journal UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform homepage and tour detail page into a distinctive "Vietnamese travel journal" experience with textured backgrounds, elevation system, asymmetric layouts, cursor-aware effects, and Vietnamese-inspired motion language.

**Architecture:** Build a shared visual foundation (textures, elevation tokens, motion utilities, cursor hooks) first, then apply page-specific treatments to homepage and tour detail. Each layer builds on the previous.

**Tech Stack:** Tailwind CSS v4 (custom utilities in globals.css), Framer Motion 12 (variants, useMotionValue, useTransform), React 19 hooks, SVG assets (inline data URIs).

---

## File Structure

### New Files

| Path                                        | Responsibility                                           |
| ------------------------------------------- | -------------------------------------------------------- |
| `src/assets/textures/grain.svg`             | SVG noise texture for paper grain overlay                |
| `src/assets/textures/lotus-watermark.svg`   | Lotus outline decorative motif                           |
| `src/assets/textures/lantern-watermark.svg` | Lantern silhouette decorative motif                      |
| `src/assets/textures/border-pattern.svg`    | Vietnamese traditional border pattern                    |
| `src/assets/textures/road-path.svg`         | Winding mountain road SVG for itinerary timeline         |
| `src/hooks/use-cursor-spotlight.ts`         | Hook: radial gradient follows cursor position            |
| `src/hooks/use-magnetic.ts`                 | Hook: magnetic pull effect for buttons                   |
| `src/hooks/use-card-tilt.ts`                | Hook: 3D tilt on hover based on cursor position          |
| `src/utils/motion-variants.ts`              | Shared Framer Motion variants (replaces inline fadeInUp) |

### Modified Files

| Path                                        | Changes                                                      |
| ------------------------------------------- | ------------------------------------------------------------ |
| `src/styles/globals.css`                    | Add elevation tokens, texture utilities, animation keyframes |
| `src/pages/index.tsx`                       | Asymmetric layouts, new section treatments, cursor effects   |
| `src/pages/tours/[slug].tsx`                | Hero cursor spotlight, layout adjustments                    |
| `src/components/tour-card/index.tsx`        | Elevation system, 3D tilt hover, inner parallax              |
| `src/components/destination-card/index.tsx` | Staggered positioning, magnetic proximity                    |
| `src/components/tour-hero/index.tsx`        | Full-bleed + cursor spotlight + clip-path reveal             |
| `src/components/tour-itinerary/index.tsx`   | Road path SVG timeline, scroll-draw animation                |
| `src/components/tour-notes/index.tsx`       | Journal-note styling with paper texture + tape decoration    |
| `src/components/tour-included/index.tsx`    | Journal-note card treatment                                  |
| `src/components/tour-cta/index.tsx`         | Magnetic buttons, press states                               |

---

## Task 1: Design Tokens & Texture Utilities

**Files:**

- Modify: `src/styles/globals.css`
- Create: `src/assets/textures/grain.svg`

- [ ] **Step 1: Create grain SVG texture**

Create a reusable noise/grain SVG texture as a data URI-compatible file:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#noise)" opacity="0.04"/>
</svg>
```

- [ ] **Step 2: Add elevation tokens to globals.css**

Add after the existing `@theme` block (after line 59):

```css
@theme {
  --shadow-elevation-1:
    0 2px 8px -2px rgba(180, 83, 9, 0.08), 0 1px 3px -1px rgba(0, 0, 0, 0.06);
  --shadow-elevation-2:
    0 8px 24px -4px rgba(180, 83, 9, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.08);
  --shadow-elevation-3:
    0 16px 48px -8px rgba(180, 83, 9, 0.16), 0 8px 16px -4px rgba(0, 0, 0, 0.1);

  --ease-lantern-sway: cubic-bezier(0.45, 0.05, 0.35, 0.95);
  --ease-motorbike-sweep: cubic-bezier(0.7, 0, 0.2, 1);
  --ease-water-flow: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

- [ ] **Step 3: Add texture and elevation utilities**

Add after the existing `@utility` blocks (after line ~141):

```css
@utility elevation-1 {
  box-shadow: var(--shadow-elevation-1);
  transition: box-shadow 200ms ease;
}

@utility elevation-2 {
  box-shadow: var(--shadow-elevation-2);
  transition: box-shadow 200ms ease;
}

@utility elevation-3 {
  box-shadow: var(--shadow-elevation-3);
  transition: box-shadow 200ms ease;
}

@utility texture-grain-warm {
  position: relative;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    background-repeat: repeat;
    pointer-events: none;
    z-index: 1;
    mix-blend-mode: multiply;
  }
}

@utility texture-grain-cool {
  position: relative;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    background-repeat: repeat;
    pointer-events: none;
    z-index: 1;
    mix-blend-mode: overlay;
  }
}

@utility texture-paper {
  background-color: #faf8f5;
}
```

- [ ] **Step 4: Add animation keyframes**

Add after the texture utilities:

```css
@keyframes lantern-sway {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-3px) rotate(0.5deg);
  }
  75% {
    transform: translateY(2px) rotate(-0.5deg);
  }
}

@utility animate-lantern-sway {
  animation: lantern-sway 4s var(--ease-lantern-sway) infinite;
}
```

- [ ] **Step 5: Verify build compiles**

Run: `pnpm build 2>&1 | head -30`
Expected: No CSS compilation errors. Build proceeds to page compilation.

- [ ] **Step 6: Commit**

```bash
git add src/styles/globals.css src/assets/textures/grain.svg
git commit -m "feat: add elevation tokens, texture utilities, and motion easings"
```

---

## Task 2: Vietnamese Decorative SVG Assets

**Files:**

- Create: `src/assets/textures/lotus-watermark.svg`
- Create: `src/assets/textures/lantern-watermark.svg`
- Create: `src/assets/textures/border-pattern.svg`

- [ ] **Step 1: Create lotus watermark SVG**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.03">
  <path d="M100 20c0 0-30 40-30 80s30 80 30 80c0 0 30-40 30-80s-30-80-30-80z"/>
  <path d="M100 20c0 0-60 30-60 90s60 70 60 70c0 0 60-10 60-70s-60-90-60-90z"/>
  <path d="M100 20c0 0-80 50-70 100c10 50 70 60 70 60c0 0 60-10 70-60c10-50-70-100-70-100z"/>
  <ellipse cx="100" cy="170" rx="40" ry="10"/>
</svg>
```

- [ ] **Step 2: Create lantern watermark SVG**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.03">
  <path d="M40 30h20M45 30v10M55 30v10"/>
  <ellipse cx="50" cy="50" rx="5" ry="10"/>
  <path d="M45 50c-15 10-20 30-20 50s5 40 10 50c5-10 10-30 15-50"/>
  <path d="M55 50c15 10 20 30 20 50s-5 40-10 50c-5-10-10-30-15-50"/>
  <path d="M35 150c5 10 10 15 15 18M65 150c-5 10-10 15-15 18"/>
  <line x1="50" y1="168" x2="50" y2="185"/>
  <circle cx="50" cy="190" r="3"/>
</svg>
```

- [ ] **Step 3: Create Vietnamese border pattern SVG**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 20" fill="none" stroke="currentColor" stroke-width="1" opacity="0.08">
  <path d="M0 10h10l5-5 5 5 5-5 5 5h10l5-5 5 5 5-5 5 5h10l5-5 5 5 5-5 5 5h10l5-5 5 5 5-5 5 5h10l5-5 5 5 5-5 5 5h10l5-5 5 5 5-5 5 5h10l5-5 5 5 5-5 5 5h10l5-5 5 5 5-5 5 5h10l5-5 5 5 5-5 5 5h10l5-5 5 5 5-5 5 5h10l5-5 5 5 5-5 5 5h10l5-5 5 5 5-5 5 5h10"/>
  <path d="M0 15h400" stroke-dasharray="2 4"/>
</svg>
```

- [ ] **Step 4: Commit**

```bash
git add src/assets/textures/
git commit -m "feat: add Vietnamese decorative SVG assets (lotus, lantern, border)"
```

---

## Task 3: Motion Variants & Cursor Hooks

**Files:**

- Create: `src/utils/motion-variants.ts`
- Create: `src/hooks/use-cursor-spotlight.ts`
- Create: `src/hooks/use-magnetic.ts`
- Create: `src/hooks/use-card-tilt.ts`

- [ ] **Step 1: Create shared motion variants**

```typescript
import {Variants, Transition} from 'framer-motion';

const sweepTransition: Transition = {
  duration: 0.6,
  ease: [0.7, 0, 0.2, 1], // motorbike-sweep
};

const flowTransition: Transition = {
  duration: 0.5,
  ease: [0.25, 0.46, 0.45, 0.94], // water-flow
};

export const clipReveal: Variants = {
  hidden: {clipPath: 'inset(0 100% 0 0)'},
  visible: {
    clipPath: 'inset(0 0% 0 0)',
    transition: sweepTransition,
  },
};

export const slideFromLeft: Variants = {
  hidden: {opacity: 0, x: -40},
  visible: {
    opacity: 1,
    x: 0,
    transition: flowTransition,
  },
};

export const slideFromRight: Variants = {
  hidden: {opacity: 0, x: 40},
  visible: {
    opacity: 1,
    x: 0,
    transition: flowTransition,
  },
};

export const riseWithOvershoot: Variants = {
  hidden: {opacity: 0, y: 30},
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.45, 0.05, 0.35, 0.95], // lantern-sway
    },
  },
};

export const waveStagger = (delayPerItem = 0.08) => ({
  hidden: {opacity: 0, y: 20},
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: i * delayPerItem,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
});

export const fadeInUp: Variants = {
  hidden: {opacity: 0, y: 30},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94]},
  },
};
```

- [ ] **Step 2: Create cursor spotlight hook**

```typescript
import {useMotionValue, useSpring, MotionValue} from 'framer-motion';
import {useCallback, useRef, RefObject} from 'react';

interface CursorSpotlight {
  ref: RefObject<HTMLElement | null>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  backgroundStyle: string;
}

export function useCursorSpotlight(
  radius = 200,
  opacity = 0.15,
  color = '180, 83, 9',
): CursorSpotlight {
  const ref = useRef<HTMLElement | null>(null);
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const springX = useSpring(x, {stiffness: 150, damping: 25});
  const springY = useSpring(y, {stiffness: 150, damping: 25});

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
    },
    [x, y],
  );

  const onMouseLeave = useCallback(() => {
    x.set(-1000);
    y.set(-1000);
  }, [x, y]);

  const backgroundStyle = `radial-gradient(${radius}px circle at var(--spotlight-x, -1000px) var(--spotlight-y, -1000px), rgba(${color}, ${opacity}), transparent)`;

  return {
    ref,
    x: springX,
    y: springY,
    onMouseMove,
    onMouseLeave,
    backgroundStyle,
  };
}
```

- [ ] **Step 3: Create magnetic button hook**

```typescript
import {useMotionValue, useSpring, MotionValue} from 'framer-motion';
import {useCallback, useRef, RefObject} from 'react';

interface MagneticEffect {
  ref: RefObject<HTMLElement | null>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export function useMagnetic(strength = 0.3, threshold = 80): MagneticEffect {
  const ref = useRef<HTMLElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, {stiffness: 300, damping: 20});
  const springY = useSpring(y, {stiffness: 300, damping: 20});

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < threshold) {
        x.set(distX * strength);
        y.set(distY * strength);
      } else {
        x.set(0);
        y.set(0);
      }
    },
    [x, y, strength, threshold],
  );

  const onMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return {ref, x: springX, y: springY, onMouseMove, onMouseLeave};
}
```

- [ ] **Step 4: Create card tilt hook**

```typescript
import {
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from 'framer-motion';
import {useCallback, useRef, RefObject} from 'react';

interface CardTilt {
  ref: RefObject<HTMLElement | null>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  scale: MotionValue<number>;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onMouseEnter: () => void;
}

export function useCardTilt(maxDeg = 4): CardTilt {
  const ref = useRef<HTMLElement | null>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const isHovered = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [maxDeg, -maxDeg]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-maxDeg, maxDeg]), {
    stiffness: 200,
    damping: 20,
  });
  const scale = useSpring(isHovered, {stiffness: 200, damping: 20});

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [mouseX, mouseY],
  );

  const onMouseEnter = useCallback(() => {
    isHovered.set(1);
  }, [isHovered]);

  const onMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    isHovered.set(0);
  }, [mouseX, mouseY, isHovered]);

  const finalScale = useTransform(scale, [0, 1], [1, 1.02]);

  return {
    ref,
    rotateX,
    rotateY,
    scale: finalScale,
    onMouseMove,
    onMouseLeave,
    onMouseEnter,
  };
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `pnpm build 2>&1 | head -40`
Expected: No TypeScript errors from new files.

- [ ] **Step 6: Commit**

```bash
git add src/utils/motion-variants.ts src/hooks/use-cursor-spotlight.ts src/hooks/use-magnetic.ts src/hooks/use-card-tilt.ts
git commit -m "feat: add motion variants and cursor interaction hooks"
```

---

## Task 4: Tour Card — Elevation & 3D Tilt

**Files:**

- Modify: `src/components/tour-card/index.tsx`

- [ ] **Step 1: Add tilt hook and elevation classes**

Replace the current `Link` wrapper and image section. The card should use `motion.div` with 3D perspective for tilt, elevation-1 resting, elevation-2 on hover.

Current card wrapper (line ~15):

```tsx
<Link
  href={`/tours/${tour.slug}`}
  className="group bg-surface-elevated rounded-lg shadow-sm hover:shadow-md transition-shadow h-full flex flex-col cursor-pointer"
>
```

Replace the entire component body with:

```tsx
import Link from 'next/link';
import {motion, useTransform} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {getDestinationName} from '@/data';
import {useCardTilt} from '@/hooks/use-card-tilt';
import type {Tour} from '@/types';

interface TourCardProps {
  tour: Tour;
}

export default function TourCard({tour}: TourCardProps) {
  const t = useTranslations('tours');
  const destinationName = getDestinationName(tour);
  const {
    ref,
    rotateX,
    rotateY,
    scale,
    onMouseMove,
    onMouseLeave,
    onMouseEnter,
  } = useCardTilt(4);

  // Inner parallax: image shifts opposite to cursor
  const imageX = useTransform(rotateY, [-4, 4], [5, -5]);
  const imageY = useTransform(rotateX, [-4, 4], [-5, 5]);

  return (
    <Link href={`/tours/${tour.slug}`} className="block h-full cursor-pointer">
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onMouseEnter={onMouseEnter}
        style={{
          rotateX,
          rotateY,
          scale,
          transformPerspective: 1000,
        }}
        className="group bg-surface-elevated rounded-lg elevation-1 hover:elevation-2 h-full flex flex-col overflow-hidden"
      >
        <div className="relative aspect-[3/2] bg-secondary/10 overflow-hidden">
          <motion.img
            src={tour.imageUrl}
            alt={tour.title}
            style={{x: imageX, y: imageY}}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h3 className="type-title-lg text-on-surface group-hover:text-primary transition-colors mb-2">
            {tour.title}
          </h3>
          <p className="text-on-surface-accent type-title-sm mb-3">
            {t('fromPrice', {price: tour.price})}
          </p>
          <div className="flex items-center gap-4 type-label-sm font-normal text-on-surface-secondary mt-auto pt-4 border-t border-border-subtle">
            <span>
              <i className="fa fa-clock-o mr-1" />
              {tour.duration}
            </span>
            <span>
              <i className="fa fa-road mr-1" />
              {tour.distance}
            </span>
            {destinationName && (
              <span>
                <i className="fa fa-map-marker mr-1" />
                {destinationName}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/tour-card/index.tsx
git commit -m "feat: tour card with 3D tilt, elevation system, and inner parallax"
```

---

## Task 5: Destination Card — Proximity Lift

**Files:**

- Modify: `src/components/destination-card/index.tsx`

- [ ] **Step 1: Add hover elevation and enhanced zoom**

The destination card already has good hover zoom. Enhance with elevation transition and a more dramatic shadow lift. Replace the current component:

```tsx
import Link from 'next/link';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {Destination} from '@/types';

interface DestinationCardProps {
  destination: Destination;
  className?: string;
  tourCount?: number;
}

export default function DestinationCard({
  destination,
  className,
  tourCount,
}: DestinationCardProps) {
  const t = useTranslations('destinations');

  return (
    <Link
      href={`/tours?destination=${destination.id}`}
      className={`group relative rounded-lg overflow-hidden block cursor-pointer elevation-1 hover:elevation-2 transition-all duration-300 ${className || 'aspect-[3/2]'}`}
    >
      <motion.div
        className="w-full h-full"
        whileHover={{y: -4}}
        transition={{duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94]}}
      >
        <img
          src={destination.imageUrl}
          alt={destination.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white type-title-lg group-hover:text-primary-light transition-colors">
            {destination.name}
          </h3>
          {tourCount !== undefined && (
            <span className="inline-block mt-2 bg-primary/90 text-white type-label-sm uppercase px-3 py-1 rounded-full">
              {t('tourCount', {count: tourCount})}
            </span>
          )}
          {destination.vehicleTypes && destination.vehicleTypes.length > 0 && (
            <div className="flex gap-2 mt-2">
              {destination.vehicleTypes.map((type) => (
                <span
                  key={type}
                  className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white type-label-sm"
                >
                  <i
                    className={`fa fa-${type === 'motorcycle' ? 'motorcycle' : 'car'}`}
                  />
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/destination-card/index.tsx
git commit -m "feat: destination card with elevation lift and enhanced hover"
```

---

## Task 6: Homepage Hero — Asymmetric + Cursor Spotlight + Clip Reveal

**Files:**

- Modify: `src/pages/index.tsx` (hero section, lines 69-90)

- [ ] **Step 1: Import new hooks and variants at top of file**

Add to existing imports in `src/pages/index.tsx`:

```typescript
import {useCursorSpotlight} from '@/hooks/use-cursor-spotlight';
import {
  clipReveal,
  riseWithOvershoot,
  slideFromLeft,
} from '@/utils/motion-variants';
```

- [ ] **Step 2: Replace hero section**

Replace lines 69-90 (the hero section) with asymmetric layout + cursor spotlight:

```tsx
{
  /* Hero Section */
}
<section
  ref={spotlight.ref as React.RefObject<HTMLElement>}
  onMouseMove={spotlight.onMouseMove}
  onMouseLeave={spotlight.onMouseLeave}
  className="relative h-screen overflow-hidden texture-grain-warm"
>
  {/* Background video/image stays the same */}
  <video
    autoPlay
    muted
    loop
    playsInline
    className="absolute inset-0 w-full h-full object-cover"
  >
    <source src="/videos/hero.mp4" type="video/mp4" />
  </video>
  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

  {/* Cursor spotlight overlay */}
  <motion.div
    className="absolute inset-0 pointer-events-none z-10"
    style={{
      background: `radial-gradient(200px circle at ${spotlight.x.get()}px ${spotlight.y.get()}px, rgba(180, 83, 9, 0.15), transparent)`,
    }}
  />

  {/* Lotus watermark */}
  <div
    className="absolute bottom-10 right-10 w-48 h-48 opacity-[0.03] pointer-events-none"
    style={{
      backgroundImage: "url('/textures/lotus-watermark.svg')",
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
    }}
  />

  {/* Asymmetric content — left-aligned 60% */}
  <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center h-full">
    <div className="max-w-[60%]">
      <motion.p
        variants={slideFromLeft}
        initial="hidden"
        animate="visible"
        className="type-label-sm uppercase tracking-wider text-primary-light mb-4"
      >
        {t('hero.subtitle')}
      </motion.p>
      <motion.h1
        variants={clipReveal}
        initial="hidden"
        animate="visible"
        className="type-display-sm md:type-display-lg text-white mb-6"
      >
        {t('hero.title')}
      </motion.h1>
      <motion.p
        variants={slideFromLeft}
        initial="hidden"
        animate="visible"
        transition={{delay: 0.3}}
        className="type-body-lg text-white/80 mb-8 max-w-lg"
      >
        {t('hero.description')}
      </motion.p>
      <motion.div
        variants={riseWithOvershoot}
        initial="hidden"
        animate="visible"
        transition={{delay: 0.5}}
      >
        <Link
          href="/tours"
          className="inline-block bg-primary hover:bg-primary-light text-on-primary type-label-sm uppercase px-8 py-3 rounded-lg cursor-pointer transition-colors elevation-2 hover:elevation-3"
        >
          {t('hero.cta')}
        </Link>
      </motion.div>
    </div>
  </div>
</section>;
```

Note: The `spotlight` variable needs to be initialized inside the component:

```tsx
const spotlight = useCursorSpotlight(200, 0.15);
```

Add this line after the existing hooks at the top of the `Home` component function.

- [ ] **Step 3: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds. The spotlight effect needs the motion values wired differently — see next step if there's a reactivity issue.

- [ ] **Step 4: Fix spotlight reactivity if needed**

The cursor spotlight needs to use `useMotionTemplate` for reactive gradient. Update the spotlight overlay to:

```tsx
import { motion, useMotionTemplate } from 'framer-motion'

// Inside component, after spotlight hook:
const spotlightBg = useMotionTemplate`radial-gradient(200px circle at ${spotlight.x}px ${spotlight.y}px, rgba(180, 83, 9, 0.15), transparent)`

// In JSX:
<motion.div
  className="absolute inset-0 pointer-events-none z-10"
  style={{ background: spotlightBg }}
/>
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat: homepage hero with asymmetric layout, cursor spotlight, clip reveal"
```

---

## Task 7: Homepage Sections — Texture, Asymmetry, Wave Stagger

**Files:**

- Modify: `src/pages/index.tsx` (destinations, about, video sections)

- [ ] **Step 1: Update destinations section with texture and stagger**

Replace the destinations section wrapper to add warm texture and staggered card reveals. Update the `motion.div` wrappers for cards to use `waveStagger`:

Add import: `import { waveStagger } from '@/utils/motion-variants'`

Around the destinations grid section, wrap with texture class and use the wave stagger variant:

```tsx
{/* Destinations Section */}
<section className="relative py-16 lg:py-24 texture-grain-warm">
  <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <motion.p
      variants={slideFromLeft}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="type-label-sm uppercase text-on-surface-accent mb-2"
    >
      {t('destinations.subtitle')}
    </motion.p>
    <motion.h2
      variants={clipReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="type-headline-sm lg:type-headline-lg text-on-surface mb-8"
    >
      {t('destinations.title')}
    </motion.h2>
    {/* Existing grid content — keep current card layout but replace fadeInUp with waveStagger */}
    {/* Each DestinationCard motion wrapper: */}
    <motion.div
      custom={i}
      variants={waveStagger(0.08)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <DestinationCard ... />
    </motion.div>
  </div>
  {/* Vietnamese border pattern divider at bottom */}
  <div
    className="absolute bottom-0 left-0 right-0 h-5 opacity-60"
    style={{ backgroundImage: "url('/textures/border-pattern.svg')", backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%' }}
  />
</section>
```

- [ ] **Step 2: Update about section with asymmetric layout**

The about section already uses two-column layout. Enhance by making the image bleed past container on left and adding cool texture:

Wrap the section with: `className="relative py-16 lg:py-24 texture-grain-cool"`

Make the image column use negative margin to bleed left:

```tsx
<div className="lg:-ml-8 lg:mr-4">{/* existing image content */}</div>
```

- [ ] **Step 3: Update video/features section with asymmetric 60/40 layout**

Change the video/features section from centered to 60/40 split:

```tsx
<section className="relative py-16 lg:py-24 texture-grain-warm">
  <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="lg:flex lg:gap-12 lg:items-center">
      {/* Video — 60% */}
      <div className="lg:w-3/5 mb-8 lg:mb-0">
        {/* existing video thumbnail + play button */}
      </div>
      {/* Features — 40% */}
      <div className="lg:w-2/5">
        {/* existing feature cards stacked vertically instead of 2x3 grid */}
        <div className="space-y-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={waveStagger(0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={{once: true}}
              className="flex items-start gap-4 p-4 rounded-lg elevation-1 bg-surface-elevated"
            >
              {/* icon + text */}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat: homepage sections with textures, wave stagger, asymmetric layouts"
```

---

## Task 8: Tour Hero — Full-Bleed + Spotlight + Clip Reveal

**Files:**

- Modify: `src/components/tour-hero/index.tsx`

- [ ] **Step 1: Rewrite tour hero with cursor spotlight and clip-path title reveal**

```tsx
import Link from 'next/link';
import {motion, useMotionTemplate} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {getDestinationName} from '@/data';
import {useCursorSpotlight} from '@/hooks/use-cursor-spotlight';
import {clipReveal, slideFromLeft} from '@/utils/motion-variants';
import type {Tour} from '@/types';

interface TourHeroProps {
  tour: Tour;
}

export default function TourHero({tour}: TourHeroProps) {
  const t = useTranslations('tourDetail');
  const destinationName = getDestinationName(tour);
  const spotlight = useCursorSpotlight(250, 0.12);
  const spotlightBg = useMotionTemplate`radial-gradient(250px circle at ${spotlight.x}px ${spotlight.y}px, rgba(180, 83, 9, 0.12), transparent)`;

  return (
    <>
      {/* Full-bleed hero */}
      <section
        ref={spotlight.ref as React.RefObject<HTMLElement>}
        onMouseMove={spotlight.onMouseMove}
        onMouseLeave={spotlight.onMouseLeave}
        className="relative h-72 md:h-96 lg:h-[28rem] overflow-hidden texture-grain-warm"
      >
        <img
          src={tour.destinationImageUrl || tour.imageUrl}
          alt={tour.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Cursor spotlight */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{background: spotlightBg}}
        />

        {/* Content — asymmetric, bottom-left */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col justify-end h-full pb-8">
          <motion.h1
            variants={clipReveal}
            initial="hidden"
            animate="visible"
            className="type-display-sm md:type-display-lg text-white mb-4 max-w-[70%]"
          >
            {tour.title}
          </motion.h1>
          <motion.div
            variants={slideFromLeft}
            initial="hidden"
            animate="visible"
            transition={{delay: 0.3}}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/80 type-body-sm"
          >
            {destinationName && (
              <span>
                <i className="fa fa-map-marker mr-1" />
                {destinationName}
              </span>
            )}
            <span>
              <i className="fa fa-clock-o mr-1" />
              {tour.duration}
            </span>
            <span>
              <i className="fa fa-road mr-1" />
              {tour.distance}
            </span>
            {tour.transportType && (
              <span>
                <i className="fa fa-motorcycle mr-1" />
                {tour.transportType}
              </span>
            )}
            {tour.rating && (
              <span>
                <i className="fa fa-star mr-1 text-primary-light" />
                {tour.rating}
              </span>
            )}
          </motion.div>
          <motion.p
            variants={slideFromLeft}
            initial="hidden"
            animate="visible"
            transition={{delay: 0.5}}
            className="mt-3 text-white type-title-sm"
          >
            {t('fromPrice')}{' '}
            <span className="type-headline-sm text-primary-light">
              ${tour.price}
            </span>
          </motion.p>
        </div>
      </section>

      {/* Breadcrumb bar */}
      <nav className="bg-surface-alt py-3 border-b border-border-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ol className="flex items-center gap-2 type-label-sm text-on-surface-secondary">
            <li>
              <Link
                href="/"
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {t('breadcrumb.home')}
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                href="/tours"
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {t('breadcrumb.tours')}
              </Link>
            </li>
            <li>/</li>
            <li className="text-on-surface truncate max-w-[200px]">
              {tour.title}
            </li>
          </ol>
        </div>
      </nav>
    </>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/tour-hero/index.tsx
git commit -m "feat: tour hero with full-bleed, cursor spotlight, and clip-path title reveal"
```

---

## Task 9: Tour Itinerary — Road Path Timeline

**Files:**

- Create: `src/assets/textures/road-path.svg`
- Modify: `src/components/tour-itinerary/index.tsx`

- [ ] **Step 1: Create winding road SVG path**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 800" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round">
  <path d="M20 0 C20 50, 35 80, 25 130 C15 180, 30 210, 20 260 C10 310, 35 340, 25 390 C15 440, 30 470, 20 520 C10 570, 35 600, 25 650 C15 700, 20 750, 20 800" stroke-dasharray="8 4" opacity="0.3"/>
  <path d="M20 0 C20 50, 35 80, 25 130 C15 180, 30 210, 20 260 C10 310, 35 340, 25 390 C15 440, 30 470, 20 520 C10 570, 35 600, 25 650 C15 700, 20 750, 20 800" class="road-draw" opacity="0.8"/>
</svg>
```

- [ ] **Step 2: Rewrite itinerary with road path and alternating day cards**

```tsx
import {motion, useScroll, useTransform} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useRef} from 'react';
import {slideFromLeft, slideFromRight} from '@/utils/motion-variants';
import type {Tour} from '@/types';

interface TourItineraryProps {
  tour: Tour;
}

export default function TourItinerary({tour}: TourItineraryProps) {
  const t = useTranslations('tourDetail');
  const containerRef = useRef<HTMLDivElement>(null);
  const {scrollYProgress} = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  // Road path draws as user scrolls
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (!tour.itinerary || tour.itinerary.length === 0) return null;

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
    >
      <h2 className="type-headline-sm text-on-surface mb-8">
        {t('itinerary.title')}
      </h2>

      <div ref={containerRef} className="relative">
        {/* Winding road SVG centerline */}
        <div className="absolute left-5 top-0 bottom-0 w-10 hidden md:block">
          <svg
            viewBox="0 0 40 800"
            preserveAspectRatio="none"
            className="w-full h-full"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {/* Background path (faint) */}
            <motion.path
              d="M20 0 C20 50,35 80,25 130 C15 180,30 210,20 260 C10 310,35 340,25 390 C15 440,30 470,20 520 C10 570,35 600,25 650 C15 700,20 750,20 800"
              className="text-primary/20"
              strokeDasharray="8 4"
            />
            {/* Animated draw path */}
            <motion.path
              d="M20 0 C20 50,35 80,25 130 C15 180,30 210,20 260 C10 310,35 340,25 390 C15 440,30 470,20 520 C10 570,35 600,25 650 C15 700,20 750,20 800"
              className="text-primary"
              style={{pathLength}}
              strokeDasharray="0 1"
            />
          </svg>
        </div>

        {/* Day cards — alternating sides */}
        <div className="space-y-8 md:pl-20">
          {tour.itinerary.map((day, dayIndex) => (
            <div key={dayIndex}>
              {tour.itinerary.length > 1 && (
                <motion.h3
                  variants={dayIndex % 2 === 0 ? slideFromLeft : slideFromRight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{once: true}}
                  className="type-title-lg text-on-surface mb-4 font-semibold"
                >
                  {t('itinerary.dayLabel', {day: dayIndex + 1})}
                </motion.h3>
              )}
              <div className="space-y-4">
                {day.items.map((item, itemIndex) => (
                  <motion.div
                    key={itemIndex}
                    variants={
                      dayIndex % 2 === 0 ? slideFromLeft : slideFromRight
                    }
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true}}
                    transition={{delay: itemIndex * 0.1}}
                    className="relative p-4 rounded-lg elevation-1 bg-surface-elevated texture-grain-warm"
                  >
                    <div className="relative z-10">
                      {item.time && (
                        <p className="type-label-lg text-primary font-semibold mb-1">
                          {item.time}
                        </p>
                      )}
                      <p className="type-title-sm text-on-surface font-medium mb-1">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="type-body-sm text-on-surface-secondary leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Road endpoint marker */}
        <motion.div
          style={{opacity: pathLength}}
          className="hidden md:flex absolute left-5 bottom-0 w-10 h-10 items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-primary border-2 border-surface elevation-1" />
        </motion.div>
      </div>
    </motion.section>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/assets/textures/road-path.svg src/components/tour-itinerary/index.tsx
git commit -m "feat: tour itinerary with winding road path timeline and scroll animation"
```

---

## Task 10: Tour Notes & Included — Journal Styling

**Files:**

- Modify: `src/components/tour-notes/index.tsx`
- Modify: `src/components/tour-included/index.tsx`

- [ ] **Step 1: Read current tour-notes component**

Run: Read `src/components/tour-notes/index.tsx` to see exact current structure.

- [ ] **Step 2: Update tour-notes with journal-note aesthetic**

Add paper texture, slight rotation, and decorative tape corners:

```tsx
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {riseWithOvershoot} from '@/utils/motion-variants';
import type {Tour} from '@/types';

interface TourNotesProps {
  tour: Tour;
}

export default function TourNotes({tour}: TourNotesProps) {
  const t = useTranslations('tourDetail');

  if (!tour.importantNotes && !tour.meals) return null;

  return (
    <motion.div
      variants={riseWithOvershoot}
      initial="hidden"
      whileInView="visible"
      viewport={{once: true}}
      className="relative rounded-xl p-5 mb-5 elevation-1 texture-grain-warm rotate-[0.3deg] hover:rotate-0 transition-transform duration-300"
    >
      {/* Decorative tape — top-left corner */}
      <div className="absolute -top-1.5 left-6 w-10 h-4 bg-primary/20 rounded-sm rotate-[-2deg]" />
      {/* Decorative tape — top-right corner */}
      <div className="absolute -top-1.5 right-8 w-8 h-4 bg-secondary/20 rounded-sm rotate-[3deg]" />

      <div className="relative z-10">
        {tour.importantNotes && (
          <div className="mb-4">
            <h4 className="type-title-sm font-semibold text-on-surface mb-2">
              {t('notes.important')}
            </h4>
            <ul className="space-y-2">
              {tour.importantNotes.map((note, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 type-body-sm text-on-surface-secondary"
                >
                  <span className="text-primary mt-0.5 shrink-0">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
        {tour.meals && (
          <div>
            <h4 className="type-title-sm font-semibold text-on-surface mb-2">
              {t('notes.meals')}
            </h4>
            <p className="type-body-sm text-on-surface-secondary">
              {tour.meals}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Read current tour-included component**

Run: Read `src/components/tour-included/index.tsx` to see exact current structure.

- [ ] **Step 4: Update tour-included with journal card treatment**

```tsx
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {waveStagger} from '@/utils/motion-variants';
import type {Tour} from '@/types';

interface TourIncludedProps {
  tour: Tour;
}

export default function TourIncluded({tour}: TourIncludedProps) {
  const t = useTranslations('tourDetail');

  if (!tour.included && !tour.excluded) return null;

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
    >
      <h2 className="type-headline-sm text-on-surface mb-6">
        {t('included.title')}
      </h2>
      <div className="relative rounded-xl p-6 elevation-1 texture-grain-warm rotate-[-0.2deg] hover:rotate-0 transition-transform duration-300">
        {/* Decorative tape */}
        <div className="absolute -top-1.5 left-8 w-12 h-4 bg-secondary/20 rounded-sm rotate-[1deg]" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {tour.included && (
            <div>
              <h4 className="type-title-sm font-semibold text-secondary mb-3">
                {t('included.included')}
              </h4>
              <ul className="space-y-2">
                {tour.included.map((item, i) => (
                  <motion.li
                    key={i}
                    custom={i}
                    variants={waveStagger(0.06)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true}}
                    className="flex items-start gap-2 type-body-sm text-on-surface-secondary"
                  >
                    <i className="fa fa-check text-secondary mt-0.5 shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
          {tour.excluded && (
            <div>
              <h4 className="type-title-sm font-semibold text-red-500 mb-3">
                {t('included.excluded')}
              </h4>
              <ul className="space-y-2">
                {tour.excluded.map((item, i) => (
                  <motion.li
                    key={i}
                    custom={i}
                    variants={waveStagger(0.06)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true}}
                    className="flex items-start gap-2 type-body-sm text-on-surface-secondary"
                  >
                    <i className="fa fa-times text-red-400 mt-0.5 shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/tour-notes/index.tsx src/components/tour-included/index.tsx
git commit -m "feat: journal-note styling for tour notes and included sections"
```

---

## Task 11: Tour CTA — Magnetic Buttons with Press States

**Files:**

- Modify: `src/components/tour-cta/index.tsx`

- [ ] **Step 1: Read current tour-cta component**

Run: Read `src/components/tour-cta/index.tsx` to see exact structure.

- [ ] **Step 2: Update with magnetic effect and satisfying press states**

```tsx
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useMagnetic} from '@/hooks/use-magnetic';
import type {Tour} from '@/types';

interface TourCTAProps {
  tour: Tour;
}

export default function TourCTA({tour}: TourCTAProps) {
  const t = useTranslations('tourDetail');
  const whatsappMagnetic = useMagnetic(0.3, 80);
  const emailMagnetic = useMagnetic(0.3, 80);

  const whatsappUrl = `https://wa.me/${tour.whatsapp?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t('cta.whatsappMessage', {tour: tour.title}))}`;
  const emailUrl = `mailto:${tour.email}?subject=${encodeURIComponent(t('cta.emailSubject', {tour: tour.title}))}`;

  return (
    <div className="space-y-3 mb-5">
      {/* WhatsApp button */}
      <motion.a
        ref={whatsappMagnetic.ref as React.RefObject<HTMLAnchorElement>}
        onMouseMove={whatsappMagnetic.onMouseMove}
        onMouseLeave={whatsappMagnetic.onMouseLeave}
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{x: whatsappMagnetic.x, y: whatsappMagnetic.y}}
        whileHover={{scale: 1.02}}
        whileTap={{scale: 0.97}}
        className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg type-title-sm font-semibold bg-[#25D366] text-white elevation-2 hover:elevation-3 transition-shadow cursor-pointer"
      >
        <i className="fa fa-whatsapp text-lg" />
        {t('cta.whatsapp')}
      </motion.a>

      {/* Email button */}
      <motion.a
        ref={emailMagnetic.ref as React.RefObject<HTMLAnchorElement>}
        onMouseMove={emailMagnetic.onMouseMove}
        onMouseLeave={emailMagnetic.onMouseLeave}
        href={emailUrl}
        style={{x: emailMagnetic.x, y: emailMagnetic.y}}
        whileHover={{scale: 1.02}}
        whileTap={{scale: 0.97}}
        className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg type-title-sm font-semibold bg-primary text-on-primary elevation-2 hover:elevation-3 transition-shadow cursor-pointer"
      >
        <i className="fa fa-envelope" />
        {t('cta.email')}
      </motion.a>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/tour-cta/index.tsx
git commit -m "feat: CTA buttons with magnetic effect and press states"
```

---

## Task 12: Tour Detail Page — Sidebar Elevation & Texture

**Files:**

- Modify: `src/pages/tours/[slug].tsx`

- [ ] **Step 1: Update sidebar wrapper with elevation-3 and paper texture**

In `src/pages/tours/[slug].tsx`, locate the desktop sidebar (around line 94-113 — the `hidden lg:block` section with `sticky top-24`):

Replace:

```tsx
<aside className="hidden lg:block lg:w-1/3">
  <div className="sticky top-24">
```

With:

```tsx
<aside className="hidden lg:block lg:w-1/3">
  <div className="sticky top-24 rounded-xl elevation-3 p-6 texture-grain-warm">
    <div className="relative z-10">
```

And close the extra `div` after the sidebar content:

```tsx
    </div>
  </div>
</aside>
```

Remove individual `border border-border-subtle rounded-xl p-5 mb-5` from the child components (TourPricing, TourDetails, TourPayment, TourNotes) since the sidebar wrapper now provides the container styling. Keep `mb-5` for spacing between them.

- [ ] **Step 2: Update mobile sticky CTA bar with elevation**

Locate the mobile CTA bar (around line 118-151, the `fixed bottom-0` section). Replace `shadow-lg` with `elevation-3`:

```tsx
<div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface-elevated border-t border-border elevation-3">
```

- [ ] **Step 3: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/pages/tours/[slug].tsx
git commit -m "feat: tour detail sidebar with elevation-3 and paper texture"
```

---

## Task 13: Public Texture Assets & Gitignore

**Files:**

- Modify: `.gitignore` (add .superpowers/)
- Copy SVG assets to public directory for URL references

- [ ] **Step 1: Copy SVG textures to public directory**

```bash
mkdir -p public/textures
cp src/assets/textures/lotus-watermark.svg public/textures/
cp src/assets/textures/lantern-watermark.svg public/textures/
cp src/assets/textures/border-pattern.svg public/textures/
```

- [ ] **Step 2: Add .superpowers/ to .gitignore**

Append to `.gitignore`:

```
# Superpowers brainstorm sessions
.superpowers/
```

- [ ] **Step 3: Verify dev server renders textures**

Run: `pnpm build 2>&1 | tail -10`
Expected: Build succeeds, no missing asset errors.

- [ ] **Step 4: Commit**

```bash
git add public/textures/ .gitignore
git commit -m "chore: add public texture assets and ignore .superpowers directory"
```

---

## Task 14: Visual QA & Polish Pass

**Files:**

- Potentially modify any file from previous tasks

- [ ] **Step 1: Run full production build**

Run: `pnpm build`
Expected: Clean build with no errors or warnings.

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: No lint errors.

- [ ] **Step 3: Start dev server and visually verify homepage**

Run: `pnpm dev`
Check:

- Hero has asymmetric layout with cursor spotlight working
- Destinations section has warm texture, staggered card reveals
- Tour cards have 3D tilt on hover with elevation transition
- Video section is 60/40 split
- Border pattern divider visible between sections

- [ ] **Step 4: Visually verify tour detail page**

Navigate to any tour detail page. Check:

- Hero has cursor spotlight and clip-path title reveal
- Itinerary has winding road path that draws on scroll
- Sidebar floats with elevation-3
- Notes/included have journal-note aesthetic with tape decorations
- CTA buttons have magnetic pull and press states

- [ ] **Step 5: Fix any visual issues found**

Address any issues discovered during visual QA. Common fixes:

- Z-index conflicts with texture pseudo-elements (ensure content has `relative z-10`)
- Texture opacity too strong/weak (adjust percentages)
- Elevation shadows not visible in dark mode (may need dark mode shadow variants)

- [ ] **Step 6: Final commit if fixes were needed**

```bash
git add -u
git commit -m "fix: visual QA polish adjustments"
```
