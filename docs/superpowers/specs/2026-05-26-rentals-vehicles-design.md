# Rentals (Vehicles) — Design

## Goal

Add a "Rentals" business domain to the site: a single `Vehicle` entity backed by a new Prisma model and PostgreSQL table, a public catalog page (`/rentals`) showing published vehicles without any booking flow, and an admin CRUD surface (`/admin/rentals`) following the existing admin shell pattern. Visual treatment follows the **Apex Gritty Documentary** Stitch theme (brutalist dark / electric mustard accents).

Introduces a **new convention for localized DB columns** — `{en, vi}` JSON shape — to be adopted by all future schemas and codified in `CLAUDE.md` and `.claude/ADMIN.md`. Existing split `*Vi`/`*En` columns on `Tour`/`Destination`/`Highlight`/`User`/`OrgRole`/`Perk` remain in place for backwards-compatibility; migration of legacy columns is out of scope.

## Non-Goals

- **No booking, reservation, or availability calendar.** Catalog only.
- **No vehicle detail page** (`/rentals/[slug]`) in v1.
- **No payment integration.**
- **No migration of legacy `*Vi`/`*En` columns** on other tables.
- **No mobile-specific admin layout** beyond the existing `AdminPageShell` responsive behavior.

## Visual Reference

Stitch project: **Vietnam Moto Tour — Rentals (Apex)** (`projects/4683768170577706110`), design system **Apex Gritty Documentary** (`assets/70797f627f3642d4b86490e5785fc7a5`).

- Public catalog mockup: brutalist dark page, full-width cinematic hero, slanted dividers, 3-column card grid with 4px mustard top-accent (bike) or white top-accent (scooter), monospace specs, chunky mustard price block, included-policy + rules two-column section, mustard "CONTACT US" CTA.
- Admin edit mockup: fixed header + tab strip (`GENERAL` / `DESCRIPTION` / `IMAGES`), 12-col form grid with brutalist inputs (1px dark gray border → mustard on focus), single bilingual description field with VI/EN locale switcher, detached footer pill with `CANCEL` ghost, `SAVE CHANGES` mustard primary, `ARCHIVE` danger ghost.

The mockups are reference for **layout, information density, and component composition** — not for literal color values. The implementation reuses the existing site theme tokens (`bg-surface`, `bg-surface-elevated`, `text-on-surface`, `bg-primary`, `bg-secondary`, etc. defined in `src/styles/globals.css`) and the existing `<Button>` variants. The Apex mustard / black palette informs structural choices (sharp rectangles, slanted dividers, all-caps type-label, monospace specs, chunky price block, locale-switcher above bilingual fields) but the page renders with the site's existing brand colors. Type case follows existing site convention — do not blanket all-caps text unless the existing site components already do so.

## Data Model

### Prisma schema additions

```prisma
enum VehicleType {
  SCOOTER
  BIKE
}

enum VehicleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Vehicle {
  id             String        @id @default(uuid())
  slug           String        @unique
  type           VehicleType
  brand          String
  model          String
  cc             Int
  quantity       Int           @default(0)
  priceUsdPerDay Int
  imageUrl       String?
  images         Json          @default("[]")
  description    Json          @default("{\"en\":\"\",\"vi\":\"\"}")
  status         VehicleStatus @default(DRAFT)
  order          Int           @default(0)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([status, order])
  @@index([type])
}
```

Notes:

- `priceUsdPerDay` is **whole USD as `Int`**, not `Decimal`. Avoids the `Decimal` → JSON serialization landmine flagged in `CLAUDE.md` ("Treat property unwrapping as unsafe"). Matches existing policy doc values ($8, $18). If sub-dollar prices become necessary later, migrate to a cents-based `Int` field.
- `images` is `Json` array of strings (image URLs / upload-pipeline keys). Same shape used by `Tour.images`.
- `description` is `Json` `{en: string, vi: string}` — **new convention** for localized columns (see below).
- `slug` unique, kebab-case, auto-derived from `${brand}-${model}` on create (overridable in admin).

### TS surface

`src/types/index.ts`:

```ts
export type Localized = {en: string; vi: string};

export type Vehicle = {
  id: string;
  slug: string;
  type: 'SCOOTER' | 'BIKE';
  brand: string;
  model: string;
  cc: number;
  quantity: number;
  priceUsdPerDay: number;
  imageUrl: string | null;
  images: string[];
  description: Localized;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  order: number;
  createdAt: string;
  updatedAt: string;
};
```

All Prisma rows pass through a `toVehicle(row)` mapper at the API / SSR boundary that:

