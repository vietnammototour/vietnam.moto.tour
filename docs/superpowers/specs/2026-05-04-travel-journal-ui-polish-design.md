# Travel Journal UI Polish — Design Spec

## Overview

Transform the Vietnam Moto Tour website from a well-structured but flat template feel into a distinctive "travel journal brought to life" experience. Focus on homepage and tour detail page as hero pages, establishing patterns that can propagate later.

**Brand direction:** Southeast Asian fusion — Vietnamese visual culture (patterns, textures, motifs) integrated into motorcycle adventure aesthetic.

**Key design pillars:**

- Textured backgrounds & grain (tactile, journal-like)
- Elevation system with realistic shadows (depth, physicality)
- Asymmetric layouts (energy, visual tension)
- Cursor-aware effects (life, interactivity)
- Vietnamese-inspired motion language (brand in motion)

## Scope

**In scope:** Homepage (`src/pages/index.tsx`), Tour Detail (`src/pages/tours/[slug].tsx`), shared foundation (design tokens, motion utilities, texture assets).

**Out of scope:** Other public pages (will inherit foundation later), admin panel, mobile-specific redesign (responsive behavior stays as-is, polish layers on top).

---

## 1. Visual Foundation

### 1.1 Texture System

**Paper grain overlay:**

- SVG noise texture applied as pseudo-element overlay on section backgrounds
- 3-5% opacity, alternating warm (amber-tinted) and cool (neutral) tones per section
- Implemented as reusable Tailwind utility or CSS class (e.g., `.texture-grain-warm`, `.texture-grain-cool`)

**Vietnamese pattern watermarks:**

- Decorative SVG motifs: lotus outlines, lantern silhouettes, traditional border patterns
- Applied at 2-4% opacity as background decorative elements
- Different motif per major section to avoid repetition
- Positioned asymmetrically (corners, edges) — not centered

**Dual surface treatment:**

- "Aged paper" warm sections (slight sepia/amber tint in background)
- "Clean linen" cool sections (neutral gray-white)
- Alternating rhythm between sections creates visual breathing

### 1.2 Elevation System (4 levels)

| Level | Use                              | Shadow                                                | Extras                 |
| ----- | -------------------------------- | ----------------------------------------------------- | ---------------------- |
| 0     | Flat content (text, labels)      | None                                                  | —                      |
| 1     | Cards, info boxes, resting state | Medium, warm-tinted (amber undertone in shadow color) | —                      |
| 2     | Hovered cards, active elements   | Large, warm-tinted + slight scale(1.02)               | Transition: 200ms ease |
| 3     | CTAs, sticky booking bar, modals | XL spread, primary-colored fringe                     | Prominent float feel   |

Shadow color: Not pure black. Use `rgba(180, 83, 9, 0.08)` base (derived from primary amber) for warmth.

### 1.3 Asymmetric Layout Rules

- **Hero sections:** Content offset 60/40 or 70/30, not centered
- **Tour cards:** Staggered grid with alternating large/small, not uniform columns
- **Feature sections:** Image bleeds past container edge on alternating sides
- **Container stays `max-w-7xl`** but inner content breaks center axis
- **Consistent rhythm:** Asymmetry follows a pattern (left-heavy, right-heavy, left-heavy) to avoid chaos

---

## 2. Motion & Interaction System

### 2.1 Cursor-Aware Effects

**Hero spotlight:**

- Radial gradient follows cursor position on hero sections
- Warm amber glow, ~200px radius, 15% opacity max
- "Flashlight on a map" metaphor
- Implementation: `mousemove` event → CSS custom properties for position → radial-gradient in pseudo-element
- Performance: Use `will-change: background` and throttle to rAF

**Magnetic buttons:**

- CTAs pull toward cursor when within 80px proximity
- Maximum shift: 2-3px translation
- Spring-back on mouse leave
- Apply to: primary CTAs, booking buttons, hero action buttons

**Card inner parallax:**

