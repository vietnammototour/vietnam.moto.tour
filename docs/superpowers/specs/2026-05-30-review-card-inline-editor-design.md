# Review Card — Inline Editor + TripAdvisor Redesign

**Date:** 2026-05-30
**Status:** Approved (brainstorm), pending spec review
**Builds on:** [2026-05-30-tripadvisor-reviews-design.md](./2026-05-30-tripadvisor-reviews-design.md)

## Goal

Re-engineer `ReviewCard` so the **same component** serves two modes:

1. **Display** (default, public) — the tour page and home page render it read-only, exactly as today.
2. **Inline editor** (admin) — the admin create/edit screen renders the same card inside an `EditableProvider`, and the on-card fields become editable in place (WYSIWYG). Admins edit the real widget, so what they change is exactly what visitors see.

Also: a visual redesign that keeps the site's **"Apex Cinematic Tactical"** frame (dark, 0px radius, mono, 1px borders) but injects **firm TripAdvisor-green accents**.

## Decisions (from brainstorm)

- **Visual direction:** tactical frame + firm TA-green accent (not a white/rounded TA-faithful card). Firm colors = mustard rating stars + green "verified" badge + green provenance mark, on dark.
- **Admin edit model:** card-as-inline-editor for on-card fields + a slim meta bar for off-card controls. The stacked `ReviewForm.tsx` is retired (its `form-utils` is kept).
- **New + edit** both use the card editor (consistent).
- **Mechanism:** reuse the existing `useEditable()` / `EditableProvider` pattern (the one `GeneralTab` uses to edit a live `TourHero`).

## Architecture

### Editable-aware ReviewCard

- `ReviewCard` calls `useEditable()` (from `src/components/Admin/EditableContext`).
  - No provider in the tree → static display (public). Unchanged behavior.
  - Inside `EditableProvider` → on-card fields render editable and emit `onFieldChange(path, value)`.
- `ReviewCard` gains no new required props; editability is derived from context. (An explicit `editable` prop is NOT added — context is the single source of truth, matching `TourItinerary`/`GeneralTab`.)

### Shared EditableText

- Extract the `EditableText` helper currently local to `src/components/TourItinerary/TourItinerary.tsx` into `src/components/Admin/EditableContext/EditableText.tsx` (exported from the barrel).
- One `contentEditable` text field: static `<span>`/`<p>` when not editable; editable with a dashed-underline affordance and `onBlur`/input → `onFieldChange(path, value)` when editable.
- `TourItinerary` is refactored to import the shared `EditableText` (removes duplication; no behavior change).

### ReviewCardEditor (admin)

- New `src/components/Admin/ReviewCardEditor/ReviewCardEditor.tsx`:
  - Owns react-hook-form (`useForm` with `buildReviewSchema` + `reviewFormDefaults`).
  - Renders `<EditableProvider locale onFieldChange={mapPathToRhf}>` wrapping `<ReviewCard review={draftFromValues} />`.
  - `onFieldChange(path, value)` maps the card field path to the RHF field and `setValue(..., {shouldDirty:true})`.
  - Renders the **slim meta bar**: tour `Select`, Featured checkbox, display-order `NumberInput`, Save (`primary`) / Cancel (`secondary`). Save runs `handleSubmit` → validates → `toReviewPayload` → calls the page's `onSubmit`.
  - Validation errors surface in the meta bar (list) and, where practical, inline.
- Co-located `ReviewCardEditor.form-utils.ts` is NOT needed — it reuses `ReviewForm.form-utils.ts` (schema/defaults/payload retained). `ReviewForm.tsx` is deleted.

### Field affordances

On-card, editable-only:
- `reviewerName`, `reviewerLocation`, `title`, `body` → shared `EditableText`.
- `rating` → interactive `StarRating` (`onRate` → `onFieldChange('rating', n)`).
- `reviewDate` → compact inline `<input type="date">` (edit mode only).
- `avatarUrl` → click avatar → inline URL input beneath; live-previews in the square frame.
- `images` → square tiles + "+ Add photo URL" / remove (existing widget), each backed by a URL input in edit mode.
- `sourceUrl` → the verified row gains an inline URL input in edit mode.

Slim meta bar (off-card): `tourId` select, `isFeatured` toggle, `displayOrder`, Save/Cancel.

## Visual Redesign

Tactical frame + firm TA accents. Token-pure (no hardcoded hex); 0px radius (no `rounded`).

