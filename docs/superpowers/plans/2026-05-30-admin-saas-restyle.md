# Admin SaaS Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the admin scope into a polished SaaS app — grouped sidebar with a bottom user widget (real avatar), a shared `DataGrid` primitive that keeps columns aligned across sections, and sticky header-resident search.

**Architecture:** Two new presentational primitives (`Avatar` in `ui/`, `DataGrid` in `Admin/`). `DataGrid` builds one `grid-template-columns` from column defs so every section shares identical tracks (fixes column drift). The `AdminLayout` sidebar is restyled with grouped nav + a session-driven user widget; the NextAuth session is extended to carry the user's photo URL and role label. `AdminPageHeader` gains a `search` slot — and because the header sits outside the scroll region, search is sticky for free. List pages are migrated to `DataGrid`; Perks and Translations keep their inline editors and only adopt the new chrome.

**Tech Stack:** Next.js 16 (Pages Router), React 19, TypeScript strict, Tailwind v4, NextAuth v4 (JWT), Prisma, Jest + React Testing Library, react-query.

**Spec:** `docs/superpowers/specs/2026-05-30-admin-saas-restyle-design.md`

**Conventions (from CLAUDE.md):** `type` not `interface`; one component per file (helpers/types in sibling files); `cursor-pointer` on interactive elements; no inline styles; shared `Button`/`TextInput`; no styling assertions in tests; do not commit/push unless the user asks (the executor should pause for the user at commit steps if the user has not pre-authorised commits).

---

## File Structure

**New files**
- `src/components/ui/Avatar/index.ts` — re-export
- `src/components/ui/Avatar/Avatar.tsx` — avatar with initials fallback
- `src/components/ui/Avatar/Avatar.spec.tsx` — tests
- `src/components/Admin/DataGrid/index.ts` — re-export
- `src/components/Admin/DataGrid/DataGrid.types.ts` — `GridColumn`, `GridSection`, `DataGridProps`
- `src/components/Admin/DataGrid/DataGrid.tsx` — grid renderer
- `src/components/Admin/DataGrid/DataGrid.spec.tsx` — tests
- `src/components/Admin/AdminLayout/AdminLayout.nav.ts` — grouped nav config

**Modified files**
- `src/components/ui/index.ts` — export `Avatar`
- `src/components/Admin/index.ts` — export `DataGrid` (verify barrel exists; if not, import directly)
- `src/components/Admin/AdminPageShell/AdminPageHeader.tsx` — add `search` slot
- `src/lib/auth.ts` — thread `imageUrl` + `roleLabel` through authorize/jwt/session
- `src/types/next-auth.d.ts` — extend session/user/jwt
- `src/components/Admin/AdminLayout/AdminLayout.tsx` — grouped nav + user widget
- List pages (one task each): `rentals`, `tours`, `reviews`, `destinations`, `users`, `roles`, `image-collections`, `backups`
- Restyle-only: `perks`, `translations`

---

## Phase 1 — Primitives

### Task 1: `Avatar` primitive

**Files:**
- Create: `src/components/ui/Avatar/Avatar.tsx`
- Create: `src/components/ui/Avatar/index.ts`
- Test: `src/components/ui/Avatar/Avatar.spec.tsx`
- Modify: `src/components/ui/index.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/Avatar/Avatar.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {Avatar} from './Avatar';

describe('Avatar', () => {
  it('renders the image when src is provided', () => {
    render(<Avatar src="https://example.com/a.jpg" name="Jane Doe" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('example.com'));
  });

  it('renders initials when src is null', () => {
    render(<Avatar src={null} name="Jane Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('derives a single initial from a one-word name', () => {
    render(<Avatar src={null} name="Wentris" />);
    expect(screen.getByText('W')).toBeInTheDocument();
  });

  it('falls back to initials after the image errors', () => {
    render(<Avatar src="https://example.com/broken.jpg" name="Jane Doe" />);
    const img = screen.getByRole('img');
    img.dispatchEvent(new Event('error', {bubbles: true}));
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --watchAll=false Avatar.spec`
Expected: FAIL — cannot resolve `./Avatar`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/ui/Avatar/Avatar.tsx`:

```tsx
import {useState} from 'react';

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  alt?: string;
};

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({src, name, size = 'md', alt}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const base = `inline-flex items-center justify-center overflow-hidden rounded-full bg-surface-alt text-on-surface font-semibold shrink-0 ${sizeClasses[size]}`;

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? name}
        className={`${base} object-cover`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={base} aria-label={alt ?? name} role="img">
      {initials(name)}
    </span>
  );
}
```

Create `src/components/ui/Avatar/index.ts`:

```ts
export {Avatar} from './Avatar';
```

> Note: a raw `<img>` is used (not `next/image`) because avatar URLs are arbitrary remote hosts and the fallback-on-error path must swap to initials. The eslint-disable is intentional and scoped to this line.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --watchAll=false Avatar.spec`
Expected: PASS (4 tests).

- [ ] **Step 5: Export from the ui barrel**

In `src/components/ui/index.ts`, add after the `Button` export line:

```ts
export {Avatar} from './Avatar';
```

