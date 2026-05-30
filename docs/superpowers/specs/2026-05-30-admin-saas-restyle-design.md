# Admin SaaS Restyle — Design

**Date:** 2026-05-30
**Status:** Approved (design), pending implementation plan

## Goal

Restyle the whole admin scope to feel like a polished SaaS app:

1. **Sidebar + logged-in widget** — grouped nav, clearer active state, a bottom user widget (avatar + name + role + logout).
2. **Consistent grids** — multi-section lists must align columns across sections. Today each section is its own auto-width `<table>`, so columns (CC / Qty / Price…) drift between sections.
3. **Sticky search** — when a list has a search field it must stay visible while rows scroll.

## Decisions (locked during brainstorm)

- **Grid layout:** Option A — one continuous CSS-grid with section header **bands**, a single shared column template, one header row at the top. Flat (non-sectioned) lists are the same grid with a single implicit section (no band).
- **User widget:** bottom of sidebar — `Avatar` + name + role label + logout icon button (Linear/Vercel style).
- **Search placement:** inside the page header. The header already renders outside the scrollable content region, so header-resident search is sticky for free.
- **Avatar source:** real user photo (users already have `photo.url`); initials fallback when none (e.g. the seeded "VMT User").
- **Rollout:** build shared primitives, then migrate **all** list pages now.
- **Inline-edit pages (Perks, Translations):** **restyle chrome only** — keep their specialized inline editors; do NOT force them into DataGrid.

## Architecture

### New primitives

#### `Avatar` — `src/components/ui/Avatar/`
- Files: `index.ts`, `Avatar.tsx`, `Avatar.spec.tsx`.
- Props: `src?: string | null`, `name: string`, `size?: 'sm' | 'md' | 'lg'`, `alt?`.
- Renders `next/image` (or `<img>`) when `src` present; otherwise an initials badge derived from `name` (first letters of up to two words), deterministic background.
- No styling assertions in tests (per CLAUDE.md). Test: shows image when `src` set; shows initials when not.

#### `DataGrid` — `src/components/Admin/DataGrid/`
- Files: `index.ts`, `DataGrid.tsx`, `DataGrid.spec.tsx`, plus types in `DataGrid.types.ts`.
- One CSS-grid container. `gridTemplateColumns` built once from column `track` values → every row and every section share identical column tracks (this is what fixes alignment).
- Types:
  ```ts
  type GridColumn<T> = {
    key: string;
    header: ReactNode;
    track: string;            // grid track, e.g. 'minmax(0,1fr)' | '80px'
    align?: 'start' | 'end';
    render?: (row: T) => ReactNode;   // default: String(row[key])
  };
  type GridSection<T> = { id: string; label: ReactNode; count?: number; items: T[] };
  type DataGridProps<T> = {
    columns: GridColumn<T>[];
    sections?: GridSection<T>[];   // sectioned mode
    items?: T[];                   // flat mode (mutually exclusive with sections)
    rowKey: (row: T) => string;
    onRowClick?: (row: T) => void;
    emptyState?: ReactNode;
    ariaLabel?: string;
  };
  ```
- Section bands span all columns (`grid-column: 1 / -1`), show label + optional count.
- Header row sticky within the scroll container.
- `render` supports thumbnails, `Badge`, `StatusPicker`, action buttons, inline inputs — so existing per-cell behaviors port over via custom renderers.
- Action column = a normal column whose `render` returns the row's `Button`s (right-aligned).
- One component per file (CLAUDE.md): row/band/header render-helpers live in sibling files (e.g. `DataGrid.helpers.tsx`) if needed, not inline.

### AdminLayout restyle — `src/components/Admin/AdminLayout/AdminLayout.tsx`
- Nav grouped into **Content** (Dashboard, Tours, Reviews, Destinations, Rentals, Perks, Image collections) and **System** (Translations, Users, Roles, Backups). Group labels are small uppercase headings. Nav config extracted to a sibling (e.g. `AdminLayout.nav.ts`) to keep one component per file.
- Active item: left accent bar + tinted background.
- Bottom user widget replaces the current name + logout link: `Avatar` + name + role label + ghost icon logout button. Reused in both desktop sidebar and mobile drawer (shared `sidebarBody`).
- Mobile drawer + hamburger behavior unchanged.

