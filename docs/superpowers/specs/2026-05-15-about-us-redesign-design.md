# About Us Page Redesign + Team Management via User Model

**Date:** 2026-05-15
**Status:** Draft (rev. 2) — pending user approval
**Scope:** Full replacement of `/about-us` public page + extending the existing `User` model to carry public team-member metadata + new admin pages for managing organisational roles.

## Goals

- Replace the current generic `about-us.tsx` template with a distinctive, story-driven page that showcases the team and the "100% locally owned" angle.
- Extend the existing `User` model so the same row drives both authentication (for admins) and public team-member display (for tour guides etc.). One person, one row.
- Introduce a first-class `OrgRole` concept with a stable `key`, replacing the current `Role` enum. Future authorization scope can switch on `OrgRole.key`.
- Add a hard authentication gate (`allowAuth`) so a user can be removed from sign-in without being removed from the public team page (and vice-versa).
- Reuse existing `ImageCollection` infrastructure for photo storage under a new `team` collection.

## Non-Goals

- Drag-to-reorder (v1 uses integer `teamOrder` + up/down arrows or numeric input).
- Stats block — dropped (numbers were invented).
- Public-page video block — current `VideoModal` removed from About.
- Rich-text bios — plain text only.
- Testimonials section — no data source yet.
- Per-user social links (Instagram etc.) — not in scope.
- Role-based authorization wiring beyond the `allowAuth` gate and an `admin`-key check in `requireAdmin`. Fine-grained scope rules are future work.
- Birth-date display — only derived age is rendered publicly.
- `/admin/staff` pages — dropped; everything lives under `/admin/users`.

## Visual Direction

**Bold Dark Adventure** aesthetic (selected from Stitch mockups):

- Dark `bg-secondary` sections, white type, sparing terracotta-orange (`primary`) accents.
- Edge-to-edge documentary photography (`object-cover`, `aspect-[3/4]` portraits).
- Headlines: `type-headline-lg` + `uppercase tracking-tight font-extrabold`.
- Body: `text-white/80` on dark.
- All styling via Tailwind utilities; no inline `style` (CLAUDE.md rule).

Reference: Stitch project `11813567873808728236`, screen `6da9fe58726345d88f87089c4c8aa138` ("Bold Dark Mode").

## Architecture

### Public route

`/about-us` (`src/pages/about-us.tsx`) — full rewrite. SSG with `getStaticProps` + 60s ISR. Loads:

1. Locale messages from `getMessagesFromDb(locale)` — picks up the new `about.*` namespace.
2. Public team members via new `getTeamForPublic()` query in `src/data/queries.ts`. Filters: `isCoreTeam=true`. Includes the user's `OrgRole` and `CollectionImage` (for the photo). Ordered by `teamOrder` asc.

Output composition:

```tsx
<AboutHero featured={team.slice(0, 3)} locale={locale} />
<AboutStory />
<AboutValueProps />
<AboutTeamGrid team={team} locale={locale} />
<AboutCta />
```

### Page sections (unchanged from rev. 1)

1. **Split hero** — eyebrow / oversized headline / lead paragraph / arrow CTA on the left; three overlapping portraits with name+role overlays on the right.
2. **Story section** — dark band, oversized pull-quote, two columns of body text.
3. **Value props strip** — 4 cells (`01`–`04`) with uppercase headings and one-sentence bodies.
4. **Meet the team grid** — `TeamMemberCard` per public-facing user; bio reveals on hover (desktop) / shows beneath (mobile).
5. **CTA strip** — accent band, condensed headline, button to `/contact`.

Site header + footer are unchanged.

## Data Models

### Prisma schema changes

