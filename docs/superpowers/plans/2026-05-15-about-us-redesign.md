# About Us Redesign + Team via User Model — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic `/about-us` page with a Bold-Dark editorial design driven by the existing `User` model. Add `OrgRole` as a first-class entity (replacing the `Role` enum), and admin pages to manage roles and the expanded user profile (bio, photo, birthDate, isCoreTeam, allowAuth, teamOrder).

**Architecture:** A single atomic SQL migration creates `OrgRole`, extends `User` with team + auth-gate fields, backfills the existing admin row, and drops the old `Role` enum. `/about-us` is SSG with 60s ISR reading `prisma.user.findMany({where:{isCoreTeam:true}, ...}).map(toTeamMember)`. NextAuth's `authorize` callback gains an `allowAuth` check; `requireAdmin` is updated to check `orgRole.key==='admin' && allowAuth`. Admin `/users` splits into list / new / edit pages; new `/admin/roles` CRUD page is added.

**Tech Stack:** Next.js 16 Pages Router, Prisma 5, React 19, Tailwind 4, next-intl 4, NextAuth 4, Yup, react-hook-form, Jest + RTL.

**Spec:** `docs/superpowers/specs/2026-05-15-about-us-redesign-design.md` (rev. 2).

---

## Conventions (apply everywhere)

- **No `interface` keyword** — use `type`.
- **One component per file.** Hooks/utilities/types in sibling files in the same folder.
- **Components:** `export function Name(props: Props) { ... }` — no `React.FC`, no return-type annotation.
- **Forms:** co-located `*.form-utils.ts` exporting Yup schema + types + defaults + submit handler.
- **No raw JSX strings.** All user-visible strings via `useTranslations()`, stored either in `src/messages/{vi,en}.json` (admin UI) or in the `Translation` table under namespace `about.*` (public page).
- **No inline styles**, Tailwind utilities only.
- **`cursor-pointer`** on every clickable element.
- **No styling assertions** in tests.
- **Admin API routes wrapped in `requireAdmin(req, res)`.**
- **Domain mappers** strip `createdAt/updatedAt/passwordHash` and convert `Date` to ISO strings.
- **Commit format:** Conventional Commits + `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer.

---

## Task 1: Prisma schema — `OrgRole` + `User` refactor + migration

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_team_user_refactor/migration.sql`

- [ ] **Step 1: Edit `prisma/schema.prisma`** — append `OrgRole` model, rewrite `User`, add reverse relation on `CollectionImage`, drop `Role` enum.

Delete the entire `enum Role { ADMIN }` block.

Replace the existing `User` model with:

```prisma
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

Append new model:

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
```

In the existing `CollectionImage` model, add the back-relation `users User[]` before the `@@index` line.

- [ ] **Step 2: Generate the migration as a stub** (no data yet)

Run: `pnpm prisma migrate dev --create-only --name team_user_refactor`
Expected: a `migration.sql` is created in `prisma/migrations/<timestamp>_team_user_refactor/`.

- [ ] **Step 3: Overwrite the generated `migration.sql`** with the explicit ordered version below:

```sql
-- 1. Create OrgRole
CREATE TABLE "OrgRole" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelVi" TEXT NOT NULL DEFAULT '',
    "labelEn" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgRole_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrgRole_key_key" ON "OrgRole"("key");

-- 2. Seed admin role so existing admin users can be backfilled.
INSERT INTO "OrgRole" ("id", "key", "labelVi", "labelEn", "order")
VALUES ('seed_admin_role_id', 'admin', 'Quản trị', 'Admin', 0);

-- 3. Add User.orgRoleId nullable
ALTER TABLE "User" ADD COLUMN "orgRoleId" TEXT;

-- 4. Backfill existing admin users
UPDATE "User" SET "orgRoleId" = 'seed_admin_role_id' WHERE "role" = 'ADMIN';

-- 5. Enforce NOT NULL + FK
ALTER TABLE "User" ALTER COLUMN "orgRoleId" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_orgRoleId_fkey"
  FOREIGN KEY ("orgRoleId") REFERENCES "OrgRole"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Drop old Role enum column and type
ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "Role";

-- 7. Relax auth-field nullability
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- 8. New team / profile columns
ALTER TABLE "User" ADD COLUMN "bioVi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "bioEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "imageId" TEXT;
ALTER TABLE "User" ADD COLUMN "isCoreTeam" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "allowAuth" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "teamOrder" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "User" ADD CONSTRAINT "User_imageId_fkey"
  FOREIGN KEY ("imageId") REFERENCES "CollectionImage"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_isCoreTeam_teamOrder_idx" ON "User"("isCoreTeam","teamOrder");
CREATE INDEX "User_orgRoleId_idx" ON "User"("orgRoleId");
```

- [ ] **Step 4: Apply the migration**

Run: `pnpm prisma migrate dev`
Expected: applies cleanly; new Prisma Client generated.

- [ ] **Step 5: Spot-check in Prisma Studio**

Run: `pnpm prisma studio`
Confirm `User` row has `orgRoleId='seed_admin_role_id'`, `allowAuth=true`, `isCoreTeam=false`, blank bios.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "$(cat <<'EOF'
feat(prisma): refactor User to use OrgRole, drop Role enum, add team fields

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Domain types — `OrgRole`, `TeamMember`, `UserAdmin` + mappers

**Files:**

- Create: `src/domain/org-role/{index.ts,mapper.ts}`
- Create: `src/domain/team-member/{index.ts,mapper.ts}`
- Modify: `src/domain/user/{index.ts,mapper.ts}` (create if absent)
- Modify: `src/domain/index.ts`

- [ ] **Step 1: `src/domain/org-role/index.ts`**

```ts
import type {OrgRole as PrismaOrgRole} from '@prisma/client';

export type OrgRole = Omit<PrismaOrgRole, 'createdAt'>;
```

- [ ] **Step 2: `src/domain/org-role/mapper.ts`**

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

- [ ] **Step 3: `src/domain/team-member/index.ts`**

```ts
import type {OrgRole} from '../org-role';

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
```

- [ ] **Step 4: `src/domain/team-member/mapper.ts`**

```ts
import type {
  User as PrismaUser,
  OrgRole as PrismaOrgRole,
  CollectionImage as PrismaCollectionImage,
} from '@prisma/client';
import {toOrgRole} from '../org-role/mapper';
import type {TeamMember} from './index';

type PrismaUserWithRelations = PrismaUser & {
  orgRole: PrismaOrgRole;
  image: PrismaCollectionImage | null;
};

function ageFromBirthDate(d: Date | null): number | null {
  if (!d) return null;
  const ms = Date.now() - d.getTime();
  const years = ms / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, Math.floor(years));
}

export function toTeamMember(row: PrismaUserWithRelations): TeamMember {
  return {
    id: row.id,
    name: row.name,
    bioVi: row.bioVi,
    bioEn: row.bioEn,
    age: ageFromBirthDate(row.birthDate),
    teamOrder: row.teamOrder,
    role: toOrgRole(row.orgRole),
    photo: row.image
      ? {url: row.image.url, altVi: row.image.altVi, altEn: row.image.altEn}
      : null,
  };
}
```

- [ ] **Step 5: Update / create `src/domain/user/index.ts`**

```ts
import type {OrgRole} from '../org-role';
import type {TeamPhoto} from '../team-member';

export type UserAdmin = {
  id: string;
  name: string;
  email: string | null;
  bioVi: string;
  bioEn: string;
  birthDate: string | null;
  imageId: string | null;
  isCoreTeam: boolean;
  allowAuth: boolean;
  teamOrder: number;
  orgRole: OrgRole;
  photo: TeamPhoto | null;
};
```

- [ ] **Step 6: Create / rewrite `src/domain/user/mapper.ts`**

```ts
import type {
  User as PrismaUser,
  OrgRole as PrismaOrgRole,
  CollectionImage as PrismaCollectionImage,
} from '@prisma/client';
import {toOrgRole} from '../org-role/mapper';
import type {UserAdmin} from './index';

type PrismaUserWithRelations = PrismaUser & {
  orgRole: PrismaOrgRole;
  image: PrismaCollectionImage | null;
};

export function toUserAdmin(row: PrismaUserWithRelations): UserAdmin {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    bioVi: row.bioVi,
    bioEn: row.bioEn,
    birthDate: row.birthDate ? row.birthDate.toISOString() : null,
    imageId: row.imageId,
    isCoreTeam: row.isCoreTeam,
    allowAuth: row.allowAuth,
    teamOrder: row.teamOrder,
    orgRole: toOrgRole(row.orgRole),
    photo: row.image
      ? {url: row.image.url, altVi: row.image.altVi, altEn: row.image.altEn}
      : null,
  };
}
```