### Session wiring (real avatar + role label)
- `src/lib/auth.ts`:
  - `authorize()` returns `imageUrl` (load the user's `image.url`) and a human role label alongside `orgRoleKey`.
  - `jwt` callback persists `imageUrl` (+ role label) onto the token.
  - `session` callback exposes `session.user.imageUrl` and the role label.
- `src/types/next-auth.d.ts`: extend `Session['user']`, `User`, and `JWT` with `imageUrl?: string | null` (+ role label field).
- Sidebar widget reads `useSession()` → `Avatar src={session.user.imageUrl}`.

### Sticky search — `AdminPageHeader`
- Add an optional `search` slot (and keep `actions`, `localeSwitcher`). Header lives in `AdminPageShell`'s non-scrolling top region → sticky automatically.
- Pages pass a search `<TextInput type="search">` into the slot. Backups' kind `SegmentedControl` and locale switchers share the header band.

## Migration plan (per page)

| Page | Action |
|------|--------|
| Dashboard | Chrome restyle only (stat cards stay) |
| Tours | DataGrid, sectioned by destination; Status cell = existing `StatusPicker`; title cell = thumbnail + link |
| Reviews | DataGrid, sectioned by tour; Avatar + StarRating + Featured cells; Edit/Delete action cell |
| Destinations | DataGrid flat; thumbnail + link, counts, Archive action |
| Users | DataGrid flat; `Avatar` cell, check-icon cells (core team / allow auth), Edit/Delete; add header search |
| Roles | DataGrid flat; Edit (opens existing modal) / Delete; keep modal create/edit |
| Image collections | DataGrid flat; Edit/Delete |
| Backups | DataGrid flat; kind `SegmentedControl` + (optional) search in header |
| Rentals | DataGrid, sectioned by type (Bikes/Scooters); move existing search into header (sticky) |
| **Perks** | **Restyle only** — keep inline-edit 2-col cards; adopt new section-header styling + shell |
| **Translations** | **Restyle only** — keep namespace sidebar + per-row Save; adopt new chrome + its existing search stays sticky |

Header search added where lists are long enough to benefit (Rentals already has one; Users/Tours/Reviews optional — confirm during planning).

## Data flow

- List pages keep their current data sources (react-query hooks or `api.admin.*` + `useState`). DataGrid is purely presentational — it receives already-fetched, already-grouped data and column defs. No data-layer changes except the session callback additions.
- Grouping stays in each page (existing `useMemo` group logic) and is passed as `sections`.

## Error handling

- DataGrid renders `emptyState` when `items`/all `sections` are empty.
- Existing per-page action errors (save/delete failures, ConfirmModal errors) unchanged.
- Avatar image load failure falls back to initials (`onError`).

## Testing

- `Avatar.spec.tsx`: image vs initials fallback (behavior/content only, no class assertions).
- `DataGrid.spec.tsx`: renders headers; renders rows per item; renders section bands with labels/counts in sectioned mode; calls `onRowClick`; custom `render` output appears; empty state shows. No styling assertions.
- Per migrated page: keep/adjust existing specs to query by role/text, not table structure.
- Auth: a unit check that the session callback surfaces `imageUrl` (if feasible with existing test setup).

## Out of scope

- No palette change — keep the existing dark + yellow theme.
- No new dependencies.
- No changes to public (non-admin) pages.
- No data-model/Prisma migrations (photo + role already exist).

## Rollout / risk

- Build `Avatar` + `DataGrid` first (with tests), then migrate page-by-page so each page is independently verifiable.
- Session callback change touches auth — verify login still works and the widget shows the real photo for a user who has one and initials for one who doesn't.