```prisma
model OrgRole {
  id        String   @id @default(cuid())
  key       String   @unique
  labelVi   String   @default("")
  labelEn   String   @default("")
  order     Int      @default(0)
  createdAt DateTime @default(now())
  users     User[]
}

model User {
  id           String           @id @default(uuid())
  email        String?          @unique
  passwordHash String?
  name         String
  bioVi        String           @default("")
  bioEn        String           @default("")
  birthDate    DateTime?
  imageId      String?
  image        CollectionImage? @relation(fields: [imageId], references: [id], onDelete: SetNull)
  orgRoleId    String
  orgRole      OrgRole          @relation(fields: [orgRoleId], references: [id], onDelete: Restrict)
  isCoreTeam   Boolean          @default(false)
  allowAuth    Boolean          @default(true)
  teamOrder    Int              @default(0)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@index([isCoreTeam, teamOrder])
  @@index([orgRoleId])
}
```

`CollectionImage` gets the reverse relation `users User[]` added.

The existing `Role` enum is **dropped** (no other model references it).

### Validation invariants

- `allowAuth=true` ⇒ `email` is required AND `passwordHash` is required (enforced in the API layer; DB stays nullable).
- `allowAuth=false` ⇒ `email` and `passwordHash` may be null. Sign-in is rejected by NextAuth even with valid creds.
- `isCoreTeam=true` ⇒ user appears on `/about-us`. No requirement on the auth fields.
- Public-facing names rendered as the single `User.name`.
- Public-facing role rendered as `OrgRole.labelVi` or `OrgRole.labelEn` depending on locale.
- Public-facing age rendered as `Math.floor((now - birthDate) / yearMs)` if `birthDate` is set; suppressed otherwise.

### Photo storage

Single `ImageCollection { key: "team", label: "Team Photos" }`. All team portraits are `CollectionImage` rows in that collection. `User.imageId` is a nullable FK. Admin image picker filters by `collection.key="team"`.

### Translation keys (namespace `about`)

Seeded via new `prisma/seed-about-translations.ts`:

```
about.hero.eyebrow              "About"
about.hero.headline             headline
about.hero.lead                 lead paragraph
about.hero.ctaMeetTeam          "Meet the team"
about.story.pullQuote           pull-quote
about.story.body                multi-paragraph block (use \n\n)
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
about.team.ageSuffix            "yo"
about.cta.headline              "Ready to ride?"
about.cta.subhead
about.cta.button                "Plan your tour"
about.meta.title
about.meta.description
```

`team.ageSuffix` is appended to the rendered age (e.g. "32 yo"). Localised so we don't bake English into JSX.

### Migration strategy (single atomic SQL)

Single Prisma migration (`<timestamp>_team_user_refactor/migration.sql`) created via `prisma migrate dev --create-only`, then edited to include a raw-SQL data migration. Order of operations:

1. `CREATE TABLE "OrgRole" (...)` with indexes.
2. `INSERT INTO "OrgRole" (id, key, labelVi, labelEn, "order")` seeding `admin`, `founder`, `tour_guide`, `tour_guide_mechanic`, `driver_support`.
3. `ALTER TABLE "User" ADD COLUMN "orgRoleId" TEXT` (nullable initially).
4. `UPDATE "User" SET "orgRoleId" = (SELECT id FROM "OrgRole" WHERE key='admin') WHERE role='ADMIN'`.
5. `ALTER TABLE "User" ALTER COLUMN "orgRoleId" SET NOT NULL`.
6. `ALTER TABLE "User" ADD CONSTRAINT "User_orgRoleId_fkey" FOREIGN KEY ("orgRoleId") REFERENCES "OrgRole"(id) ON DELETE RESTRICT ON UPDATE CASCADE`.
7. `ALTER TABLE "User" DROP COLUMN "role"`.
8. `DROP TYPE "Role"`.
9. `ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL` (keep `UNIQUE` constraint).
10. `ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL`.
11. `ALTER TABLE "User" ADD COLUMN "bioVi" TEXT NOT NULL DEFAULT ''`.
12. `ALTER TABLE "User" ADD COLUMN "bioEn" TEXT NOT NULL DEFAULT ''`.
13. `ALTER TABLE "User" ADD COLUMN "birthDate" TIMESTAMP`.
14. `ALTER TABLE "User" ADD COLUMN "imageId" TEXT`.
15. `ALTER TABLE "User" ADD COLUMN "isCoreTeam" BOOLEAN NOT NULL DEFAULT false`.
16. `ALTER TABLE "User" ADD COLUMN "allowAuth" BOOLEAN NOT NULL DEFAULT true`.
17. `ALTER TABLE "User" ADD COLUMN "teamOrder" INTEGER NOT NULL DEFAULT 0`.
18. `ALTER TABLE "User" ADD CONSTRAINT "User_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "CollectionImage"(id) ON DELETE SET NULL ON UPDATE CASCADE`.
19. Indexes: `CREATE INDEX "User_isCoreTeam_teamOrder_idx" ON "User"("isCoreTeam","teamOrder")`. `CREATE INDEX "User_orgRoleId_idx" ON "User"("orgRoleId")`.

