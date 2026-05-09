# Admin General Tab — Inline-Edit Redesign

**Status:** Design approved 2026-05-09
**Author:** brainstorm session

## Problem

The admin Tour edit page's General tab presents a left-column form + right-column preview. The form duplicates information that is already rendered by the public tour detail components, splitting attention between "what I'm editing" and "what users see." Other tabs (Itinerary, Pricing) already use a WYSIWYG pattern: render the public component wrapped in an `EditableProvider`, with always-on inline inputs. General is the odd one out.

## Goal

Rewrite the General tab so that what the admin sees matches the public tour detail page, with every visible property inline-editable. The page must still read as **part of the admin workspace** — not as a standalone preview — so the admin never loses orientation.

## Non-goals

- No change to data model, API contracts, or save semantics for tours.
- No change to other tabs (Itinerary, Pricing, Highlights, Perks).
- No mobile-only layout work beyond what `TourHero` / `TourDescription` already do.
- No autosave; submission stays explicit.

## Layout

### Admin frame (above tab body)

- Breadcrumbs: `Admin / Tours / [slug ✏]`. The last segment is inline-editable: pencil icon on hover; click swaps it to a `TextInput` bound to the General form's `slug` field. Pressing Enter or blur returns to display mode. The slug only persists on Save General; URL is not rewritten until reload.
- Right side: existing EN/VI locale toggle + `Back to Tours` button.
- **Status pill is removed from this page.** Status remains editable on the tour listing page.
- Tabs row: `General | Card | Itinerary | Pricing | Highlights | Perks`. `Card` is new.

### General tab body (no sidebar — full width)

1. **Hero banner** — render `TourHero` with edit affordances supplied by `useEditable`:
   - Background image = `destinationHeroImage` from the currently selected destination (auto-driven by the destination select; not editable here).
   - **Destination `<Select>`** overlaid top-left of the hero, styled as a chip on the dark gradient. Changing it updates the form's `destinationId` and swaps the hero background live.
   - Title (`h1`) — always-on inline input styled as the hero heading. Bound to `title`.
   - Meta row — always-on inline inputs for `duration` (number), `distance` (number), `transportation` (text). The destination label is read-only here, mirroring the select.

2. **Article body** (full width, max content width matches public page, no sidebar):
   - `TourDescription` rendered with an editable textarea. Locale-aware: writes to `descriptionEn` or `descriptionVi` based on the active EN/VI toggle.
   - Trailing details block: `hotel` + `guided`, styled to match the public `TourDetails` row treatment.

3. **Footer** — single `Save General` button + `isDirty` warning. Same react-hook-form instance, same Yup schema as today minus `imageCard`.

### Card tab (new)

- `ImageUploadField` for the card image (slot `card`).
- Live `TourCard` preview using a snapshot of the General form state (read via shared parent or via a parent-held tour object).
- Own submit, flushes image slot only.

## Edit pattern

Always-on inline inputs styled to match the display text they replace. The same `EditableProvider` pattern used by `ItineraryTab` and `PricingTab` is extended to two new consumers:

- `TourHero` reads `useEditable()`. When editable, the title and meta row render styled inputs; when not, normal display.
- `TourDescription` reads `useEditable()`. When editable, prose becomes a textarea; otherwise rendered text.

`TourPreviewPanel` is deleted.

## Embedded feel — admin context cues

The page must visually read as part of the admin workspace, not as a public preview embedded into admin chrome.

- **Container framing.** Hero + body render inside the admin content frame's padding and border, not full-bleed. Hero corners rounded to match the admin card style.
- **Persistent edit-state styling.** Every editable element carries a subtle treatment: dashed underline, `hover:bg-surface-elevated/50` tint, focus ring uses the admin primary token (distinct from the public-page primary).
- **Field labels on hover/focus.** Inline-edited fields lose their form labels; a small tag ("Title", "Distance", etc.) appears on hover or focus to disambiguate.
- **Pencil icon affordance.** Shown on hover for every editable region (slug breadcrumb, hero title, meta items, description, hotel/guided). One icon, one meaning.
- **Admin chrome remains visible.** Breadcrumbs, tab nav, and language toggle stay above the hero. Hero never visually covers admin nav.
- **Public-only UI is hidden in editable mode.** Components consult `useEditable()` and suppress: WhatsApp/Email CTAs, the mobile sticky bottom bar, and the pricing CTA. (These already only appear on parent pages that include them, but `TourHero` itself includes a price chip — gate it on `!editable`.)
- **Global dirty indicator.** While the form is dirty, an `Unsaved changes` chip pins near the tab nav, in addition to the existing footer marker.

## Save semantics

- **General Save.** Submits text fields only. Same schema as today minus `imageCard`. `react-hook-form`'s `isDirty` drives the dirty indicator.
- **Card Save.** Flushes the image slot via `flushImageSlots` only. No text fields.
- The slug edited via the breadcrumb is part of the General form state and persists on General Save.

## Components affected

- `src/components/admin/tabs/GeneralTab/GeneralTab.tsx` — rewrite. Replace form fields with `EditableProvider`-wrapped `TourHero` + `TourDescription` + trailing hotel/guided block.
- `src/components/admin/tabs/GeneralTab/GeneralTab.form-utils.ts` — drop `imageCard` from schema and types.
- `src/components/TourHero/TourHero.tsx` — read `useEditable()`; render title + meta as inputs when editable; suppress price/CTA UI when editable.
- `src/components/tour-detail/TourDescription/` — read `useEditable()`; render textarea when editable.
- `src/components/admin/TourEditTabs/TourEditTabs.tsx` — add `Card` tab between General and Itinerary.
- `src/components/admin/AdminBreadcrumbs/` — accept an inline-editable last segment with pencil affordance bound to a form field.
- New `src/components/admin/tabs/CardTab/` (`CardTab.tsx`, `CardTab.form-utils.ts`, `index.ts`) — image upload + `TourCard` preview + image-only submit.
- `src/components/admin/TourPreviewPanel/` — delete.

## Open mechanics (resolve in plan)

- **Hero image swap.** When destination changes, the hero needs the new destination's hero image without a full reload. Either pass all destinations with their hero images into the General tab as props, or fetch on demand. Pre-pass is simpler if the list is small.
- **Inline-edit styling on dark hero.** Existing `TextInput`/`NumberInput` assume light surface. The hero needs a transparent-bg variant with white text and an underline-only treatment, or a one-off styled input contained inside `TourHero`. Pick one approach in the plan.
- **Slug-edit URL drift.** The route reflects the saved slug; editing in the breadcrumb does not rewrite the URL. The breadcrumb must clearly tie its display value to the form state, not to the URL, so the admin doesn't think the field is broken.
- **`useEditable()` consumers' default behavior.** When the context is absent (public pages), components must behave exactly as today. New code paths gate on `editable === true`.

## Out of scope

- Per-field autosave.
- A WYSIWYG-with-toolbar rich text editor for descriptions (textarea is enough).
- Drag-and-drop reordering of any element on this tab.
- Status workflow changes.