- [ ] **Step 7: Update `src/domain/index.ts`** — drop any `Role` enum re-export, replace old `User` export, add new exports:

```ts
export type {OrgRole} from './org-role';
export type {TeamMember, TeamPhoto} from './team-member';
export type {UserAdmin} from './user';
```

Remove any line exporting `Role` (the enum). If a `User` type was exported from there, replace with `UserAdmin`.

- [ ] **Step 8: Find existing callers of `user.role` and adjust**

Run: `grep -rn "user\.role\b\|from '@/domain'.*\bUser\b" src/`
Replace `user.role` with `user.orgRole.key` (or `labelEn`/`labelVi` if used for display). For now keep changes minimal — substantive UI updates happen in later tasks.

- [ ] **Step 9: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: clean (or only minor unrelated noise).

- [ ] **Step 10: Commit**

```bash
git add src/domain/ src/
git commit -m "$(cat <<'EOF'
feat(domain): OrgRole + TeamMember + UserAdmin types and mappers

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Update `seed-admin.ts` + create `seed-team.ts`

**Files:**

- Modify: `prisma/seed-admin.ts`
- Create: `prisma/seed-team.ts`
- Modify: `package.json`

- [ ] **Step 1: Patch `prisma/seed-admin.ts`** — before the existing user-upsert call, upsert the `admin` `OrgRole`:

```ts
const adminRole = await prisma.orgRole.upsert({
  where: {key: 'admin'},
  update: {labelVi: 'Quản trị', labelEn: 'Admin', order: 0},
  create: {key: 'admin', labelVi: 'Quản trị', labelEn: 'Admin', order: 0},
});
```

In the user upsert data block, replace `role: 'ADMIN'` (or any reference) with:

```ts
orgRoleId: adminRole.id,
allowAuth: true,
isCoreTeam: false,
```

- [ ] **Step 2: Create `prisma/seed-team.ts`** with the same env-loading boilerplate as the existing seeds, plus this body (after `const prisma = new PrismaClient({adapter});`):

```ts
type RoleSeed = {key: string; labelVi: string; labelEn: string; order: number};

const ROLES: RoleSeed[] = [
  {key: 'admin', labelVi: 'Quản trị', labelEn: 'Admin', order: 0},
  {key: 'founder', labelVi: 'Người sáng lập', labelEn: 'Founder', order: 1},
  {
    key: 'tour_guide',
    labelVi: 'Hướng dẫn viên',
    labelEn: 'Tour Guide',
    order: 2,
  },
  {
    key: 'tour_guide_mechanic',
    labelVi: 'Hướng dẫn viên & Kỹ sư',
    labelEn: 'Tour Guide & Mechanic',
    order: 3,
  },
  {
    key: 'driver_support',
    labelVi: 'Tài xế hỗ trợ',
    labelEn: 'Driver Support',
    order: 4,
  },
];

type StaffSeed = {name: string; roleKey: string; teamOrder: number};

const STAFF: StaffSeed[] = [
  {name: 'Thomas', roleKey: 'founder', teamOrder: 0},
  {name: 'Tino', roleKey: 'tour_guide', teamOrder: 1},
  {name: 'Chan', roleKey: 'tour_guide_mechanic', teamOrder: 2},
  {name: 'Hai', roleKey: 'tour_guide', teamOrder: 3},
  {name: 'Phi', roleKey: 'driver_support', teamOrder: 4},
];