- **New token:** `--color-tripadvisor` — TripAdvisor mint-green in OKLCH (e.g. `oklch(0.82 0.15 165)`), added to `src/styles/globals.css` theme and exposed as Tailwind `tripadvisor` color. Used for the provenance mark + verified badge.
- **Card:** `bg-surface-alt`, `border border-border`, 0-radius.
- **Provenance header:** top row — `TripAdvisorIcon` (existing) owl + `TRIPADVISOR` mono-uppercase label in `text-tripadvisor`.
- **Identity row:** square `ReviewerAvatar` (md) + name (Hanken bold) + location (mono); `reviewDate` (mono) right-aligned.
- **Rating:** `StarRating` mustard (`text-primary`), bold size.
- **Title:** prominent (Hanken, `text-on-surface`). **Body:** `text-on-surface-secondary`, readable, line-length bounded.
- **Photos:** square tiles (existing pattern).
- **Verified action:** firm green chip — `border border-tripadvisor/50 text-tripadvisor`, owl + label + arrow, `target="_blank" rel="noopener noreferrer"` → `sourceUrl`. Replaces the small tan link.
- **Edit affordance:** editable fields show a dashed bottom border (`border-b border-dashed border-outline`) in edit mode.

## Admin Pages

- `src/pages/admin/reviews/new.tsx` and `[id].tsx` render `<ReviewCardEditor mode tours defaults onSubmit />` instead of `<ReviewForm>`. getServerSideProps unchanged (tours options, review for edit).
- Delete `src/components/Admin/ReviewForm/ReviewForm.tsx`; keep `ReviewForm.form-utils.ts` (+ its spec).

## ADMIN.md Rule (new)

Add to `.claude/ADMIN.md`:

> **Edit/create UIs are built on the public widget.** When a domain object has a public-facing component (a card, hero, row, badge), its admin create/edit screen MUST render that same component inside `EditableProvider` for inline WYSIWYG editing. Only off-widget fields (relations, status flags, ordering, save/cancel) belong in a slim meta bar. Do not build a parallel stacked form that re-lists the widget's fields — that duplicates layout and hides what is actually being edited.
>
> **How:** the public component consumes `useEditable()` and renders `EditableText` (or an interactive control) for each field; the admin editor wraps it in `EditableProvider` and maps `onFieldChange(path, value)` into form state. See `ReviewCardEditor` + `ReviewCard`, and `GeneralTab` + `TourHero`.

## CLAUDE.md Rule (new)

Add a "Verification" rule to `CLAUDE.md`:

> **Verify UI with a real browser.** After building or changing a component/widget, verify it renders by driving it in Playwright (the configured `@playwright/mcp` server), not by reading code alone. For integration changes (data flow, getServerSideProps, admin save), run the app on localhost and verify the path end-to-end with the headless browser. A green unit test is not sufficient evidence that a widget renders correctly.

## Testing & Verification

Unit (Jest + RTL, no CSS assertions):
- `ReviewCard` display mode — existing specs stay green (no provider → static).
- `ReviewCard` editable mode — rendered inside `EditableProvider`: editable fields present; editing a field calls `onFieldChange` with the correct path + value; clicking a star emits `rating`.
- Shared `EditableText` — static vs editable; emits on blur/change with the field path.
- `ReviewCardEditor` — Save with invalid data is blocked and shows the error; valid data calls `onSubmit` with the `toReviewPayload` shape.
- `ReviewForm.form-utils` specs unchanged.

Playwright (per the new CLAUDE.md rule), against `pnpm dev` on localhost:
- Public tour page `/tours/{slug}` — screenshot the redesigned card; confirm provenance mark, mustard stars, green verified chip, square avatar, 0-radius.
- Admin `/admin/reviews/new` and `/admin/reviews/{id}` — confirm the card renders as editor, inline-edit a field, click a star, Save persists; confirm the list still shows stars + avatar.
- Static guards: `pnpm exec tsc --noEmit`, `pnpm lint:design` (token purity / no `rounded`), `pnpm exec jest`.

## Out of Scope

- Changing the Review data model / API (no schema changes).
- TripAdvisor-faithful white/rounded styling (explicitly rejected).
- Auto-import from TripAdvisor.
- Applying the inline-editor pattern retroactively to other admin forms (the ADMIN.md rule governs *new* work; existing forms migrate opportunistically, not in this spec).
