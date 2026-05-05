# Type-Safe Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a centralized route registry with typed path builders, API client, and navigation hook — then migrate all hardcoded routes and raw fetch calls across the codebase.

**Architecture:** Single `src/routes/index.ts` file exports `routes` (path builders), `api` (typed fetch wrappers), and `useNavigate` hook. All page routes, API endpoints, and navigation calls go through this layer.

**Tech Stack:** TypeScript, Next.js Pages Router, React hooks

**Spec:** `docs/superpowers/specs/2026-05-06-type-safe-routing-design.md`

---

### Task 1: Create route registry and API client

**Files:**

- Create: `src/routes/index.ts`
- Modify: `src/types/index.ts` (add missing types)

- [ ] **Step 1: Add missing types to `src/types/index.ts`**

Add `AdminUser`, `TranslationRow`, and `AdminStats` types at the end of the file (before the closing of the file). These are currently defined locally in page components — centralize them:

```ts
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface TranslationRow {
  id: string;
  namespace: string;
  key: string;
  valueVi: string;
  valueEn: string;
}

export interface AdminStats {
  tourCount: number;
  destinationCount: number;
  userCount: number;
}
```

- [ ] **Step 2: Create `src/routes/index.ts` with route registry**

```ts
import {useRouter} from 'next/router';
import type {
  Tour,
  Destination,
  Highlight,
  AdminUser,
  TranslationRow,
  AdminStats,
} from '@/types';

// ─── Route Registry ───────────────────────────────────────

export const routes = {
  home: {path: () => '/'},
  tours: {
    list: {path: () => '/tours'},
    detail: {path: (p: {slug: string}) => `/tours/${p.slug}`},
    byDestination: {
      path: (p: {destinationId: string | number}) =>
        `/tours?destination=${p.destinationId}`,
    },
  },
  aboutUs: {path: () => '/about-us'},
  contact: {path: () => '/contact'},

  admin: {
    dashboard: {path: () => '/admin'},
    tours: {
      list: {path: () => '/admin/tours'},
      new: {path: () => '/admin/tours/new'},
      edit: {path: (p: {id: string | number}) => `/admin/tours/${p.id}/edit`},
    },
    destinations: {
      list: {path: () => '/admin/destinations'},
      new: {path: () => '/admin/destinations/new'},
      edit: {
        path: (p: {id: string | number}) => `/admin/destinations/${p.id}/edit`,
      },
    },
    translations: {path: () => '/admin/translations'},
    users: {path: () => '/admin/users'},
  },

  isAdmin: (pathname: string) => pathname.startsWith('/admin'),
} as const;

// ─── API Client ───────────────────────────────────────────

type ApiResult<T> = {data: T; error: null} | {data: null; error: string};

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      headers: {'Content-Type': 'application/json'},
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {data: null, error: body.error || res.statusText};
    }
    if (res.status === 204) return {data: null as T, error: null};
    return {data: await res.json(), error: null};
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

export const api = {
  admin: {
    tours: {
      list: () => request<Tour[]>('/api/admin/tours'),
      get: (id: string) => request<Tour>(`/api/admin/tours/${id}`),
      create: (data: Record<string, unknown>) =>
        request<Tour>('/api/admin/tours', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<Tour>(`/api/admin/tours/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/tours/${id}`, {method: 'DELETE'}),
    },
    destinations: {
      list: () => request<Destination[]>('/api/admin/destinations'),
      get: (id: string) =>
        request<Destination>(`/api/admin/destinations/${id}`),
      create: (data: Record<string, unknown>) =>
        request<Destination>('/api/admin/destinations', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<Destination>(`/api/admin/destinations/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/destinations/${id}`, {method: 'DELETE'}),
    },
    highlights: {
      list: (destinationId: string) =>
        request<Highlight[]>(
          `/api/admin/highlights?destinationId=${destinationId}`,
        ),
      create: (data: Record<string, unknown>) =>
        request<Highlight>('/api/admin/highlights', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<Highlight>(`/api/admin/highlights/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/highlights/${id}`, {method: 'DELETE'}),
    },
    users: {
      list: () => request<AdminUser[]>('/api/admin/users'),
      create: (data: Record<string, unknown>) =>
        request<AdminUser>('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/users/${id}`, {method: 'DELETE'}),
    },
    translations: {
      list: () => request<TranslationRow[]>('/api/admin/translations'),
      update: (data: Record<string, unknown>[]) =>
        request<TranslationRow[]>('/api/admin/translations', {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
    },
    stats: () => request<AdminStats>('/api/admin/stats'),
    upload: {
      create: (formData: FormData) =>
        request<{url: string}>('/api/admin/upload', {
          method: 'POST',
          body: formData,
          headers: {},
        }),
      delete: (data: Record<string, unknown>) =>
        request<void>('/api/admin/upload', {
          method: 'DELETE',
          body: JSON.stringify(data),
        }),
    },
  },
};