async function main() {
  await prisma.imageCollection.upsert({
    where: {key: 'team'},
    update: {label: 'Team Photos'},
    create: {key: 'team', label: 'Team Photos'},
  });

  const roleByKey = new Map<string, {id: string}>();
  for (const role of ROLES) {
    const row = await prisma.orgRole.upsert({
      where: {key: role.key},
      update: {labelVi: role.labelVi, labelEn: role.labelEn, order: role.order},
      create: role,
    });
    roleByKey.set(role.key, {id: row.id});
  }

  for (const s of STAFF) {
    const role = roleByKey.get(s.roleKey);
    if (!role) throw new Error(`Missing role ${s.roleKey}`);
    const existing = await prisma.user.findFirst({
      where: {name: s.name, allowAuth: false},
    });
    if (existing) {
      await prisma.user.update({
        where: {id: existing.id},
        data: {orgRoleId: role.id, teamOrder: s.teamOrder, isCoreTeam: true},
      });
    } else {
      await prisma.user.create({
        data: {
          name: s.name,
          email: null,
          passwordHash: null,
          orgRoleId: role.id,
          teamOrder: s.teamOrder,
          isCoreTeam: true,
          allowAuth: false,
        },
      });
    }
  }

  console.log(`Seeded ${ROLES.length} roles and ${STAFF.length} staff users.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

(Use the same env-loading prologue as `prisma/seed-image-collection-translations.ts` — copy it verbatim.)

- [ ] **Step 3: Add to `package.json` scripts**

```json
"db:seed-team": "npx tsx prisma/seed-team.ts",
```

- [ ] **Step 4: Run seeds**

Run: `pnpm db:seed-admin`
Expected: admin user has `orgRoleId` set, `allowAuth=true`, `isCoreTeam=false`.

Run: `pnpm db:seed-team`
Expected: `Seeded 5 roles and 5 staff users.`

Run: `pnpm db:seed-team` again
Expected: same output, no duplicates.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed-admin.ts prisma/seed-team.ts package.json
git commit -m "$(cat <<'EOF'
feat(seed): seed OrgRole + staff Users; update admin seed for new schema

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Seed `about.*` translation namespace

**Files:**

- Create: `prisma/seed-about-translations.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `prisma/seed-about-translations.ts`** — same env-loading prologue, then prisma init, then the entries:

```ts
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
  {namespace: 'about', key: 'team.ageSuffix', valueVi: 'tuổi', valueEn: 'yo'},
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
      where: {namespace_key: {namespace: entry.namespace, key: entry.key}},
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

- [ ] **Step 2: Add npm script**

```json
"db:seed-about-translations": "npx tsx prisma/seed-about-translations.ts",
```

- [ ] **Step 3: Run + commit**

```bash
pnpm db:seed-about-translations
git add prisma/seed-about-translations.ts package.json
git commit -m "$(cat <<'EOF'
feat(seed): seed about.* translation namespace

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `getTeamForPublic` query

**Files:**

- Modify: `src/data/queries.ts`

- [ ] **Step 1: Add imports near the top of the file**

```ts
import type {TeamMember} from '@/domain';
import {toTeamMember} from '@/domain/team-member/mapper';
```

- [ ] **Step 2: Append the query at the end of the file**

```ts
export async function getTeamForPublic(): Promise<TeamMember[]> {
  try {
    const rows = await prisma.user.findMany({
      where: {isCoreTeam: true},
      orderBy: {teamOrder: 'asc'},
      include: {orgRole: true, image: true},
    });
    return rows.map(toTeamMember);
  } catch (error) {
    console.error('getTeamForPublic: DB query failed', error);
    return [];
  }
}
```

- [ ] **Step 3: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/data/queries.ts
git commit -m "$(cat <<'EOF'
feat(queries): add getTeamForPublic

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: NextAuth `allowAuth` check + `requireAdmin` update

**Files:**

- Modify: `src/lib/auth.ts` (or the existing NextAuth config location — find via `grep -rn "CredentialsProvider" src/`)
- Modify: `src/lib/admin-auth.ts`
- Modify: NextAuth type augmentation file (look for `next-auth.d.ts` via `grep -rn "next-auth" src/types src/`)

- [ ] **Step 1: Locate the NextAuth config**

Run: `grep -rn "CredentialsProvider\|authorize" src/lib src/pages/api/auth`

- [ ] **Step 2: Update `authorize` callback** — inside the function, after the bcrypt compare, before the return:

```ts
if (!user.allowAuth) return null;
```

Replace the returned user with `id`, `email`, `name`, and `orgRoleKey`:

```ts
return {
  id: user.id,
  email: user.email,
  name: user.name,
  orgRoleKey: user.orgRole?.key ?? null,
};
```

Make sure the `prisma.user.findUnique` call inside `authorize` has `include: {orgRole: true}`. Remove any reference to the old `user.role`.

- [ ] **Step 3: Update `jwt` + `session` callbacks**

```ts
async jwt({token, user}) {
  if (user) token.orgRoleKey = (user as {orgRoleKey?: string}).orgRoleKey ?? null;
  return token;
},
async session({session, token}) {
  session.user = {
    ...session.user,
    id: token.sub as string,
    orgRoleKey: (token.orgRoleKey as string | null) ?? null,
  };
  return session;
},
```

- [ ] **Step 4: Augment the type-declaration file** — add `orgRoleKey: string | null` on both `Session.user` and `JWT`:

```ts
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      orgRoleKey: string | null;
    };
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    orgRoleKey?: string | null;
  }
}
```

(Adjust the file path / declaration to match the existing augmentation style. CLAUDE.md says no `interface` — this is the one allowed exception because `next-auth` uses module-augmentation interfaces. Match the style of the existing declaration file.)

- [ ] **Step 5: Update `src/lib/admin-auth.ts`** — replace `requireAdmin` with the version below (preserve any extra logic from the existing impl):

```ts
import {getServerSession} from 'next-auth/next';
import {authOptions} from './auth';
import {prisma} from './prisma';
import type {NextApiRequest, NextApiResponse} from 'next';

export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<boolean> {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    res.status(401).json({error: 'Unauthenticated'});
    return false;
  }
  if (session.user.orgRoleKey !== 'admin') {
    res.status(403).json({error: 'Forbidden'});
    return false;
  }
  const user = await prisma.user.findUnique({
    where: {id: session.user.id},
    select: {allowAuth: true},
  });
  if (!user?.allowAuth) {
    res.status(403).json({error: 'Forbidden'});
    return false;
  }
  return true;
}
```

- [ ] **Step 6: Run tests + smoke**

Run: `pnpm test`
If any existing auth tests reference `Role` enum, update them to compare `orgRoleKey === 'admin'`.

Then: `pnpm dev` — sign in as the admin → expect success. Flip `allowAuth=false` via Prisma Studio → sign out → sign in → expect rejection. Flip back.

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts src/lib/admin-auth.ts src/types
git commit -m "$(cat <<'EOF'
feat(auth): enforce allowAuth + admin orgRoleKey check

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: `TeamMemberCard` (TDD)

**Files:**

- Create: `src/components/about/AboutTeamGrid/TeamMemberCard.tsx`
- Create: `src/components/about/AboutTeamGrid/TeamMemberCard.spec.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {TeamMemberCard} from './TeamMemberCard';
import type {TeamMember} from '@/domain';

const role = {
  id: 'r1',
  key: 'founder',
  labelVi: 'Người sáng lập',
  labelEn: 'Founder',
  order: 0,
};

const member: TeamMember = {
  id: '1',
  name: 'Thomas',
  bioVi: 'Người sáng lập từ 2009.',
  bioEn: 'Founder since 2009.',
  age: 42,
  teamOrder: 0,
  role,
  photo: {url: '/uploads/t.jpg', altVi: 'T', altEn: 'T'},
};

const messages = {about: {team: {ageSuffix: 'yo'}}};

function renderCard(locale: 'vi' | 'en', m: TeamMember = member) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TeamMemberCard member={m} locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe('TeamMemberCard', () => {
  it('renders name, role, bio, and age (en)', () => {
    renderCard('en');
    expect(screen.getByText('Thomas')).toBeInTheDocument();
    expect(screen.getByText('Founder')).toBeInTheDocument();
    expect(screen.getByText('Founder since 2009.')).toBeInTheDocument();
    expect(screen.getByText('42 yo')).toBeInTheDocument();
  });

  it('renders role + bio in Vietnamese', () => {
    renderCard('vi');
    expect(screen.getByText('Người sáng lập')).toBeInTheDocument();
    expect(screen.getByText('Người sáng lập từ 2009.')).toBeInTheDocument();
  });

  it('renders img with photo url + alt', () => {
    renderCard('en');
    const img = screen.getByRole('img', {name: 'T'}) as HTMLImageElement;
    expect(img.src).toContain('/uploads/t.jpg');
  });

  it('renders placeholder when photo is null', () => {
    renderCard('en', {...member, photo: null});
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('team-card-placeholder')).toBeInTheDocument();
  });

  it('omits age when null', () => {
    renderCard('en', {...member, age: null});
    expect(screen.queryByText(/\byo\b/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run failing**

Run: `pnpm test src/components/about/AboutTeamGrid/TeamMemberCard.spec.tsx`

- [ ] **Step 3: Implement `TeamMemberCard.tsx`**

```tsx
import {useTranslations} from 'next-intl';
import type {TeamMember} from '@/domain';

type TeamMemberCardProps = {
  member: TeamMember;
  locale: 'vi' | 'en';
};

export function TeamMemberCard({member, locale}: TeamMemberCardProps) {
  const t = useTranslations('about.team');
  const roleLabel = locale === 'vi' ? member.role.labelVi : member.role.labelEn;
  const bio = locale === 'vi' ? member.bioVi : member.bioEn;
  const alt = locale === 'vi' ? member.photo?.altVi : member.photo?.altEn;
  const ageText = member.age != null ? `${member.age} ${t('ageSuffix')}` : null;

  return (
    <article className="group relative overflow-hidden bg-secondary">
      <div className="aspect-[3/4] w-full bg-surface-alt">
        {member.photo?.url ? (
          <img
            src={member.photo.url}
            alt={alt ?? member.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            data-testid="team-card-placeholder"
            className="flex h-full w-full items-center justify-center text-white/40"
          >
            {member.name}
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
        <p className="type-label-sm uppercase tracking-widest text-primary">
          {roleLabel}
        </p>
        <h3 className="type-headline-sm font-extrabold uppercase tracking-tight">
          {member.name}
        </h3>
        {ageText ? (
          <p className="mt-1 text-xs text-white/60">{ageText}</p>
        ) : null}
        <p className="mt-2 max-h-0 overflow-hidden text-sm text-white/80 transition-[max-height] duration-500 group-hover:max-h-40">
          {bio}
        </p>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Test + commit**

```bash
pnpm test src/components/about/AboutTeamGrid/TeamMemberCard.spec.tsx
git add src/components/about/AboutTeamGrid/
git commit -m "$(cat <<'EOF'
feat(about): add TeamMemberCard

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: `AboutTeamGrid` (TDD)

**Files:**

- Create: `src/components/about/AboutTeamGrid/{AboutTeamGrid.tsx,AboutTeamGrid.spec.tsx,index.ts}`

- [ ] **Step 1: Failing test**

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {AboutTeamGrid} from './AboutTeamGrid';
import type {TeamMember} from '@/domain';

const role = {
  id: 'r1',
  key: 'founder',
  labelVi: 'Người sáng lập',
  labelEn: 'Founder',
  order: 0,
};
const team: TeamMember[] = [
  {
    id: '1',
    name: 'Thomas',
    bioVi: 'a',
    bioEn: 'a',
    age: null,
    teamOrder: 0,
    role,
    photo: null,
  },
  {
    id: '2',
    name: 'Hai',
    bioVi: 'b',
    bioEn: 'b',
    age: null,
    teamOrder: 1,
    role,
    photo: null,
  },
];
const messages = {
  about: {team: {heading: 'The Crew', subhead: 'Sub', ageSuffix: 'yo'}},
};

function renderGrid(items: TeamMember[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AboutTeamGrid team={items} locale="en" />
    </NextIntlClientProvider>,
  );
}

describe('AboutTeamGrid', () => {
  it('renders heading + subhead', () => {
    renderGrid(team);
    expect(screen.getByText('The Crew')).toBeInTheDocument();
    expect(screen.getByText('Sub')).toBeInTheDocument();
  });

  it('renders one card per member', () => {
    renderGrid(team);
    expect(screen.getByText('Thomas')).toBeInTheDocument();
    expect(screen.getByText('Hai')).toBeInTheDocument();
  });

  it('renders empty-state', () => {
    renderGrid([]);
    expect(screen.getByTestId('team-empty')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement `AboutTeamGrid.tsx`**

```tsx
import {useTranslations} from 'next-intl';
import type {TeamMember} from '@/domain';
import {TeamMemberCard} from './TeamMemberCard';

type AboutTeamGridProps = {
  team: TeamMember[];
  locale: 'vi' | 'en';
};

export function AboutTeamGrid({team, locale}: AboutTeamGridProps) {
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
        {team.length === 0 ? (
          <p data-testid="team-empty" className="text-center text-white/60">
            —
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <li key={m.id}>
                <TeamMemberCard member={m} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `index.ts`**

```ts
export {AboutTeamGrid} from './AboutTeamGrid';
export {TeamMemberCard} from './TeamMemberCard';
```

- [ ] **Step 4: Test + commit**

```bash
pnpm test src/components/about/AboutTeamGrid/
git add src/components/about/AboutTeamGrid/
git commit -m "$(cat <<'EOF'
feat(about): add AboutTeamGrid

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: `AboutHero` + `PolaroidStack` (TDD)

**Files:**

- Create: `src/components/about/AboutHero/{AboutHero.tsx,PolaroidStack.tsx,AboutHero.spec.tsx,index.ts}`

- [ ] **Step 1: Failing test**

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {AboutHero} from './AboutHero';
import type {TeamMember} from '@/domain';

const role = {
  id: 'r1',
  key: 'founder',
  labelVi: 'NSL',
  labelEn: 'Founder',
  order: 0,
};
const make = (id: string, name: string): TeamMember => ({
  id,
  name,
  bioVi: '',
  bioEn: '',
  age: null,
  teamOrder: 0,
  role,
  photo: {url: `/uploads/${id}.jpg`, altVi: name, altEn: name},
});

const featured = [make('1', 'Thomas'), make('2', 'Hai'), make('3', 'Chan')];
const messages = {
  about: {
    hero: {
      eyebrow: 'About',
      headline: 'Riding the real Vietnam.',
      lead: 'Lead.',
      ctaMeetTeam: 'Meet the team',
    },
  },
};

describe('AboutHero', () => {
  it('renders text + CTA', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutHero featured={featured} locale="en" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Riding the real Vietnam.')).toBeInTheDocument();
    expect(screen.getByText('Lead.')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /Meet the team/i})).toHaveAttribute(
      'href',
      '#team',
    );
  });

  it('renders three polaroids', () => {
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

- [ ] **Step 2: Implement `PolaroidStack.tsx`**

```tsx
import type {TeamMember} from '@/domain';

type PolaroidStackProps = {
  featured: TeamMember[];
  locale: 'vi' | 'en';
};

export function PolaroidStack({featured, locale}: PolaroidStackProps) {
  return (
    <div className="relative h-[28rem] w-full">
      {featured.slice(0, 3).map((m, i) => {
        const rotation = ['-rotate-6', 'rotate-2', '-rotate-3'][i] ?? '';
        const offset =
          ['left-0 top-0', 'left-1/4 top-8', 'left-1/2 top-4'][i] ?? '';
        const alt = locale === 'vi' ? m.photo?.altVi : m.photo?.altEn;
        const role = locale === 'vi' ? m.role.labelVi : m.role.labelEn;
        return (
          <figure
            key={m.id}
            className={`absolute ${offset} ${rotation} w-48 transform shadow-2xl`}
          >
            <div className="aspect-[3/4] w-full bg-surface-alt">
              {m.photo?.url ? (
                <img
                  src={m.photo.url}
                  alt={alt ?? m.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <figcaption className="bg-white px-3 py-2 text-xs">
              <span className="block font-semibold">{m.name}</span>
              <span className="text-on-surface-secondary">{role}</span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Implement `AboutHero.tsx`**

```tsx
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import type {TeamMember} from '@/domain';
import {PolaroidStack} from './PolaroidStack';

type AboutHeroProps = {
  featured: TeamMember[];
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

- [ ] **Step 4: `index.ts`**

```ts
export {AboutHero} from './AboutHero';
export {PolaroidStack} from './PolaroidStack';
```

- [ ] **Step 5: Test + commit**

```bash
pnpm test src/components/about/AboutHero/
git add src/components/about/AboutHero/
git commit -m "$(cat <<'EOF'
feat(about): add AboutHero + PolaroidStack

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: `AboutStory` (TDD)

**Files:**

- Create: `src/components/about/AboutStory/{AboutStory.tsx,AboutStory.spec.tsx,index.ts}`

- [ ] **Step 1: Test**

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {AboutStory} from './AboutStory';

const messages = {
  about: {story: {pullQuote: '100% locally owned.', body: 'One.\n\nTwo.'}},
};

describe('AboutStory', () => {
  it('renders pull quote', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutStory />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('100% locally owned.')).toBeInTheDocument();
  });

  it('renders paragraphs', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutStory />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('One.')).toBeInTheDocument();
    expect(screen.getByText('Two.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement**

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

- [ ] **Step 3: `index.ts` + commit**

```ts
export {AboutStory} from './AboutStory';
```

```bash
pnpm test src/components/about/AboutStory/
git add src/components/about/AboutStory/
git commit -m "$(cat <<'EOF'
feat(about): add AboutStory

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: `AboutValueProps` (TDD)

**Files:**

- Create: `src/components/about/AboutValueProps/{AboutValueProps.tsx,AboutValueProps.spec.tsx,index.ts}`

- [ ] **Step 1: Test**

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {AboutValueProps} from './AboutValueProps';

const messages = {
  about: {
    valueProps: {
      '01': {title: 'Locally Owned', body: 'L'},
      '02': {title: 'Off the Beaten Track', body: 'O'},
      '03': {title: 'All Rider Levels', body: 'A'},
      '04': {title: 'Local Knowledge', body: 'K'},
    },
  },
};

describe('AboutValueProps', () => {
  it('renders 4 cells', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutValueProps />
      </NextIntlClientProvider>,
    );
    [
      'Locally Owned',
      'Off the Beaten Track',
      'All Rider Levels',
      'Local Knowledge',
      'K',
    ].forEach((s) => expect(screen.getByText(s)).toBeInTheDocument());
  });

  it('renders numerals 01-04', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutValueProps />
      </NextIntlClientProvider>,
    );
    ['01', '02', '03', '04'].forEach((s) =>
      expect(screen.getByText(s)).toBeInTheDocument(),
    );
  });
});
```

- [ ] **Step 2: Implement + index + commit**

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

```ts
export {AboutValueProps} from './AboutValueProps';
```

```bash
pnpm test src/components/about/AboutValueProps/
git add src/components/about/AboutValueProps/
git commit -m "$(cat <<'EOF'
feat(about): add AboutValueProps

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: `AboutCta` (TDD)

**Files:**

- Create: `src/components/about/AboutCta/{AboutCta.tsx,AboutCta.spec.tsx,index.ts}`

- [ ] **Step 1: Test**

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
  it('renders content + contact link', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutCta />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Ready to ride?')).toBeInTheDocument();
    expect(screen.getByText('Tell us.')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /plan your tour/i})).toHaveAttribute(
      'href',
      '/contact',
    );
  });
});
```

- [ ] **Step 2: Implement + index + commit**

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

```ts
export {AboutCta} from './AboutCta';
```

```bash
pnpm test src/components/about/AboutCta/
git add src/components/about/AboutCta/
git commit -m "$(cat <<'EOF'
feat(about): add AboutCta

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Compose `/about-us` page

**Files:**

- Create: `src/components/about/index.ts`
- Modify: `src/pages/about-us.tsx`

- [ ] **Step 1: Barrel index**

```ts
export {AboutHero} from './AboutHero';
export {AboutStory} from './AboutStory';
export {AboutValueProps} from './AboutValueProps';
export {AboutTeamGrid} from './AboutTeamGrid';
export {AboutCta} from './AboutCta';
```

- [ ] **Step 2: Replace `src/pages/about-us.tsx`**

```tsx
import Head from 'next/head';
import {useTranslations} from 'next-intl';
import type {GetStaticPropsContext} from 'next';
import type {TeamMember} from '@/domain';
import {
  AboutHero,
  AboutStory,
  AboutValueProps,
  AboutTeamGrid,
  AboutCta,
} from '@/components/about';

type AboutUsProps = {
  team: TeamMember[];
  locale: 'vi' | 'en';
};

export default function AboutUs({team, locale}: AboutUsProps) {
  const tMeta = useTranslations('about.meta');

  return (
    <>
      <Head>
        <title>{tMeta('title')}</title>
        <meta name="description" content={tMeta('description')} />
      </Head>
      <AboutHero featured={team.slice(0, 3)} locale={locale} />
      <AboutStory />
      <AboutValueProps />
      <AboutTeamGrid team={team} locale={locale} />
      <AboutCta />
    </>
  );
}

export async function getStaticProps({locale}: GetStaticPropsContext) {
  const {getMessagesFromDb, getTeamForPublic} = await import('@/data/queries');
  const resolvedLocale = (locale ?? 'vi') as 'vi' | 'en';
  const [messages, team] = await Promise.all([
    getMessagesFromDb(resolvedLocale),
    getTeamForPublic(),
  ]);
  return {props: {messages, team, locale: resolvedLocale}, revalidate: 60};
}
```

- [ ] **Step 3: Type-check + smoke + commit**

```bash
pnpm exec tsc --noEmit
pnpm dev
# Visit /about-us → confirm sections render with placeholder team cards.
git add src/components/about/index.ts src/pages/about-us.tsx
git commit -m "$(cat <<'EOF'
feat(about): rewrite /about-us using User-backed team

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Routes registry + API builders

**Files:**

- Modify: `src/routes/registry.ts`
- Modify: `src/routes/api.ts`

- [ ] **Step 1: Replace `routes.admin.users` and add `routes.admin.roles`** — inside `routes.admin`, find the existing `users: {path: () => '/admin/users'}` (or similar) and replace, then add `roles`:

```ts
    users: {
      list: {path: () => '/admin/users'},
      new: {path: () => '/admin/users/new'},
      edit: {path: (p: {id: string}) => `/admin/users/${p.id}`},
    },
    roles: {
      list: {path: () => '/admin/roles'},
      new: {path: () => '/admin/roles/new'},
      edit: {path: (p: {id: string}) => `/admin/roles/${p.id}`},
    },
```

- [ ] **Step 2: Extend `api.admin.users` and add `api.admin.roles`** — in `src/routes/api.ts`:

```ts
    users: {
      list: () => request<VMT.UserAdmin[]>('/api/admin/users'),
      get: (id: string) => request<VMT.UserAdmin>(`/api/admin/users/${id}`),
      create: (data: Record<string, unknown>) =>
        request<VMT.UserAdmin>('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<VMT.UserAdmin>(`/api/admin/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/users/${id}`, {method: 'DELETE'}),
    },
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
```

(Replace any existing `users` block entirely.)

- [ ] **Step 3: Type-check + commit**

```bash
pnpm exec tsc --noEmit
git add src/routes/
git commit -m "$(cat <<'EOF'
feat(routes): add admin roles, extend users routes/api

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: API — `roles/index.ts`

**Files:**

- Create: `src/pages/api/admin/roles/index.ts`

- [ ] **Step 1: Implement**

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
    if (typeof labelVi !== 'string')
      return res.status(400).json({error: 'labelVi must be a string'});
    if (typeof labelEn !== 'string')
      return res.status(400).json({error: 'labelEn must be a string'});
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

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/admin/roles/index.ts
git commit -m "$(cat <<'EOF'
feat(api): add admin roles list + create endpoint

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: API — `roles/[id].ts`

**Files:**

- Create: `src/pages/api/admin/roles/[id].ts`

- [ ] **Step 1: Implement**

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
      if (current && current.key !== key)
        return res.status(400).json({error: 'key is immutable'});
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
    const inUse = await prisma.user.count({where: {orgRoleId: id}});
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

## Task 17: API — extend `users/index.ts`

**Files:**

- Modify: `src/pages/api/admin/users/index.ts`

- [ ] **Step 1: Replace with full new handler**

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import bcrypt from 'bcryptjs';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toUserAdmin} from '@/domain/user/mapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const rows = await prisma.user.findMany({
      orderBy: [{isCoreTeam: 'desc'}, {teamOrder: 'asc'}, {name: 'asc'}],
      include: {orgRole: true, image: true},
    });
    return res.json(rows.map(toUserAdmin));
  }

  if (req.method === 'POST') {
    const {
      name,
      email,
      password,
      orgRoleId,
      bioVi,
      bioEn,
      birthDate,
      imageId,
      isCoreTeam,
      allowAuth,
      teamOrder,
    } = req.body ?? {};

    if (typeof name !== 'string' || name.length === 0) {
      return res.status(400).json({error: 'name is required'});
    }
    if (typeof orgRoleId !== 'string' || orgRoleId.length === 0) {
      return res.status(400).json({error: 'orgRoleId is required'});
    }
    const role = await prisma.orgRole.findUnique({where: {id: orgRoleId}});
    if (!role) return res.status(400).json({error: 'orgRoleId not found'});

    const authOn = allowAuth === true || allowAuth === undefined;
    if (authOn && (typeof email !== 'string' || email.length === 0)) {
      return res
        .status(400)
        .json({error: 'email is required when allowAuth=true'});
    }
    if (authOn && (typeof password !== 'string' || password.length < 8)) {
      return res
        .status(400)
        .json({error: 'password (>=8 chars) is required when allowAuth=true'});
    }
    if (imageId != null && typeof imageId !== 'string') {
      return res.status(400).json({error: 'imageId must be a string or null'});
    }
    if (imageId) {
      const img = await prisma.collectionImage.findUnique({
        where: {id: imageId},
      });
      if (!img) return res.status(400).json({error: 'imageId not found'});
    }

    const data = {
      name,
      email: typeof email === 'string' && email.length > 0 ? email : null,
      passwordHash: authOn ? await bcrypt.hash(password, 10) : null,
      orgRoleId,
      bioVi: typeof bioVi === 'string' ? bioVi : '',
      bioEn: typeof bioEn === 'string' ? bioEn : '',
      birthDate:
        typeof birthDate === 'string' && birthDate.length > 0
          ? new Date(birthDate)
          : null,
      imageId: imageId ?? null,
      isCoreTeam: isCoreTeam === true,
      allowAuth: authOn,
      teamOrder: typeof teamOrder === 'number' ? teamOrder : 0,
    };

    const row = await prisma.user.create({
      data,
      include: {orgRole: true, image: true},
    });
    return res.status(201).json(toUserAdmin(row));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

(Verify `bcryptjs` is already a project dependency — if a different bcrypt library is used, swap the import.)

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/admin/users/index.ts
git commit -m "$(cat <<'EOF'
feat(api): extend users list+create for new schema

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 18: API — `users/[id].ts` (GET, PUT, DELETE)

**Files:**

- Modify or Create: `src/pages/api/admin/users/[id].ts`

- [ ] **Step 1: Implement**

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import bcrypt from 'bcryptjs';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toUserAdmin} from '@/domain/user/mapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({error: 'id required'});

  if (req.method === 'GET') {
    const row = await prisma.user.findUnique({
      where: {id},
      include: {orgRole: true, image: true},
    });
    if (!row) return res.status(404).json({error: 'Not found'});
    return res.json(toUserAdmin(row));
  }

  if (req.method === 'PUT') {
    const body = req.body ?? {};
    const current = await prisma.user.findUnique({where: {id}});
    if (!current) return res.status(404).json({error: 'Not found'});

    const next: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.length === 0) {
        return res.status(400).json({error: 'name must be non-empty'});
      }
      next.name = body.name;
    }
    if (body.email !== undefined) {
      if (body.email !== null && typeof body.email !== 'string') {
        return res.status(400).json({error: 'email must be a string or null'});
      }
      next.email = body.email === '' ? null : body.email;
    }
    if (body.orgRoleId !== undefined) {
      if (typeof body.orgRoleId !== 'string')
        return res.status(400).json({error: 'orgRoleId required'});
      const role = await prisma.orgRole.findUnique({
        where: {id: body.orgRoleId},
      });
      if (!role) return res.status(400).json({error: 'orgRoleId not found'});
      next.orgRoleId = body.orgRoleId;
    }
    if (body.bioVi !== undefined)
      next.bioVi = typeof body.bioVi === 'string' ? body.bioVi : '';
    if (body.bioEn !== undefined)
      next.bioEn = typeof body.bioEn === 'string' ? body.bioEn : '';
    if (body.birthDate !== undefined) {
      next.birthDate =
        typeof body.birthDate === 'string' && body.birthDate.length > 0
          ? new Date(body.birthDate)
          : null;
    }
    if (body.imageId !== undefined) {
      if (body.imageId !== null && typeof body.imageId !== 'string') {
        return res
          .status(400)
          .json({error: 'imageId must be a string or null'});
      }
      if (body.imageId) {
        const img = await prisma.collectionImage.findUnique({
          where: {id: body.imageId},
        });
        if (!img) return res.status(400).json({error: 'imageId not found'});
      }
      next.imageId = body.imageId;
    }
    if (body.isCoreTeam !== undefined)
      next.isCoreTeam = body.isCoreTeam === true;
    if (body.teamOrder !== undefined && typeof body.teamOrder === 'number') {
      next.teamOrder = body.teamOrder;
    }
    if (body.allowAuth !== undefined) next.allowAuth = body.allowAuth === true;

    if (body.password !== undefined && body.password !== '') {
      if (typeof body.password !== 'string' || body.password.length < 8) {
        return res
          .status(400)
          .json({error: 'password must be at least 8 characters'});
      }
      next.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const futureAllowAuth =
      typeof next.allowAuth === 'boolean' ? next.allowAuth : current.allowAuth;
    const futureEmail =
      'email' in next ? (next.email as string | null) : current.email;
    const futureHasPassword =
      'passwordHash' in next ? !!next.passwordHash : !!current.passwordHash;
    if (futureAllowAuth && (!futureEmail || !futureHasPassword)) {
      return res.status(400).json({
        error: 'allowAuth=true requires email and password',
      });
    }

    try {
      const row = await prisma.user.update({
        where: {id},
        data: next,
        include: {orgRole: true, image: true},
      });
      return res.json(toUserAdmin(row));
    } catch {
      return res.status(404).json({error: 'Not found'});
    }
  }

  if (req.method === 'DELETE') {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.id === id) {
      return res.status(400).json({error: 'Cannot delete current user'});
    }
    try {
      await prisma.user.delete({where: {id}});
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
git add src/pages/api/admin/users/[id].ts
git commit -m "$(cat <<'EOF'
feat(api): users get/update + rebuild delete with self-block

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 19: `RoleForm` + form-utils (TDD)

**Files:**

- Create: `src/components/Admin/RoleForm/{RoleForm.tsx,RoleForm.form-utils.ts,RoleForm.spec.tsx,index.ts}`
- Modify: `src/messages/{vi,en}.json`

- [ ] **Step 1: Failing test** — `RoleForm.spec.tsx`:

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
  it('disables key on edit', () => {
    setup({
      mode: 'edit',
      defaults: {key: 'founder', labelVi: 'X', labelEn: 'Y', order: 0},
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

  it('errors on invalid key', async () => {
    setup();
    await userEvent.type(screen.getByLabelText('Key'), 'Invalid!');
    await userEvent.type(screen.getByLabelText('Label (VI)'), 'X');
    await userEvent.type(screen.getByLabelText('Label (EN)'), 'Y');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(
      await screen.findByText('key must be lowercase snake_case'),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement `RoleForm.form-utils.ts`**

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

- [ ] **Step 3: Implement `RoleForm.tsx`**

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

- [ ] **Step 4: `index.ts`**

```ts
export {RoleForm} from './RoleForm';
export type {RoleFormValues} from './RoleForm.form-utils';
```

- [ ] **Step 5: Add UI translations to `src/messages/en.json`** (under `admin`):

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
      "usersCount": "Users with role",
      "validation": {
        "keyFormat": "key must be lowercase snake_case",
        "labelViRequired": "Vietnamese label required",
        "labelEnRequired": "English label required"
      }
    },
```

Mirror in `src/messages/vi.json` (Vietnamese translations of user-facing strings).

- [ ] **Step 6: Test + commit**

```bash
pnpm test src/components/Admin/RoleForm/
git add src/components/Admin/RoleForm/ src/messages/
git commit -m "$(cat <<'EOF'
feat(admin): add RoleForm + i18n strings

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 20: `/admin/roles` list / new / edit pages

**Files:**

- Create: `src/pages/admin/roles/{index.tsx,new.tsx,[id].tsx}`

- [ ] **Step 1: `index.tsx`**

```tsx
import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import type * as VMT from '@/domain';

export default function RolesListPage() {
  const t = useTranslations('admin.roles');
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
                  type="button"
                  onClick={() => handleDelete(r)}
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

- [ ] **Step 2: `new.tsx`**

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

- [ ] **Step 3: `[id].tsx`**

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

- [ ] **Step 4: Smoke + commit**

```bash
git add src/pages/admin/roles/
git commit -m "$(cat <<'EOF'
feat(admin): add /admin/roles list, new, and edit pages

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 21: `TeamPhotoPicker` (TDD)

**Files:**

- Create: `src/components/Admin/UserForm/{TeamPhotoPicker.tsx,TeamPhotoPicker.spec.tsx}`

- [ ] **Step 1: Failing test**

```tsx
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {NextIntlClientProvider} from 'next-intl';
import {TeamPhotoPicker} from './TeamPhotoPicker';

const messages = {
  admin: {
    users: {
      pickImage: 'Select photo',
      removeImage: 'Remove',
      modalTitle: 'Choose a team photo',
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
      <TeamPhotoPicker images={images} value={value} onChange={onChange} />
    </NextIntlClientProvider>,
  );
  return {onChange};
}

describe('TeamPhotoPicker', () => {
  it('opens modal', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', {name: 'Select photo'}));
    expect(screen.getByText('Choose a team photo')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('selects and closes', async () => {
    const {onChange} = setup();
    await userEvent.click(screen.getByRole('button', {name: 'Select photo'}));
    await userEvent.click(screen.getByRole('img', {name: 'A'}));
    expect(onChange).toHaveBeenCalledWith('i1');
    expect(screen.queryByText('Choose a team photo')).not.toBeInTheDocument();
  });

  it('removes selection', async () => {
    const {onChange} = setup('i1');
    await userEvent.click(screen.getByRole('button', {name: 'Remove'}));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
```

- [ ] **Step 2: Implement**

```tsx
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {Modal, Button} from '@/components/ui';
import type * as VMT from '@/domain';

type PickableImage = Pick<
  VMT.CollectionImage,
  'id' | 'url' | 'altVi' | 'altEn'
>;

type TeamPhotoPickerProps = {
  images: PickableImage[];
  value: string | null;
  onChange: (id: string | null) => void;
};

export function TeamPhotoPicker({
  images,
  value,
  onChange,
}: TeamPhotoPickerProps) {
  const t = useTranslations('admin.users');
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

- [ ] **Step 3: Test + commit**

```bash
pnpm test src/components/Admin/UserForm/TeamPhotoPicker.spec.tsx
git add src/components/Admin/UserForm/
git commit -m "$(cat <<'EOF'
feat(admin): add TeamPhotoPicker

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 22: `UserForm` + form-utils (TDD)

**Files:**

- Create: `src/components/Admin/UserForm/{UserForm.tsx,UserForm.form-utils.ts,UserForm.spec.tsx,index.ts}`
- Modify: `src/messages/{vi,en}.json` (extend `admin.users.*`)

- [ ] **Step 1: form-utils**

```ts
import * as yup from 'yup';

export type UserFormValues = {
  name: string;
  email: string;
  password: string;
  orgRoleId: string;
  bioVi: string;
  bioEn: string;
  birthDate: string;
  imageId: string | null;
  isCoreTeam: boolean;
  allowAuth: boolean;
  teamOrder: number;
};

export const userFormDefaults: UserFormValues = {
  name: '',
  email: '',
  password: '',
  orgRoleId: '',
  bioVi: '',
  bioEn: '',
  birthDate: '',
  imageId: null,
  isCoreTeam: false,
  allowAuth: true,
  teamOrder: 0,
};

export function buildUserSchema(
  t: (k: string) => string,
  mode: 'create' | 'edit',
) {
  return yup.object({
    name: yup.string().required(t('validation.nameRequired')),
    email: yup.string().when('allowAuth', {
      is: true,
      then: (s) =>
        s
          .required(t('validation.emailRequired'))
          .email(t('validation.emailFormat')),
      otherwise: (s) => s.defined(),
    }),
    password: yup.string().when('allowAuth', {
      is: true,
      then: (s) =>
        mode === 'create'
          ? s
              .required(t('validation.passwordRequired'))
              .min(8, t('validation.passwordShort'))
          : s
              .defined()
              .test(
                'opt-min',
                t('validation.passwordShort'),
                (v) => !v || v.length >= 8,
              ),
      otherwise: (s) => s.defined(),
    }),
    orgRoleId: yup.string().required(t('validation.roleRequired')),
    bioVi: yup.string().defined(),
    bioEn: yup.string().defined(),
    birthDate: yup.string().defined(),
    imageId: yup.string().nullable().defined(),
    isCoreTeam: yup.boolean().default(false),
    allowAuth: yup.boolean().default(true),
    teamOrder: yup.number().integer().min(0).default(0),
  });
}
```

- [ ] **Step 2: Failing test**

```tsx
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {NextIntlClientProvider} from 'next-intl';
import {UserForm} from './UserForm';

const messages = {
  admin: {
    users: {
      nameLabel: 'Name',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      roleLabel: 'Role',
      bioViLabel: 'Bio (VI)',
      bioEnLabel: 'Bio (EN)',
      birthDateLabel: 'Birth date',
      orderLabel: 'Order',
      isCoreTeamLabel: 'Core team',
      allowAuthLabel: 'Allow sign-in',
      save: 'Save',
      pickImage: 'Select photo',
      removeImage: 'Remove',
      modalTitle: 'Choose a team photo',
      validation: {
        nameRequired: 'Name required',
        emailRequired: 'Email required',
        emailFormat: 'Email format invalid',
        passwordRequired: 'Password required',
        passwordShort: 'Password too short',
        roleRequired: 'Role required',
      },
    },
  },
};

const roles = [
  {id: 'r1', key: 'admin', labelVi: 'Quản trị', labelEn: 'Admin', order: 0},
  {
    id: 'r2',
    key: 'founder',
    labelVi: 'Người sáng lập',
    labelEn: 'Founder',
    order: 1,
  },
];

function setup() {
  const onSubmit = jest.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <UserForm mode="create" roles={roles} images={[]} onSubmit={onSubmit} />
    </NextIntlClientProvider>,
  );
  return {onSubmit};
}

describe('UserForm', () => {
  it('populates role select', () => {
    setup();
    expect(screen.getByRole('option', {name: 'Admin'})).toBeInTheDocument();
    expect(screen.getByRole('option', {name: 'Founder'})).toBeInTheDocument();
  });

  it('submits valid data', async () => {
    const {onSubmit} = setup();
    await userEvent.type(screen.getByLabelText('Name'), 'Alice');
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Password'), 'longpass1');
    await userEvent.selectOptions(screen.getByLabelText('Role'), 'r1');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Alice',
        email: 'a@b.com',
        password: 'longpass1',
        orgRoleId: 'r1',
      }),
    );
  });

  it('errors when password too short', async () => {
    setup();
    await userEvent.type(screen.getByLabelText('Name'), 'A');
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.selectOptions(screen.getByLabelText('Role'), 'r1');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(await screen.findByText('Password too short')).toBeInTheDocument();
  });

  it('allows empty auth fields when allowAuth=false', async () => {
    const {onSubmit} = setup();
    await userEvent.click(screen.getByLabelText('Allow sign-in'));
    await userEvent.type(screen.getByLabelText('Name'), 'Thomas');
    await userEvent.selectOptions(screen.getByLabelText('Role'), 'r2');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Thomas',
        allowAuth: false,
        orgRoleId: 'r2',
      }),
    );
  });
});
```

- [ ] **Step 3: Implement `UserForm.tsx`**

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
import {TeamPhotoPicker} from './TeamPhotoPicker';
import {
  buildUserSchema,
  userFormDefaults,
  type UserFormValues,
} from './UserForm.form-utils';
import type * as VMT from '@/domain';

type PickableImage = Pick<
  VMT.CollectionImage,
  'id' | 'url' | 'altVi' | 'altEn'
>;

type UserFormProps = {
  mode: 'create' | 'edit';
  roles: VMT.OrgRole[];
  images: PickableImage[];
  defaults?: UserFormValues;
  onSubmit: (data: UserFormValues) => void;
};

export function UserForm({
  mode,
  roles,
  images,
  defaults,
  onSubmit,
}: UserFormProps) {
  const t = useTranslations('admin.users');
  const {
    register,
    handleSubmit,
    control,
    formState: {errors, isSubmitting},
  } = useForm<UserFormValues>({
    resolver: yupResolver(buildUserSchema(t, mode)),
    defaultValues: defaults ?? userFormDefaults,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField label={t('nameLabel')} error={errors.name?.message}>
        <TextInput {...register('name')} />
      </FormField>
      <FormField label={t('emailLabel')} error={errors.email?.message}>
        <TextInput type="email" {...register('email')} />
      </FormField>
      <FormField label={t('passwordLabel')} error={errors.password?.message}>
        <TextInput type="password" {...register('password')} />
      </FormField>
      <FormField label={t('roleLabel')} error={errors.orgRoleId?.message}>
        <select
          {...register('orgRoleId')}
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
      <FormField label={t('birthDateLabel')} error={errors.birthDate?.message}>
        <input
          type="date"
          {...register('birthDate')}
          className="bg-surface-elevated border border-border rounded-lg p-2 cursor-pointer"
        />
      </FormField>
      <FormField label={t('orderLabel')} error={errors.teamOrder?.message}>
        <NumberInput {...register('teamOrder', {valueAsNumber: true})} />
      </FormField>
      <Controller
        control={control}
        name="imageId"
        render={({field}) => (
          <TeamPhotoPicker
            images={images}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...register('isCoreTeam')}
          className="cursor-pointer"
        />
        {t('isCoreTeamLabel')}
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...register('allowAuth')}
          className="cursor-pointer"
        />
        {t('allowAuthLabel')}
      </label>
      <Button type="submit" disabled={isSubmitting}>
        {t('save')}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: `index.ts`**

```ts
export {UserForm} from './UserForm';
export {TeamPhotoPicker} from './TeamPhotoPicker';
export type {UserFormValues} from './UserForm.form-utils';
```

- [ ] **Step 5: Extend `admin.users` in `src/messages/en.json`** — replace the existing `users` block with:

```json
    "users": {
      "title": "Users",
      "new": "New user",
      "edit": "Edit user",
      "nameLabel": "Name",
      "emailLabel": "Email",
      "passwordLabel": "Password",
      "passwordHelp": "Leave blank to keep current password.",
      "roleLabel": "Role",
      "bioViLabel": "Bio (VI)",
      "bioEnLabel": "Bio (EN)",
      "birthDateLabel": "Birth date",
      "orderLabel": "Team order",
      "isCoreTeamLabel": "Show on About page",
      "allowAuthLabel": "Allow sign-in",
      "save": "Save",
      "delete": "Delete",
      "deleteConfirm": "Delete user \"{name}\"?",
      "pickImage": "Select photo",
      "removeImage": "Remove",
      "modalTitle": "Choose a team photo",
      "validation": {
        "nameRequired": "Name required",
        "emailRequired": "Email required",
        "emailFormat": "Email must be a valid address",
        "passwordRequired": "Password required",
        "passwordShort": "Password must be at least 8 characters",
        "roleRequired": "Role required"
      }
    },
```

Mirror in `src/messages/vi.json`.

- [ ] **Step 6: Test + commit**

```bash
pnpm test src/components/Admin/UserForm/
git add src/components/Admin/UserForm/ src/messages/
git commit -m "$(cat <<'EOF'
feat(admin): add UserForm + extend users i18n strings

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 23: Rewrite `/admin/users` as list / new / edit pages

**Files:**

- Delete: `src/pages/admin/users.tsx`
- Create: `src/pages/admin/users/{index.tsx,new.tsx,[id].tsx}`
- Delete (if unused): `src/lib/users-form-utils.ts`

- [ ] **Step 1: Delete the old single-file page**

```bash
git rm src/pages/admin/users.tsx
```

- [ ] **Step 2: Create `src/pages/admin/users/index.tsx`**

```tsx
import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useSession} from 'next-auth/react';
import {useTranslations} from 'next-intl';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import type * as VMT from '@/domain';

export default function UsersListPage() {
  const t = useTranslations('admin.users');
  const {data: session} = useSession();
  const {setLoading: setAdminLoading} = useAdminLoading();
  const [users, setUsers] = useState<VMT.UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.users.list().then(({data}) => {
      if (data) setUsers(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function handleDelete(u: VMT.UserAdmin) {
    if (!confirm(t('deleteConfirm', {name: u.name}))) return;
    const {error} = await api.admin.users.delete(u.id);
    if (error) {
      alert(error);
      return;
    }
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="type-headline-sm">{t('title')}</h1>
        <Link
          href={routes.admin.users.new.path()}
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
            <th className="p-3">{t('emailLabel')}</th>
            <th className="p-3">{t('roleLabel')}</th>
            <th className="p-3">{t('isCoreTeamLabel')}</th>
            <th className="p-3">{t('allowAuthLabel')}</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="p-3">{u.teamOrder}</td>
              <td className="p-3">
                {u.photo?.url ? (
                  <img
                    src={u.photo.url}
                    alt=""
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <div className="h-12 w-12 bg-surface-alt rounded" />
                )}
              </td>
              <td className="p-3 font-medium">{u.name}</td>
              <td className="p-3 text-on-surface-secondary">
                {u.email ?? '—'}
              </td>
              <td className="p-3">{u.orgRole.labelEn}</td>
              <td className="p-3">{u.isCoreTeam ? '✓' : '—'}</td>
              <td className="p-3">{u.allowAuth ? '✓' : '—'}</td>
              <td className="p-3 flex gap-2">
                <Link
                  href={routes.admin.users.edit.path({id: u.id})}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Edit
                </Link>
                {session?.user.id !== u.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(u)}
                    className="text-error hover:underline cursor-pointer"
                  >
                    {t('delete')}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Helper inline in `new.tsx` and `[id].tsx`** — fetches the `team` collection's images. Verify the existing `/api/admin/image-collections` endpoint shape during implementation; this code handles both shapes (list with nested images, or list-then-detail):

(See snippets in Step 4 and Step 5 below.)

- [ ] **Step 4: `new.tsx`**

```tsx
import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {UserForm, type UserFormValues} from '@/components/Admin/UserForm';
import {api, routes} from '@/routes';
import type * as VMT from '@/domain';

type TeamImage = {id: string; url: string | null; altVi: string; altEn: string};

export default function NewUserPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<VMT.OrgRole[]>([]);
  const [images, setImages] = useState<TeamImage[]>([]);

  useEffect(() => {
    api.admin.roles.list().then(({data}) => {
      if (data) setRoles(data);
    });
    fetch('/api/admin/image-collections?key=team')
      .then((r) => r.json())
      .then(async (collections) => {
        const found = Array.isArray(collections)
          ? collections.find((c: {key: string}) => c.key === 'team')
          : null;
        if (!found) return;
        if (Array.isArray(found.images)) {
          setImages(found.images);
        } else {
          const detail = await fetch(
            `/api/admin/image-collections/${found.id}`,
          ).then((r) => r.json());
          if (Array.isArray(detail.images)) setImages(detail.images);
        }
      });
  }, []);

  async function onSubmit(values: UserFormValues) {
    const payload: Record<string, unknown> = {
      ...values,
      birthDate: values.birthDate || null,
    };
    const {error} = await api.admin.users.create(payload);
    if (error) {
      alert(error);
      return;
    }
    router.push(routes.admin.users.list.path());
  }

  return (
    <UserForm mode="create" roles={roles} images={images} onSubmit={onSubmit} />
  );
}
```

- [ ] **Step 5: `[id].tsx`**

```tsx
import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {UserForm, type UserFormValues} from '@/components/Admin/UserForm';
import {api, routes} from '@/routes';
import type * as VMT from '@/domain';

type TeamImage = {id: string; url: string | null; altVi: string; altEn: string};

export default function EditUserPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [user, setUser] = useState<VMT.UserAdmin | null>(null);
  const [roles, setRoles] = useState<VMT.OrgRole[]>([]);
  const [images, setImages] = useState<TeamImage[]>([]);

  useEffect(() => {
    if (!id) return;
    api.admin.users.get(id).then(({data}) => {
      if (data) setUser(data);
    });
    api.admin.roles.list().then(({data}) => {
      if (data) setRoles(data);
    });
    fetch('/api/admin/image-collections?key=team')
      .then((r) => r.json())
      .then(async (collections) => {
        const found = Array.isArray(collections)
          ? collections.find((c: {key: string}) => c.key === 'team')
          : null;
        if (!found) return;
        if (Array.isArray(found.images)) {
          setImages(found.images);
        } else {
          const detail = await fetch(
            `/api/admin/image-collections/${found.id}`,
          ).then((r) => r.json());
          if (Array.isArray(detail.images)) setImages(detail.images);
        }
      });
  }, [id]);

  async function onSubmit(values: UserFormValues) {
    const payload: Record<string, unknown> = {
      ...values,
      birthDate: values.birthDate || null,
    };
    if (!values.password) delete payload.password;
    const {error} = await api.admin.users.update(id, payload);
    if (error) {
      alert(error);
      return;
    }
    router.push(routes.admin.users.list.path());
  }

  if (!user) return null;
  const defaults: UserFormValues = {
    name: user.name,
    email: user.email ?? '',
    password: '',
    orgRoleId: user.orgRole.id,
    bioVi: user.bioVi,
    bioEn: user.bioEn,
    birthDate: user.birthDate ? user.birthDate.slice(0, 10) : '',
    imageId: user.imageId,
    isCoreTeam: user.isCoreTeam,
    allowAuth: user.allowAuth,
    teamOrder: user.teamOrder,
  };

  return (
    <UserForm
      mode="edit"
      defaults={defaults}
      roles={roles}
      images={images}
      onSubmit={onSubmit}
    />
  );
}
```

- [ ] **Step 6: Remove legacy `users-form-utils` if unused**

Run: `grep -rn 'users-form-utils' src/`
If no references remain: `git rm src/lib/users-form-utils.ts`. Otherwise leave it.

- [ ] **Step 7: Smoke + commit**

```bash
pnpm dev
# Walk through admin /users list → /users/new → /users/[id].
git add src/pages/admin/users src/lib
git commit -m "$(cat <<'EOF'
feat(admin): rewrite /admin/users as list/new/edit pages

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 24: Admin sidebar nav — add Roles

**Files:**

- Modify: `src/components/Admin/AdminLayout/AdminLayout.tsx`

- [ ] **Step 1: Replace the existing Users entry + add Roles** — find the existing `routes.admin.users.path()` entry (if it still uses the flat form). The registry change in Task 14 made it `routes.admin.users.list.path()`. Add a Roles entry:

```ts
    {
      href: routes.admin.users.list.path(),
      label: 'Users',
      icon: 'fa-users',
    },
    {
      href: routes.admin.roles.list.path(),
      label: 'Roles',
      icon: 'fa-id-badge',
    },
```

- [ ] **Step 2: Smoke + commit**

```bash
pnpm dev
# Confirm Users + Roles in admin sidebar.
git add src/components/Admin/AdminLayout/
git commit -m "$(cat <<'EOF'
feat(admin): add Roles sidebar entry; align Users to new route shape

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 25: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Test suite**

Run: `pnpm test`
Expected: all pass.

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: succeeds.

- [ ] **Step 4: Manual flow**

Run: `pnpm dev`

1. Open `/about-us` (no photos yet) — verify hero, story, value props, team grid (5 placeholder cards), CTA. Switch locale (vi/en) → check translations.
2. Sign in to `/admin`. Confirm `Users` + `Roles` nav entries.
3. Open `/admin/image-collections` → upload 5 portraits from `src/raw/*.JPG` into the `team` collection.
4. Open `/admin/users` → edit each seeded staff user → attach photo → fill bios → set birth date → save.
5. Reload `/about-us` (en + vi) → confirm all 5 cards render with photos, names, role labels, bios, ages.
6. Open `/admin/roles` → create a fresh role (e.g., `social_media_manager`) → assign to a new user via `/admin/users/new` with `allowAuth=true` + valid password → sign in as that user → expect success. Flip `allowAuth=false` via admin → sign out + try sign-in → expect failure → flip back.
7. Try to delete a role in use → expect inline error message.
8. Try to delete the currently signed-in user → expect 400.

- [ ] **Step 5: Fix any regressions and commit follow-ups. Otherwise, implementation is complete.**

---

## Self-Review Checklist

After completing all tasks:

1. **Spec coverage:**
   - Public hero / story / value props / team grid / CTA — Tasks 7–13 ✓
   - Bold Dark visual treatment — Tailwind classes in each component ✓
   - OrgRole model + Role enum replacement + extended User — Task 1 ✓
   - Domain types + mappers — Task 2 ✓
   - Seeds (about translations, roles, staff users) — Tasks 3, 4 ✓
   - `getTeamForPublic` query — Task 5 ✓
   - NextAuth `allowAuth` gate + `requireAdmin` admin-key check — Task 6 ✓
   - Routes registry + api builders — Task 14 ✓
   - Admin /roles CRUD — Tasks 15, 16, 19, 20 ✓
   - Admin /users CRUD with new fields — Tasks 17, 18, 21, 22, 23 ✓
   - Image picker for the `team` collection — Task 21 ✓
   - Admin nav entries — Task 24 ✓
   - End-to-end verification — Task 25 ✓
   - No styling assertions in tests — every test uses text/role queries ✓

2. **Type consistency:** `TeamMember`, `UserAdmin`, `OrgRole`, `UserFormValues`, `RoleFormValues` names used identically across tasks.

3. **Out of scope:** drag-reorder, fine-grained auth scopes beyond `admin`, social links, testimonials — deferred per spec.