- [ ] **Step 6: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0 (no Avatar-related errors).

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Avatar src/components/ui/index.ts
git commit -m "feat(ui): add Avatar primitive with initials fallback"
```

---

### Task 2: `DataGrid` types

**Files:**
- Create: `src/components/Admin/DataGrid/DataGrid.types.ts`

- [ ] **Step 1: Write the types file**

Create `src/components/Admin/DataGrid/DataGrid.types.ts`:

```ts
import type {ReactNode} from 'react';

export type GridColumn<T> = {
  /** unique column id; also the default value accessor key */
  key: string;
  header: ReactNode;
  /** a CSS grid track, e.g. 'minmax(0,1fr)' or '80px' */
  track: string;
  align?: 'start' | 'end';
  render?: (row: T) => ReactNode;
};

export type GridSection<T> = {
  id: string;
  label: ReactNode;
  count?: number;
  items: T[];
};

export type DataGridProps<T> = {
  columns: GridColumn<T>[];
  /** sectioned mode — mutually exclusive with `items` */
  sections?: GridSection<T>[];
  /** flat mode — mutually exclusive with `sections` */
  items?: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  ariaLabel?: string;
};
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/Admin/DataGrid/DataGrid.types.ts
git commit -m "feat(admin): add DataGrid types"
```

---

### Task 3: `DataGrid` renderer

**Files:**
- Create: `src/components/Admin/DataGrid/DataGrid.tsx`
- Create: `src/components/Admin/DataGrid/index.ts`
- Test: `src/components/Admin/DataGrid/DataGrid.spec.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/Admin/DataGrid/DataGrid.spec.tsx`:

```tsx
import {render, screen, fireEvent} from '@testing-library/react';
import {DataGrid} from './DataGrid';
import type {GridColumn} from './DataGrid.types';

type Row = {id: string; name: string; cc: number};

const columns: GridColumn<Row>[] = [
  {key: 'name', header: 'Vehicle', track: 'minmax(0,1fr)'},
  {key: 'cc', header: 'CC', track: '80px', render: (r) => `${r.cc}cc`},
];

