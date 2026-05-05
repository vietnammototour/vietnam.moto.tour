# Destination Edit Page Redesign

## Overview

Redesign the admin destination edit page to provide live visual previews for images using actual production components. Add a locale segmented picker to eliminate duplicate fields.

## Tab Structure

```
[ General ] [ Card Image ] [ Highlights ]                    [ EN | VI ]
```

- Tabs on the left, locale segmented picker on the right (same row)
- Locale picker persists across all tabs — controls which language is being edited/previewed
- Tab order: General → Card Image → Highlights

## Locale Segmented Picker

- Position: right-aligned in the tab bar row
- Appearance: iOS-style segmented control (EN | VI)
- Scope: controls the entire destination entity
- Affects: all text fields, hero preview text, card preview text, highlights

**Field classification:**

- Locale-independent (always visible): Slug
- Locale-dependent (swap on toggle): Name, Description

## General Tab

**Fields (top section):**

- Slug (text input)
- Name (text input — content changes with locale picker)
- Description (textarea — content changes with locale picker)

No card image upload. No size dropdown. Text-only form fields.

**Hero Image Preview (bottom section, below divider):**

- Renders the actual `TourHero` component from `src/components/tour-hero/index.tsx`
- Props: destination hero image URL, destination name (in selected locale), preview mode flag
- Minimal text — focus is on how the image looks under the hero treatment (gradient overlay, spotlight effect)
- Spotlight cursor effect remains active (demonstrates the interactive overlay)
- Breadcrumb nav and tour metadata (duration, distance, price) hidden in preview mode
- "Change Image" button overlaid on top-right corner of the preview
- Clicking "Change Image" triggers the image upload flow (same WebP compression as current)

## Card Image Tab

**Controls row (top):**

- Left: "Card Size:" label + segmented toggle (Small | Big)
- Right: "Change Card Image" button

**Grid Preview (below controls):**

- Renders the actual home page masonry grid layout
- Uses actual `DestinationCard` component from `src/components/destination-card/index.tsx` for the edited destination
- Other grid slots: generic placeholder cards (gray, "Destination" label centered)

**Size toggle behavior:**

- **Big**: edited card at position 1 (grid-column: span 2, grid-row: span 2)
- **Small**: edited card at position 2 (standard 1×1 cell), placeholder takes position 1 (2×2)

**Visual indicators on the active card:**

- Red border (primary color)
- "EDITING" badge in top-left corner

**Data flow:**

- Card image updates immediately on upload
- Size toggle persists to DB (replaces the old dropdown from General tab)
- Locale picker changes the name displayed on the card

## Highlights Tab

No structural changes. Locale picker applies — shows highlights in selected locale only (instead of showing both languages).

## Architecture: Approach A — Embedded Components with Props Override

Reuse actual production components (`TourHero`, `DestinationCard`) directly in admin page. Create thin wrapper components for admin-specific concerns.

**New components:**

- `HeroImagePreview` — wraps `TourHero`, adds "Change Image" button overlay, passes destination data as props
- `CardImagePreview` — wraps masonry grid + `DestinationCard`, adds size toggle, upload button, placeholder cards

**Modifications to existing components:**

- `TourHero`: accept optional prop overrides to render with minimal/custom data (just image + name, no tour metadata)
- `DestinationCard`: no changes needed — already accepts destination data as props
- `DestinationEditTabs`: restructure to new tab layout, add locale picker state, remove image/size fields from General

**State management:**

- Locale state lives in `DestinationEditTabs` (parent of all tabs)
- Size state managed in Card Image tab, persisted on change
- Image URLs update in-place after upload (with cache busters)

## Component Hierarchy

```
DestinationEditTabs
├── TabBar
│   ├── Tabs (General | Card Image | Highlights)
│   └── LocalePicker (EN | VI)
├── GeneralTab
│   ├── TextFields (slug, name, description)
│   └── HeroImagePreview
│       └── TourHero (actual component, minimal props)
├── CardImageTab
│   ├── ControlsRow (size toggle + upload button)
│   └── MasonryGridPreview
│       ├── DestinationCard (actual component, highlighted)
│       └── PlaceholderCard × 4
└── HighlightsTab (existing, locale-aware)
```

## Image Upload Flow

No changes to the upload mechanism. Same `ImageUploadField` logic:

- Compress to WebP (max 1920px, quality 0.8)
- Upload via existing API route
- Update preview immediately with cache-busted URL
- Disabled state until entity is saved

The upload trigger is just relocated — from inline form fields to overlay buttons on the preview components.
