# About Us Redesign + Staff Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic `/about-us` page with a Bold-Dark editorial design driven by an admin-managed staff roster, with `OrgRole` and `StaffMember` Prisma models, an image-picker bound to a reusable `ImageCollection`, and bilingual content sourced from the existing `Translation` table.

**Architecture:** Two new Prisma models (`OrgRole`, `StaffMember`) plus a reused `ImageCollection(key="staff")` for photos. Public page is SSG with 60s ISR, reading from `prisma.staffMember.findMany` joined with role + photo. Admin CRUD pages mirror the existing tours/destinations patterns; admin forms follow the `*.form-utils.ts` convention. Translations live under namespace `about.*` in the `Translation` table.

**Tech Stack:** Next.js 16 Pages Router, Prisma 5, React 19, Tailwind 4, next-intl 4, Yup, react-hook-form, Jest + RTL.

**Spec:** `docs/superpowers/specs/2026-05-15-about-us-redesign-design.md`

---

## File Manifest

**Create:**

- `prisma/migrations/<timestamp>_add_staff_and_org_role/migration.sql` (auto-generated)
- `prisma/seed-about-translations.ts`
- `prisma/seed-staff.ts`
- `src/domain/staff/index.ts`
- `src/domain/staff/mapper.ts`
- `src/domain/org-role/index.ts`
- `src/domain/org-role/mapper.ts`
- `src/components/about/AboutHero/{AboutHero.tsx,PolaroidStack.tsx,AboutHero.spec.tsx,index.ts}`
- `src/components/about/AboutStory/{AboutStory.tsx,AboutStory.spec.tsx,index.ts}`
- `src/components/about/AboutValueProps/{AboutValueProps.tsx,AboutValueProps.spec.tsx,index.ts}`
- `src/components/about/AboutTeamGrid/{AboutTeamGrid.tsx,StaffCard.tsx,AboutTeamGrid.spec.tsx,StaffCard.spec.tsx,index.ts}`
- `src/components/about/AboutCta/{AboutCta.tsx,AboutCta.spec.tsx,index.ts}`
- `src/components/about/index.ts`
- `src/components/Admin/RoleForm/{RoleForm.tsx,RoleForm.form-utils.ts,RoleForm.spec.tsx,index.ts}`
- `src/components/Admin/StaffForm/{StaffForm.tsx,StaffForm.form-utils.ts,StaffForm.spec.tsx,StaffImagePicker.tsx,index.ts}`
- `src/pages/admin/roles/{index.tsx,new.tsx,[id].tsx}`
- `src/pages/admin/staff/{index.tsx,new.tsx,[id].tsx}`
- `src/pages/api/admin/roles/{index.ts,[id].ts}`
- `src/pages/api/admin/staff/{index.ts,[id].ts}`

**Modify:**

- `prisma/schema.prisma` — add `OrgRole`, `StaffMember`, reverse relation on `CollectionImage`
- `src/domain/index.ts` — re-export new types
- `src/data/queries.ts` — add `getStaffForPublic`
- `src/routes/registry.ts` — add `routes.admin.roles.*` and `routes.admin.staff.*`
- `src/routes/api.ts` — add `api.admin.roles.*` and `api.admin.staff.*`
- `src/pages/about-us.tsx` — full rewrite
- `src/components/Admin/AdminLayout/AdminLayout.tsx` — add nav entries
- `package.json` — add `db:seed-about-translations` + `db:seed-staff` scripts
- `src/messages/{vi,en}.json` — add `admin.roles.*` and `admin.staff.*` UI strings

---

## Conventions To Follow

- **No `interface` keyword** — use `type Foo = { ... }` everywhere.
- **One component per file.** Hooks/utilities/types in sibling files in the same folder.
- **Component declaration:** `export function Name(props: Props) { ... }`. No `React.FC`, no return-type annotations.
- **Co-locate forms:** every page/component with a form has a sibling `*.form-utils.ts` exporting Yup schema + types + defaults + submit handler.
- **No raw JSX strings.** All user-visible strings flow through `useTranslations()`; static keys live in `src/messages/{vi,en}.json` or the `Translation` table (namespace `about.*` for public page text, `admin.roles.*`/`admin.staff.*` for admin UI strings).
- **No inline styles**, Tailwind utilities only.
- **`cursor-pointer`** on every clickable element.
- **No styling assertions in tests** (no `toHaveClass`, `toHaveStyle`).
- **Tests use Jest + RTL** with `render`, `screen`, `userEvent`.
- **Commit format:** Conventional Commits with `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer.
- **All admin API routes wrap in `requireAdmin(req, res)`** before processing.
- **Domain mappers** strip `createdAt/updatedAt` and convert `Date` to plain types so results serialize through `getStaticProps`.

---

## Task 1: Prisma schema — add `OrgRole` and `StaffMember`

**Files:**

- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Edit `prisma/schema.prisma`** — add the two new models and the reverse relation on `CollectionImage`. Append to the end of the file:

```prisma
model OrgRole {
  id        String        @id @default(cuid())
  key       String        @unique
  labelVi   String        @default("")
  labelEn   String        @default("")
  order     Int           @default(0)
  createdAt DateTime      @default(now())
  staff     StaffMember[]
}

model StaffMember {
  id        String           @id @default(cuid())
  name      String
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

  @@index([roleId])
  @@index([active, order])
}
```

- [ ] **Step 2: Add reverse relation on `CollectionImage`** — find the existing `CollectionImage` model in `prisma/schema.prisma` and add a `staff StaffMember[]` line before the closing brace:

```prisma
model CollectionImage {
  id           String          @id @default(cuid())
  collectionId String
  collection   ImageCollection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  url          String?
  altEn        String          @default("")
  altVi        String          @default("")
  order        Int             @default(0)
  createdAt    DateTime        @default(now())
  staff        StaffMember[]

  @@index([collectionId, order])
}
```

- [ ] **Step 3: Generate the migration**

Run: `pnpm prisma migrate dev --name add_staff_and_org_role`
Expected: migration applied successfully; new Prisma Client generated.

- [ ] **Step 4: Verify the migration SQL** — open the newly created file under `prisma/migrations/<timestamp>_add_staff_and_org_role/migration.sql`. Confirm it creates `OrgRole` and `StaffMember` tables, adds the FK on `CollectionImage` relation, and creates the indexes.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "$(cat <<'EOF'
feat(prisma): add OrgRole and StaffMember models

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Domain types for `OrgRole` and `StaffMember`

**Files:**

- Create: `src/domain/org-role/index.ts`
- Create: `src/domain/org-role/mapper.ts`
- Create: `src/domain/staff/index.ts`
- Create: `src/domain/staff/mapper.ts`
- Modify: `src/domain/index.ts`

- [ ] **Step 1: Create `src/domain/org-role/index.ts`**

```ts
import type {OrgRole as PrismaOrgRole} from '@prisma/client';

export type OrgRole = Omit<PrismaOrgRole, 'createdAt'>;
```

- [ ] **Step 2: Create `src/domain/org-role/mapper.ts`**

```ts
import type {OrgRole as PrismaOrgRole} from '@prisma/client';
import type {OrgRole} from './index';

export function toOrgRole(row: PrismaOrgRole): OrgRole {
  return {
    id: row.id,
    key: row.key,
    labelVi: row.labelVi,
    labelEn: row.labelEn,
    order: row.order,
  };
}
```

- [ ] **Step 3: Create `src/domain/staff/index.ts`**

```ts
import type {OrgRole} from '../org-role';

export type StaffImage = {
  url: string | null;
  altVi: string;
  altEn: string;
};

export type StaffPublic = {
  id: string;
  name: string;
  bioVi: string;
  bioEn: string;
  order: number;
  role: OrgRole;
  image: StaffImage | null;
};

export type StaffAdmin = StaffPublic & {
  active: boolean;
};
```

- [ ] **Step 4: Create `src/domain/staff/mapper.ts`**

```ts
import type {
  StaffMember as PrismaStaffMember,
  OrgRole as PrismaOrgRole,
  CollectionImage as PrismaCollectionImage,
} from '@prisma/client';
import {toOrgRole} from '../org-role/mapper';
import type {StaffAdmin, StaffPublic} from './index';

type PrismaStaffWithRelations = PrismaStaffMember & {
  role: PrismaOrgRole;
  image: PrismaCollectionImage | null;
};

export function toStaffPublic(row: PrismaStaffWithRelations): StaffPublic {
  return {
    id: row.id,
    name: row.name,
    bioVi: row.bioVi,
    bioEn: row.bioEn,
    order: row.order,
    role: toOrgRole(row.role),
    image: row.image
      ? {url: row.image.url, altVi: row.image.altVi, altEn: row.image.altEn}
      : null,
  };
}

export function toStaffAdmin(row: PrismaStaffWithRelations): StaffAdmin {
  return {
    ...toStaffPublic(row),
    active: row.active,
  };
}
```

- [ ] **Step 5: Re-export from `src/domain/index.ts`** — add these two lines at the end:

```ts
export type {OrgRole} from './org-role';
export type {StaffPublic, StaffAdmin, StaffImage} from './staff';
```

- [ ] **Step 6: Type-check**

Run: `pnpm build`
Expected: build succeeds (or fails on unrelated parts — confirm types/domain compiles cleanly).

If build is heavy, an alternative quick check: `pnpm exec tsc --noEmit`.

- [ ] **Step 7: Commit**

```bash
git add src/domain/
git commit -m "$(cat <<'EOF'
feat(domain): add OrgRole and Staff types + mappers

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Seed the `about.*` translation namespace

**Files:**

- Create: `prisma/seed-about-translations.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `prisma/seed-about-translations.ts`** — mirror the structure of `prisma/seed-admin-translations.ts`:

```ts
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL.split('?')[0];
const adapter = new PrismaPg(dbUrl);
const prisma = new PrismaClient({adapter});

type Entry = {namespace: string; key: string; valueVi: string; valueEn: string};