- Card child elements (image layer, text layer) shift at different rates on hover
- Image: 3-5px shift opposite to cursor direction
- Text: 1-2px shift toward cursor
- Creates depth "within" the card

### 2.2 Vietnamese-Inspired Motion Language

**Lantern sway (idle/float):**

- Easing: `cubic-bezier(0.45, 0.05, 0.35, 0.95)` with gentle overshoot
- Applied to: scroll-to-top button idle state, decorative floating elements, loading spinners
- Characteristics: pendulum-like, gentle, meditative

**Motorbike sweep (progress/transitions):**

- Easing: `cubic-bezier(0.7, 0, 0.2, 1)`
- Applied to: horizontal progress bars, page transitions, clip-path reveals
- Characteristics: fast start, confident deceleration — forward momentum

**Water flow (scroll reveals):**

- Staggered cascading timing with 80ms delays between items
- Wave-pattern entry: elements at edges enter slightly before center, or vice versa
- Applied to: card grids, list items, multi-element sections

### 2.3 Hover States

**Tour cards:**

- 3D tilt: max 4deg rotation based on cursor position within card
- Shadow transitions from Level 1 → Level 2
- Image zooms to 105% (contained within card overflow:hidden)
- Paper texture overlay fades slightly (reveals cleaner image)
- Transition: 300ms with spring-like easing

**Buttons:**

- Hover: scale(1.02) + shadow expansion + 1px Y-lift
- Press/active: scale(0.97) + shadow collapse (satisfying tactile "click")
- Transition: 150ms for press, 250ms for hover

**Navigation links:**

- Underline draws in from left using `scaleX` transform
- Uses motorbike-sweep easing (fast start)

### 2.4 Scroll Choreography

**Replace uniform `fadeInUp`** with varied, intentional entrances:

- Asymmetric content: enters from its offset side (left content from left, right image from right)
- Card grids: wave pattern with 80ms stagger
- Section titles: clip-path reveal left-to-right (motorbike-sweep easing)
- Decorative elements: fade in with lantern-sway Y-offset

---

## 3. Homepage Treatments

### 3.1 Hero Section

- **Layout:** 60/40 asymmetric — headline + subtitle + CTA aligned left, hero image bleeds right past container
- **Background:** Full-bleed Vietnam road photo, subtle grain overlay, dark gradient from left for text contrast
- **Cursor spotlight:** Active on entire hero area
- **Decorative:** Faint lotus pattern watermark bottom-right (3% opacity)
- **Entry animation sequence:**
  1. Background image fades in (300ms)
  2. Title clip-path reveals left-to-right (motorbike-sweep, 600ms)
  3. Subtitle fades in (200ms delay after title)
  4. CTA rises from below with lantern-sway overshoot (300ms delay)

### 3.2 Tour Cards Section

- **Layout:** Staggered grid — first card spans 2 columns (large feature), remaining cards smaller. Pattern alternates per row
- **Card treatment:** Paper texture background, Level 1 elevation resting
- **Hover:** 3D tilt + Level 2 shadow + inner image parallax
- **Scroll entry:** Wave pattern, 80ms stagger, alternating slight horizontal offset
- **Section divider:** Thin Vietnamese traditional border pattern along section top (decorative SVG)

### 3.3 Destinations Section

- **Layout:** Staggered vertical positioning — cards offset like photos pinned to a corkboard (not uniform grid)
- **Interaction:** Cursor proximity causes nearest card to lift (magnetic depth — within 120px, card gains 2px Y-translation)
- **Section background:** Warm "aged paper" texture with noise

### 3.4 Video/Features Section

- **Layout:** 60/40 — video left, feature cards stacked right (breaking current centered approach)
- **Feature cards:** Compact, Level 1 elevation, Vietnamese-inspired line icons
- **Video hover:** Scale 1.02 + shadow deepen, play button pulses with lantern-sway timing
- **Section background:** Cool "clean linen" texture (contrast with warm destinations section above)