describe('DataGrid', () => {
  it('renders column headers', () => {
    render(
      <DataGrid columns={columns} items={[]} rowKey={(r) => r.id} />,
    );
    expect(screen.getByText('Vehicle')).toBeInTheDocument();
    expect(screen.getByText('CC')).toBeInTheDocument();
  });

  it('renders one row per item using custom render', () => {
    render(
      <DataGrid
        columns={columns}
        items={[{id: '1', name: 'Enduro', cc: 150}]}
        rowKey={(r) => r.id}
      />,
    );
    expect(screen.getByText('Enduro')).toBeInTheDocument();
    expect(screen.getByText('150cc')).toBeInTheDocument();
  });

  it('renders section bands with label and count', () => {
    render(
      <DataGrid
        columns={columns}
        sections={[
          {id: 'b', label: 'Bikes', count: 1, items: [{id: '1', name: 'Enduro', cc: 150}]},
          {id: 's', label: 'Scooters', count: 1, items: [{id: '2', name: 'Airblade', cc: 125}]},
        ]}
        rowKey={(r) => r.id}
      />,
    );
    expect(screen.getByText('Bikes')).toBeInTheDocument();
    expect(screen.getByText('Scooters')).toBeInTheDocument();
    expect(screen.getByText('Enduro')).toBeInTheDocument();
    expect(screen.getByText('Airblade')).toBeInTheDocument();
  });

  it('calls onRowClick with the row', () => {
    const onRowClick = jest.fn();
    render(
      <DataGrid
        columns={columns}
        items={[{id: '1', name: 'Enduro', cc: 150}]}
        rowKey={(r) => r.id}
        onRowClick={onRowClick}
      />,
    );
    fireEvent.click(screen.getByText('Enduro'));
    expect(onRowClick).toHaveBeenCalledWith({id: '1', name: 'Enduro', cc: 150});
  });

  it('renders the empty state when there are no items', () => {
    render(
      <DataGrid
        columns={columns}
        items={[]}
        rowKey={(r) => r.id}
        emptyState={<span>Nothing here</span>}
      />,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --watchAll=false DataGrid.spec`
Expected: FAIL — cannot resolve `./DataGrid`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/Admin/DataGrid/DataGrid.tsx`:

```tsx
import {Fragment} from 'react';
import type {DataGridProps, GridColumn, GridSection} from './DataGrid.types';

function cellValue<T>(col: GridColumn<T>, row: T): React.ReactNode {
  if (col.render) return col.render(row);
  const raw = (row as Record<string, unknown>)[col.key];
  return raw == null ? '' : String(raw);
}

export function DataGrid<T>({
  columns,
  sections,
  items,
  rowKey,
  onRowClick,
  emptyState,
  ariaLabel,
}: DataGridProps<T>) {
  const template = columns.map((c) => c.track).join(' ');
  const resolvedSections: GridSection<T>[] =
    sections ??
    (items ? [{id: '__flat__', label: '', items}] : []);
  const total = resolvedSections.reduce((n, s) => n + s.items.length, 0);
  const showBands = !!sections;

  if (total === 0) {
    return (
      <div
        className="border border-border bg-surface-elevated p-8 text-center type-body-md text-on-surface-secondary"
        role="status"
      >
        {emptyState ?? 'Nothing here yet.'}
      </div>
    );
  }

  return (
    <div
      role="table"
      aria-label={ariaLabel}
      className="border border-border bg-surface-elevated overflow-hidden"
    >
      <div
        role="row"
        className="grid gap-3 px-4 py-2 bg-surface border-b border-border sticky top-0 z-[1]"
        style={{gridTemplateColumns: template}}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            role="columnheader"
            className={`type-label-sm uppercase tracking-wide text-on-surface-tertiary ${
              col.align === 'end' ? 'text-right' : 'text-left'
            }`}
          >
            {col.header}
          </div>
        ))}
      </div>

      {resolvedSections.map((section) => (
        <Fragment key={section.id}>
          {showBands && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-surface-alt border-b border-border">
              <span className="type-label-sm uppercase tracking-wide text-on-surface-secondary">
                {section.label}
              </span>
              {section.count != null && (
                <span className="type-body-sm text-on-surface-tertiary tabular-nums">
                  ({section.count})
                </span>
              )}
            </div>
          )}
          {section.items.map((row) => (
            <div
              key={rowKey(row)}
              role="row"
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`grid gap-3 px-4 py-3 border-b border-border last:border-0 ${
                onRowClick ? 'cursor-pointer hover:bg-surface-alt/50' : ''
              }`}
              style={{gridTemplateColumns: template}}
            >
              {columns.map((col) => (
                <div
                  key={col.key}
                  role="cell"
                  className={`min-w-0 type-body-sm text-on-surface-secondary self-center ${
                    col.align === 'end' ? 'text-right' : 'text-left'
                  }`}
                >
                  {cellValue(col, row)}
                </div>
              ))}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
```

> Note: the style attribute here sets `gridTemplateColumns` from a runtime-computed track string. CLAUDE.md bans inline styling for *visual* properties handled by Tailwind; a dynamic grid template cannot be expressed as a static utility class, so this is the documented exception (same pattern Tailwind's own `grid-cols-[...]` arbitrary values would need at build time). Keep ALL other styling in Tailwind classes.

Create `src/components/Admin/DataGrid/index.ts`:

```ts
export {DataGrid} from './DataGrid';
export type {GridColumn, GridSection, DataGridProps} from './DataGrid.types';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --watchAll=false DataGrid.spec`
Expected: PASS (5 tests).

- [ ] **Step 5: Lint + typecheck**

Run: `pnpm exec eslint src/components/Admin/DataGrid && pnpm exec tsc --noEmit`
Expected: exit 0. If eslint flags the `onClick` on a `role="row"` div, add a keyboard handler or `// eslint-disable-next-line` only if the existing codebase pattern requires it — otherwise leave row-click as is (rows also expose an explicit Edit action, so click is an enhancement, not the sole affordance).

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin/DataGrid
git commit -m "feat(admin): add DataGrid primitive with shared column tracks"
```

---

## Phase 2 — Shell & session

### Task 4: Extend the NextAuth session with photo + role label

**Files:**
- Modify: `src/types/next-auth.d.ts`
- Modify: `src/lib/auth.ts`

- [ ] **Step 1: Extend the session types**

Replace the body of `src/types/next-auth.d.ts` with:

```ts
import 'next-auth';

declare module 'next-auth' {
  interface User {
    orgRoleKey?: string | null;
    roleLabel?: string | null;
    imageUrl?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      orgRoleKey: string | null;
      roleLabel: string | null;
      imageUrl: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    orgRoleKey?: string | null;
    roleLabel?: string | null;
    imageUrl?: string | null;
  }
}
```

- [ ] **Step 2: Load the image + role label in `authorize`**

In `src/lib/auth.ts`, change the Prisma query include and the returned object inside `authorize`:

```ts
const user = await prisma.user.findUnique({
  where: {email: credentials.email},
  include: {orgRole: true, image: true},
});
```

```ts
return {
  id: user.id,
  email: user.email,
  name: user.name,
  orgRoleKey: user.orgRole?.key ?? null,
  roleLabel: user.orgRole?.labelEn ?? user.orgRole?.key ?? null,
  imageUrl: user.image?.url ?? null,
};
```

- [ ] **Step 3: Thread through jwt + session callbacks**

Replace the `callbacks` block in `src/lib/auth.ts` with:

```ts
callbacks: {
  async jwt({token, user}) {
    if (user) {
      const u = user as {
        orgRoleKey?: string | null;
        roleLabel?: string | null;
        imageUrl?: string | null;
      };
      token.orgRoleKey = u.orgRoleKey ?? null;
      token.roleLabel = u.roleLabel ?? null;
      token.imageUrl = u.imageUrl ?? null;
    }
    return token;
  },
  async session({session, token}) {
    session.user = {
      ...session.user,
      id: token.sub as string,
      orgRoleKey: (token.orgRoleKey as string | null) ?? null,
      roleLabel: (token.roleLabel as string | null) ?? null,
      imageUrl: (token.imageUrl as string | null) ?? null,
    };
    return session;
  },
},
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0. (`src/lib/admin-auth.ts` reads `session.user.orgRoleKey` — still present, so no break.)

- [ ] **Step 5: Verify the Prisma `image` relation name**

Run: `grep -n "image" prisma/schema.prisma | head`
Expected: confirm the `User` model has an `image` relation (the user mapper at `src/domain/user/mapper.ts` already includes `image`). If the relation is named differently, match it here.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/types/next-auth.d.ts
git commit -m "feat(auth): expose user photo and role label on the session"
```

---

### Task 5: Add a `search` slot to `AdminPageHeader`

**Files:**
- Modify: `src/components/Admin/AdminPageShell/AdminPageHeader.tsx`

- [ ] **Step 1: Add the prop and render it**

In `src/components/Admin/AdminPageShell/AdminPageHeader.tsx`, add `search?: ReactNode;` to `AdminPageHeaderProps`, destructure `search`, and render it. Replace the right-side action cluster so search sits before the locale switcher:

```tsx
type AdminPageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  status?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
  localeSwitcher?: ReactNode;
};
```

```tsx
      <div className="flex items-center gap-3 shrink-0">
        {search}
        {status}
        {localeSwitcher}
        {actions}
      </div>
```

(Add `search` to the destructured params list as well.)

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/Admin/AdminPageShell/AdminPageHeader.tsx
git commit -m "feat(admin): add search slot to AdminPageHeader"
```

---

### Task 6: Grouped nav config

**Files:**
- Create: `src/components/Admin/AdminLayout/AdminLayout.nav.ts`

- [ ] **Step 1: Write the nav config**

Create `src/components/Admin/AdminLayout/AdminLayout.nav.ts`:

```ts
import {routes} from '@/routes';

export type AdminNavItem = {href: string; label: string; icon: string};
export type AdminNavGroup = {label: string; items: AdminNavItem[]};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Content',
    items: [
      {href: routes.admin.dashboard.path(), label: 'Dashboard', icon: 'fa-tachometer-alt'},
      {href: routes.admin.tours.list.path(), label: 'Tours', icon: 'fa-route'},
      {href: routes.admin.reviews.list.path(), label: 'Reviews', icon: 'fa-star'},
      {href: routes.admin.destinations.list.path(), label: 'Destinations', icon: 'fa-map-marker-alt'},
      {href: routes.admin.vehicles.list.path(), label: 'Rentals', icon: 'fa-motorcycle'},
      {href: routes.admin.perks.list.path(), label: 'Perks', icon: 'fa-check-circle'},
      {href: routes.admin.imageCollections.list.path(), label: 'Image collections', icon: 'fa-images'},
    ],
  },
  {
    label: 'System',
    items: [
      {href: routes.admin.translations.path(), label: 'Translations', icon: 'fa-language'},
      {href: routes.admin.users.list.path(), label: 'Users', icon: 'fa-users'},
      {href: routes.admin.roles.list.path(), label: 'Roles', icon: 'fa-user-shield'},
      {href: routes.admin.backups.path?.() ?? '/admin/backups', label: 'Backups', icon: 'fa-database'},
    ],
  },
];
```

> Before writing: run `grep -n "backups\|dashboard\|imageCollections\|vehicles\|translations" src/routes/registry.ts` to confirm each route builder name. Use the exact registry names; replace the `backups` fallback with the real `routes.admin.backups.path()` if it exists.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/Admin/AdminLayout/AdminLayout.nav.ts
git commit -m "feat(admin): grouped admin nav config"
```

---

### Task 7: Restyle `AdminLayout` (grouped nav + user widget)

**Files:**
- Modify: `src/components/Admin/AdminLayout/AdminLayout.tsx`

- [ ] **Step 1: Replace the inline `navItems` + `sidebarBody`**

In `AdminLayout.tsx`: remove the local `navItems` array; import the config and `Avatar`:

```tsx
import {Avatar} from '@/components/ui';
import {adminNavGroups} from './AdminLayout.nav';
```

Replace the `<nav>` block inside `sidebarBody` with grouped rendering:

```tsx
<nav className="flex-1 p-3 overflow-y-auto">
  {adminNavGroups.map((group) => (
    <div key={group.label} className="mb-4">
      <p className="px-3 pb-1.5 type-label-sm uppercase tracking-[0.14em] text-on-surface-tertiary">
        {group.label}
      </p>
      <div className="space-y-1">
        {group.items.map((item) => {
          const isActive =
            item.href === routes.admin.dashboard.path()
              ? router.pathname === routes.admin.dashboard.path()
              : router.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg type-body-sm transition-colors cursor-pointer ${
                isActive
                  ? 'bg-primary/10 text-primary before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-r before:bg-primary'
                  : 'text-on-surface-secondary hover:bg-surface-alt hover:text-on-surface'
              }`}
            >
              <i className={`fas ${item.icon} w-5 text-center`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  ))}
</nav>
```

- [ ] **Step 2: Replace the footer name/logout with the user widget**

Replace the existing bottom `<div className="p-4 border-t border-border">…</div>` in `sidebarBody` with:

```tsx
<div className="p-3 border-t border-border">
  <div className="flex items-center gap-3 px-2 py-2 rounded-lg border border-border bg-surface">
    <Avatar
      src={session?.user.imageUrl ?? null}
      name={session?.user.name ?? 'Admin'}
      size="sm"
    />
    <div className="min-w-0 flex-1">
      <p className="type-body-sm font-semibold text-on-surface truncate">
        {session?.user.name ?? 'Admin'}
      </p>
      <p className="type-label-sm text-on-surface-tertiary truncate">
        {session?.user.roleLabel ?? '—'}
      </p>
    </div>
    <button
      type="button"
      onClick={() => signOut({callbackUrl: '/'})}
      aria-label="Logout"
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-on-surface-secondary hover:text-on-surface hover:bg-surface-alt cursor-pointer"
    >
      <i className="fa fa-power-off text-xs" />
    </button>
  </div>
</div>
```

(The `Button` import may now be unused — remove it from the import if so; `signOut`, `useSession`, `session` are already in scope.)

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm exec eslint src/components/Admin/AdminLayout`
Expected: exit 0. Resolve any unused-import error from the removed `Button`/`navItems`.

- [ ] **Step 4: Visual check (manual)**

Run: `pnpm dev`, sign in, open any `/admin` page. Confirm: grouped nav (Content / System), active item has a left accent bar, the bottom widget shows your real avatar (a user with a photo) and initials (the seeded "VMT User"), logout works.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/AdminLayout/AdminLayout.tsx
git commit -m "feat(admin): grouped sidebar nav and user widget with avatar"
```

---

## Phase 3 — Page migrations

> Pattern for every migration: build a `columns: GridColumn<Row>[]` array, wrap each existing group in a `GridSection` (sectioned pages) or pass `items` (flat pages), and replace the hand-rolled `<table>`/`<section>` JSX with a single `<DataGrid>`. KEEP all existing data hooks, `useMemo` grouping, handlers, `ConfirmModal`s, header actions, and `getServerSideProps` untouched. Action buttons move into a final column's `render`. After each: `pnpm exec tsc --noEmit`, run that page's spec if one exists, `pnpm dev` smoke check, commit.

### Task 8: Migrate Rentals (sectioned + move search into header)

**Files:**
- Modify: `src/pages/admin/rentals/index.tsx`

- [ ] **Step 1: Import DataGrid and define columns**

Add import:

```tsx
import {DataGrid, type GridColumn} from '@/components/Admin/DataGrid';
```

Define columns above the `return` (after `grouped` is computed):

```tsx
const columns: GridColumn<Vehicle>[] = [
  {
    key: 'vehicle',
    header: 'Vehicle',
    track: 'minmax(0,1fr)',
    render: (v) => (
      <Link
        href={routes.admin.vehicles.edit.path({id: v.id})}
        className="flex items-center gap-3 cursor-pointer"
      >
        {v.imageUrl ? (
          <Image src={v.imageUrl} alt="" width={60} height={40} unoptimized className="h-[40px] w-auto object-cover" />
        ) : null}
        <span className="type-title-sm text-on-surface">{v.brand} {v.model}</span>
      </Link>
    ),
  },
  {key: 'cc', header: 'CC', track: '64px', render: (v) => v.cc},
  {key: 'qty', header: 'Qty', track: '56px', render: (v) => v.quantity},
  {key: 'price', header: 'Price/day', track: '96px', render: (v) => `$${v.priceUsdPerDay}`},
  {key: 'status', header: 'Status', track: '120px', render: (v) => <Badge>{v.status}</Badge>},
  {
    key: 'actions',
    header: 'Actions',
    track: '160px',
    align: 'end',
    render: (v) => (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost-primary" size="sm" href={routes.admin.vehicles.edit.path({id: v.id})} icon={<i className="fa fa-pencil" />}>Edit</Button>
        <Button variant="ghost-danger" size="sm" onClick={() => setConfirmId(v.id)} icon={<i className="fa fa-trash" />}>Delete</Button>
      </div>
    ),
  },
];

const sections = grouped.map((g) => ({
  id: g.type,
  label: g.type === 'SCOOTER' ? 'Scooters' : 'Bikes',
  count: g.items.length,
  items: g.items,
}));
```

- [ ] **Step 2: Move search into the header**

In `AdminPageHeader`, add a `search` prop and remove the in-body `<input type="search">`:

```tsx
search={
  <input
    type="search"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search by brand or model…"
    className="cursor-text w-64 px-3 py-2 border border-border bg-surface-elevated"
  />
}
```

- [ ] **Step 3: Replace the body**

Replace the entire `<div className="space-y-6">…</div>` body (the search input + the `grouped.map(...)` sections) with:

```tsx
<DataGrid
  columns={columns}
  sections={sections}
  rowKey={(v) => v.id}
  ariaLabel="Rentals"
  emptyState={'No vehicles yet. Click "Add vehicle" to create the first one.'}
/>
```

- [ ] **Step 4: Typecheck + smoke + commit**

Run: `pnpm exec tsc --noEmit`
Run: `pnpm dev` → `/admin/rentals`. Confirm columns align across Bikes/Scooters, search in header is sticky on scroll, Edit/Delete work.

```bash
git add src/pages/admin/rentals/index.tsx
git commit -m "feat(admin): migrate rentals list to DataGrid with header search"
```

---

### Task 9: Migrate Tours (sectioned by destination, StatusPicker cell)

**Files:**
- Modify: `src/pages/admin/tours/index.tsx`

- [ ] **Step 1: Import DataGrid; define columns + sections**

Add `import {DataGrid, type GridColumn} from '@/components/Admin/DataGrid';`. After `groupedByDestination` is computed, add:

```tsx
const columns: GridColumn<AdminTour>[] = [
  {
    key: 'title',
    header: 'Title',
    track: 'minmax(0,1fr)',
    render: (tour) => (
      <Link href={routes.admin.tours.edit.path({id: tour.id})} className="flex items-center gap-3 cursor-pointer">
        {tour.imageUrl ? (
          <Image src={tour.imageUrl} alt="" width={75} height={50} unoptimized className="h-[50px] w-auto object-contain shrink-0" />
        ) : (
          <span className="h-[50px] w-[50px] bg-surface-alt flex items-center justify-center shrink-0">
            <i className="fa fa-image text-on-surface-tertiary" />
          </span>
        )}
        <span className="type-body-lg text-primary hover:underline">{pickTitle(tour)}</span>
      </Link>
    ),
  },
  {
    key: 'pricing',
    header: 'Pricing Type',
    track: '160px',
    render: (tour) => {
      const types = new Set((tour.pricingGroups ?? []).map((g) => g.type));
      const hasGroup = types.has('group-size');
      const hasVehicle = types.has('vehicle');
      if (!hasGroup && !hasVehicle) return <span className="text-on-surface-tertiary">—</span>;
      const chip = 'type-label-sm uppercase tracking-wide bg-surface-alt border border-border text-on-surface-secondary px-2 py-0.5';
      return (
        <div className="flex items-center gap-1.5">
          {hasGroup && <span className={chip}>Group</span>}
          {hasVehicle && <span className={chip}>Vehicle</span>}
        </div>
      );
    },
  },
  {
    key: 'status',
    header: 'Status',
    track: '180px',
    align: 'end',
    render: (tour) => (
      <div className="inline-flex justify-end">
        <StatusPicker value={tour.status} onChange={(status) => handleStatusChange(tour.id, status)} />
      </div>
    ),
  },
];

const sections = groupedByDestination.map((g) => ({
  id: g.label,
  label: g.label,
  count: g.tours.length,
  items: g.tours,
}));
```

- [ ] **Step 2: Replace the body**

Replace the entire `<div className="space-y-6">…</div>` (all the `groupedByDestination.map(...)` sections + the empty-state block) with:

```tsx
<DataGrid
  columns={columns}
  sections={sections}
  rowKey={(t) => t.id}
  ariaLabel="Tours"
  emptyState="No tours yet."
/>
```

- [ ] **Step 3: Typecheck + smoke + commit**

Run: `pnpm exec tsc --noEmit`; `pnpm dev` → `/admin/tours`: columns align across destinations, StatusPicker still toggles.

```bash
git add src/pages/admin/tours/index.tsx
git commit -m "feat(admin): migrate tours list to DataGrid"
```

---

### Task 10: Migrate Reviews (sectioned by tour)

**Files:**
- Modify: `src/pages/admin/reviews/index.tsx`

- [ ] **Step 1: Read the current file**

Run: `sed -n '1,220p' src/pages/admin/reviews/index.tsx` to capture the exact row data shape (reviewer name/avatar, StarRating component, Featured flag, Edit/Delete handlers, grouping by tour).

- [ ] **Step 2: Define columns + sections**

Add `import {DataGrid, type GridColumn} from '@/components/Admin/DataGrid';` and `import {Avatar} from '@/components/ui';` (if not already). Build:

```tsx
const columns: GridColumn<Review>[] = [
  {
    key: 'reviewer',
    header: 'Reviewer',
    track: 'minmax(0,1fr)',
    render: (r) => (
      <div className="flex items-center gap-3">
        <Avatar src={r.avatarUrl ?? null} name={r.reviewerName} size="sm" />
        <span className="type-title-sm text-on-surface">{r.reviewerName}</span>
      </div>
    ),
  },
  {key: 'rating', header: 'Rating', track: '120px', render: (r) => <StarRating rating={r.rating} size="sm" />},
  {key: 'featured', header: 'Featured', track: '90px', render: (r) => (r.isFeatured ? <i className="fa fa-check text-primary" aria-label="Featured" /> : <span className="text-on-surface-tertiary">—</span>)},
  {
    key: 'actions',
    header: 'Actions',
    track: '160px',
    align: 'end',
    render: (r) => (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost-primary" size="sm" href={routes.admin.reviews.edit.path({id: r.id})} icon={<i className="fa fa-pencil" />}>Edit</Button>
        <Button variant="ghost-danger" size="sm" onClick={() => setDeleteTarget(r)} icon={<i className="fa fa-trash" />}>Delete</Button>
      </div>
    ),
  },
];
```

Map the existing tour-grouping into `sections` exactly as the page already groups (reuse the current grouped variable; set `id`/`label` to the tour title and `count` to the group length). Match the real field names found in Step 1 (e.g. `avatarUrl`, `isFeatured`, the StarRating import path, the delete handler name).

- [ ] **Step 3: Replace the `<table>`/sections body with `<DataGrid columns={columns} sections={sections} rowKey={(r) => r.id} ariaLabel="Reviews" />`. Keep the `ConfirmModal`/delete logic.**

- [ ] **Step 4: Typecheck + run spec + smoke + commit**

Run: `pnpm exec tsc --noEmit`; `pnpm test -- --watchAll=false reviews` (if a list spec exists); `pnpm dev` → `/admin/reviews`.

```bash
git add src/pages/admin/reviews/index.tsx
git commit -m "feat(admin): migrate reviews list to DataGrid"
```

---

### Task 11: Migrate Destinations (flat)

**Files:**
- Modify: `src/pages/admin/destinations/index.tsx`

- [ ] **Step 1: Read the file** — `sed -n '1,220p' src/pages/admin/destinations/index.tsx` for the row type (name + thumbnail link, tours count, highlights count, size, Archive action) and the archive handler name.

- [ ] **Step 2: Define columns** (`Name` 1fr with thumbnail+link, `Tours` 80px, `Highlights` 96px, `Size` 96px, `Actions` 140px end with the existing Archive `ghost-danger` Button). Pass the existing list as `items` (flat — no sections).

- [ ] **Step 3: Replace the `<table>` with `<DataGrid columns={columns} items={list} rowKey={(d) => d.id} ariaLabel="Destinations" emptyState="No destinations yet." />`. Keep `ConfirmModal` + archive logic.**

- [ ] **Step 4: Typecheck + smoke + commit**

```bash
git add src/pages/admin/destinations/index.tsx
git commit -m "feat(admin): migrate destinations list to DataGrid"
```

---

### Task 12: Migrate Users (flat; Avatar + check cells; header search)

**Files:**
- Modify: `src/pages/admin/users/index.tsx`

- [ ] **Step 1: Read the file** — `sed -n '1,260p' src/pages/admin/users/index.tsx` for the row type and the current-user delete guard.

- [ ] **Step 2: Define columns**

```tsx
const check = (on: boolean) => (on ? <i className="fa fa-check text-primary" aria-hidden="true" /> : <span className="text-on-surface-tertiary">—</span>);

const columns: GridColumn<UserAdmin>[] = [
  {key: 'order', header: 'Order', track: '64px', render: (u) => u.teamOrder},
  {key: 'photo', header: '', track: '48px', render: (u) => <Avatar src={u.photo?.url ?? null} name={u.name} size="sm" />},
  {key: 'name', header: 'Name', track: 'minmax(0,1fr)', render: (u) => <span className="type-title-sm text-on-surface">{u.name}</span>},
  {key: 'email', header: 'Email', track: 'minmax(0,1fr)', render: (u) => u.email},
  {key: 'role', header: 'Role', track: '120px', render: (u) => u.orgRole?.labelEn ?? u.orgRole?.key ?? '—'},
  {key: 'core', header: 'Core team', track: '100px', render: (u) => check(u.isCoreTeam)},
  {key: 'auth', header: 'Allow sign-in', track: '120px', render: (u) => check(u.allowAuth)},
  {
    key: 'actions', header: 'Actions', track: '160px', align: 'end',
    render: (u) => (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost-primary" size="sm" href={routes.admin.users.edit.path({id: u.id})} icon={<i className="fa fa-pencil" />}>Edit</Button>
        {u.id !== currentUserId && (
          <Button variant="ghost-danger" size="sm" onClick={() => setDeleteTarget(u)} icon={<i className="fa fa-trash" />}>Delete</Button>
        )}
      </div>
    ),
  },
];
```

Match `currentUserId`/`setDeleteTarget`/the role + photo field names to what Step 1 reveals. Add a header `search` input filtering by name/email (new `useState('')` + `useMemo` filter, mirroring the rentals pattern) since Users can be long.

- [ ] **Step 3: Replace the `<table>` with `<DataGrid columns={columns} items={filteredUsers} rowKey={(u) => u.id} ariaLabel="Users" emptyState="No users yet." />`. Keep `ConfirmModal`, locale switcher, and the delete logic.**

- [ ] **Step 4: Typecheck + smoke + commit**

```bash
git add src/pages/admin/users/index.tsx
git commit -m "feat(admin): migrate users list to DataGrid with search"
```

---

### Task 13: Migrate Roles (flat; keep modal create/edit)

**Files:**
- Modify: `src/pages/admin/roles/index.tsx`

- [ ] **Step 1: Define columns** (`Order` 64px, `Key` 1fr mono, `Label` 1fr → `locale === 'en' ? r.labelEn : r.labelVi`, `Actions` 160px end → existing `openEdit(r)` Edit + `setDeleteTarget(r)` Delete buttons). The file already has `openEdit`, `setDeleteTarget`, `locale` in scope from the earlier modal work.

- [ ] **Step 2: Replace the `<table className="w-full …">…</table>` with `<DataGrid columns={columns} items={roles} rowKey={(r) => r.id} ariaLabel="Roles" emptyState="No roles yet." />`. Leave the `Modal` + `ConfirmModal` blocks untouched.**

- [ ] **Step 3: Typecheck + smoke + commit**

Run: `pnpm exec tsc --noEmit`; `pnpm dev` → `/admin/roles`: Edit opens the modal, Delete confirms.

```bash
git add src/pages/admin/roles/index.tsx
git commit -m "feat(admin): migrate roles list to DataGrid"
```

---

### Task 14: Migrate Image collections (flat)

**Files:**
- Modify: `src/pages/admin/image-collections/index.tsx`

- [ ] **Step 1: Read the file** — `sed -n '1,200p' src/pages/admin/image-collections/index.tsx` for the row type + handlers.

- [ ] **Step 2: Define columns** (`Label` 1fr, `Key` 1fr mono, `Image count` 120px, `Actions` 160px end → Edit link + Delete). Pass list as `items`.

- [ ] **Step 3: Replace `<table>` with `<DataGrid … items=… rowKey={(c) => c.id} ariaLabel="Image collections" emptyState="No collections yet." />`. Keep delete `ConfirmModal`.**

- [ ] **Step 4: Typecheck + smoke + commit**

```bash
git add src/pages/admin/image-collections/index.tsx
git commit -m "feat(admin): migrate image collections list to DataGrid"
```

---

### Task 15: Migrate Backups (flat; kind toggle in header)

**Files:**
- Modify: `src/pages/admin/backups/index.tsx`

- [ ] **Step 1: Read the file** — `sed -n '1,220p' src/pages/admin/backups/index.tsx` for the row type, the `SegmentedControl` kind toggle, and the download handler.

- [ ] **Step 2: Move the `SegmentedControl` into the header `search` (or `actions`) slot. Define columns** (`Created` 1fr, `Source` 140px badge, `Size` 120px, `Actions` 140px end → Download `ghost-primary`). Pass rows as `items`.

- [ ] **Step 3: Replace `<table>` with `<DataGrid … items=… rowKey={(b) => b.id} ariaLabel="Backups" emptyState="No backups yet." />`. Keep the kind state + reload logic.**

- [ ] **Step 4: Typecheck + smoke + commit**

```bash
git add src/pages/admin/backups/index.tsx
git commit -m "feat(admin): migrate backups list to DataGrid"
```

---

## Phase 4 — Restyle-only pages & dashboard

### Task 16: Restyle Perks (keep inline editor)

**Files:**
- Modify: `src/pages/admin/perks/index.tsx`

Perks keeps its 2-column inline-edit cards and its existing category section headers (already restyled this session: accent bar + count badge). Only align it to the new chrome:

- [ ] **Step 1: Add a header `search`** input that filters perks by the active-locale label (new `useState('')` + filter before `grouped`), matching the rentals search styling. This satisfies "search must be sticky" for perks.

- [ ] **Step 2: Confirm the section header markup matches the new band style** used elsewhere (uppercase label, count). No DataGrid migration.

- [ ] **Step 3: Typecheck + smoke + commit**

```bash
git add src/pages/admin/perks/index.tsx
git commit -m "feat(admin): add sticky search to perks, align chrome"
```

### Task 17: Restyle Translations (keep editor)

**Files:**
- Modify: `src/pages/admin/translations.tsx`

- [ ] **Step 1:** Translations already has a namespace sidebar + search + per-row Save. Move its search into the `AdminPageHeader` `search` slot so it's sticky with the header (currently it may sit in the body). Keep the namespace sidebar and Value inputs exactly as they are. No DataGrid migration.

- [ ] **Step 2: Typecheck + smoke + commit**

```bash
git add src/pages/admin/translations.tsx
git commit -m "feat(admin): make translations search sticky in header"
```

### Task 18: Dashboard chrome pass + final verification

**Files:**
- Modify (if needed): `src/pages/admin/index.tsx`

- [ ] **Step 1:** Dashboard stat cards stay. Verify spacing/typography read consistently with the restyled shell; adjust only if visibly off. No structural change.

- [ ] **Step 2: Full verification**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

Run: `pnpm test -- --watchAll=false`
Expected: all suites pass (note: a pre-existing ReviewCard `London, UK` failure is unrelated to this work — confirm it is the only red and was red before).

Run: `pnpm lint`
Expected: no new errors.

Run: `pnpm build`
Expected: build + type-check succeed.

- [ ] **Step 3: Manual SaaS pass** — `pnpm dev`, walk every admin list page: columns align across sections everywhere, search stays pinned, sidebar groups + active accent + user widget (avatar/initials) + logout all correct.

- [ ] **Step 4: Commit any dashboard tweaks**

```bash
git add src/pages/admin/index.tsx
git commit -m "chore(admin): dashboard chrome consistency pass"
```

---

## Self-Review notes

- **Spec coverage:** sidebar+widget (Tasks 6–7), avatar/session (Task 4), DataGrid+alignment (Tasks 2–3, applied 8–15), sticky search (Task 5 + per-page), migrate-all (Tasks 8–17), Perks/Translations restyle-only (16–17), no palette/dep/Prisma change (honored). ✓
- **Type consistency:** `GridColumn`/`GridSection`/`DataGridProps` names are used identically across Tasks 2, 3, and all migrations. `imageUrl`/`roleLabel` named identically in Task 4 types, callbacks, and Task 7 widget. ✓
- **Known unknowns to resolve at task time (each task says how):** exact route-builder names (Task 6 grep), Prisma `image` relation name (Task 4 Step 5), and per-page field names for Reviews/Destinations/Users/Image-collections/Backups (each task's Step 1 reads the file first).