const ENTRIES: Entry[] = [
  {
    namespace: 'about',
    key: 'hero.eyebrow',
    valueVi: 'Về chúng tôi',
    valueEn: 'About',
  },
  {
    namespace: 'about',
    key: 'hero.headline',
    valueVi: 'Khám phá Việt Nam đích thực.',
    valueEn: 'Riding the real Vietnam.',
  },
  {
    namespace: 'about',
    key: 'hero.lead',
    valueVi:
      'Công ty tour mô tô độc lập tại Nha Trang. 100% sở hữu trong nước, hơn 15 năm kinh nghiệm dẫn tour qua những cung đường ít người biết đến.',
    valueEn:
      'An independent Nha Trang motorcycle tour company. 100% locally owned, with 15+ years of experience guiding rides through the parts of Vietnam most tours miss.',
  },
  {
    namespace: 'about',
    key: 'hero.ctaMeetTeam',
    valueVi: 'Gặp đội ngũ',
    valueEn: 'Meet the team',
  },
  {
    namespace: 'about',
    key: 'story.pullQuote',
    valueVi: '100% sở hữu trong nước.',
    valueEn: '100% locally owned.',
  },
  {
    namespace: 'about',
    key: 'story.body',
    valueVi:
      'Chúng tôi thiết kế tour dựa trên nhiều năm kinh nghiệm chạy mô tô khắp Việt Nam. Khác xa các tuyến du lịch đại trà, đường của chúng tôi đi qua những vùng núi, làng dân tộc và bờ biển hoang sơ.\n\nLợi nhuận được giữ lại trong nước để hỗ trợ gia đình các hướng dẫn viên. Điều đó cũng cho phép chúng tôi cung cấp giá tốt hơn và kiến thức bản địa sâu hơn.\n\nTour của chúng tôi phù hợp cho cả tay lái mới và dày dặn kinh nghiệm. Chúng tôi đồng hành với bạn từ trước, trong và sau chuyến đi.',
    valueEn:
      "Our tours are built on years of motorcycle touring across Vietnam. Away from the well-worn highways, our routes wind through mountain villages, ethnic-minority communities, and stretches of coast most operators miss.\n\nWe're 100% locally owned, so the income stays in the country, funding food and education for our guides' families. That also lets us offer better rates and deeper local knowledge — including home-cooked meals with Vietnamese families along the way.\n\nWe cater to both new and experienced riders. Before, during, and after your tour, we look after you. Consider us your one-stop shop in Vietnam.",
  },
  {
    namespace: 'about',
    key: 'valueProps.01.title',
    valueVi: 'Sở hữu trong nước',
    valueEn: 'Locally Owned',
  },
  {
    namespace: 'about',
    key: 'valueProps.01.body',
    valueVi:
      '100% người Việt sở hữu và vận hành. Mọi đồng lợi nhuận quay về với cộng đồng.',
    valueEn:
      '100% Vietnamese-owned and operated. Every dong of profit goes back into the country.',
  },
  {
    namespace: 'about',
    key: 'valueProps.02.title',
    valueVi: 'Đường mòn ít người',
    valueEn: 'Off the Beaten Track',
  },
  {
    namespace: 'about',
    key: 'valueProps.02.body',
    valueVi:
      'Chúng tôi liên tục khám phá tuyến đường mới — tránh xa lối mòn du lịch quen thuộc.',
    valueEn:
      "We're constantly scouting new routes — away from the tourist circuits most operators stick to.",
  },
  {
    namespace: 'about',
    key: 'valueProps.03.title',
    valueVi: 'Mọi trình độ',
    valueEn: 'All Rider Levels',
  },
  {
    namespace: 'about',
    key: 'valueProps.03.body',
    valueVi:
      'Từ người mới đến tay lái dày dạn — chúng tôi điều chỉnh tour theo trình độ của bạn.',
    valueEn:
      'New rider or seasoned tourer — we tune the route, pace, and bike to your level.',
  },
  {
    namespace: 'about',
    key: 'valueProps.04.title',
    valueVi: 'Kiến thức bản địa',
    valueEn: 'Local Knowledge',
  },
  {
    namespace: 'about',
    key: 'valueProps.04.body',
    valueVi:
      'Quán ăn ngon nhất, chỗ nghỉ tốt nhất, và những gia đình đón bạn như người thân.',
    valueEn:
      'The best places to eat, the best places to sleep, and the Vietnamese families who will welcome you in.',
  },
  {
    namespace: 'about',
    key: 'team.heading',
    valueVi: 'Đội ngũ',
    valueEn: 'The Crew',
  },
  {
    namespace: 'about',
    key: 'team.subhead',
    valueVi: 'Những người sẽ đồng hành cùng bạn trên từng cây số.',
    valueEn: 'The people who will ride beside you, every kilometer of the way.',
  },
  {
    namespace: 'about',
    key: 'cta.headline',
    valueVi: 'Sẵn sàng lên đường?',
    valueEn: 'Ready to ride?',
  },
  {
    namespace: 'about',
    key: 'cta.subhead',
    valueVi: 'Hãy cho chúng tôi biết bạn muốn đi đâu.',
    valueEn: 'Tell us where you want to go.',
  },
  {
    namespace: 'about',
    key: 'cta.button',
    valueVi: 'Lên kế hoạch tour',
    valueEn: 'Plan your tour',
  },
  {
    namespace: 'about',
    key: 'meta.title',
    valueVi: 'Về chúng tôi — Vietnam Motorcycle Tour',
    valueEn: 'About Us — Vietnam Motorcycle Tour',
  },
  {
    namespace: 'about',
    key: 'meta.description',
    valueVi:
      'Công ty tour mô tô độc lập 100% sở hữu trong nước tại Nha Trang. Hơn 15 năm dẫn tour qua những cung đường ít người biết của Việt Nam.',
    valueEn:
      'An independent, 100% locally owned motorcycle tour company in Nha Trang. 15+ years guiding riders through the parts of Vietnam most tours miss.',
  },
];

