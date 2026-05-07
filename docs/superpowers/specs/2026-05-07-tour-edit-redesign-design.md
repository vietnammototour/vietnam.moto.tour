# Tour Edit Page Redesign — Shared Locale + Live Previews

## Context

The admin Tour edit page (`/admin/tours/[id]/edit`) currently has three friction points:

1. **Locale UX is fragmented.** `ItineraryTab` and `PricingTab` each own their own `LocalePicker` with local state. The `GeneralTab` doesn't switch — it shows EN and VI fields side-by-side as duplicated inputs (`titleEn` + `titleVi`, `descriptionEn` + `descriptionVi`).
2. **No preview.** Editors can't see how their changes will look on the public site without saving and navigating.
3. **Inconsistency with Destination edit.** `DestinationEditTabs` already implements a single shared `LocalePicker` in the tabs header, threaded down via prop. Tour edit should mirror this.

The redesign unifies locale UX and adds live previews of the public-facing `TourCard` and `TourDetails` widgets in the General tab.

## Scope

Affects only the Tour admin edit page and the `TourCard` component. No API, schema, or public-page changes.

## Design

### 1. Shared LocalePicker

Lift `locale` state from per-tab to the `TourEditTabs` container. Render `<LocalePicker value={locale} onChange={setLocale} />` in the tabs header, mirroring `DestinationEditTabs.tsx:84-85`.

Thread `locale: VMT.Locale` as a prop to `GeneralTab`, `ItineraryTab`, and `PricingTab`. Highlights tab is unaffected (no localized fields).

Delete:

- Local `useState` and `<LocalePicker>` from `ItineraryTab.tsx`
- Local `useState` and `<LocalePicker>` from `PricingTab.tsx`

### 2. GeneralTab — collapse duplicate fields

Replace the `titleEn` + `titleVi` field pair with a single rendered `title` input bound to either `titleEn` or `titleVi` based on the active `locale` prop. Same treatment for `descriptionEn` + `descriptionVi`.

Pattern matches `DestinationGeneralForm.tsx:44-45`:

```ts
const titleField = locale === 'en' ? 'titleEn' : 'titleVi';
const descField = locale === 'en' ? 'descriptionEn' : 'descriptionVi';
```

Label suffix `(EN)` / `(VI)` follows locale.

The `GeneralTab.form-utils.ts` yup schema retains both `titleEn`/`titleVi`/`descriptionEn`/`descriptionVi` keys — only the rendered field switches. Submit payload is unchanged; no API changes.

### 3. Preview panel — General tab right rail

General tab layout becomes a two-column grid on `lg` and up:

- Left (~⅔ width): existing form
- Right (~⅓ width, sticky): `TourPreviewPanel`

On `<lg` viewports, columns stack (preview below form).

`TourPreviewPanel` stacks two widgets vertically:

1. `TourCard` (interactive=false variant)
2. `TourDetails`

Both are wired via react-hook-form `useWatch()` so they update live as the editor types or uploads. The panel constructs an in-memory `VMT.Tour`-shaped object from the watched form values + active `locale`.

Image preview source resolution:

- `imageCard` field is an `imageSlot` shape (variants: `empty`, staged blob, persisted URL).
- When the slot has a staged blob, use the blob's object URL.
- When persisted, use the saved URL.
- When empty, fall back to the existing placeholder rendered by `TourCard`.

### 4. TourCard — non-interactive variant

`TourCard.tsx` currently always renders inside `<Link>` and applies `useCardTilt`. For preview use, add an `interactive?: boolean` prop (default `true`).

When `interactive === false`:

- Render the root as a `<div>` instead of `<Link>` (no navigation).
- Skip `useCardTilt` and motion transforms.

Default `true` preserves all existing public usages with no changes.

### 5. New component

`src/components/Admin/TourPreviewPanel/`

- `index.ts` — re-export
- `TourPreviewPanel.tsx` — implementation
- `TourPreviewPanel.spec.tsx` — tests

Props:

```ts
type Props = {
  control: Control<GeneralTabFormData>;
  locale: VMT.Locale;
  destinationName: string;
};
```

Uses `useWatch({control})` to subscribe to form state. Constructs `VMT.Tour` shape and renders the two preview widgets.

## Files to Modify

- `src/components/Admin/TourEditTabs/TourEditTabs.tsx` — lift locale, add LocalePicker to header, thread prop
- `src/components/Admin/tabs/GeneralTab/GeneralTab.tsx` — accept locale prop, collapse title/description rendering, add preview panel column
- `src/components/Admin/tabs/GeneralTab/GeneralTab.form-utils.ts` — schema unchanged (keep both locale keys)
- `src/components/Admin/tabs/ItineraryTab/ItineraryTab.tsx` — remove local LocalePicker + state, accept prop
- `src/components/Admin/tabs/PricingTab/PricingTab.tsx` — remove local LocalePicker + state, accept prop
- `src/components/TourCard/TourCard.tsx` — add `interactive` prop, conditional Link/tilt
- `src/components/TourCard/TourCard.spec.tsx` — add coverage for non-interactive mode

## Files to Create

- `src/components/Admin/TourPreviewPanel/index.ts`
- `src/components/Admin/TourPreviewPanel/TourPreviewPanel.tsx`
- `src/components/Admin/TourPreviewPanel/TourPreviewPanel.spec.tsx`

## Reused Code

- `LocalePicker` — `src/components/Admin/LocalePicker/LocalePicker.tsx` (already used by Destination edit)
- `TourDetails` — `src/components/tour-detail/TourDetails/TourDetails.tsx` (drop-in, locale-aware via `next-intl`)
- `TourCard` — `src/components/TourCard/TourCard.tsx` (extended with `interactive` prop)
- `useWatch` from react-hook-form for live values
- `VMT.Tour` domain type — `src/domain/tour/index.ts`

## Verification

1. `pnpm dev` and navigate to `/admin/tours/<id>/edit` for any existing tour.
2. **Shared LocalePicker:** confirm a single LocalePicker appears in the tabs header. Switch EN ↔ VI. Confirm only one set of title/description fields renders in General, and Itinerary/Pricing localized content swaps with the shared switcher.
3. **No duplicate fields:** confirm `Description (EN)` + `Description (VI)` pair is gone from General; only one `Description (EN|VI)` shows based on switcher.
4. **Live preview:**
   - Edit `title` — `TourCard` title updates live.
   - Edit `price`, `duration`, `distance` — both widgets update live.
   - Edit `transportation`, `groupSize`, `hotel`, `guided` — `TourDetails` rows update live.
   - Upload a new card image — `TourCard` shows the blob preview before save.
   - Switch locale — title in `TourCard` and labels in `TourDetails` swap.
5. **TourCard public page unchanged:** visit `/tours` listing and a tour detail page; cards still link and tilt as before (interactive default).
6. `pnpm test` — all suites pass, including new `TourPreviewPanel.spec.tsx` and updated `TourCard.spec.tsx`.
7. `pnpm build` — type check passes.