// ─── Navigation Hook ──────────────────────────────────────

type RoutePath = {path: (...args: never[]) => string};

export function useNavigate() {
  const router = useRouter();

  return {
    to(route: RoutePath, ...args: unknown[]) {
      const path = (route.path as (...a: unknown[]) => string)(...args);
      router.push(path);
    },
    replace(route: RoutePath, ...args: unknown[]) {
      const path = (route.path as (...a: unknown[]) => string)(...args);
      router.replace(path);
    },
    replaceUrl(route: RoutePath, ...args: unknown[]) {
      const path = (route.path as (...a: unknown[]) => string)(...args);
      window.history.replaceState(null, '', path);
    },
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/wentris/Documents/vietnam.moto.tour && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to `src/routes/index.ts`

- [ ] **Step 4: Commit**

```bash
git add src/routes/index.ts src/types/index.ts
git commit -m "feat: add type-safe route registry, API client, and navigation hook"
```

---

### Task 2: Migrate public page routes (header, footer, tour-card, destination-card, home page)

**Files:**

- Modify: `src/components/header/index.tsx`
- Modify: `src/components/footer/index.tsx`
- Modify: `src/components/tour-card/index.tsx`
- Modify: `src/components/destination-card/index.tsx`
- Modify: `src/pages/index.tsx`

- [ ] **Step 1: Migrate `src/components/header/index.tsx`**

Add import at top:

```ts
import {routes} from '@/routes';
```

Replace the `navLinks` array (lines 26-62). Change each hardcoded path and active check:

```ts
const navLinks = [
  {
    href: routes.home.path(),
    label: t('home'),
    active: router.pathname === routes.home.path(),
  },
  {
    href: routes.tours.list.path(),
    label: t('tours'),
    active: router.pathname.startsWith('/tours'),
  },
  {
    href: routes.aboutUs.path(),
    label: t('aboutUs'),
    active: router.pathname === routes.aboutUs.path(),
  },
  {
    href: routes.contact.path(),
    label: t('contact'),
    active: router.pathname === routes.contact.path(),
  },
  ...(session
    ? [
        {
          href: routes.admin.dashboard.path(),
          label: t('admin'),
          active: routes.isAdmin(router.pathname),
        },
      ]
    : []),
];
```

Also replace the logo `<Link href="/">` (line 113) with `<Link href={routes.home.path()}>`.

- [ ] **Step 2: Migrate `src/components/footer/index.tsx`**

Add import at top:

```ts
import {routes} from '@/routes';
```

Replace hardcoded hrefs:

- Line 15: `<Link href="/">` → `<Link href={routes.home.path()}>`
- Line 26: `<Link href="/tours">` → `<Link href={routes.tours.list.path()}>`
- Line 40: `<Link href="/about-us">` → `<Link href={routes.aboutUs.path()}>`
- Line 46: `<Link href="/contact">` → `<Link href={routes.contact.path()}>`

- [ ] **Step 3: Migrate `src/components/tour-card/index.tsx`**

Add import at top:

```ts
import {routes} from '@/routes';
```

Replace line 26:

```ts
// Before
<Link href={`/tours/${slug}`} className="block h-full cursor-pointer">
// After
<Link href={routes.tours.detail.path({slug})} className="block h-full cursor-pointer">
```

- [ ] **Step 4: Migrate `src/components/destination-card/index.tsx`**

Add import at top:

```ts
import {routes} from '@/routes';
```

Replace line 20:

```ts
// Before
href={`/tours?destination=${id}`}
// After
href={routes.tours.byDestination.path({destinationId: id})}
```

- [ ] **Step 5: Migrate `src/pages/index.tsx`**

Add import at top:

```ts
import {routes} from '@/routes';
```

Replace line 129:

```ts
// Before
<Link href="/tours" className="...">
// After
<Link href={routes.tours.list.path()} className="...">
```

- [ ] **Step 6: Verify build**

Run: `cd /Users/wentris/Documents/vietnam.moto.tour && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add src/components/header/index.tsx src/components/footer/index.tsx src/components/tour-card/index.tsx src/components/destination-card/index.tsx src/pages/index.tsx
git commit -m "refactor: migrate public page routes to route registry"
```

---

### Task 3: Migrate `_app.tsx` and admin layout routes

**Files:**

- Modify: `src/pages/_app.tsx`
- Modify: `src/components/admin/AdminLayout.tsx`

- [ ] **Step 1: Migrate `src/pages/_app.tsx`**

Add import at top:

```ts
import {routes} from '@/routes';
```

Replace line 41:

```ts
// Before
const isAdmin = router.pathname.startsWith('/admin');
// After
const isAdmin = routes.isAdmin(router.pathname);
```

- [ ] **Step 2: Migrate `src/components/admin/AdminLayout.tsx`**

Add import at top:

```ts
import {routes} from '@/routes';
```

Replace the `navItems` array (lines 22-32):

```ts
const navItems = [
  {
    href: routes.admin.dashboard.path(),
    label: 'Dashboard',
    icon: 'fa-tachometer-alt',
  },
  {href: routes.admin.tours.list.path(), label: 'Tours', icon: 'fa-route'},
  {
    href: routes.admin.destinations.list.path(),
    label: 'Destinations',
    icon: 'fa-map-marker-alt',
  },
  {
    href: routes.admin.translations.path(),
    label: 'Translations',
    icon: 'fa-language',
  },
  {href: routes.admin.users.path(), label: 'Users', icon: 'fa-users'},
];
```

Replace the active state check (lines 47-50):

```ts
// Before
const isActive =
  item.href === '/admin'
    ? router.pathname === '/admin'
    : router.pathname.startsWith(item.href);
// After
const isActive =
  item.href === routes.admin.dashboard.path()
    ? router.pathname === routes.admin.dashboard.path()
    : router.pathname.startsWith(item.href);
```

Replace line 41 (VMT Admin link):

```ts
// Before
<Link href="/" className="type-title-sm text-primary cursor-pointer">
// After
<Link href={routes.home.path()} className="type-title-sm text-primary cursor-pointer">
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/wentris/Documents/vietnam.moto.tour && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/_app.tsx src/components/admin/AdminLayout.tsx
git commit -m "refactor: migrate _app.tsx and admin layout to route registry"
```

---

### Task 4: Migrate admin tours page (routes + API calls)

**Files:**

- Modify: `src/pages/admin/tours/index.tsx`

- [ ] **Step 1: Migrate routes and API calls**

Add import at top:

```ts
import {routes, api} from '@/routes';
```

Replace the delete handler (lines 31-37):

```ts
async function handleDelete(id: string) {
  if (!confirm('Archive this tour?')) return;

  const {error} = await api.admin.tours.delete(id);
  if (!error) {
    refetch();
  }
}
```

Replace the status change handler (lines 40-48):

```ts
async function handleStatusChange(id: string, status: TourStatus) {
  const {error} = await api.admin.tours.update(id, {status});
  if (!error) {
    refetch();
  }
}
```

Replace the "New Tour" link (line 58):

```ts
// Before
href="/admin/tours/new"
// After
href={routes.admin.tours.new.path()}
```

Replace the edit link (line 94):

```ts
// Before
href={`/admin/tours/${tour.id}/edit`}
// After
href={routes.admin.tours.edit.path({id: tour.id})}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/wentris/Documents/vietnam.moto.tour && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/tours/index.tsx
git commit -m "refactor: migrate admin tours list to route registry and API client"
```

---

### Task 5: Migrate admin destinations page (routes + API calls)

**Files:**

- Modify: `src/pages/admin/destinations/index.tsx`

- [ ] **Step 1: Migrate routes and API calls**

Add import at top:

```ts
import {routes, api} from '@/routes';
```

Replace the delete handler (lines 27-36):

```ts
async function handleDelete(id: string) {
  if (!confirm('Deactivate this destination?')) return;

  const {error} = await api.admin.destinations.delete(id);
  if (!error) {
    refetch();
  }
}
```

Replace the "New Destination" link (line 45):

```ts
// Before
href="/admin/destinations/new"
// After
href={routes.admin.destinations.new.path()}
```

Replace the edit link (line 78):

```ts
// Before
href={`/admin/destinations/${dest.id}/edit`}
// After
href={routes.admin.destinations.edit.path({id: dest.id})}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/wentris/Documents/vietnam.moto.tour && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/destinations/index.tsx
git commit -m "refactor: migrate admin destinations list to route registry and API client"
```

---

### Task 6: Migrate TourEditTabs (API calls + navigation)

**Files:**

- Modify: `src/components/admin/TourEditTabs.tsx`

- [ ] **Step 1: Migrate imports and handlers**

Add import at top:

```ts
import {routes, api, useNavigate} from '@/routes';
```

Add navigate hook inside the component (after `const router = useRouter();`):

```ts
const navigate = useNavigate();
```

Replace `handleGeneralSave` (lines 47-74):

```ts
const handleGeneralSave = useCallback(
  async (data: GeneralTabData) => {
    const isNew = mode === 'create' && !tourId;
    const result = isNew
      ? await api.admin.tours.create(data as unknown as Record<string, unknown>)
      : await api.admin.tours.update(
          tourId!,
          data as unknown as Record<string, unknown>,
        );

    if (result.error) throw new Error(result.error);

    if (isNew && result.data) {
      const saved = result.data as Tour & {id: string};
      setTourId(String(saved.id));
      navigate.replaceUrl(routes.admin.tours.edit, {id: String(saved.id)});
    }
  },
  [mode, tourId, navigate],
);
```

Replace `handleItinerarySave` (lines 76-90):

```ts
const handleItinerarySave = useCallback(
  async (itinerary: ItineraryDay[]) => {
    if (!tourId) throw new Error('Save General tab first');
    const {error} = await api.admin.tours.update(tourId, {itinerary});
    if (error) throw new Error(error);
  },
  [tourId],
);
```

Replace `handlePricingSave` (lines 92-106):

```ts
const handlePricingSave = useCallback(
  async (pricingGroups: PricingGroup[]) => {
    if (!tourId) throw new Error('Save General tab first');
    const {error} = await api.admin.tours.update(tourId, {pricingGroups});
    if (error) throw new Error(error);
  },
  [tourId],
);
```

Replace `handleHighlightsSave` (lines 108-122):

```ts
const handleHighlightsSave = useCallback(
  async (highlightIds: string[]) => {
    if (!tourId) throw new Error('Save General tab first');
    const {error} = await api.admin.tours.update(tourId, {highlightIds});
    if (error) throw new Error(error);
  },
  [tourId],
);
```

Replace the "Back to Tours" button click (line 135):

```ts
// Before
onClick={() => router.push('/admin/tours')}
// After
onClick={() => navigate.to(routes.admin.tours.list)}
```

Add `Tour` to the imports from `@/types`:

```ts
import type {ItineraryDay, PricingGroup, Tour} from '@/types';
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/wentris/Documents/vietnam.moto.tour && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/TourEditTabs.tsx
git commit -m "refactor: migrate TourEditTabs to API client and navigation hook"
```

---

### Task 7: Migrate DestinationEditTabs and DestinationGeneralForm

**Files:**

- Modify: `src/components/admin/DestinationEditTabs.tsx`
- Modify: `src/components/admin/DestinationGeneralForm.tsx`

- [ ] **Step 1: Migrate `src/components/admin/DestinationEditTabs.tsx`**

Add import at top:

```ts
import {routes, api, useNavigate} from '@/routes';
```

Add navigate hook inside the component (after `const router = useRouter();`):

```ts
const navigate = useNavigate();
```

Replace the `handleSaved` callback (lines 48-56):

```ts
const handleSaved = useCallback(
  (id: string) => {
    if (!destinationId) {
      setDestinationId(id);
      navigate.replaceUrl(routes.admin.destinations.edit, {id});
    }
  },
  [destinationId, navigate],
);
```

Replace the size update `useEffect` fetch call (lines 77-81):

```ts
// Before
fetch(`/api/admin/destinations/${destinationId}`, {
  method: 'PUT',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({...form, size: form.size}),
});
// After
api.admin.destinations.update(destinationId, {...form, size: form.size});
```

Replace the "Back to Destinations" button click (line 94):

```ts
// Before
onClick={() => router.push('/admin/destinations')}
// After
onClick={() => navigate.to(routes.admin.destinations.list)}
```

- [ ] **Step 2: Migrate `src/components/admin/DestinationGeneralForm.tsx`**

Add import at top:

```ts
import {routes, api, useNavigate} from '@/routes';
```

Add navigate hook inside the component (after `const router = useRouter();`):

```ts
const navigate = useNavigate();
```

Replace the `handleSubmit` function (lines 40-71):

```ts
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setSaving(true);
  setError('');

  const result =
    mode === 'create'
      ? await api.admin.destinations.create(
          form as unknown as Record<string, unknown>,
        )
      : await api.admin.destinations.update(
          destinationId!,
          form as unknown as Record<string, unknown>,
        );

  setSaving(false);

  if (result.error) {
    setError(result.error);
    return;
  }

  if (onSaved) {
    onSaved(String(result.data?.id ?? destinationId));
  } else {
    navigate.to(routes.admin.destinations.list);
  }
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/wentris/Documents/vietnam.moto.tour && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/DestinationEditTabs.tsx src/components/admin/DestinationGeneralForm.tsx
git commit -m "refactor: migrate destination edit components to API client and navigation hook"
```

---

### Task 8: Migrate admin users page

**Files:**

- Modify: `src/pages/admin/users.tsx`

- [ ] **Step 1: Migrate API calls**

Add import at top:

```ts
import {api} from '@/routes';
```

Replace the `handleCreate` function (lines 30-52):

```ts
async function handleCreate(e: React.FormEvent) {
  e.preventDefault();
  setSaving(true);
  setError('');

  const {error} = await api.admin.users.create(newUser);
  setSaving(false);

  if (error) {
    setError(error);
    return;
  }

  setNewUser({email: '', name: '', password: ''});
  setShowForm(false);
  refetch();
}
```

Replace the `handleDelete` function (lines 54-61):

```ts
async function handleDelete(id: string) {
  if (!confirm('Delete this admin user?')) return;

  const {error} = await api.admin.users.delete(id);
  if (!error) {
    refetch();
  }
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/wentris/Documents/vietnam.moto.tour && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/users.tsx
git commit -m "refactor: migrate admin users page to API client"
```

---

### Task 9: Migrate TranslationEditor, DestinationHighlights, HighlightsTab, ImageUploadField

**Files:**

- Modify: `src/components/admin/TranslationEditor.tsx`
- Modify: `src/components/admin/DestinationHighlights.tsx`
- Modify: `src/components/admin/tabs/HighlightsTab.tsx`
- Modify: `src/components/admin/ImageUploadField.tsx`

- [ ] **Step 1: Migrate `src/components/admin/TranslationEditor.tsx`**

Add import at top:

```ts
import {api} from '@/routes';
```

Replace the `handleSave` function (lines 60-84):

```ts
async function handleSave() {
  setSaving(true);

  const toUpdate = translations
    .filter((t) => modified.has(t.id))
    .map((t) => ({
      id: t.id,
      namespace: t.namespace,
      key: t.key,
      valueVi: t.valueVi,
      valueEn: t.valueEn,
    }));

  const {error} = await api.admin.translations.update(toUpdate);
  setSaving(false);

  if (!error) {
    setModified(new Set());
  }
}
```

- [ ] **Step 2: Migrate `src/components/admin/DestinationHighlights.tsx`**

Add import at top:

```ts
import {api} from '@/routes';
```

Replace `fetchHighlights` (lines 30-42):

```ts
const fetchHighlights = useCallback(async () => {
  try {
    const {data, error} = await api.admin.highlights.list(destinationId);
    if (!error && data) setHighlights(data);
  } catch {
    // silent
  } finally {
    setLoading(false);
  }
}, [destinationId]);
```

Replace `handleAdd` (lines 48-64):

```ts
async function handleAdd() {
  if (!newText.trim()) return;
  setAdding(true);
  const {error} = await api.admin.highlights.create({
    destinationId,
    [textField]: newText,
  });
  if (!error) {
    setNewText('');
    await fetchHighlights();
  }
  setAdding(false);
}
```

Replace `handleDelete` (lines 66-69):

```ts
async function handleDelete(id: string) {
  if (!confirm('Delete this highlight?')) return;
  await api.admin.highlights.delete(id);
  await fetchHighlights();
}
```

Replace `handleUpdateText` (lines 72-83):

```ts
async function handleUpdateText(
  id: string,
  field: 'textEn' | 'textVi',
  value: string,
) {
  await api.admin.highlights.update(id, {[field]: value});
  await fetchHighlights();
}
```

Replace `handleImageUpload` (lines 85-92):

```ts
async function handleImageUpload(id: string, imageUrl: string) {
  await api.admin.highlights.update(id, {imageUrl});
  await fetchHighlights();
}
```

- [ ] **Step 3: Migrate `src/components/admin/tabs/HighlightsTab.tsx`**

Add import at top:

```ts
import {api} from '@/routes';
```

Replace the `useEffect` fetch (lines 37-54):

```ts
useEffect(() => {
  if (!destinationId) {
    setAllHighlights([]);
    setLoading(false);
    return;
  }
  setLoading(true);
  api.admin.highlights
    .list(destinationId)
    .then(({data, error}) => {
      if (!error && data) setAllHighlights(data);
      else if (error) setError('Failed to load highlights');
      setLoading(false);
    })
    .catch(() => {
      setError('Failed to load highlights');
      setLoading(false);
    });
}, [destinationId]);
```

- [ ] **Step 4: Migrate `src/components/admin/ImageUploadField.tsx`**

Add import at top:

```ts
import {api} from '@/routes';
```

Replace the upload fetch in `handleFileSelect` (lines 45-56):

```ts
try {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('entityType', entityType);
  formData.append('entityId', entityId);
  formData.append('imageType', imageType);

  const {data, error} = await api.admin.upload.create(formData);

  if (error) {
    setError(error);
    return;
  }

  setPreviewUrl(`${data!.url}?t=${Date.now()}`);
  onUploadComplete(data!.url);
} catch {
  setError('Upload failed');
} finally {
  setUploading(false);
  if (fileInputRef.current) fileInputRef.current.value = '';
}
```

Replace the delete fetch in `handleDelete` (lines 70-87):

```ts
async function handleDelete() {
  if (!entityId || !confirm('Delete this image?')) return;

  try {
    const {error} = await api.admin.upload.delete({
      entityType,
      entityId,
      imageType,
    });

    if (!error) {
      setPreviewUrl('');
      onUploadComplete('');
    }
  } catch {
    setError('Delete failed');
  }
}
```

- [ ] **Step 5: Verify build**

Run: `cd /Users/wentris/Documents/vietnam.moto.tour && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/TranslationEditor.tsx src/components/admin/DestinationHighlights.tsx src/components/admin/tabs/HighlightsTab.tsx src/components/admin/ImageUploadField.tsx
git commit -m "refactor: migrate remaining admin components to API client"
```

---

### Task 10: Remove local type duplicates and clean up unused imports

**Files:**

- Modify: `src/pages/admin/index.tsx` (remove local `DashboardStats` interface, use `AdminStats` from types)
- Modify: `src/pages/admin/users.tsx` (remove local `AdminUser` interface, use from types)
- Modify: `src/pages/admin/translations.tsx` (remove local `TranslationRow` interface, use from types)
- Modify: `src/components/admin/TranslationEditor.tsx` (remove local `TranslationRow` interface, use from types)

- [ ] **Step 1: Update `src/pages/admin/index.tsx`**

Remove local `DashboardStats` interface (lines 6-10). Add import:

```ts
import type {AdminStats} from '@/types';
```

Replace `useAdminFetch<DashboardStats>` with `useAdminFetch<AdminStats>`.

- [ ] **Step 2: Update `src/pages/admin/users.tsx`**

Remove local `AdminUser` interface (lines 7-12). Add import:

```ts
import type {AdminUser} from '@/types';
```

- [ ] **Step 3: Update `src/pages/admin/translations.tsx`**

Remove local `TranslationRow` interface (lines 6-12). Add import:

```ts
import type {TranslationRow} from '@/types';
```

- [ ] **Step 4: Update `src/components/admin/TranslationEditor.tsx`**

Remove local `TranslationRow` interface (lines 5-11). Add import:

```ts
import type {TranslationRow} from '@/types';
```

- [ ] **Step 5: Verify build**

Run: `cd /Users/wentris/Documents/vietnam.moto.tour && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/index.tsx src/pages/admin/users.tsx src/pages/admin/translations.tsx src/components/admin/TranslationEditor.tsx
git commit -m "refactor: centralize admin types, remove local duplicates"
```

---

### Task 11: Verify no hardcoded routes remain, then update CLAUDE.md

**Files:**

- Verify: all files
- Modify: `CLAUDE.md`

- [ ] **Step 1: Search for remaining hardcoded routes**

Run: `grep -rn "href=['\"]/" src/components/ src/pages/ --include="*.tsx" | grep -v "node_modules" | grep -v "href=\"https" | grep -v "href=\"mailto" | grep -v "href=\"tel" | grep -v "href={.*routes" | grep -v "href={.*getUrl" | grep -v "href={.*contactInfo"`

Expected: No results (or only external links, `#` anchors, and locale-related paths that are not being migrated).

- [ ] **Step 2: Search for remaining raw fetch calls to admin API**

Run: `grep -rn "fetch(['\`]/api/admin" src/components/ src/pages/ --include="_.tsx" --include="_.ts" | grep -v "src/pages/api/" | grep -v "src/hooks/useAdminFetch"`

Expected: No results (all admin API calls should go through the `api` client now). Note: `useAdminFetch` hook still uses raw fetch internally — this is intentional as it's a separate abstraction for GET-with-loading-state.

- [ ] **Step 3: Run full build**

Run: `cd /Users/wentris/Documents/vietnam.moto.tour && pnpm build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Update CLAUDE.md**

Add a new section after the "**Path alias:**" line in the Architecture section:

```markdown
**Routing:** All route paths, API calls, and programmatic navigation go through `src/routes/index.ts`. This file exports:

- `routes` — typed path builders for all pages (e.g., `routes.tours.detail.path({slug})`)
- `api` — typed fetch wrappers for admin API endpoints with `{data, error}` result pattern
- `useNavigate()` — hook wrapping `router.push`, `router.replace`, and `window.history.replaceState`
  Do not add hardcoded route strings or raw `fetch('/api/admin/...')` calls — use the route registry and API client instead.
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add routing abstraction to CLAUDE.md architecture section"
```