- Converts `createdAt`, `updatedAt` to ISO strings.
- Coerces `images` (Prisma `JsonValue`) to `string[]` (default `[]`).
- Coerces `description` to `{en: string, vi: string}` (default `{en: '', vi: ''}` for any missing key).
- Drops any field not in the explicit `Vehicle` shape.

Mapper lives at `src/domain/vehicle/mapper.ts`, matching the existing `src/domain/<entity>/mapper.ts` convention used by `tour`, `destination`, etc. The full `src/domain/vehicle/` folder also hosts `index.ts` (re-exports) and any vehicle-specific helpers needed by the form (e.g. slug derivation).

## Localized Columns Convention (New Rule)

**Going forward**, any DB column that holds translatable content uses a single `Json` column shaped `{en: string, vi: string}` rather than two parallel `String` columns named `<field>Vi` / `<field>En`. The shared TS type is `Localized = {en: string; vi: string}` in `src/types/index.ts`. Yup validation at API boundaries enforces both keys exist as strings.

This rule is added to **two** places:

1. **`CLAUDE.md` → Code Style section** (primary location, since it's a code-level convention):

   ```md
   - **Localized DB columns use `{en, vi}` JSON shape, not split `*Vi`/`*En` columns.** New tables with translatable fields must declare them as `Json` with `{en: string, vi: string}` shape (e.g. `description Json @default("{\"en\":\"\",\"vi\":\"\"}")`), not as two separate `String` columns. The TS surface uses `Localized = {en: string; vi: string}` from `src/types/index.ts`. Admin forms render one field with a locale switcher (per the locale-switcher rule); the switcher mutates `{en}` or `{vi}` inside the same JSON value. Yup validation enforces both keys exist as strings. Legacy split columns (`titleVi`/`titleEn`, `descriptionVi`/`descriptionEn`, `nameVi`/`nameEn`, `bioVi`/`bioEn`, `labelVi`/`labelEn`) remain on existing tables for backwards-compatibility — do not introduce new split columns.
   ```

2. **`.claude/ADMIN.md`** (cross-reference, since admin forms consume the convention):

   ```md
   - **Localized fields stored as `{en, vi}` JSON, not split columns.** See CLAUDE.md Code Style. Admin forms continue to render one field + locale switcher; the switcher now mutates the `en` or `vi` key inside the same JSON value.
   ```

Existing tables (`Tour.titleVi/En`, `Destination.nameVi/En`, etc.) are **not** migrated as part of this work.

## Pages

### Public — `/rentals`

Replaces existing `src/pages/rental.tsx` (rename to plural to match `tours`, `destinations` patterns). Sections from top to bottom:

1. **Hero** — `PageHeader` with title `"Motorbike Rentals"` (localized) and breadcrumb `Home / Rentals`. Uses existing `PageHeader` component, sharing background image with the legacy `/rental` page.
2. **Filter bar** — `SegmentedControl` with `All / Scooters / Bikes` (uses existing `src/components/ui/SegmentedControl`). State held client-side; filtering happens in-memory on the already-loaded vehicle list.
3. **Vehicle grid** — Responsive 1-col mobile / 2-col tablet / 3-col desktop. Each cell is `<VehicleCard vehicle={v} />`. Cards display: type badge, brand + model, cc + automatic/manual hint, availability indicator (`Available` when `quantity > 0`, `Out of stock` muted otherwise), and price.
4. **Policy section** — Two-column block rendering seeded translations: included items (helmet, passenger helmet, phone holder, rain gear) and rules (deposit, cancellation, license, age, security deposit, mileage, no-border-crossing, availability confirmation).
5. **Contact CTA** — Link to `/contact` with localized prompt.

Data load: `getStaticProps` calls a new `getPublishedVehicles()` in `src/data/queries.ts`, mapped through `toVehicle`. `revalidate: 60`.

### Admin — `/admin/rentals`

Mirrors the existing `admin/tours` shape but with simpler tabs.

- **`/admin/rentals`** — list view. `AdminPageShell` with header `"Rentals"`, primary action `Add vehicle` (`<Button variant="primary" icon={<i className="fa fa-plus" />}>Add vehicle</Button>`). Table columns: image thumbnail, type, brand+model, cc, quantity, price/day, status badge, row actions (`Edit` ghost-primary, `Delete` ghost-danger). Search box filters by brand/model.
- **`/admin/rentals/new/[tab]`** and **`/admin/rentals/[id]/edit/[tab]`** — form pages. Tabs: `general`, `description`, `images`. Each tab is a separate component pair with its own `form-utils.ts`:
  - `VehicleFormGeneral` / `VehicleFormGeneral.form-utils.ts` — type, brand, model, cc, quantity, priceUsdPerDay, status, order.
  - `VehicleFormDescription` / `VehicleFormDescription.form-utils.ts` — single bilingual textarea with VI/EN locale switcher above (uses existing `Tabs` or `SegmentedControl`). Writes back into `description.{vi|en}`.
  - `VehicleFormImages` / `VehicleFormImages.form-utils.ts` — primary `imageUrl` upload + secondary `images[]` gallery upload, both via existing `ImageUpload` component and upload pipeline.
- **`/admin/rentals/archive`** — archived list (status=ARCHIVED) with `Restore` row action.

Delete action uses the shared `ConfirmModal`. "Delete" is a soft-archive (sets `status=ARCHIVED`), not a hard delete; restore is supported. Hard delete is not exposed in v1.

## API

All routes guarded by NextAuth admin role check (reuse existing `requireAdmin` middleware used by tour/destination admin APIs):

```
GET    /api/admin/vehicles                — list, query params: ?status=, ?type=, ?search=
POST   /api/admin/vehicles                — create
GET    /api/admin/vehicles/[id]
PUT    /api/admin/vehicles/[id]           — full replacement
DELETE /api/admin/vehicles/[id]           — soft archive (sets status=ARCHIVED)
POST   /api/admin/vehicles/[id]/restore   — sets status=DRAFT
```

Request/response bodies use the `Vehicle` TS type. Yup validation at the route boundary verifies `description: {en, vi}` shape, `cc > 0`, `quantity >= 0`, `priceUsdPerDay >= 0`, `type ∈ {SCOOTER, BIKE}`, `status ∈ {DRAFT, PUBLISHED, ARCHIVED}`.

All admin API responses use the existing `{data, error}` result pattern wrapped by `api.*` in `src/routes/api.ts`. New `api.vehicles.*` client wrappers added there.

## Routes Registry

Additions to `src/routes/registry.ts`:

```ts
export type VehicleTab = 'general' | 'description' | 'images';
export const isVehicleTab = (v: string): v is VehicleTab =>
  v === 'general' || v === 'description' || v === 'images';

// Public
rentals: {
  list: {path: () => '/rentals'},
},

// Admin
admin: {
  ...
  vehicles: {
    list: {path: () => '/admin/rentals'},
    archive: {path: () => '/admin/rentals/archive'},
    new: {path: (p?: {tab?: VehicleTab}) => `/admin/rentals/new/${p?.tab ?? 'general'}`},
    edit: {path: (p: {id: string; tab?: VehicleTab}) =>
      `/admin/rentals/${p.id}/edit/${p.tab ?? 'general'}`},
  },
}
```

No hardcoded route strings or raw `fetch('/api/admin/...')` calls in components — everything goes through `routes` + `api`.

## i18n

Translations live exclusively in the DB `Translation` table (no JSON fallback per the project's DB-only translations rule). A new `prisma/seed-rentals-translations.ts` seeds the keys below into VI + EN.

### Reuse from `common.*` (do not duplicate)

`common.cancel`, `common.save`, `common.delete`, `common.edit`, `common.add`, `common.back`, `common.loading`, `common.search`, `common.confirm`. Check `pnpm i18n:scan` after seeding to confirm no duplicates were introduced.

### New keys

**Public (`rentals.*`):**

- `rentals.title`, `rentals.subtitle`, `rentals.breadcrumbRental`
- `rentals.perDay`, `rentals.cc`, `rentals.available`, `rentals.outOfStock`
- `rentals.filter.all`, `rentals.filter.scooter`, `rentals.filter.bike`
- `rentals.type.scooter`, `rentals.type.bike`
- `rentals.policy.title`
- `rentals.policy.included.title`, `rentals.policy.included.helmet`, `rentals.policy.included.passengerHelmet`, `rentals.policy.included.phoneHolder`, `rentals.policy.included.rainGear`, `rentals.policy.included.free`
- `rentals.policy.rules.title`, `rentals.policy.rules.deposit`, `rentals.policy.rules.cancellation`, `rentals.policy.rules.license`, `rentals.policy.rules.age`, `rentals.policy.rules.securityDeposit`, `rentals.policy.rules.mileage`, `rentals.policy.rules.noBorderCrossing`, `rentals.policy.rules.availability`, `rentals.policy.rules.confirmationRequired`
- `rentals.contactCta.title`, `rentals.contactCta.subtitle`, `rentals.contactCta.button`

**Meta:** `meta.rentalsTitle`, `meta.rentalsDescription`.

**Admin (`admin.rentals.*`):**

- `admin.rentals.title`, `admin.rentals.addEntity` ("Add vehicle")
- `admin.rentals.fields.{type, brand, model, cc, quantity, priceUsdPerDay, description, images, imageUrl, status, order, slug}`
- `admin.rentals.tabs.{general, description, images}`
- `admin.rentals.status.{DRAFT, PUBLISHED, ARCHIVED}`
- `admin.rentals.confirmDelete.title`, `admin.rentals.confirmDelete.body`
- `admin.rentals.archive.title`, `admin.rentals.archive.empty`
- `admin.rentals.list.empty`, `admin.rentals.list.searchPlaceholder`

Vietnamese values translated from English source; for policy rules, Vietnamese values are derived from `src/rentals/policy.md` interpreted into idiomatic VI (final translation pass during implementation).

## Component Surface

```
src/components/
  rentals/
    VehicleCard/
      VehicleCard.tsx
      VehicleCard.spec.tsx
      index.ts
    RentalsFilter/
      RentalsFilter.tsx
      RentalsFilter.spec.tsx
      index.ts
    RentalPolicy/
      RentalPolicy.tsx
      RentalPolicy.spec.tsx
      index.ts
    RentalContactCta/
      RentalContactCta.tsx
      index.ts
  admin/
    rentals/
      VehicleListRow/
        VehicleListRow.tsx
        VehicleListRow.spec.tsx
        index.ts
      VehicleFormGeneral/
        VehicleFormGeneral.tsx
        VehicleFormGeneral.form-utils.ts
        VehicleFormGeneral.spec.tsx
        index.ts
      VehicleFormDescription/
        VehicleFormDescription.tsx
        VehicleFormDescription.form-utils.ts
        VehicleFormDescription.spec.tsx
        index.ts
      VehicleFormImages/
        VehicleFormImages.tsx
        VehicleFormImages.form-utils.ts
        index.ts
```

Each component is one-component-per-file with co-located tests/utils per the existing CLAUDE.md convention.

## Seed Data

Initial seed inserts two vehicles matching the assets already on disk in `src/rentals/`:

| Brand | Model          | Type    | CC  | Quantity | Price/day | Image source                                              |
| ----- | -------------- | ------- | --- | -------- | --------- | --------------------------------------------------------- |
| Honda | Enduro XR 150L | BIKE    | 150 | 2        | $18       | `src/rentals/Honda Enduro XR 150L.jpeg`                   |
| Honda | Airblade       | SCOOTER | 125 | 2        | $8        | `src/rentals/Scooter automatic Honda Airblade 125cc.jpeg` |

Images move into the upload pipeline (see `.claude/STORAGE.md`) — `UPLOAD_DIR/vehicles/<uuid>.jpeg`. Seed reads from `src/rentals/`, copies to the storage path, sets `imageUrl` to the served URL. After seed runs successfully, the source files under `src/rentals/*.jpeg` can be removed in a follow-up commit (kept for v1 to verify seed).

`policy.md` content is split into translation values (see i18n section). After seed, `src/rentals/policy.md` becomes a redundant reference and is removed.

## Tests

- **`VehicleCard.spec.tsx`** — renders brand/model/price/availability indicator. Behavior assertions only (no class checks per CLAUDE.md testing rule).
- **`RentalsFilter.spec.tsx`** — filter switching updates active state and emits selection.
- **`VehicleFormGeneral.spec.tsx`** — Yup validation surfaces errors on missing/invalid type, brand, model, cc<=0, quantity<0, price<0.
- **`VehicleFormDescription.spec.tsx`** — locale switcher persists both `vi` and `en` values across toggles; both fields submit together.
- **`VehicleListRow.spec.tsx`** — delete confirmation flow opens `ConfirmModal`; restore action visible only when archived.
- **API tests** (`src/pages/api/admin/vehicles/__tests__/`) — CRUD happy path, auth rejection without admin role, archive + restore lifecycle, soft-delete semantics, Yup validation failures.

## Migration Plan

1. Prisma migration `add_vehicle_table` creating `Vehicle` table, two enums (`VehicleType`, `VehicleStatus`), and the two indexes.
2. Seed script `prisma/seed-rentals-translations.ts` inserts translation keys.
3. Seed script `prisma/seed-vehicles.ts` inserts two starter vehicles + uploads their images.
4. Add to `package.json` seed pipeline: `pnpm seed:rentals` and chain into existing `pnpm seed` command.

## Out-of-Scope Items (Future)

- Vehicle detail page (`/rentals/[slug]`) with extended spec sheet and gallery carousel.
- Booking/reservation flow + payment integration.
- Availability calendar / per-vehicle blackout dates.
- Backfilling existing `*Vi`/`*En` columns to the new `{en, vi}` JSON shape.
- Multi-brand fleet view / pricing tiers (weekend rates, weekly discounts).