The migration is idempotent inside Prisma's tracking — it runs once per environment and the data steps only touch existing admin rows.

### Seed data

`prisma/seed-team.ts` (new): idempotent upserts of public-facing roles + the 5 staff users.

| Role key              | labelVi                | labelEn               |
| --------------------- | ---------------------- | --------------------- |
| `admin`               | Quản trị               | Admin                 |
| `founder`             | Người sáng lập         | Founder               |
| `tour_guide`          | Hướng dẫn viên         | Tour Guide            |
| `tour_guide_mechanic` | Hướng dẫn viên & Kỹ sư | Tour Guide & Mechanic |
| `driver_support`      | Tài xế hỗ trợ          | Driver Support        |

Staff users (keyed on `name` for idempotency — name uniqueness is acceptable for this fixture; the script uses findFirst-then-create/update):

| name   | roleKey             | isCoreTeam | allowAuth | email | passwordHash | teamOrder |
| ------ | ------------------- | ---------- | --------- | ----- | ------------ | --------- |
| Thomas | founder             | true       | false     | null  | null         | 0         |
| Tino   | tour_guide          | true       | false     | null  | null         | 1         |
| Chan   | tour_guide_mechanic | true       | false     | null  | null         | 2         |
| Hai    | tour_guide          | true       | false     | null  | null         | 3         |
| Phi    | driver_support      | true       | false     | null  | null         | 4         |

`bioVi`, `bioEn`, `birthDate`, `imageId` are left at defaults — admin fills in via `/admin/users/[id]`.

The `team` `ImageCollection` is upserted too (`{key:"team", label:"Team Photos"}`).

`prisma/seed-admin.ts` (existing) is updated: ensures the `admin` role row exists, sets the seeded admin user's `orgRoleId` to it, sets `allowAuth=true`, `isCoreTeam=false`.

`prisma/seed-about-translations.ts` (new) seeds the `about.*` namespace.

## Routes & API

### `src/routes/index.ts` additions

```ts
routes.admin.roles.list / new / edit
api.admin.roles.list / get / create / update / delete
```

`routes.admin.users.*` and `api.admin.users.*` already exist but are extended:

- New URL: `/admin/users/new`, `/admin/users/[id]` (current page is one-shot list + inline create — split into 3 pages).
- API: `api.admin.users.list()`, `.get(id)`, `.create(data)`, `.update(id, data)`, `.delete(id)`. Existing list/create/delete remain; add `get` and `update`.

### API handler updates

**`/api/admin/users/index.ts` (GET, POST):**

- GET returns `UserAdmin[]` (full shape including auth fields, `OrgRole`, `imageId`).
- POST accepts the full creation payload. Validates: `name` required, `orgRoleId` required and refers to an existing OrgRole, `birthDate` optional ISO string, `email`/`password` required when `allowAuth=true` else optional. If a password is supplied it's bcrypt-hashed before write.

**`/api/admin/users/[id].ts` (GET, PUT, DELETE):**

- GET returns one `UserAdmin`.
- PUT accepts a partial payload; allows updating each field. Same `allowAuth` invariant — if turning `allowAuth` to true and no email/password exists, return 400.
- DELETE removes the user. Refuse to delete the current session user (existing behavior preserved).

**`/api/admin/roles/index.ts` and `[id].ts`:** as in rev. 1.

### Auth flow change

In the NextAuth credentials provider's `authorize` callback (`src/lib/auth.ts` or equivalent — check where the provider is defined), after the password compare, add:

```ts
if (!user.allowAuth) return null;
```

`requireAdmin(req, res)` (server middleware) is extended: in addition to "user exists in DB", it checks that the session user's `orgRole.key === 'admin'`. The session must carry `orgRoleKey` — added via NextAuth callbacks (`session` callback reads from `jwt`, `jwt` callback reads from DB on sign-in).

## Admin Pages

### `/admin/users` (rewrite of existing single-page admin)

Three pages:

- **`/admin/users/index.tsx`** — table: photo thumbnail, name, email (or "—"), role label, `isCoreTeam` badge, `allowAuth` badge, `teamOrder`, actions (Edit / Delete). "New user" button → `/admin/users/new`.
- **`/admin/users/new.tsx`** + **`/admin/users/[id].tsx`** — both render shared `UserForm`. New page leaves password blank; edit page leaves password blank for "no change", sets password only if filled.

**`UserForm`** (with co-located `UserForm.form-utils.ts`):

- Fields: `name`, `email`, `password` (write-only, hidden in edit unless toggled), `orgRoleId` (select), `bioVi` (textarea), `bioEn` (textarea), `birthDate` (date input), `imageId` (`TeamPhotoPicker`), `isCoreTeam` (checkbox), `allowAuth` (checkbox), `teamOrder` (number).
- Yup schema enforces:
  - `name` required.
  - `orgRoleId` required.
  - `birthDate` optional ISO date.
  - `email` required when `allowAuth=true`.
  - `password` required when `allowAuth=true` AND `mode='create'` (or when admin explicitly enables it on edit).
- Components: `TextInput`, `Textarea`, `NumberInput`, `FormField`, `<select>`, `<input type="date">`, `TeamPhotoPicker`, `Button`.

### `/admin/roles` (new — list / new / edit)

- List columns: `order`, `key` (mono), `labelVi`, `labelEn`, user-count, actions. Delete blocked server-side when in use → 409 surfaced as inline error.
- `RoleForm` with co-located `RoleForm.form-utils.ts`. `key` immutable on edit.

### Admin sidebar nav

Add a **Roles** entry next to **Users**. **Users** nav item stays. No `Staff` entry.

## Component Structure (Public Page)

```
src/components/about/
  AboutHero/
    AboutHero.tsx
    PolaroidStack.tsx
    AboutHero.spec.tsx
    index.ts
  AboutStory/
    AboutStory.tsx
    AboutStory.spec.tsx
    index.ts
  AboutValueProps/
    AboutValueProps.tsx
    AboutValueProps.spec.tsx
    index.ts
  AboutTeamGrid/
    AboutTeamGrid.tsx
    TeamMemberCard.tsx
    AboutTeamGrid.spec.tsx
    TeamMemberCard.spec.tsx
    index.ts
  AboutCta/
    AboutCta.tsx
    AboutCta.spec.tsx
    index.ts
  index.ts
```

`TeamMemberCard` props: `{ member: TeamMember; locale: 'vi'|'en' }`. It renders photo (or placeholder), role label, name, age suffix if `birthDate` set, and bio.

## Admin Component Structure

```
src/components/Admin/
  RoleForm/
    RoleForm.tsx
    RoleForm.form-utils.ts
    RoleForm.spec.tsx
    index.ts
  UserForm/
    UserForm.tsx
    UserForm.form-utils.ts
    UserForm.spec.tsx
    TeamPhotoPicker.tsx
    index.ts
```

`TeamPhotoPicker` is the renamed-and-relocated equivalent of the original spec's `StaffImagePicker` — bound to the `team` `ImageCollection`.

## Domain Types

