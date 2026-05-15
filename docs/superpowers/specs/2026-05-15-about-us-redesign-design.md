# About Us Page Redesign + Staff Management

**Date:** 2026-05-15
**Status:** Draft — pending user approval
**Scope:** Full replacement of `/about-us` public page + new admin sections for staff and organisational roles.

## Goals

- Replace the current generic `about-us.tsx` template with a distinctive, story-driven page that showcases the team and the "100% locally owned" angle.
- Add admin tooling so the owner can manage the team roster (photos, bios, roles) without code changes.
- Introduce an organisational-role concept (`OrgRole`) modelled as a first-class entity with a stable `key`, so future authorization scope can switch on it.
- Reuse existing `ImageCollection` infrastructure for photo storage instead of bolting on a new upload pipeline.

## Non-Goals

- Drag-to-reorder (v1 uses integer `order` + up/down arrows).
- Role-based authorization wiring (model is ready, enforcement is a later task).
- Stats block ("870+ tours" etc.) — dropped because the numbers are invented.
- Public-page video block — current `VideoModal` removed in the full replace.
- Rich-text bios — plain text only.
- Testimonials section — no data source yet.
- Social links per staff (Instagram etc.) — not in scope.

## Visual Direction

**Bold Dark Adventure** aesthetic (selected from 3 Stitch mockups):

- Dark `bg-secondary` sections, white type, sparing terracotta-orange (`primary`) accents.
- Edge-to-edge documentary photography (`object-cover`, `aspect-[3/4]` portraits).
- Headlines: `type-headline-lg` + `uppercase tracking-tight font-extrabold` for a bold-condensed feel (no new font dependency).
- Body: `text-white/80` on dark, `text-on-surface-secondary` on cream.
- All styling via Tailwind utilities; no inline `style` (CLAUDE.md rule).

Reference mockup: Stitch project `11813567873808728236`, screen `6da9fe58726345d88f87089c4c8aa138` ("Bold Dark Mode").

## Architecture

### Public route

`/about-us` (`src/pages/about-us.tsx`) — full rewrite. SSG with `getStaticProps` + 60s ISR, matching the existing pattern. Loads:

1. Locale messages from `getMessagesFromDb(locale)` — picks up the new `about.*` namespace.
2. Active staff via a new `getStaffForPublic()` query in `src/data/queries.ts`, joined with `OrgRole` and `CollectionImage`.

Output is a thin composition:

```tsx
<AboutHero translations staff={staff.slice(0, 3)} />
<AboutStory translations />
<AboutValueProps translations />
<AboutTeamGrid staff={staff} />
<AboutCta translations />
```

### Page sections, in order

1. **Split hero** — left half: small uppercase eyebrow "About", oversized condensed headline, lead paragraph, accent-arrow CTA "Meet the team" (anchor link to team grid). Right half: 3 overlapping rectangular portraits of the first 3 staff with name + role overlays at the bottom of each.
2. **Story section** — full-width dark band with an oversized accent-color pull-quote (`100% LOCALLY OWNED.`), two columns of body text. Optional cinematic inset photo.
3. **Value props strip** — 4 cells separated by thin accent vertical lines. Each cell: oversized condensed numeral (`01`–`04`), short uppercase heading, one-sentence body.
4. **Meet the team grid** — section title "THE CREW" in oversized type. Responsive grid (3 + 2 layout on desktop, stacked on mobile). Each `StaffCard` is a full-bleed portrait with name + role overlaid at the bottom; bio fades in on hover (desktop) or shows beneath the photo (mobile).
5. **CTA strip** — full-width accent band, condensed headline "READY TO RIDE?", subhead, dark button linking to `routes.contact.path()`.

Site header + footer are unchanged (rendered by `src/components/layout/index.tsx`).

## Data Models

### Prisma schema additions

```prisma
model OrgRole {
  id        String        @id @default(cuid())
  key       String        @unique               // snake_case, immutable after create, future auth-scope identifier
  labelVi   String
  labelEn   String
  order     Int           @default(0)
  createdAt DateTime      @default(now())
  staff     StaffMember[]
}

model StaffMember {
  id        String           @id @default(cuid())
  name      String                                 // single language — names are not translated
  bioVi     String           @default("")
  bioEn     String           @default("")
  roleId    String
  role      OrgRole          @relation(fields: [roleId], references: [id], onDelete: Restrict)
  imageId   String?
  image     CollectionImage? @relation(fields: [imageId], references: [id], onDelete: SetNull)
  order     Int              @default(0)
  active    Boolean          @default(true)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
}
```

`CollectionImage` gets the reverse relation `staff StaffMember[]` added.

Photo storage: a single `ImageCollection { key: "staff", label: "Staff Photos" }`. All staff portraits are `CollectionImage` rows in that collection. `StaffMember.imageId` is a nullable FK so a staff entry can exist without a photo.

### Translation keys (namespace `about`)

Seeded via new `prisma/seed-about-translations.ts`, vi + en values written by hand from the raw `src/raw/about.md` source, edited for tone:

```
about.hero.eyebrow              "About"
about.hero.headline             headline
about.hero.lead                 short lead paragraph
about.hero.ctaMeetTeam          "Meet the team"
about.story.pullQuote           short pull-quote
about.story.body                3-paragraph block (use \n\n separators in the value)
about.valueProps.01.title       "Locally Owned"
about.valueProps.01.body
about.valueProps.02.title       "Off the Beaten Track"
about.valueProps.02.body
about.valueProps.03.title       "All Rider Levels"
about.valueProps.03.body
about.valueProps.04.title       "Local Knowledge"
about.valueProps.04.body
about.team.heading              "The Crew"
about.team.subhead
about.cta.headline              "Ready to ride?"
about.cta.subhead
about.cta.button                "Plan your tour"
about.meta.title
about.meta.description
```

### Seed data (idempotent)

`prisma/seed-staff.ts`:

1. Upsert `ImageCollection { key: "staff", label: "Staff Photos" }`.
2. Upsert these `OrgRole` rows:

   | key                   | labelVi                | labelEn               |
   | --------------------- | ---------------------- | --------------------- |
   | `founder`             | Người sáng lập         | Founder               |
   | `tour_guide`          | Hướng dẫn viên         | Tour Guide            |
   | `tour_guide_mechanic` | Hướng dẫn viên & Kỹ sư | Tour Guide & Mechanic |
   | `driver_support`      | Tài xế hỗ trợ          | Driver Support        |

3. Upsert `StaffMember` rows from `src/raw/about.md`: Thomas (founder), Tino (tour_guide), Chan (tour_guide_mechanic), Hai (tour_guide), Phi (driver_support). Placeholder bios; admin will edit. `imageId: null` initially.

Photo file copy from `src/raw/*.JPG` into the `staff` collection is left to the admin via the existing image-collections admin or `/admin/staff` image picker — easier than wiring a one-shot migration to the upload pipeline.

Both new seed scripts are wired into `prisma/seed.ts` so a fresh `pnpm prisma db seed` produces a working page.

## Routes & API

### `src/routes/index.ts` additions

```ts
routes.admin.roles.list.path();
routes.admin.roles.new.path();
routes.admin.roles.edit.path({id});
routes.admin.staff.list.path();
routes.admin.staff.new.path();
routes.admin.staff.edit.path({id});

api.admin.roles.list();
api.admin.roles.create(payload);
api.admin.roles.update(id, payload);
api.admin.roles.delete(id);
api.admin.staff.list();
api.admin.staff.create(payload);
api.admin.staff.update(id, payload);
api.admin.staff.delete(id);
```

### API handlers (`src/pages/api/admin/`)

```
roles/index.ts   GET (list), POST (create)
roles/[id].ts    GET, PUT, DELETE
staff/index.ts   GET (list), POST (create)
staff/[id].ts    GET, PUT, DELETE
```

All wrapped in the existing `requireAdmin()` auth middleware. Server-side Yup validation mirrors the client schema. Errors:

- `400` field-level Yup errors
- `401` unauthenticated, `403` not admin
- `404` not found
- `409` constraint violation: deleting an `OrgRole` referenced by any `StaffMember` returns `{ error: "Role in use" }`

`DELETE` on `StaffMember` is a hard delete (no `archived` column — `active=false` already toggles visibility). `OrgRole.key` is immutable on update (server rejects key changes with 400).

## Admin Pages

### Files

```
src/pages/admin/roles/
  index.tsx
  new.tsx
  [id].tsx
src/pages/admin/staff/
  index.tsx
  new.tsx
  [id].tsx
src/components/admin/RoleForm/
  RoleForm.tsx
  RoleForm.form-utils.ts
  RoleForm.spec.tsx
  index.ts
src/components/admin/StaffForm/
  StaffForm.tsx
  StaffForm.form-utils.ts
  StaffForm.spec.tsx
  StaffImagePicker.tsx
  index.ts
```

### `/admin/roles`

- **List:** table with columns `order`, `key`, `labelVi`, `labelEn`, staff-count, actions. "New role" button. Delete blocked server-side when in use; the UI shows the 409 message inline.
- **Form (`RoleForm`):** Yup schema requires `key` (lowercase snake_case, unique), `labelVi`, `labelEn`, `order` (int, default 0). `key` field disabled in edit mode — the value is the future auth-scope identifier and must stay stable.

### `/admin/staff`

- **List:** table with `order`, photo thumbnail, `name`, role label, active toggle, actions. Order managed via simple up/down arrow buttons in v1.
- **Form (`StaffForm`):** Yup schema requires `name`, `roleId`, `bioVi`, `bioEn`. `imageId` optional. `order` int, `active` bool.
  - Role select is populated from a `useAdminFetch('/api/admin/roles')` call inside the form page (not the form component — keep the form pure).
  - **`StaffImagePicker`** (separate file): a button that opens a `<Modal>` showing every `CollectionImage` from `ImageCollection(key="staff")` as a clickable grid. Clicking sets `imageId` in the form. A "Upload new" button inside the modal hits the existing collection-image upload endpoint and refreshes. The currently selected image is shown as a thumbnail next to the picker button with a "Remove" link.

### Admin nav