async function main() {
  for (const entry of ENTRIES) {
    await prisma.translation.upsert({
      where: {
        namespace_key: {namespace: entry.namespace, key: entry.key},
      },
      update: {valueVi: entry.valueVi, valueEn: entry.valueEn},
      create: entry,
    });
  }
  console.log(`Seeded ${ENTRIES.length} about.* translations.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add the npm script** — edit `package.json`, append to the `scripts` block after `db:seed-admin-translations`:

```json
"db:seed-about-translations": "npx tsx prisma/seed-about-translations.ts",
```

- [ ] **Step 3: Run the seed**

Run: `pnpm db:seed-about-translations`
Expected output: `Seeded 22 about.* translations.`

- [ ] **Step 4: Verify in DB** — run a quick check via the existing `/admin/translations` page (start dev with `pnpm dev`, log in, filter namespace `about`), or via Prisma:

Run: `pnpm prisma studio` (optional, manual)

- [ ] **Step 5: Commit**

```bash
git add prisma/seed-about-translations.ts package.json
git commit -m "$(cat <<'EOF'
feat(seed): seed about.* translation namespace

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Seed `OrgRole` and `StaffMember` baselines

**Files:**

- Create: `prisma/seed-staff.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `prisma/seed-staff.ts`**

```ts
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL.split('?')[0];
const adapter = new PrismaPg(dbUrl);
const prisma = new PrismaClient({adapter});

type RoleSeed = {key: string; labelVi: string; labelEn: string; order: number};
type StaffSeed = {name: string; roleKey: string; order: number};

const ROLES: RoleSeed[] = [
  {key: 'founder', labelVi: 'Người sáng lập', labelEn: 'Founder', order: 0},
  {
    key: 'tour_guide',
    labelVi: 'Hướng dẫn viên',
    labelEn: 'Tour Guide',
    order: 1,
  },
  {
    key: 'tour_guide_mechanic',
    labelVi: 'Hướng dẫn viên & Kỹ sư',
    labelEn: 'Tour Guide & Mechanic',
    order: 2,
  },
  {
    key: 'driver_support',
    labelVi: 'Tài xế hỗ trợ',
    labelEn: 'Driver Support',
    order: 3,
  },
];

const STAFF: StaffSeed[] = [
  {name: 'Thomas', roleKey: 'founder', order: 0},
  {name: 'Tino', roleKey: 'tour_guide', order: 1},
  {name: 'Chan', roleKey: 'tour_guide_mechanic', order: 2},
  {name: 'Hai', roleKey: 'tour_guide', order: 3},
  {name: 'Phi', roleKey: 'driver_support', order: 4},
];

async function main() {
  // Ensure the staff image collection exists.
  await prisma.imageCollection.upsert({
    where: {key: 'staff'},
    update: {label: 'Staff Photos'},
    create: {key: 'staff', label: 'Staff Photos'},
  });

  // Roles
  const roleByKey = new Map<string, {id: string}>();
  for (const role of ROLES) {
    const row = await prisma.orgRole.upsert({
      where: {key: role.key},
      update: {
        labelVi: role.labelVi,
        labelEn: role.labelEn,
        order: role.order,
      },
      create: role,
    });
    roleByKey.set(role.key, {id: row.id});
  }

  // Staff — keyed by name; idempotent via findFirst-then-upsert pattern since
  // StaffMember has no unique field other than id.
  for (const s of STAFF) {
    const role = roleByKey.get(s.roleKey);
    if (!role) throw new Error(`Missing role ${s.roleKey}`);
    const existing = await prisma.staffMember.findFirst({
      where: {name: s.name},
    });
    if (existing) {
      await prisma.staffMember.update({
        where: {id: existing.id},
        data: {roleId: role.id, order: s.order},
      });
    } else {
      await prisma.staffMember.create({
        data: {name: s.name, roleId: role.id, order: s.order, active: true},
      });
    }
  }

  console.log(
    `Seeded ${ROLES.length} org roles and ${STAFF.length} staff members.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add the npm script** — edit `package.json`, append after `db:seed-about-translations`:

```json
"db:seed-staff": "npx tsx prisma/seed-staff.ts",
```

- [ ] **Step 3: Run the seed**

Run: `pnpm db:seed-staff`
Expected output: `Seeded 4 org roles and 5 staff members.`

- [ ] **Step 4: Run again to confirm idempotency**

Run: `pnpm db:seed-staff`
Expected: same output, no duplicate rows. Spot-check via Prisma Studio if desired.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed-staff.ts package.json
git commit -m "$(cat <<'EOF'
feat(seed): seed OrgRole + StaffMember baseline data

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `getStaffForPublic` query + mapper integration

**Files:**

- Modify: `src/data/queries.ts`

- [ ] **Step 1: Add the import** — at the top of `src/data/queries.ts`, alongside existing imports:

```ts
import type {StaffPublic} from '@/domain';
import {toStaffPublic} from '@/domain/staff/mapper';
```

- [ ] **Step 2: Append the new query** — at the end of `src/data/queries.ts`:

```ts
export async function getStaffForPublic(): Promise<StaffPublic[]> {
  try {
    const rows = await prisma.staffMember.findMany({
      where: {active: true},
      orderBy: {order: 'asc'},
      include: {role: true, image: true},
    });
    return rows.map(toStaffPublic);
  } catch (error) {
    console.error('getStaffForPublic: DB query failed', error);
    return [];
  }
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors related to the new code.

- [ ] **Step 4: Commit**

```bash
git add src/data/queries.ts
git commit -m "$(cat <<'EOF'
feat(queries): add getStaffForPublic

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: `StaffCard` component (TDD)

**Files:**

- Create: `src/components/about/AboutTeamGrid/StaffCard.tsx`
- Create: `src/components/about/AboutTeamGrid/StaffCard.spec.tsx`

- [ ] **Step 1: Write the failing test** — `src/components/about/AboutTeamGrid/StaffCard.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {StaffCard} from './StaffCard';
import type {StaffPublic} from '@/domain';

const staff: StaffPublic = {
  id: '1',
  name: 'Thomas',
  bioVi: 'Người sáng lập từ năm 2009.',
  bioEn: 'Founder since 2009.',
  order: 0,
  role: {
    id: 'r1',
    key: 'founder',
    labelVi: 'Người sáng lập',
    labelEn: 'Founder',
    order: 0,
  },
  image: {url: '/uploads/thomas.jpg', altVi: 'Thomas', altEn: 'Thomas'},
};

function renderWithLocale(locale: 'vi' | 'en', s: StaffPublic = staff) {
  return render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <StaffCard staff={s} locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe('StaffCard', () => {
  it('renders name, role, and bio in English locale', () => {
    renderWithLocale('en');
    expect(screen.getByText('Thomas')).toBeInTheDocument();
    expect(screen.getByText('Founder')).toBeInTheDocument();
    expect(screen.getByText('Founder since 2009.')).toBeInTheDocument();
  });

  it('renders role and bio in Vietnamese locale', () => {
    renderWithLocale('vi');
    expect(screen.getByText('Người sáng lập')).toBeInTheDocument();
    expect(screen.getByText('Người sáng lập từ năm 2009.')).toBeInTheDocument();
  });

  it('renders an img with the photo url and alt', () => {
    renderWithLocale('en');
    const img = screen.getByRole('img', {name: 'Thomas'}) as HTMLImageElement;
    expect(img.src).toContain('/uploads/thomas.jpg');
  });

  it('renders a placeholder when image is null', () => {
    renderWithLocale('en', {...staff, image: null});
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('staff-card-placeholder')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/components/about/AboutTeamGrid/StaffCard.spec.tsx`
Expected: FAIL — `Cannot find module './StaffCard'`.

- [ ] **Step 3: Implement `StaffCard.tsx`**

```tsx
import type {StaffPublic} from '@/domain';

type StaffCardProps = {
  staff: StaffPublic;
  locale: 'vi' | 'en';
};

export function StaffCard({staff, locale}: StaffCardProps) {
  const roleLabel = locale === 'vi' ? staff.role.labelVi : staff.role.labelEn;
  const bio = locale === 'vi' ? staff.bioVi : staff.bioEn;
  const alt = locale === 'vi' ? staff.image?.altVi : staff.image?.altEn;

  return (
    <article className="group relative overflow-hidden bg-secondary">
      <div className="aspect-[3/4] w-full bg-surface-alt">
        {staff.image?.url ? (
          <img
            src={staff.image.url}
            alt={alt ?? staff.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            data-testid="staff-card-placeholder"
            className="flex h-full w-full items-center justify-center text-white/40"
          >
            {staff.name}
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
        <p className="type-label-sm uppercase tracking-widest text-primary">
          {roleLabel}
        </p>
        <h3 className="type-headline-sm font-extrabold uppercase tracking-tight">
          {staff.name}
        </h3>
        <p className="mt-2 max-h-0 overflow-hidden text-sm text-white/80 transition-[max-height] duration-500 group-hover:max-h-40">
          {bio}
        </p>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/components/about/AboutTeamGrid/StaffCard.spec.tsx`
Expected: 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/about/AboutTeamGrid/
git commit -m "$(cat <<'EOF'
feat(about): add StaffCard component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: `AboutTeamGrid` component (TDD)

**Files:**

- Create: `src/components/about/AboutTeamGrid/AboutTeamGrid.tsx`
- Create: `src/components/about/AboutTeamGrid/AboutTeamGrid.spec.tsx`
- Create: `src/components/about/AboutTeamGrid/index.ts`

- [ ] **Step 1: Write the failing test** — `src/components/about/AboutTeamGrid/AboutTeamGrid.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {AboutTeamGrid} from './AboutTeamGrid';
import type {StaffPublic} from '@/domain';

const role = {
  id: 'r1',
  key: 'founder',
  labelVi: 'Người sáng lập',
  labelEn: 'Founder',
  order: 0,
};

const staff: StaffPublic[] = [
  {
    id: '1',
    name: 'Thomas',
    bioVi: 'a',
    bioEn: 'a',
    order: 0,
    role,
    image: null,
  },
  {id: '2', name: 'Hai', bioVi: 'b', bioEn: 'b', order: 1, role, image: null},
];

const messages = {
  about: {team: {heading: 'The Crew', subhead: 'Sub'}},
};

function renderGrid(items: StaffPublic[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AboutTeamGrid staff={items} locale="en" />
    </NextIntlClientProvider>,
  );
}

describe('AboutTeamGrid', () => {
  it('renders the section heading and subhead from translations', () => {
    renderGrid(staff);
    expect(screen.getByText('The Crew')).toBeInTheDocument();
    expect(screen.getByText('Sub')).toBeInTheDocument();
  });

  it('renders one card per staff member', () => {
    renderGrid(staff);
    expect(screen.getByText('Thomas')).toBeInTheDocument();
    expect(screen.getByText('Hai')).toBeInTheDocument();
  });

  it('renders an empty-state message when staff list is empty', () => {
    renderGrid([]);
    expect(screen.getByTestId('staff-empty')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/components/about/AboutTeamGrid/AboutTeamGrid.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `AboutTeamGrid.tsx`**

```tsx
import {useTranslations} from 'next-intl';
import type {StaffPublic} from '@/domain';
import {StaffCard} from './StaffCard';

type AboutTeamGridProps = {
  staff: StaffPublic[];
  locale: 'vi' | 'en';
};

export function AboutTeamGrid({staff, locale}: AboutTeamGridProps) {
  const t = useTranslations('about.team');

  return (
    <section
      id="team"
      className="bg-secondary py-20 lg:py-32"
      aria-labelledby="team-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-12 lg:mb-20">
          <h2
            id="team-heading"
            className="type-headline-lg font-extrabold uppercase tracking-tight text-white"
          >
            {t('heading')}
          </h2>
          <p className="mt-3 max-w-xl text-white/70">{t('subhead')}</p>
        </header>
        {staff.length === 0 ? (
          <p data-testid="staff-empty" className="text-center text-white/60">
            —
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((s) => (
              <li key={s.id}>
                <StaffCard staff={s} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `index.ts`**

```ts
export {AboutTeamGrid} from './AboutTeamGrid';
export {StaffCard} from './StaffCard';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test src/components/about/AboutTeamGrid/`
Expected: all passing.

- [ ] **Step 6: Commit**

```bash
git add src/components/about/AboutTeamGrid/
git commit -m "$(cat <<'EOF'
feat(about): add AboutTeamGrid component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: `AboutHero` + `PolaroidStack` (TDD)

**Files:**

- Create: `src/components/about/AboutHero/AboutHero.tsx`
- Create: `src/components/about/AboutHero/PolaroidStack.tsx`
- Create: `src/components/about/AboutHero/AboutHero.spec.tsx`
- Create: `src/components/about/AboutHero/index.ts`

- [ ] **Step 1: Write the failing test** — `AboutHero.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {AboutHero} from './AboutHero';
import type {StaffPublic} from '@/domain';

const role = {
  id: 'r1',
  key: 'founder',
  labelVi: 'Người sáng lập',
  labelEn: 'Founder',
  order: 0,
};

const featured: StaffPublic[] = [
  {
    id: '1',
    name: 'Thomas',
    bioVi: '',
    bioEn: '',
    order: 0,
    role,
    image: {url: '/uploads/t.jpg', altVi: 'T', altEn: 'T'},
  },
  {
    id: '2',
    name: 'Hai',
    bioVi: '',
    bioEn: '',
    order: 1,
    role,
    image: {url: '/uploads/h.jpg', altVi: 'H', altEn: 'H'},
  },
  {
    id: '3',
    name: 'Chan',
    bioVi: '',
    bioEn: '',
    order: 2,
    role,
    image: {url: '/uploads/c.jpg', altVi: 'C', altEn: 'C'},
  },
];

const messages = {
  about: {
    hero: {
      eyebrow: 'About',
      headline: 'Riding the real Vietnam.',
      lead: 'Lead paragraph.',
      ctaMeetTeam: 'Meet the team',
    },
  },
};

describe('AboutHero', () => {
  it('renders eyebrow, headline, lead, and CTA from translations', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutHero featured={featured} locale="en" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Riding the real Vietnam.')).toBeInTheDocument();
    expect(screen.getByText('Lead paragraph.')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /Meet the team/i})).toHaveAttribute(
      'href',
      '#team',
    );
  });

  it('renders three polaroids from the featured staff', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutHero featured={featured} locale="en" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Thomas')).toBeInTheDocument();
    expect(screen.getByText('Hai')).toBeInTheDocument();
    expect(screen.getByText('Chan')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/components/about/AboutHero/AboutHero.spec.tsx`
Expected: module not found.

- [ ] **Step 3: Implement `PolaroidStack.tsx`**

```tsx
import type {StaffPublic} from '@/domain';

type PolaroidStackProps = {
  featured: StaffPublic[];
  locale: 'vi' | 'en';
};

export function PolaroidStack({featured, locale}: PolaroidStackProps) {
  return (
    <div className="relative h-[28rem] w-full">
      {featured.slice(0, 3).map((s, i) => {
        const rotation = ['-rotate-6', 'rotate-2', '-rotate-3'][i] ?? '';
        const offset =
          ['left-0 top-0', 'left-1/4 top-8', 'left-1/2 top-4'][i] ?? '';
        const alt = locale === 'vi' ? s.image?.altVi : s.image?.altEn;
        const role = locale === 'vi' ? s.role.labelVi : s.role.labelEn;
        return (
          <figure
            key={s.id}
            className={`absolute ${offset} ${rotation} w-48 transform shadow-2xl`}
          >
            <div className="aspect-[3/4] w-full bg-surface-alt">
              {s.image?.url ? (
                <img
                  src={s.image.url}
                  alt={alt ?? s.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <figcaption className="bg-white px-3 py-2 text-xs">
              <span className="block font-semibold">{s.name}</span>
              <span className="text-on-surface-secondary">{role}</span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Implement `AboutHero.tsx`**

```tsx
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import type {StaffPublic} from '@/domain';
import {PolaroidStack} from './PolaroidStack';

type AboutHeroProps = {
  featured: StaffPublic[];
  locale: 'vi' | 'en';
};

export function AboutHero({featured, locale}: AboutHeroProps) {
  const t = useTranslations('about.hero');

  return (
    <section className="bg-secondary py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="type-label-sm uppercase tracking-widest text-primary">
              {t('eyebrow')}
            </p>
            <h1 className="mt-4 type-headline-lg font-extrabold uppercase tracking-tight text-white">
              {t('headline')}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">{t('lead')}</p>
            <Link
              href="#team"
              className="mt-8 inline-flex items-center gap-2 text-primary hover:text-primary-light cursor-pointer type-label-sm uppercase tracking-widest"
            >
              {t('ctaMeetTeam')} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <PolaroidStack featured={featured} locale={locale} />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `index.ts`**

```ts
export {AboutHero} from './AboutHero';
export {PolaroidStack} from './PolaroidStack';
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm test src/components/about/AboutHero/`
Expected: passing.

- [ ] **Step 7: Commit**

```bash
git add src/components/about/AboutHero/
git commit -m "$(cat <<'EOF'
feat(about): add AboutHero with PolaroidStack

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: `AboutStory` (TDD)

**Files:**

- Create: `src/components/about/AboutStory/AboutStory.tsx`
- Create: `src/components/about/AboutStory/AboutStory.spec.tsx`
- Create: `src/components/about/AboutStory/index.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {AboutStory} from './AboutStory';

const messages = {
  about: {
    story: {
      pullQuote: '100% locally owned.',
      body: 'Paragraph one.\n\nParagraph two.',
    },
  },
};

describe('AboutStory', () => {
  it('renders the pull quote', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutStory />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('100% locally owned.')).toBeInTheDocument();
  });

  it('renders each \\n\\n-separated paragraph as its own <p>', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutStory />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Paragraph one.')).toBeInTheDocument();
    expect(screen.getByText('Paragraph two.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/components/about/AboutStory/AboutStory.spec.tsx`
Expected: module not found.

- [ ] **Step 3: Implement `AboutStory.tsx`**

```tsx
import {useTranslations} from 'next-intl';

export function AboutStory() {
  const t = useTranslations('about.story');
  const paragraphs = t('body').split('\n\n');

  return (
    <section className="bg-secondary py-20 lg:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <blockquote className="type-headline-lg font-extrabold uppercase tracking-tight text-primary">
          {t('pullQuote')}
        </blockquote>
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-white/80">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `index.ts`**

```ts
export {AboutStory} from './AboutStory';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test src/components/about/AboutStory/`
Expected: passing.

- [ ] **Step 6: Commit**

```bash
git add src/components/about/AboutStory/
git commit -m "$(cat <<'EOF'
feat(about): add AboutStory section

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: `AboutValueProps` (TDD)

**Files:**

- Create: `src/components/about/AboutValueProps/AboutValueProps.tsx`
- Create: `src/components/about/AboutValueProps/AboutValueProps.spec.tsx`
- Create: `src/components/about/AboutValueProps/index.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {AboutValueProps} from './AboutValueProps';

const messages = {
  about: {
    valueProps: {
      '01': {title: 'Locally Owned', body: 'L body'},
      '02': {title: 'Off the Beaten Track', body: 'O body'},
      '03': {title: 'All Rider Levels', body: 'A body'},
      '04': {title: 'Local Knowledge', body: 'K body'},
    },
  },
};

describe('AboutValueProps', () => {
  it('renders all four value props', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutValueProps />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Locally Owned')).toBeInTheDocument();
    expect(screen.getByText('Off the Beaten Track')).toBeInTheDocument();
    expect(screen.getByText('All Rider Levels')).toBeInTheDocument();
    expect(screen.getByText('Local Knowledge')).toBeInTheDocument();
    expect(screen.getByText('K body')).toBeInTheDocument();
  });

  it('renders numerals 01–04', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutValueProps />
      </NextIntlClientProvider>,
    );
    for (const n of ['01', '02', '03', '04']) {
      expect(screen.getByText(n)).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/components/about/AboutValueProps/AboutValueProps.spec.tsx`
Expected: module not found.

- [ ] **Step 3: Implement `AboutValueProps.tsx`**

```tsx
import {useTranslations} from 'next-intl';

const KEYS = ['01', '02', '03', '04'] as const;

export function AboutValueProps() {
  const t = useTranslations('about.valueProps');

  return (
    <section className="bg-secondary py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {KEYS.map((k) => (
            <li key={k} className="border-l border-primary/60 pl-6">
              <p className="type-headline-md font-extrabold text-primary">
                {k}
              </p>
              <h3 className="mt-4 type-label-lg font-bold uppercase tracking-widest text-white">
                {t(`${k}.title`)}
              </h3>
              <p className="mt-3 text-sm text-white/70">{t(`${k}.body`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `index.ts`**

```ts
export {AboutValueProps} from './AboutValueProps';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test src/components/about/AboutValueProps/`
Expected: passing.

- [ ] **Step 6: Commit**

```bash
git add src/components/about/AboutValueProps/
git commit -m "$(cat <<'EOF'
feat(about): add AboutValueProps section

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: `AboutCta` (TDD)

**Files:**

- Create: `src/components/about/AboutCta/AboutCta.tsx`
- Create: `src/components/about/AboutCta/AboutCta.spec.tsx`
- Create: `src/components/about/AboutCta/index.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {AboutCta} from './AboutCta';

const messages = {
  about: {
    cta: {
      headline: 'Ready to ride?',
      subhead: 'Tell us.',
      button: 'Plan your tour',
    },
  },
};

describe('AboutCta', () => {
  it('renders headline, subhead, and button linking to /contact', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutCta />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Ready to ride?')).toBeInTheDocument();
    expect(screen.getByText('Tell us.')).toBeInTheDocument();
    const link = screen.getByRole('link', {name: /plan your tour/i});
    expect(link).toHaveAttribute('href', '/contact');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/components/about/AboutCta/AboutCta.spec.tsx`
Expected: module not found.

- [ ] **Step 3: Implement `AboutCta.tsx`**

```tsx
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {routes} from '@/routes';

export function AboutCta() {
  const t = useTranslations('about.cta');

  return (
    <section className="bg-primary py-16 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="text-white">
          <h2 className="type-headline-md font-extrabold uppercase tracking-tight">
            {t('headline')}
          </h2>
          <p className="mt-2 text-white/80">{t('subhead')}</p>
        </div>
        <Link
          href={routes.contact.path()}
          className="bg-secondary text-white type-label-sm uppercase tracking-widest px-8 py-4 rounded-none hover:bg-secondary/80 transition-colors cursor-pointer"
        >
          {t('button')}
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `index.ts`**

```ts
export {AboutCta} from './AboutCta';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test src/components/about/AboutCta/`
Expected: passing.

- [ ] **Step 6: Commit**

```bash
git add src/components/about/AboutCta/
git commit -m "$(cat <<'EOF'
feat(about): add AboutCta section

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Compose `/about-us` page

**Files:**

- Create: `src/components/about/index.ts`
- Modify: `src/pages/about-us.tsx` (full rewrite)

- [ ] **Step 1: Create the barrel `src/components/about/index.ts`**

```ts
export {AboutHero} from './AboutHero';
export {AboutStory} from './AboutStory';
export {AboutValueProps} from './AboutValueProps';
export {AboutTeamGrid} from './AboutTeamGrid';
export {AboutCta} from './AboutCta';
```

- [ ] **Step 2: Replace `src/pages/about-us.tsx` entirely**

```tsx
import Head from 'next/head';
import {useTranslations} from 'next-intl';
import type {GetStaticPropsContext} from 'next';
import type {StaffPublic} from '@/domain';
import {
  AboutHero,
  AboutStory,
  AboutValueProps,
  AboutTeamGrid,
  AboutCta,
} from '@/components/about';

type AboutUsProps = {
  staff: StaffPublic[];
  locale: 'vi' | 'en';
};

export default function AboutUs({staff, locale}: AboutUsProps) {
  const tMeta = useTranslations('about.meta');

  return (
    <>
      <Head>
        <title>{tMeta('title')}</title>
        <meta name="description" content={tMeta('description')} />
      </Head>
      <AboutHero featured={staff.slice(0, 3)} locale={locale} />
      <AboutStory />
      <AboutValueProps />
      <AboutTeamGrid staff={staff} locale={locale} />
      <AboutCta />
    </>
  );
}

export async function getStaticProps({locale}: GetStaticPropsContext) {
  const {getMessagesFromDb, getStaffForPublic} = await import('@/data/queries');
  const resolvedLocale = (locale ?? 'vi') as 'vi' | 'en';
  const [messages, staff] = await Promise.all([
    getMessagesFromDb(resolvedLocale),
    getStaffForPublic(),
  ]);

  return {
    props: {messages, staff, locale: resolvedLocale},
    revalidate: 60,
  };
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Smoke-test in dev**

Run: `pnpm dev`
Open: http://localhost:3000/about-us — confirm hero / story / value props / team grid / CTA all render with seeded content.

- [ ] **Step 5: Commit**

```bash
git add src/components/about/index.ts src/pages/about-us.tsx
git commit -m "$(cat <<'EOF'
feat(about): rewrite /about-us with new layout

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Routes registry + API builders

**Files:**

- Modify: `src/routes/registry.ts`
- Modify: `src/routes/api.ts`

- [ ] **Step 1: Add admin routes** — in `src/routes/registry.ts`, inside the `admin:` block (after `users:`):

```ts
    roles: {
      list: {path: () => '/admin/roles'},
      new: {path: () => '/admin/roles/new'},
      edit: {path: (p: {id: string}) => `/admin/roles/${p.id}`},
    },
    staff: {
      list: {path: () => '/admin/staff'},
      new: {path: () => '/admin/staff/new'},
      edit: {path: (p: {id: string}) => `/admin/staff/${p.id}`},
    },
```

- [ ] **Step 2: Add api builders** — in `src/routes/api.ts`, inside `api.admin = { ... }` (after the existing admin entries):

```ts
    roles: {
      list: () => request<VMT.OrgRole[]>('/api/admin/roles'),
      get: (id: string) => request<VMT.OrgRole>(`/api/admin/roles/${id}`),
      create: (data: Record<string, unknown>) =>
        request<VMT.OrgRole>('/api/admin/roles', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<VMT.OrgRole>(`/api/admin/roles/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/roles/${id}`, {method: 'DELETE'}),
    },
    staff: {
      list: () => request<VMT.StaffAdmin[]>('/api/admin/staff'),
      get: (id: string) => request<VMT.StaffAdmin>(`/api/admin/staff/${id}`),
      create: (data: Record<string, unknown>) =>
        request<VMT.StaffAdmin>('/api/admin/staff', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<VMT.StaffAdmin>(`/api/admin/staff/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/staff/${id}`, {method: 'DELETE'}),
    },
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/registry.ts src/routes/api.ts
git commit -m "$(cat <<'EOF'
feat(routes): add admin roles + staff routes and api builders

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: API handler — `roles/index.ts` (GET list, POST create)

**Files:**

- Create: `src/pages/api/admin/roles/index.ts`

- [ ] **Step 1: Implement the handler**

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toOrgRole} from '@/domain/org-role/mapper';

const KEY_REGEX = /^[a-z][a-z0-9_]*$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const rows = await prisma.orgRole.findMany({orderBy: {order: 'asc'}});
    return res.json(rows.map(toOrgRole));
  }

  if (req.method === 'POST') {
    const {key, labelVi, labelEn, order} = req.body ?? {};
    if (typeof key !== 'string' || !KEY_REGEX.test(key)) {
      return res.status(400).json({error: 'key must be lowercase snake_case'});
    }
    if (typeof labelVi !== 'string' || labelVi.length === 0) {
      return res.status(400).json({error: 'labelVi is required'});
    }
    if (typeof labelEn !== 'string' || labelEn.length === 0) {
      return res.status(400).json({error: 'labelEn is required'});
    }
    const existing = await prisma.orgRole.findUnique({where: {key}});
    if (existing) return res.status(409).json({error: 'key already in use'});
    const row = await prisma.orgRole.create({
      data: {
        key,
        labelVi,
        labelEn,
        order: typeof order === 'number' ? order : 0,
      },
    });
    return res.status(201).json(toOrgRole(row));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 2: Smoke-test via curl while `pnpm dev` is running** (optional). Log in via the admin UI to obtain a session cookie. Then:

```bash
curl -s http://localhost:3000/api/admin/roles -H "Cookie: <session-cookie>"
```

Expected: JSON array containing the 4 seeded roles.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/admin/roles/index.ts
git commit -m "$(cat <<'EOF'
feat(api): add admin roles list + create endpoint

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: API handler — `roles/[id].ts` (GET, PUT, DELETE)

**Files:**

- Create: `src/pages/api/admin/roles/[id].ts`

- [ ] **Step 1: Implement the handler**

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toOrgRole} from '@/domain/org-role/mapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({error: 'id required'});

  if (req.method === 'GET') {
    const row = await prisma.orgRole.findUnique({where: {id}});
    if (!row) return res.status(404).json({error: 'Not found'});
    return res.json(toOrgRole(row));
  }

  if (req.method === 'PUT') {
    const {labelVi, labelEn, order, key} = req.body ?? {};
    if (typeof key === 'string') {
      const current = await prisma.orgRole.findUnique({where: {id}});
      if (current && current.key !== key) {
        return res.status(400).json({error: 'key is immutable'});
      }
    }
    if (labelVi !== undefined && typeof labelVi !== 'string') {
      return res.status(400).json({error: 'labelVi must be a string'});
    }
    if (labelEn !== undefined && typeof labelEn !== 'string') {
      return res.status(400).json({error: 'labelEn must be a string'});
    }
    try {
      const row = await prisma.orgRole.update({
        where: {id},
        data: {
          ...(labelVi !== undefined ? {labelVi} : {}),
          ...(labelEn !== undefined ? {labelEn} : {}),
          ...(typeof order === 'number' ? {order} : {}),
        },
      });
      return res.json(toOrgRole(row));
    } catch {
      return res.status(404).json({error: 'Not found'});
    }
  }

  if (req.method === 'DELETE') {
    const inUse = await prisma.staffMember.count({where: {roleId: id}});
    if (inUse > 0) return res.status(409).json({error: 'Role in use'});
    try {
      await prisma.orgRole.delete({where: {id}});
      return res.status(204).end();
    } catch {
      return res.status(404).json({error: 'Not found'});
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/admin/roles/[id].ts
git commit -m "$(cat <<'EOF'
feat(api): add admin role read/update/delete endpoint

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: API handler — `staff/index.ts` (GET list, POST create)

**Files:**

- Create: `src/pages/api/admin/staff/index.ts`

- [ ] **Step 1: Implement the handler**

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toStaffAdmin} from '@/domain/staff/mapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const rows = await prisma.staffMember.findMany({
      orderBy: {order: 'asc'},
      include: {role: true, image: true},
    });
    return res.json(rows.map(toStaffAdmin));
  }

  if (req.method === 'POST') {
    const {name, roleId, bioVi, bioEn, imageId, order, active} = req.body ?? {};
    if (typeof name !== 'string' || name.length === 0) {
      return res.status(400).json({error: 'name is required'});
    }
    if (typeof roleId !== 'string' || roleId.length === 0) {
      return res.status(400).json({error: 'roleId is required'});
    }
    const role = await prisma.orgRole.findUnique({where: {id: roleId}});
    if (!role) return res.status(400).json({error: 'roleId not found'});
    if (imageId != null && typeof imageId !== 'string') {
      return res.status(400).json({error: 'imageId must be a string or null'});
    }
    if (imageId) {
      const img = await prisma.collectionImage.findUnique({
        where: {id: imageId},
      });
      if (!img) return res.status(400).json({error: 'imageId not found'});
    }
    const row = await prisma.staffMember.create({
      data: {
        name,
        roleId,
        bioVi: typeof bioVi === 'string' ? bioVi : '',
        bioEn: typeof bioEn === 'string' ? bioEn : '',
        imageId: imageId ?? null,
        order: typeof order === 'number' ? order : 0,
        active: typeof active === 'boolean' ? active : true,
      },
      include: {role: true, image: true},
    });
    return res.status(201).json(toStaffAdmin(row));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/admin/staff/index.ts
git commit -m "$(cat <<'EOF'
feat(api): add admin staff list + create endpoint

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: API handler — `staff/[id].ts` (GET, PUT, DELETE)

**Files:**

- Create: `src/pages/api/admin/staff/[id].ts`

- [ ] **Step 1: Implement the handler**

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toStaffAdmin} from '@/domain/staff/mapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({error: 'id required'});

  if (req.method === 'GET') {
    const row = await prisma.staffMember.findUnique({
      where: {id},
      include: {role: true, image: true},
    });
    if (!row) return res.status(404).json({error: 'Not found'});
    return res.json(toStaffAdmin(row));
  }

  if (req.method === 'PUT') {
    const {name, roleId, bioVi, bioEn, imageId, order, active} = req.body ?? {};
    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.length === 0) {
        return res.status(400).json({error: 'name must be a non-empty string'});
      }
      data.name = name;
    }
    if (roleId !== undefined) {
      if (typeof roleId !== 'string' || roleId.length === 0) {
        return res.status(400).json({error: 'roleId required'});
      }
      const role = await prisma.orgRole.findUnique({where: {id: roleId}});
      if (!role) return res.status(400).json({error: 'roleId not found'});
      data.roleId = roleId;
    }
    if (bioVi !== undefined) {
      if (typeof bioVi !== 'string') {
        return res.status(400).json({error: 'bioVi must be a string'});
      }
      data.bioVi = bioVi;
    }
    if (bioEn !== undefined) {
      if (typeof bioEn !== 'string') {
        return res.status(400).json({error: 'bioEn must be a string'});
      }
      data.bioEn = bioEn;
    }
    if (imageId !== undefined) {
      if (imageId !== null && typeof imageId !== 'string') {
        return res
          .status(400)
          .json({error: 'imageId must be a string or null'});
      }
      if (imageId) {
        const img = await prisma.collectionImage.findUnique({
          where: {id: imageId},
        });
        if (!img) return res.status(400).json({error: 'imageId not found'});
      }
      data.imageId = imageId;
    }
    if (typeof order === 'number') data.order = order;
    if (typeof active === 'boolean') data.active = active;

    try {
      const row = await prisma.staffMember.update({
        where: {id},
        data,
        include: {role: true, image: true},
      });
      return res.json(toStaffAdmin(row));
    } catch {
      return res.status(404).json({error: 'Not found'});
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.staffMember.delete({where: {id}});
      return res.status(204).end();
    } catch {
      return res.status(404).json({error: 'Not found'});
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/admin/staff/[id].ts
git commit -m "$(cat <<'EOF'
feat(api): add admin staff read/update/delete endpoint

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 18: `RoleForm` component + form-utils (TDD)

**Files:**

- Create: `src/components/Admin/RoleForm/RoleForm.form-utils.ts`
- Create: `src/components/Admin/RoleForm/RoleForm.tsx`
- Create: `src/components/Admin/RoleForm/RoleForm.spec.tsx`
- Create: `src/components/Admin/RoleForm/index.ts`

- [ ] **Step 1: Write the failing test** — `RoleForm.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {NextIntlClientProvider} from 'next-intl';
import {RoleForm} from './RoleForm';

const messages = {
  admin: {
    roles: {
      keyLabel: 'Key',
      labelViLabel: 'Label (VI)',
      labelEnLabel: 'Label (EN)',
      orderLabel: 'Order',
      save: 'Save',
      validation: {
        keyFormat: 'key must be lowercase snake_case',
        labelViRequired: 'Vietnamese label required',
        labelEnRequired: 'English label required',
      },
    },
  },
};

function setup(props: Partial<React.ComponentProps<typeof RoleForm>> = {}) {
  const onSubmit = jest.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RoleForm mode="create" onSubmit={onSubmit} {...props} />
    </NextIntlClientProvider>,
  );
  return {onSubmit};
}

describe('RoleForm', () => {
  it('disables the key field when mode=edit', () => {
    setup({
      mode: 'edit',
      defaults: {
        key: 'founder',
        labelVi: 'X',
        labelEn: 'Y',
        order: 0,
      },
    });
    expect(screen.getByLabelText('Key')).toBeDisabled();
  });

  it('submits valid data', async () => {
    const {onSubmit} = setup();
    await userEvent.type(screen.getByLabelText('Key'), 'guide');
    await userEvent.type(screen.getByLabelText('Label (VI)'), 'HD');
    await userEvent.type(screen.getByLabelText('Label (EN)'), 'Guide');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'guide',
        labelVi: 'HD',
        labelEn: 'Guide',
        order: 0,
      }),
    );
  });

  it('shows an error when key is not snake_case', async () => {
    setup();
    await userEvent.type(screen.getByLabelText('Key'), 'Invalid Key!');
    await userEvent.type(screen.getByLabelText('Label (VI)'), 'X');
    await userEvent.type(screen.getByLabelText('Label (EN)'), 'Y');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(
      await screen.findByText('key must be lowercase snake_case'),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/components/Admin/RoleForm/RoleForm.spec.tsx`
Expected: module not found.

- [ ] **Step 3: Implement `RoleForm.form-utils.ts`**

```ts
import * as yup from 'yup';

export const KEY_REGEX = /^[a-z][a-z0-9_]*$/;

export type RoleFormValues = {
  key: string;
  labelVi: string;
  labelEn: string;
  order: number;
};

export const roleFormDefaults: RoleFormValues = {
  key: '',
  labelVi: '',
  labelEn: '',
  order: 0,
};

export function buildRoleSchema(t: (k: string) => string) {
  return yup.object({
    key: yup
      .string()
      .required(t('validation.keyFormat'))
      .matches(KEY_REGEX, t('validation.keyFormat')),
    labelVi: yup.string().required(t('validation.labelViRequired')),
    labelEn: yup.string().required(t('validation.labelEnRequired')),
    order: yup.number().integer().min(0).default(0),
  });
}
```

- [ ] **Step 4: Implement `RoleForm.tsx`**

```tsx
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {Button, TextInput, NumberInput, FormField} from '@/components/ui';
import {
  buildRoleSchema,
  roleFormDefaults,
  type RoleFormValues,
} from './RoleForm.form-utils';

type RoleFormProps = {
  mode: 'create' | 'edit';
  defaults?: RoleFormValues;
  onSubmit: (data: RoleFormValues) => void;
};

export function RoleForm({mode, defaults, onSubmit}: RoleFormProps) {
  const t = useTranslations('admin.roles');
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<RoleFormValues>({
    resolver: yupResolver(buildRoleSchema(t)),
    defaultValues: defaults ?? roleFormDefaults,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField label={t('keyLabel')} error={errors.key?.message}>
        <TextInput {...register('key')} disabled={mode === 'edit'} />
      </FormField>
      <FormField label={t('labelViLabel')} error={errors.labelVi?.message}>
        <TextInput {...register('labelVi')} />
      </FormField>
      <FormField label={t('labelEnLabel')} error={errors.labelEn?.message}>
        <TextInput {...register('labelEn')} />
      </FormField>
      <FormField label={t('orderLabel')} error={errors.order?.message}>
        <NumberInput {...register('order', {valueAsNumber: true})} />
      </FormField>
      <Button type="submit" disabled={isSubmitting}>
        {t('save')}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Create `index.ts`**

```ts
export {RoleForm} from './RoleForm';
export type {RoleFormValues} from './RoleForm.form-utils';
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm test src/components/Admin/RoleForm/`
Expected: passing.

- [ ] **Step 7: Add UI translations** — open `src/messages/en.json`, add under top-level `admin`:

```json
    "roles": {
      "title": "Roles",
      "new": "New role",
      "edit": "Edit role",
      "keyLabel": "Key",
      "labelViLabel": "Label (VI)",
      "labelEnLabel": "Label (EN)",
      "orderLabel": "Order",
      "save": "Save",
      "delete": "Delete",
      "deleteConfirm": "Delete role \"{label}\"?",
      "deleteInUse": "Role is in use and cannot be deleted",
      "staffCount": "Staff using role",
      "validation": {
        "keyFormat": "key must be lowercase snake_case",
        "labelViRequired": "Vietnamese label required",
        "labelEnRequired": "English label required"
      }
    },
```

In `src/messages/vi.json`, mirror with Vietnamese translations (use the same JSON shape, translate user-facing strings).

- [ ] **Step 8: Commit**

```bash
git add src/components/Admin/RoleForm/ src/messages/
git commit -m "$(cat <<'EOF'
feat(admin): add RoleForm component + i18n strings

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 19: Admin `/admin/roles` list + new + edit pages

**Files:**

- Create: `src/pages/admin/roles/index.tsx`
- Create: `src/pages/admin/roles/new.tsx`
- Create: `src/pages/admin/roles/[id].tsx`

- [ ] **Step 1: Implement `src/pages/admin/roles/index.tsx`**

```tsx
import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import type * as VMT from '@/domain';

export default function RolesListPage() {
  const t = useTranslations('admin.roles');
  const router = useRouter();
  const {setLoading: setAdminLoading} = useAdminLoading();
  const [roles, setRoles] = useState<VMT.OrgRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.roles.list().then(({data}) => {
      if (data) setRoles(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function handleDelete(role: VMT.OrgRole) {
    if (!confirm(t('deleteConfirm', {label: role.labelEn}))) return;
    const {error} = await api.admin.roles.delete(role.id);
    if (error) {
      alert(error.includes('Role in use') ? t('deleteInUse') : error);
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="type-headline-sm">{t('title')}</h1>
        <Link
          href={routes.admin.roles.new.path()}
          className="bg-primary text-white px-4 py-2 rounded-lg cursor-pointer"
        >
          {t('new')}
        </Link>
      </header>
      <table className="w-full bg-surface-elevated rounded-xl border border-border">
        <thead>
          <tr className="text-left type-label-sm uppercase text-on-surface-secondary">
            <th className="p-3">{t('orderLabel')}</th>
            <th className="p-3">{t('keyLabel')}</th>
            <th className="p-3">{t('labelViLabel')}</th>
            <th className="p-3">{t('labelEnLabel')}</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3">{r.order}</td>
              <td className="p-3 font-mono text-sm">{r.key}</td>
              <td className="p-3">{r.labelVi}</td>
              <td className="p-3">{r.labelEn}</td>
              <td className="p-3 flex gap-2">
                <Link
                  href={routes.admin.roles.edit.path({id: r.id})}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(r)}
                  className="text-error hover:underline cursor-pointer"
                  type="button"
                >
                  {t('delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Implement `src/pages/admin/roles/new.tsx`**

```tsx
import {useRouter} from 'next/router';
import {RoleForm, type RoleFormValues} from '@/components/Admin/RoleForm';
import {api, routes} from '@/routes';

export default function NewRolePage() {
  const router = useRouter();

  async function onSubmit(values: RoleFormValues) {
    const {error} = await api.admin.roles.create(
      values as unknown as Record<string, unknown>,
    );
    if (error) {
      alert(error);
      return;
    }
    router.push(routes.admin.roles.list.path());
  }

  return <RoleForm mode="create" onSubmit={onSubmit} />;
}
```

- [ ] **Step 3: Implement `src/pages/admin/roles/[id].tsx`**

```tsx
import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {RoleForm, type RoleFormValues} from '@/components/Admin/RoleForm';
import {api, routes} from '@/routes';
import type * as VMT from '@/domain';

export default function EditRolePage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [role, setRole] = useState<VMT.OrgRole | null>(null);

  useEffect(() => {
    if (!id) return;
    api.admin.roles.get(id).then(({data}) => {
      if (data) setRole(data);
    });
  }, [id]);

  async function onSubmit(values: RoleFormValues) {
    const {error} = await api.admin.roles.update(
      id,
      values as unknown as Record<string, unknown>,
    );
    if (error) {
      alert(error);
      return;
    }
    router.push(routes.admin.roles.list.path());
  }

  if (!role) return null;
  return <RoleForm mode="edit" defaults={role} onSubmit={onSubmit} />;
}
```

- [ ] **Step 4: Smoke-test**

Run: `pnpm dev`
Visit /admin/roles, /admin/roles/new, /admin/roles/<id>. Create a test role; edit; delete (expect 409 if assigned).

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/roles/
git commit -m "$(cat <<'EOF'
feat(admin): add roles list, new, and edit pages

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 20: `StaffImagePicker` component (TDD)

**Files:**

- Create: `src/components/Admin/StaffForm/StaffImagePicker.tsx`
- Create: `src/components/Admin/StaffForm/StaffImagePicker.spec.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {NextIntlClientProvider} from 'next-intl';
import {StaffImagePicker} from './StaffImagePicker';

const messages = {
  admin: {
    staff: {
      pickImage: 'Select photo',
      removeImage: 'Remove',
      modalTitle: 'Choose a staff photo',
    },
  },
};

const images = [
  {id: 'i1', url: '/uploads/a.jpg', altVi: '', altEn: 'A'},
  {id: 'i2', url: '/uploads/b.jpg', altVi: '', altEn: 'B'},
];

function setup(value: string | null = null) {
  const onChange = jest.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <StaffImagePicker images={images} value={value} onChange={onChange} />
    </NextIntlClientProvider>,
  );
  return {onChange};
}

describe('StaffImagePicker', () => {
  it('opens a modal of images when the button is clicked', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', {name: 'Select photo'}));
    expect(screen.getByText('Choose a staff photo')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('calls onChange with the selected id and closes the modal', async () => {
    const {onChange} = setup();
    await userEvent.click(screen.getByRole('button', {name: 'Select photo'}));
    await userEvent.click(screen.getByRole('img', {name: 'A'}));
    expect(onChange).toHaveBeenCalledWith('i1');
    expect(screen.queryByText('Choose a staff photo')).not.toBeInTheDocument();
  });

  it('shows a remove button when a value is set', async () => {
    const {onChange} = setup('i1');
    await userEvent.click(screen.getByRole('button', {name: 'Remove'}));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/components/Admin/StaffForm/StaffImagePicker.spec.tsx`
Expected: module not found.

- [ ] **Step 3: Implement `StaffImagePicker.tsx`**

```tsx
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {Modal, Button} from '@/components/ui';
import type * as VMT from '@/domain';

type PickableImage = Pick<
  VMT.CollectionImage,
  'id' | 'url' | 'altVi' | 'altEn'
>;

type StaffImagePickerProps = {
  images: PickableImage[];
  value: string | null;
  onChange: (id: string | null) => void;
};

export function StaffImagePicker({
  images,
  value,
  onChange,
}: StaffImagePickerProps) {
  const t = useTranslations('admin.staff');
  const [open, setOpen] = useState(false);
  const selected = images.find((i) => i.id === value);

  return (
    <div className="flex items-center gap-4">
      {selected?.url ? (
        <img
          src={selected.url}
          alt={selected.altEn}
          className="h-20 w-20 object-cover rounded-lg"
        />
      ) : (
        <div className="h-20 w-20 bg-surface-alt rounded-lg" />
      )}
      <div className="flex flex-col gap-2">
        <Button type="button" onClick={() => setOpen(true)}>
          {t('pickImage')}
        </Button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-sm text-error hover:underline cursor-pointer"
          >
            {t('removeImage')}
          </button>
        ) : null}
      </div>
      {open ? (
        <Modal title={t('modalTitle')} onClose={() => setOpen(false)}>
          <div className="grid grid-cols-3 gap-3">
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                className="cursor-pointer overflow-hidden rounded-lg"
                onClick={() => {
                  onChange(img.id);
                  setOpen(false);
                }}
              >
                {img.url ? (
                  <img
                    src={img.url}
                    alt={img.altEn}
                    className="h-32 w-full object-cover"
                  />
                ) : null}
              </button>
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/components/Admin/StaffForm/StaffImagePicker.spec.tsx`
Expected: passing.

- [ ] **Step 5: Add UI translations** — append under `admin` in `src/messages/en.json`:

```json
    "staff": {
      "title": "Staff",
      "new": "New staff member",
      "edit": "Edit staff member",
      "nameLabel": "Name",
      "roleLabel": "Role",
      "bioViLabel": "Bio (VI)",
      "bioEnLabel": "Bio (EN)",
      "orderLabel": "Order",
      "activeLabel": "Active",
      "save": "Save",
      "delete": "Delete",
      "deleteConfirm": "Delete \"{name}\"?",
      "pickImage": "Select photo",
      "removeImage": "Remove",
      "modalTitle": "Choose a staff photo",
      "imageCollectionMissing": "Create the 'staff' image collection first.",
      "validation": {
        "nameRequired": "Name required",
        "roleRequired": "Role required"
      }
    },
```

Mirror in `src/messages/vi.json`.

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin/StaffForm/ src/messages/
git commit -m "$(cat <<'EOF'
feat(admin): add StaffImagePicker + staff i18n strings

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 21: `StaffForm` component + form-utils (TDD)

**Files:**

- Create: `src/components/Admin/StaffForm/StaffForm.form-utils.ts`
- Create: `src/components/Admin/StaffForm/StaffForm.tsx`
- Create: `src/components/Admin/StaffForm/StaffForm.spec.tsx`
- Create: `src/components/Admin/StaffForm/index.ts`

- [ ] **Step 1: Implement `StaffForm.form-utils.ts`**

```ts
import * as yup from 'yup';

export type StaffFormValues = {
  name: string;
  roleId: string;
  bioVi: string;
  bioEn: string;
  imageId: string | null;
  order: number;
  active: boolean;
};

export const staffFormDefaults: StaffFormValues = {
  name: '',
  roleId: '',
  bioVi: '',
  bioEn: '',
  imageId: null,
  order: 0,
  active: true,
};

export function buildStaffSchema(t: (k: string) => string) {
  return yup.object({
    name: yup.string().required(t('validation.nameRequired')),
    roleId: yup.string().required(t('validation.roleRequired')),
    bioVi: yup.string().defined(),
    bioEn: yup.string().defined(),
    imageId: yup.string().nullable().defined(),
    order: yup.number().integer().min(0).default(0),
    active: yup.boolean().default(true),
  });
}
```

- [ ] **Step 2: Write the failing test** — `StaffForm.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {NextIntlClientProvider} from 'next-intl';
import {StaffForm} from './StaffForm';

const messages = {
  admin: {
    staff: {
      title: 'Staff',
      nameLabel: 'Name',
      roleLabel: 'Role',
      bioViLabel: 'Bio (VI)',
      bioEnLabel: 'Bio (EN)',
      orderLabel: 'Order',
      activeLabel: 'Active',
      save: 'Save',
      pickImage: 'Select photo',
      removeImage: 'Remove',
      modalTitle: 'Choose a staff photo',
      validation: {
        nameRequired: 'Name required',
        roleRequired: 'Role required',
      },
    },
  },
};

const roles = [
  {
    id: 'r1',
    key: 'founder',
    labelVi: 'Người sáng lập',
    labelEn: 'Founder',
    order: 0,
  },
];

function setup() {
  const onSubmit = jest.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <StaffForm mode="create" roles={roles} images={[]} onSubmit={onSubmit} />
    </NextIntlClientProvider>,
  );
  return {onSubmit};
}

describe('StaffForm', () => {
  it('populates the role select with provided roles', () => {
    setup();
    expect(screen.getByRole('option', {name: 'Founder'})).toBeInTheDocument();
  });

  it('submits with valid input', async () => {
    const {onSubmit} = setup();
    await userEvent.type(screen.getByLabelText('Name'), 'Thomas');
    await userEvent.selectOptions(screen.getByLabelText('Role'), 'r1');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Thomas', roleId: 'r1'}),
    );
  });

  it('shows error when name is empty', async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText('Role'), 'r1');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(await screen.findByText('Name required')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test src/components/Admin/StaffForm/StaffForm.spec.tsx`
Expected: module not found.

- [ ] **Step 4: Implement `StaffForm.tsx`**

```tsx
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {
  Button,
  TextInput,
  Textarea,
  NumberInput,
  FormField,
} from '@/components/ui';
import {StaffImagePicker} from './StaffImagePicker';
import {
  buildStaffSchema,
  staffFormDefaults,
  type StaffFormValues,
} from './StaffForm.form-utils';
import type * as VMT from '@/domain';

type PickableImage = Pick<
  VMT.CollectionImage,
  'id' | 'url' | 'altVi' | 'altEn'
>;

type StaffFormProps = {
  mode: 'create' | 'edit';
  roles: VMT.OrgRole[];
  images: PickableImage[];
  defaults?: StaffFormValues;
  onSubmit: (data: StaffFormValues) => void;
};

export function StaffForm({
  mode,
  roles,
  images,
  defaults,
  onSubmit,
}: StaffFormProps) {
  const t = useTranslations('admin.staff');
  const {
    register,
    handleSubmit,
    control,
    formState: {errors, isSubmitting},
  } = useForm<StaffFormValues>({
    resolver: yupResolver(buildStaffSchema(t)),
    defaultValues: defaults ?? staffFormDefaults,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField label={t('nameLabel')} error={errors.name?.message}>
        <TextInput {...register('name')} />
      </FormField>
      <FormField label={t('roleLabel')} error={errors.roleId?.message}>
        <select
          {...register('roleId')}
          className="bg-surface-elevated border border-border rounded-lg p-2 cursor-pointer"
        >
          <option value="">—</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.labelEn}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={t('bioViLabel')} error={errors.bioVi?.message}>
        <Textarea {...register('bioVi')} rows={4} />
      </FormField>
      <FormField label={t('bioEnLabel')} error={errors.bioEn?.message}>
        <Textarea {...register('bioEn')} rows={4} />
      </FormField>
      <FormField label={t('orderLabel')} error={errors.order?.message}>
        <NumberInput {...register('order', {valueAsNumber: true})} />
      </FormField>
      <Controller
        control={control}
        name="imageId"
        render={({field}) => (
          <StaffImagePicker
            images={images}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...register('active')}
          className="cursor-pointer"
        />
        {t('activeLabel')}
      </label>
      <Button type="submit" disabled={isSubmitting}>
        {t('save')}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Create `index.ts`**

```ts
export {StaffForm} from './StaffForm';
export {StaffImagePicker} from './StaffImagePicker';
export type {StaffFormValues} from './StaffForm.form-utils';
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm test src/components/Admin/StaffForm/`
Expected: passing.

- [ ] **Step 7: Commit**

```bash
git add src/components/Admin/StaffForm/
git commit -m "$(cat <<'EOF'
feat(admin): add StaffForm component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 22: Admin `/admin/staff` list + new + edit pages

**Files:**

- Create: `src/pages/admin/staff/index.tsx`
- Create: `src/pages/admin/staff/new.tsx`
- Create: `src/pages/admin/staff/[id].tsx`

- [ ] **Step 1: Implement `src/pages/admin/staff/index.tsx`**

```tsx
import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import type * as VMT from '@/domain';

export default function StaffListPage() {
  const t = useTranslations('admin.staff');
  const {setLoading: setAdminLoading} = useAdminLoading();
  const [staff, setStaff] = useState<VMT.StaffAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.staff.list().then(({data}) => {
      if (data) setStaff(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function handleDelete(s: VMT.StaffAdmin) {
    if (!confirm(t('deleteConfirm', {name: s.name}))) return;
    const {error} = await api.admin.staff.delete(s.id);
    if (error) {
      alert(error);
      return;
    }
    setStaff((prev) => prev.filter((x) => x.id !== s.id));
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="type-headline-sm">{t('title')}</h1>
        <Link
          href={routes.admin.staff.new.path()}
          className="bg-primary text-white px-4 py-2 rounded-lg cursor-pointer"
        >
          {t('new')}
        </Link>
      </header>
      <table className="w-full bg-surface-elevated rounded-xl border border-border">
        <thead>
          <tr className="text-left type-label-sm uppercase text-on-surface-secondary">
            <th className="p-3">{t('orderLabel')}</th>
            <th className="p-3" />
            <th className="p-3">{t('nameLabel')}</th>
            <th className="p-3">{t('roleLabel')}</th>
            <th className="p-3">{t('activeLabel')}</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id} className="border-t border-border">
              <td className="p-3">{s.order}</td>
              <td className="p-3">
                {s.image?.url ? (
                  <img
                    src={s.image.url}
                    alt=""
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <div className="h-12 w-12 bg-surface-alt rounded" />
                )}
              </td>
              <td className="p-3 font-medium">{s.name}</td>
              <td className="p-3">{s.role.labelEn}</td>
              <td className="p-3">{s.active ? '✓' : '—'}</td>
              <td className="p-3 flex gap-2">
                <Link
                  href={routes.admin.staff.edit.path({id: s.id})}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(s)}
                  className="text-error hover:underline cursor-pointer"
                >
                  {t('delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Implement `src/pages/admin/staff/new.tsx`**

```tsx
import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {StaffForm, type StaffFormValues} from '@/components/Admin/StaffForm';
import {api, routes} from '@/routes';
import type * as VMT from '@/domain';

type StaffImage = {
  id: string;
  url: string | null;
  altVi: string;
  altEn: string;
};

export default function NewStaffPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<VMT.OrgRole[]>([]);
  const [images, setImages] = useState<StaffImage[]>([]);

  useEffect(() => {
    api.admin.roles.list().then(({data}) => {
      if (data) setRoles(data);
    });
    // Pull images from the 'staff' image collection.
    fetch('/api/admin/image-collections?key=staff')
      .then((r) => r.json())
      .then((collections) => {
        const found = Array.isArray(collections)
          ? collections.find((c: {key: string}) => c.key === 'staff')
          : null;
        if (found?.images) setImages(found.images);
      });
  }, []);

  async function onSubmit(values: StaffFormValues) {
    const {error} = await api.admin.staff.create(
      values as unknown as Record<string, unknown>,
    );
    if (error) {
      alert(error);
      return;
    }
    router.push(routes.admin.staff.list.path());
  }

  return (
    <StaffForm
      mode="create"
      roles={roles}
      images={images}
      onSubmit={onSubmit}
    />
  );
}
```

> **Note on the image collection fetch:** the call above assumes the existing image-collections list endpoint returns an array including images. Verify the exact shape in `src/pages/api/admin/image-collections/index.ts` during implementation and adjust the parsing accordingly. If the existing endpoint returns only collections without nested images, a follow-up GET per-collection-id (e.g., `/api/admin/image-collections/<id>`) is the right move — wire that instead.

- [ ] **Step 3: Implement `src/pages/admin/staff/[id].tsx`**

```tsx
import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {StaffForm, type StaffFormValues} from '@/components/Admin/StaffForm';
import {api, routes} from '@/routes';
import type * as VMT from '@/domain';

type StaffImage = {
  id: string;
  url: string | null;
  altVi: string;
  altEn: string;
};

export default function EditStaffPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [staff, setStaff] = useState<VMT.StaffAdmin | null>(null);
  const [roles, setRoles] = useState<VMT.OrgRole[]>([]);
  const [images, setImages] = useState<StaffImage[]>([]);

  useEffect(() => {
    if (!id) return;
    api.admin.staff.get(id).then(({data}) => {
      if (data) setStaff(data);
    });
    api.admin.roles.list().then(({data}) => {
      if (data) setRoles(data);
    });
    fetch('/api/admin/image-collections?key=staff')
      .then((r) => r.json())
      .then((collections) => {
        const found = Array.isArray(collections)
          ? collections.find((c: {key: string}) => c.key === 'staff')
          : null;
        if (found?.images) setImages(found.images);
      });
  }, [id]);

  async function onSubmit(values: StaffFormValues) {
    const {error} = await api.admin.staff.update(
      id,
      values as unknown as Record<string, unknown>,
    );
    if (error) {
      alert(error);
      return;
    }
    router.push(routes.admin.staff.list.path());
  }

  if (!staff) return null;
  const defaults: StaffFormValues = {
    name: staff.name,
    roleId: staff.role.id,
    bioVi: staff.bioVi,
    bioEn: staff.bioEn,
    imageId: staff.image ? null : null, // staff.image carries only display props, not id; admin must repick
    order: staff.order,
    active: staff.active,
  };

  return (
    <StaffForm
      mode="edit"
      defaults={defaults}
      roles={roles}
      images={images}
      onSubmit={onSubmit}
    />
  );
}
```

> **Note on `imageId`:** the public `StaffPublic` shape we re-used for admin doesn't carry the `CollectionImage.id`. Before this task ships, extend `StaffAdmin` (or add an admin-specific shape) to include `imageId: string | null` and surface it from `/api/admin/staff/:id`. The mapper change is one line. Make this adjustment now — Step 4 below.

- [ ] **Step 4: Extend `StaffAdmin` to include `imageId`** — edit `src/domain/staff/index.ts`:

```ts
export type StaffAdmin = StaffPublic & {
  active: boolean;
  imageId: string | null;
};
```

Edit `src/domain/staff/mapper.ts` `toStaffAdmin`:

```ts
export function toStaffAdmin(row: PrismaStaffWithRelations): StaffAdmin {
  return {
    ...toStaffPublic(row),
    active: row.active,
    imageId: row.imageId,
  };
}
```

Now update `EditStaffPage` defaults:

```ts
const defaults: StaffFormValues = {
  name: staff.name,
  roleId: staff.role.id,
  bioVi: staff.bioVi,
  bioEn: staff.bioEn,
  imageId: staff.imageId,
  order: staff.order,
  active: staff.active,
};
```

- [ ] **Step 5: Type-check + smoke**

Run: `pnpm exec tsc --noEmit`
Then `pnpm dev` and walk through /admin/staff create → edit → delete flows.

- [ ] **Step 6: Commit**

```bash
git add src/domain/staff/ src/pages/admin/staff/
git commit -m "$(cat <<'EOF'
feat(admin): add staff list, new, and edit pages

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 23: Admin sidebar nav entries

**Files:**

- Modify: `src/components/Admin/AdminLayout/AdminLayout.tsx`

- [ ] **Step 1: Add nav entries** — open `src/components/Admin/AdminLayout/AdminLayout.tsx` and locate the navigation array (containing existing entries with `routes.admin.tours.list.path()`, etc.). Add these two entries right after the "Destinations" entry and before "Perks":

```ts
    {
      href: routes.admin.staff.list.path(),
      label: 'Staff',
      icon: 'fa-users',
    },
    {
      href: routes.admin.roles.list.path(),
      label: 'Roles',
      icon: 'fa-id-badge',
    },
```

(Verify the surrounding object shape matches the existing entries when applying — copy the field names exactly.)

- [ ] **Step 2: Smoke-test**

Run: `pnpm dev`
Log in to /admin. Confirm "Staff" and "Roles" appear in the sidebar and the active-state highlighting works when navigating to /admin/staff and /admin/roles.

- [ ] **Step 3: Commit**

```bash
git add src/components/Admin/AdminLayout/AdminLayout.tsx
git commit -m "$(cat <<'EOF'
feat(admin): add Staff and Roles sidebar nav entries

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 24: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass, including the new about-page and admin form specs.

- [ ] **Step 2: Run the full build**

Run: `pnpm build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: succeeds.

- [ ] **Step 4: Manual end-to-end check**

Run: `pnpm dev`

Walk through the flow:

1. Visit http://localhost:3000/about-us — confirm hero, story, value props, team grid, CTA all render. Switch locale via the URL — confirm Vietnamese strings load.
2. Log in to /admin. Confirm "Staff" and "Roles" appear in the sidebar.
3. Visit /admin/image-collections, find the "Staff Photos" collection (key=staff). Upload the 5 portraits from `src/raw/*.JPG` into that collection.
4. Visit /admin/staff. Edit each seeded staff member, attach a photo via the image picker, fill in bios. Save.
5. Reload /about-us — confirm portraits and bios now render in the team grid.
6. Visit /admin/roles. Try to delete the "founder" role — expect a 409 error message ("Role is in use").
7. Create a fresh test role; assign it to a new staff member; delete the staff member; delete the role — confirm full CRUD round-trip.

- [ ] **Step 5: If any regressions or visual issues, fix them and commit before moving on. Otherwise, the implementation is complete.**

---

## Self-Review Checklist

After completing all tasks:

1. **Spec coverage:**
   - Public page hero / story / value props / team grid / CTA — Tasks 8-12 ✓
   - Bold Dark visual treatment — applied via Tailwind classes in each component ✓
   - OrgRole + StaffMember Prisma models — Task 1 ✓
   - `ImageCollection(key="staff")` reuse — Task 4 (seed) + Task 20 (picker) ✓
   - Translation namespace `about.*` — Task 3 ✓
   - Admin /admin/roles CRUD — Tasks 14, 15, 18, 19 ✓
   - Admin /admin/staff CRUD — Tasks 16, 17, 20, 21, 22 ✓
   - Image picker bound to staff collection — Task 20 + 22 ✓
   - Routes registry + api builders — Task 13 ✓
   - Admin nav entries — Task 23 ✓
   - Seed scripts for roles/staff + translations — Tasks 3, 4 ✓
   - Tests with no styling assertions — every spec uses text-content/role queries ✓
   - 60s ISR + locale messages — Task 12 ✓

2. **Type consistency:** `StaffPublic` / `StaffAdmin` / `OrgRole` / `RoleFormValues` / `StaffFormValues` names are used identically across tasks.

3. **Future work:** drag-to-reorder, role-based auth scope, social links — deferred per spec.