```ts
// src/domain/org-role/index.ts
export type OrgRole = {
  id: string;
  key: string;
  labelVi: string;
  labelEn: string;
  order: number;
};

// src/domain/team-member/index.ts
export type TeamPhoto = {
  url: string | null;
  altVi: string;
  altEn: string;
};

export type TeamMember = {
  id: string;
  name: string;
  bioVi: string;
  bioEn: string;
  age: number | null;
  teamOrder: number;
  role: OrgRole;
  photo: TeamPhoto | null;
};

// src/domain/user/index.ts (extended)
export type UserAdmin = {
  id: string;
  name: string;
  email: string | null;
  bioVi: string;
  bioEn: string;
  birthDate: string | null; // ISO string for JSON serialisation
  imageId: string | null;
  isCoreTeam: boolean;
  allowAuth: boolean;
  teamOrder: number;
  orgRole: OrgRole;
  photo: TeamPhoto | null; // resolved from CollectionImage
  // password is never returned to the client
};
```

Mappers (`src/domain/user/mapper.ts`, `src/domain/team-member/mapper.ts`) strip `createdAt/updatedAt/passwordHash` and convert `Date` to ISO strings. **No raw Prisma rows leave the server** (CLAUDE.md rule).

`age` is computed in `toTeamMember`:

```ts
function ageFromBirthDate(d: Date | null): number | null {
  if (!d) return null;
  const ms = Date.now() - d.getTime();
  const years = ms / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, Math.floor(years));
}
```

## Data Flow

### Public read

1. `getStaticProps({locale})` calls `getMessagesFromDb(locale)` and `getTeamForPublic()`.
2. `getTeamForPublic`:
   ```ts
   prisma.user
     .findMany({
       where: {isCoreTeam: true},
       orderBy: {teamOrder: 'asc'},
       include: {orgRole: true, image: true},
     })
     .then((rows) => rows.map(toTeamMember));
   ```
3. Return `{ props: { messages, team, locale }, revalidate: 60 }`.

### Admin reads/writes