### 3.5 CTA / Booking Section

- **Full-width warm background** with Vietnamese pattern watermark (lantern motif, 3% opacity)
- **Layout:** Asymmetric — text/headline left, action button right
- **Button:** Level 3 elevation, magnetic cursor pull, satisfying press state
- **Entry:** Text from left, button from right, meeting in middle

---

## 4. Tour Detail Page Treatments

### 4.1 Tour Hero

- **Full-bleed image** with grain overlay
- **Content overlaid at bottom-left** (asymmetric positioning, not centered)
- **Cursor spotlight** active on hero image
- **Title:** Large, enters with clip-path reveal on page load
- **Breadcrumb/meta:** Fades in 400ms after title settles

### 4.2 Itinerary Section

- **Road path timeline:** Replace vertical dots/line with winding road SVG that curves like Vietnamese mountain roads
- **Day cards:** Asymmetric, alternating left/right of road path
- **Scroll animation:** Road path draws itself (stroke-dashoffset) as user scrolls down
- **Day card reveal:** Each card enters when the road "reaches" it
- **Card treatment:** Subtle paper texture background, Level 1 elevation

### 4.3 Pricing/Booking Sidebar (Desktop)

- **Sticky positioning maintained** with Level 3 elevation — floats prominently above page
- **Paper texture** background within card
- **Buttons:** Magnetic cursor effect, satisfying press states (scale + shadow)
- **Price transitions:** Number changes animate (count up/down with spring easing) rather than instant swap

### 4.4 Gallery Section

- **Grid proportions unchanged** (current masonry layout preserved exactly)
- **Hover:** Image lifts to Level 2, slight tilt (2deg max), surrounding images dim 10%
- **Lightbox:** Clicked image expands from its grid position (shared element animation via Framer Motion `layoutId`)

### 4.5 Tour Notes / Included Section

- **Style:** Journal-note aesthetic — slightly off-grid alignment (1-2deg rotation on cards)
- **Card treatment:** Paper texture, decorative "tape" or "pin" elements at corners (CSS-only, pseudo-elements)
- **Icons:** Vietnamese-inspired line art where possible, replacing generic FontAwesome glyphs
- **Level 1 elevation** on cards

---

## 5. Technical Implementation Notes

### Assets Needed

- SVG noise/grain textures (generatable, no external deps)
- Vietnamese motif SVGs: lotus outline, lantern silhouette, traditional border pattern, winding road path (custom illustrations or traced from references)
- Vietnamese-inspired line icon set for tour features (8-12 icons)

### Performance Considerations

- Cursor effects: throttle to requestAnimationFrame, use CSS custom properties for position (avoids re-render)
- 3D tilt: use `transform: perspective(1000px) rotateX() rotateY()` with `will-change: transform`
- SVG road path: use Intersection Observer for scroll trigger, not scroll event listener
- Texture overlays: use CSS `background-image` with SVG data URIs (no network requests)
- Grain: single SVG, tiled via `background-repeat`

### Tailwind Integration

- New utilities: `elevation-1`, `elevation-2`, `elevation-3`
- New utilities: `texture-grain-warm`, `texture-grain-cool`, `texture-paper`
- Custom animation utilities: `animate-lantern-sway`, `animate-sweep`
- Add to `globals.css` design token section

### Framer Motion Patterns

- Replace uniform `fadeInUp` variant with section-specific variants
- New variants: `slideFromLeft`, `slideFromRight`, `clipReveal`, `waveStagger`
- Use `useMotionValue` + `useTransform` for cursor-aware effects
- `layoutId` for gallery lightbox shared element transition

---

## 6. What NOT to Change

- Overall page structure and routing
- Container widths and responsive breakpoints
- Gallery masonry grid proportions
- Color palette (primary amber, secondary teal) — already strong
- Typography utility system — already well-structured
- Mobile-first responsive patterns
- Dark mode token system