Add "Staff" and "Roles" sidebar entries to the admin layout. Verify the layout file's location during implementation (likely `src/components/admin/`).

## Data Flow

### Public read

1. `getStaticProps({locale})` calls `getMessagesFromDb(locale)` (existing) and `getStaffForPublic()` (new).
2. `getStaffForPublic` runs `prisma.staffMember.findMany({ where: { active: true }, orderBy: { order: 'asc' }, include: { role: true, image: true }})`.
3. Result is mapped through a serializer that explicitly enumerates the returned fields (CLAUDE.md rule against blind `Omit`/spread of Prisma rows). Output shape:
   ```ts
   type StaffPublic = {
     id: string;
     name: string;
     bioVi: string;
     bioEn: string;
     order: number;
     role: {key: string; labelVi: string; labelEn: string};
     image: {url: string | null; altVi: string; altEn: string} | null;
   };
   ```
4. Return `{ props: { messages, staff }, revalidate: 60 }`.

### Admin reads/writes

- Reads: existing `useAdminFetch` against the new endpoints.
- Writes: form submit handlers in `*.form-utils.ts` call `api.admin.roles.*` / `api.admin.staff.*` which return `{data, error}`; on success the page navigates back to the list via `useNavigate().push(routes.admin.*.list.path())`.

## Error Handling

- **Public page:** the staff fetch is wrapped in try/catch; on failure the page returns `staff: []` and renders without the team grid rather than 500.
- **Image FK:** `StaffMember.imageId` is `ON DELETE SET NULL`. Deleting a `CollectionImage` from the staff collection leaves the `StaffMember` with no photo; the public card shows a neutral placeholder block.
- **Role FK:** `StaffMember.roleId` is `ON DELETE RESTRICT`. Trying to delete an in-use role surfaces a 409 in the admin UI.
- **Validation:** server-side Yup mirrors the client schema; field-level errors are returned in `{ errors: { field: message } }` shape and rendered next to the inputs.

## Testing

Jest + React Testing Library, co-located `*.spec.tsx`. No styling assertions (CLAUDE.md rule). Coverage:

**Public components:**

- `AboutHero.spec.tsx` — eyebrow / headline / lead / CTA from translations; 3 polaroids from the first 3 staff.
- `AboutTeamGrid.spec.tsx` — one `StaffCard` per staff; empty state when staff list is empty.
- `StaffCard.spec.tsx` — name, locale-aware role label, locale-aware bio, photo alt; placeholder when image is null.
- `AboutValueProps.spec.tsx` — all 4 cells render from translations.
- `AboutCta.spec.tsx` — headline + CTA link points to `routes.contact.path()`.

**Admin forms:**

- `RoleForm.spec.tsx` — valid submit; Yup error rendering; `key` disabled on edit.
- `StaffForm.spec.tsx` — valid submit; role select populated; image-picker modal opens and selecting an image updates form state.

**API handlers:** lightweight handler tests for each endpoint covering auth-rejection, validation-rejection, and happy path. Match the existing convention in the repo (verify on implementation).

**Prisma queries:** integration test for `getStaffForPublic` — seeds 2 staff (one active, one inactive) and asserts that only the active one is returned, ordered by `order`.

**Migration:** run `pnpm prisma migrate dev` locally; run `pnpm prisma db seed`; verify `/about-us` renders the seeded crew end-to-end.

## File Manifest

New:

- `prisma/migrations/<timestamp>_add_staff_and_org_role/migration.sql`
- `prisma/seed-staff.ts`
- `prisma/seed-about-translations.ts`
- `src/data/queries.ts` — add `getStaffForPublic()` (edit)
- `src/components/about/AboutHero/{AboutHero,PolaroidStack}.tsx`
- `src/components/about/AboutStory/AboutStory.tsx`
- `src/components/about/AboutValueProps/AboutValueProps.tsx`
- `src/components/about/AboutTeamGrid/{AboutTeamGrid,StaffCard}.tsx`
- `src/components/about/AboutCta/AboutCta.tsx`
- `src/components/about/index.ts`
- Specs co-located next to each new component.
- `src/components/admin/RoleForm/*`
- `src/components/admin/StaffForm/*` (including `StaffImagePicker.tsx`)
- `src/pages/admin/roles/{index,new,[id]}.tsx`
- `src/pages/admin/staff/{index,new,[id]}.tsx`
- `src/pages/api/admin/roles/{index,[id]}.ts`
- `src/pages/api/admin/staff/{index,[id]}.ts`
- `src/types/index.ts` — add `StaffPublic`, `OrgRole`, `StaffMember`-admin types (edit)

Modified:

- `prisma/schema.prisma` — `OrgRole`, `StaffMember`, reverse relation on `CollectionImage`
- `prisma/seed.ts` — wire new seed scripts
- `src/routes/index.ts` — admin routes + api builders
- `src/pages/about-us.tsx` — full rewrite
- Admin layout/sidebar component — add "Staff" + "Roles" entries

Removed:

- Old hero / progress-bar / video / stats sections currently in `src/pages/about-us.tsx`
- `VideoModal` import from `about-us.tsx` only (component file kept; used elsewhere if applicable)