- Reads use existing `useAdminFetch` pattern against `/api/admin/users` and `/api/admin/roles`.
- Writes use `api.admin.users.create/update/delete` and `api.admin.roles.*` from `src/routes/api.ts`.
- Image-picker reads images from the `team` collection via the existing `/api/admin/image-collections` endpoint (or a new helper if the existing one returns shape that's awkward — verify during implementation).

## Error Handling

- **Public page:** team fetch wrapped in try/catch; on failure return `team: []` and render the page without the grid.
- **Role FK:** `User.orgRoleId` is `ON DELETE RESTRICT`. Deleting a role in use returns 409.
- **Image FK:** `User.imageId` is `ON DELETE SET NULL`. Deleting a `CollectionImage` leaves the user with no photo.
- **Validation:** all admin API mutations validate via Yup; field-level errors returned as `{ errors: { field: message } }` and rendered next to inputs.
- **Auth:** `requireAdmin` rejects with 401 if no session, 403 if session user's `orgRole.key !== 'admin'` OR `allowAuth=false`.
- **`allowAuth` flip on currently-logged-in user:** out of scope to invalidate active sessions. Next NextAuth roundtrip will re-evaluate via the `jwt`/`session` callbacks and produce 403 from `requireAdmin`. Document this behavior; acceptable for v1.

## Testing

- **`TeamMemberCard.spec.tsx`** — name, role (locale-aware), bio (locale-aware), age rendering when `birthDate` set, suppressed when null, placeholder when photo null.
- **`AboutTeamGrid.spec.tsx`** — heading/subhead from translations, one card per member, empty-state when array empty.
- **`AboutHero.spec.tsx`** — eyebrow / headline / lead / CTA from translations; 3 polaroids when 3 featured members provided.
- **`AboutStory.spec.tsx`** — pull-quote + `\n\n`-split paragraphs.
- **`AboutValueProps.spec.tsx`** — 4 cells from translations; numerals 01–04.
- **`AboutCta.spec.tsx`** — link to `/contact`.
- **`RoleForm.spec.tsx`** — valid submit; `key` validation error; `key` disabled on edit.
- **`UserForm.spec.tsx`** — submit; role select populated; `password` required when `allowAuth=true` and `mode='create'`; image picker integration.
- **`TeamPhotoPicker.spec.tsx`** — modal opens; selection updates value; remove clears.
- **API handler integration:** light handler tests for /api/admin/roles/_ and /api/admin/users/_ covering auth-reject, validation-reject, happy-path.
- **`getTeamForPublic`:** integration test seeds two users (one `isCoreTeam=true`, one false), asserts only public one is returned.
- **NextAuth `authorize`:** unit test the `allowAuth=false` rejection.

## File Manifest

**Create:**

- `prisma/migrations/<timestamp>_team_user_refactor/migration.sql`
- `prisma/seed-team.ts`
- `prisma/seed-about-translations.ts`
- `src/domain/org-role/{index.ts,mapper.ts}`
- `src/domain/team-member/{index.ts,mapper.ts}`
- `src/components/about/AboutHero/{AboutHero.tsx,PolaroidStack.tsx,AboutHero.spec.tsx,index.ts}`
- `src/components/about/AboutStory/{AboutStory.tsx,AboutStory.spec.tsx,index.ts}`
- `src/components/about/AboutValueProps/{AboutValueProps.tsx,AboutValueProps.spec.tsx,index.ts}`
- `src/components/about/AboutTeamGrid/{AboutTeamGrid.tsx,TeamMemberCard.tsx,AboutTeamGrid.spec.tsx,TeamMemberCard.spec.tsx,index.ts}`
- `src/components/about/AboutCta/{AboutCta.tsx,AboutCta.spec.tsx,index.ts}`
- `src/components/about/index.ts`
- `src/components/Admin/RoleForm/{RoleForm.tsx,RoleForm.form-utils.ts,RoleForm.spec.tsx,index.ts}`
- `src/components/Admin/UserForm/{UserForm.tsx,UserForm.form-utils.ts,UserForm.spec.tsx,TeamPhotoPicker.tsx,TeamPhotoPicker.spec.tsx,index.ts}`
- `src/pages/admin/roles/{index.tsx,new.tsx,[id].tsx}`
- `src/pages/admin/users/new.tsx` (existing `users.tsx` becomes the new `users/index.tsx`)
- `src/pages/admin/users/[id].tsx`
- `src/pages/api/admin/users/[id].ts` (likely already exists for delete — extend with GET, PUT)
- `src/pages/api/admin/roles/{index.ts,[id].ts}`

**Modify:**

- `prisma/schema.prisma` — `OrgRole`, extended `User`, reverse relation on `CollectionImage`, drop `Role` enum.
- `prisma/seed-admin.ts` — ensure `admin` role + assign to seeded admin user.
- `src/domain/index.ts` — re-export new types; drop `Role` re-export if any.
- `src/domain/user/{index.ts,mapper.ts}` — drop `role` field, add new ones; new mapper returns `UserAdmin`.
- `src/data/queries.ts` — add `getTeamForPublic`.
- `src/routes/registry.ts` — `routes.admin.roles.*`, `routes.admin.users.new`, `routes.admin.users.edit`.
- `src/routes/api.ts` — add roles builders; extend users with `get` and `update`.
- `src/pages/admin/users.tsx` — move to `src/pages/admin/users/index.tsx`, reduce to table + nav links.
- `src/pages/api/admin/users/index.ts` — extended POST validation.
- `src/lib/auth.ts` (or equivalent NextAuth config) — `authorize` checks `allowAuth`. JWT/session callbacks carry `orgRoleKey`.
- `src/lib/admin-auth.ts` — `requireAdmin` checks `orgRoleKey === 'admin'` and `allowAuth`.
- `src/pages/about-us.tsx` — full rewrite using new components.
- `src/components/Admin/AdminLayout/AdminLayout.tsx` — add `Roles` nav entry next to `Users`.
- `package.json` — add `db:seed-about-translations` and `db:seed-team` scripts.
- `src/messages/{vi,en}.json` — add `admin.roles.*` and extend `admin.users.*` UI strings (form labels, validation messages, picker strings).
- `src/lib/users-form-utils.ts` — either rewritten as `UserForm.form-utils.ts` co-located with the component, OR kept for the create-only flow and superseded by the new file. Plan recommends rewriting + removing the old file (we now own the lifecycle).

**Removed:**

- The `Role` Prisma enum.
- `User.role` column (via migration).
- The legacy inline-create form on the old `/admin/users` (becomes a dedicated `/admin/users/new` page).
