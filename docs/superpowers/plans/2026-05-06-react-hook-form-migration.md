# React Hook Form + Yup Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all forms from raw `useState` to `react-hook-form` + `yup`, establishing a `form-utils.ts` co-location convention.

**Architecture:** Each form component gets a co-located `*.form-utils.ts` file exporting schema, inferred types, defaults, and submit handler. Components own only rendering and `useForm()` wiring. A shared `FormFieldError` component and `form-helpers.ts` provide reusable utilities.

**Tech Stack:** react-hook-form, @hookform/resolvers, yup, Next.js Pages Router, TypeScript strict mode.

---

## File Structure

### New files to create:

- `src/components/admin/FormFieldError.tsx` — reusable inline error component
- `src/utils/form-helpers.ts` — shared yup helpers (`localizedString`)
- `src/components/admin/LoginModal.form-utils.ts` — login schema/defaults/submit
- `src/pages/contact.form-utils.ts` — contact schema/defaults/submit
- `src/pages/admin/users.form-utils.ts` — user creation schema/defaults/submit
- `src/components/admin/DestinationGeneralForm.form-utils.ts` — destination schema/defaults/submit
- `src/components/admin/tabs/GeneralTab.form-utils.ts` — tour general schema/defaults/submit
- `src/components/admin/tabs/ItineraryTab.form-utils.ts` — itinerary schema/defaults/submit
- `src/components/admin/tabs/PricingTab.form-utils.ts` — pricing schema/defaults/submit
- `src/components/admin/DestinationHighlights.form-utils.ts` — highlights schema/defaults/submit

### Files to modify:

- `CLAUDE.md` — add form convention rule
- `src/components/admin/LoginModal.tsx` — replace useState with useForm
- `src/pages/contact.tsx` — wire up useForm
- `src/pages/admin/users.tsx` — replace useState with useForm
- `src/components/admin/DestinationGeneralForm.tsx` — replace props-driven state with useForm
- `src/components/admin/DestinationEditTabs.tsx` — adjust parent interface
- `src/components/admin/tabs/GeneralTab.tsx` — replace useState with useForm
- `src/components/admin/tabs/ItineraryTab.tsx` — replace useState/setNestedValue with useForm + useFieldArray
- `src/components/admin/tabs/PricingTab.tsx` — replace useState/setNestedValue with useForm + useFieldArray
- `src/components/admin/DestinationHighlights.tsx` — partial migration for add-highlight form

---

## Task 1: Install Dependencies & Update CLAUDE.md

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: Install dependencies**

```bash
pnpm add react-hook-form @hookform/resolvers yup
```

- [ ] **Step 2: Verify installation**

```bash
pnpm build 2>&1 | head -5
```

Expected: build starts without dependency errors.

- [ ] **Step 3: Add form convention rule to CLAUDE.md**

Add after the `cursor-pointer` rule in the `### Code Style` section of `CLAUDE.md`:

```markdown
- **Form convention.** Every component or page that contains a form must have a co-located `form-utils.ts` file (e.g., `LoginModal.form-utils.ts` next to `LoginModal.tsx`). This file exports: Yup validation schema, form TypeScript type (inferred via `yup.InferType`), default values, and submit handler. Components handle only rendering and `useForm()` wiring.
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md package.json pnpm-lock.yaml
git commit -m "feat: add react-hook-form, @hookform/resolvers, yup dependencies and CLAUDE.md form convention"
```

---

## Task 2: Create Shared Utilities

**Files:**

- Create: `src/components/admin/FormFieldError.tsx`
- Create: `src/utils/form-helpers.ts`

- [ ] **Step 1: Create FormFieldError component**

Create `src/components/admin/FormFieldError.tsx`:

```tsx
type FormFieldErrorProps = {
  message?: string;
};

export function FormFieldError({message}: FormFieldErrorProps) {
  if (!message) return null;
  return <p className="text-red-500 text-sm mt-1">{message}</p>;
}
```

- [ ] **Step 2: Create shared form helpers**

Create `src/utils/form-helpers.ts`:

```typescript
import * as yup from 'yup';

export const localizedString = (label: string) =>
  yup.object({
    en: yup.string().required(`${label} (EN) is required`),
    vi: yup.string().required(`${label} (VI) is required`),
  });
```

- [ ] **Step 3: Verify types compile**

```bash
pnpm build 2>&1 | tail -5
```

Expected: successful build.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/FormFieldError.tsx src/utils/form-helpers.ts
git commit -m "feat: add FormFieldError component and shared form helpers"
```

---

## Task 3: Migrate Login Modal

**Files:**

- Create: `src/components/admin/LoginModal.form-utils.ts`
- Modify: `src/components/admin/LoginModal.tsx`

- [ ] **Step 1: Create LoginModal.form-utils.ts**

Create `src/components/admin/LoginModal.form-utils.ts`:

```typescript
import * as yup from 'yup';
import {signIn} from 'next-auth/react';

export const loginSchema = yup.object({
  email: yup.string().required('Email is required'),
  password: yup.string().required('Password is required'),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;

export const loginDefaults: LoginFormData = {
  email: '',
  password: '',
};

export async function submitLogin(
  data: LoginFormData,
): Promise<{error?: string}> {
  const result = await signIn('credentials', {
    redirect: false,
    email: data.email,
    password: data.password,
  });

  if (result?.error) return {error: 'Invalid email or password'};
  return {};
}
```

- [ ] **Step 2: Rewrite LoginForm component in LoginModal.tsx**

Replace the entire `LoginForm` function (lines 11-89) in `src/components/admin/LoginModal.tsx`. The imports at the top of the file should become:

```typescript
'use client';

import {useState, useEffect, useCallback} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {
  loginSchema,
  loginDefaults,
  submitLogin,
  type LoginFormData,
} from './LoginModal.form-utils';
import {FormFieldError} from './FormFieldError';
```

Replace the `LoginForm` function with:

```tsx
function LoginForm({onClose}: {onClose: () => void}) {
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: loginDefaults,
    shouldFocusError: true,
  });

  async function onSubmit(data: LoginFormData) {
    setSubmitError('');
    const {error} = await submitLogin(data);
    if (error) {
      setSubmitError(error);
      return;
    }
    onClose();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="login-email"
          className="block type-label-sm text-on-surface-secondary mb-1"
        >
          Email
        </label>
        <input
          id="login-email"
          type="text"
          {...register('email')}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          autoComplete="username"
        />
        <FormFieldError message={errors.email?.message} />
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="block type-label-sm text-on-surface-secondary mb-1"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          {...register('password')}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          autoComplete="current-password"
        />
        <FormFieldError message={errors.password?.message} />
      </div>

      {submitError && (
        <p className="type-body-sm text-red-500" role="alert">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary-light text-on-primary type-label-sm uppercase py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? '...' : 'Sign In'}
      </button>
    </form>
  );
}
```

The `LoginModal` wrapper component (lines 92-140) stays unchanged.

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | tail -5
```

Expected: successful build.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/LoginModal.tsx src/components/admin/LoginModal.form-utils.ts
git commit -m "feat: migrate LoginModal to react-hook-form + yup"
```

---

## Task 4: Migrate Contact Page

**Files:**

- Create: `src/pages/contact.form-utils.ts`
- Modify: `src/pages/contact.tsx`

- [ ] **Step 1: Create contact.form-utils.ts**

Create `src/pages/contact.form-utils.ts`:

```typescript
import * as yup from 'yup';

export const contactSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  message: yup.string().required('Message is required'),
});

export type ContactFormData = yup.InferType<typeof contactSchema>;

export const contactDefaults: ContactFormData = {
  name: '',
  email: '',
  message: '',
};

export async function submitContact(
  data: ContactFormData,
): Promise<{error?: string}> {
  // Stub until contact API route is built
  console.log('Contact form submitted:', data);
  return {};
}
```

- [ ] **Step 2: Update contact.tsx to use react-hook-form**

Add imports at the top of `src/pages/contact.tsx` (after existing imports):

```typescript
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {
  contactSchema,
  contactDefaults,
  submitContact,
  type ContactFormData,
} from './contact.form-utils';
import {FormFieldError} from '@/components/admin/FormFieldError';
```

Replace the `Contact` component function body. The whole default export becomes:

```tsx
export default function Contact() {
  const t = useTranslations('contact');
  const tMeta = useTranslations('meta');

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting, isSubmitSuccessful},
    reset,
  } = useForm<ContactFormData>({
    resolver: yupResolver(contactSchema),
    defaultValues: contactDefaults,
    shouldFocusError: true,
  });

  async function onSubmit(data: ContactFormData) {
    await submitContact(data);
    reset();
  }

  return (
    <>
      <Head>
        <title>{tMeta('contactTitle')}</title>
        <meta name="description" content={tMeta('contactDescription')} />
      </Head>

      <PageHeader
        title={t('title')}
        breadcrumbs={[
          {label: t('breadcrumbHome'), href: '/'},
          {label: t('breadcrumbContact')},
        ]}
        backgroundImage="https://media.gadventures.com/media-server/cache/59/d0/59d0b4d7c98928e2b9bf2e208409d5d6.jpg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <span className="type-label-sm uppercase text-on-surface-accent">
                {t('talkWithTeam')}
              </span>
              <h2 className="type-headline-lg mt-2 mb-6">{t('anyQuestion')}</h2>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 bg-surface-alt hover:bg-primary hover:text-on-primary rounded-full flex items-center justify-center text-on-surface-secondary transition-all"
                >
                  <i className="fab fa-facebook" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-surface-alt hover:bg-primary hover:text-on-primary rounded-full flex items-center justify-center text-on-surface-secondary transition-all"
                >
                  <i className="fab fa-twitter" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-surface-alt hover:bg-primary hover:text-on-primary rounded-full flex items-center justify-center text-on-surface-secondary transition-all"
                >
                  <i className="fab fa-instagram" />
                </a>
              </div>
            </div>
            <div className="lg:col-span-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <input
                      type="text"
                      placeholder={t('namePlaceholder')}
                      {...register('name')}
                      className="w-full bg-surface-alt border-0 rounded-lg px-5 py-4 type-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <FormFieldError message={errors.name?.message} />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      {...register('email')}
                      className="w-full bg-surface-alt border-0 rounded-lg px-5 py-4 type-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <FormFieldError message={errors.email?.message} />
                  </div>
                </div>
                <div>
                  <textarea
                    placeholder={t('messagePlaceholder')}
                    rows={6}
                    {...register('message')}
                    className="w-full bg-surface-alt border-0 rounded-lg px-5 py-4 type-body-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <FormFieldError message={errors.message?.message} />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary-light text-on-primary type-label-sm uppercase px-8 py-4 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? '...' : t('sendMessage')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface-alt">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: 'icon-place',
                lines: [contactInfo.address, `${contactInfo.city}, Vietnam`],
              },
              {icon: 'icon-phone-call', lines: [contactInfo.phone]},
              {icon: 'icon-at', lines: [contactInfo.email]},
            ].map((info, i) => (
              <div
                key={i}
                className="bg-surface-elevated rounded-lg p-8 text-center shadow-sm"
              >
                <span
                  className={`${info.icon} text-xl text-primary block mb-8`}
                />
                {info.lines.map((line, j) => (
                  <p key={j} className="text-on-surface text-[0.6rem]">
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TODO: replace with interactive map when ready */}
      <section>
        <img
          src="/assets/images/map.png"
          alt="Location map"
          className="w-full h-96 object-cover"
        />
      </section>
    </>
  );
}
```

Keep the `getStaticProps` function unchanged at the bottom.

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | tail -5
```

Expected: successful build.

- [ ] **Step 4: Commit**

```bash
git add src/pages/contact.tsx src/pages/contact.form-utils.ts
git commit -m "feat: migrate contact page to react-hook-form + yup"
```

---

## Task 5: Migrate Users Creation Form

**Files:**

- Create: `src/pages/admin/users.form-utils.ts`
- Modify: `src/pages/admin/users.tsx`

- [ ] **Step 1: Create users.form-utils.ts**

Create `src/pages/admin/users.form-utils.ts`:

```typescript
import * as yup from 'yup';
import {api} from '@/routes';

export const createUserSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

export type CreateUserFormData = yup.InferType<typeof createUserSchema>;

export const createUserDefaults: CreateUserFormData = {
  name: '',
  email: '',
  password: '',
};

export async function submitCreateUser(
  data: CreateUserFormData,
): Promise<{error?: string}> {
  const {error} = await api.admin.users.create(data);
  if (error) return {error};
  return {};
}
```

- [ ] **Step 2: Rewrite users.tsx form section**

Replace the imports and component in `src/pages/admin/users.tsx`:

```tsx
import {useState, useEffect} from 'react';
import {useSession} from 'next-auth/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {api} from '@/routes';
import type {AdminUser} from '@/types';
import {
  createUserSchema,
  createUserDefaults,
  submitCreateUser,
  type CreateUserFormData,
} from './users.form-utils';
import {FormFieldError} from '@/components/admin/FormFieldError';

export default function AdminUsers() {
  const {data: session} = useSession();
  const {data, loading, refetch} =
    useAdminFetch<AdminUser[]>('/api/admin/users');
  const {setLoading} = useAdminLoading();
  const users = data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
    reset,
  } = useForm<CreateUserFormData>({
    resolver: yupResolver(createUserSchema),
    defaultValues: createUserDefaults,
    shouldFocusError: true,
  });

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  async function onSubmit(data: CreateUserFormData) {
    setSubmitError('');
    const {error} = await submitCreateUser(data);
    if (error) {
      setSubmitError(error);
      return;
    }
    reset();
    setShowForm(false);
    refetch();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this admin user?')) return;

    const {error} = await api.admin.users.delete(id);
    if (!error) {
      refetch();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Users</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors cursor-pointer"
        >
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-surface-elevated rounded-xl border border-border p-6 mb-6 max-w-lg"
        >
          {submitError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-lg mb-4">
              {submitError}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block type-label-sm text-on-surface-secondary mb-1">
                Name
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <FormFieldError message={errors.name?.message} />
            </div>
            <div>
              <label className="block type-label-sm text-on-surface-secondary mb-1">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <FormFieldError message={errors.email?.message} />
            </div>
            <div>
              <label className="block type-label-sm text-on-surface-secondary mb-1">
                Password
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <FormFieldError message={errors.password?.message} />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Name
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Email
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Role
              </th>
              <th className="text-right px-4 py-3 type-label-sm text-on-surface-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3 type-body-lg text-on-surface">
                  {user.name}
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface-secondary">
                  {user.email}
                </td>
                <td className="px-4 py-3 type-label-sm text-on-surface-secondary">
                  {user.role}
                </td>
                <td className="px-4 py-3 text-right">
                  {session?.user.id !== user.id && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="type-label-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | tail -5
```

Expected: successful build.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/users.tsx src/pages/admin/users.form-utils.ts
git commit -m "feat: migrate admin users form to react-hook-form + yup"
```

---

## Task 6: Migrate Destination General Form

**Files:**

- Create: `src/components/admin/DestinationGeneralForm.form-utils.ts`
- Modify: `src/components/admin/DestinationGeneralForm.tsx`
- Modify: `src/components/admin/DestinationEditTabs.tsx`

This form is tricky: the parent (`DestinationEditTabs`) currently owns the form state and passes it down with `onFieldChange`. After migration, `DestinationGeneralForm` owns its own state via `useForm`, receiving only `initialData`, `mode`, `destinationId`, and callbacks.

- [ ] **Step 1: Create DestinationGeneralForm.form-utils.ts**

Create `src/components/admin/DestinationGeneralForm.form-utils.ts`:

```typescript
import * as yup from 'yup';
import {api} from '@/routes';

export const destinationSchema = yup.object({
  slug: yup.string().required('Slug is required'),
  name: yup.string().defined(),
  nameVi: yup.string().defined(),
  nameEn: yup.string().defined(),
  imageUrl: yup.string().defined(),
  heroImage: yup.string().defined(),
  descriptionVi: yup.string().defined(),
  descriptionEn: yup.string().defined(),
  size: yup.string().defined(),
});

export type DestinationFormData = yup.InferType<typeof destinationSchema>;

export const destinationDefaults: DestinationFormData = {
  slug: '',
  name: '',
  nameVi: '',
  nameEn: '',
  imageUrl: '',
  heroImage: '',
  descriptionVi: '',
  descriptionEn: '',
  size: '',
};

export async function submitDestination(
  data: DestinationFormData,
  mode: 'create' | 'edit',
  destinationId: string | null,
): Promise<{data?: {id: string | number}; error?: string}> {
  const result =
    mode === 'create'
      ? await api.admin.destinations.create(
          data as unknown as Record<string, unknown>,
        )
      : await api.admin.destinations.update(
          destinationId!,
          data as unknown as Record<string, unknown>,
        );

  if (result.error) return {error: result.error};
  return {data: {id: result.data?.id ?? destinationId!}};
}
```

- [ ] **Step 2: Rewrite DestinationGeneralForm.tsx**

Replace `src/components/admin/DestinationGeneralForm.tsx` entirely:

```tsx
'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {routes, useNavigate} from '@/routes';
import {FormFieldError} from './FormFieldError';
import {
  destinationSchema,
  submitDestination,
  type DestinationFormData,
} from './DestinationGeneralForm.form-utils';
import type {Locale} from './LocalePicker';

type DestinationGeneralFormProps = {
  initialData: DestinationFormData;
  locale: Locale;
  mode: 'create' | 'edit';
  destinationId: string | null;
  onSaved?: (id: string) => void;
};

export function DestinationGeneralForm({
  initialData,
  locale,
  mode,
  destinationId,
  onSaved,
}: DestinationGeneralFormProps) {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
    reset,
  } = useForm<DestinationFormData>({
    resolver: yupResolver(destinationSchema),
    defaultValues: initialData,
    shouldFocusError: true,
  });

  const nameField = locale === 'en' ? 'nameEn' : 'nameVi';
  const descField = locale === 'en' ? 'descriptionEn' : 'descriptionVi';

  async function onSubmit(data: DestinationFormData) {
    setSubmitError('');
    const result = await submitDestination(data, mode, destinationId);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    reset(data);

    if (onSaved) {
      onSaved(String(result.data?.id));
    } else {
      navigate.to(routes.admin.destinations.list);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-sm">
          {submitError}
        </div>
      )}

      <div className="max-w-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              Slug
            </label>
            <input
              type="text"
              {...register('slug')}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <FormFieldError message={errors.slug?.message} />
          </div>
          <div>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              Name ({locale.toUpperCase()})
            </label>
            <input
              type="text"
              {...register(nameField)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <FormFieldError message={errors[nameField]?.message} />
          </div>
        </div>

        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description ({locale.toUpperCase()})
          </label>
          <textarea
            rows={4}
            {...register(descField)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <FormFieldError message={errors[descField]?.message} />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting
              ? 'Saving...'
              : mode === 'create'
                ? 'Create Destination'
                : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Update DestinationEditTabs.tsx**

In `src/components/admin/DestinationEditTabs.tsx`, the parent no longer manages form fields. Make these changes:

1. Remove the `DestinationFormData` type export and move it. Instead, import from form-utils:

Replace the import line:

```typescript
import {DestinationGeneralForm} from './DestinationGeneralForm';
```

with:

```typescript
import {DestinationGeneralForm} from './DestinationGeneralForm';
import type {DestinationFormData} from './DestinationGeneralForm.form-utils';
```

2. Remove the `updateForm` callback (lines 62-70) — no longer needed by the general form.

3. Remove the `form` state entirely — **wait, other tabs still use `form` for heroImage, cardImage, and size.** The parent must keep `form` state for the image tabs. The general form now manages its own state independently, but the parent still needs `form` for image URLs and size.

So the actual change is simpler: just update the `DestinationGeneralForm` usage in the JSX. Replace lines 134-141:

```tsx
{
  activeTab === 'general' && (
    <div className="p-5">
      <DestinationGeneralForm
        initialData={form}
        locale={locale}
        mode={mode}
        destinationId={destinationId}
        onSaved={handleSaved}
      />
    </div>
  );
}
```

Keep `updateForm`, `form`, and `DestinationFormData` type in `DestinationEditTabs.tsx` as they are — the image/highlights tabs still need them.

Also update the `DestinationFormData` export to still be exported from `DestinationEditTabs.tsx` (it's used by other tabs). But now `DestinationGeneralForm.form-utils.ts` has its own copy. To avoid duplication, have the form-utils import the type from `DestinationEditTabs`:

Actually, let's keep it simple — the types are the same shape. Export `DestinationFormData` from `DestinationEditTabs.tsx` as before (other files may import it). The `DestinationGeneralForm.form-utils.ts` defines its own schema-inferred type. Both are structurally identical so TypeScript accepts them interchangeably.

- [ ] **Step 4: Verify build**

```bash
pnpm build 2>&1 | tail -5
```

Expected: successful build.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/DestinationGeneralForm.tsx src/components/admin/DestinationGeneralForm.form-utils.ts src/components/admin/DestinationEditTabs.tsx
git commit -m "feat: migrate DestinationGeneralForm to react-hook-form + yup"
```

---

## Task 7: Migrate Tour General Tab

**Files:**

- Create: `src/components/admin/tabs/GeneralTab.form-utils.ts`
- Modify: `src/components/admin/tabs/GeneralTab.tsx`

- [ ] **Step 1: Create GeneralTab.form-utils.ts**

Create `src/components/admin/tabs/GeneralTab.form-utils.ts`:

```typescript
import * as yup from 'yup';
import type {TourStatus, LocalizedText} from '@/types';

export const generalTabSchema = yup.object({
  slug: yup.string().required('Slug is required'),
  destinationId: yup.string().required('Destination is required'),
  title: yup.string().required('Title is required'),
  titleVi: yup.string().defined(),
  titleEn: yup.string().defined(),
  imageUrl: yup.string().defined(),
  price: yup
    .number()
    .min(0, 'Price must be positive')
    .required('Price is required'),
  duration: yup.number().min(0).required('Duration is required'),
  distance: yup.number().min(0).required('Distance is required'),
  descriptionVi: yup.string().defined(),
  descriptionEn: yup.string().defined(),
  transportation: yup.string().defined(),
  groupSize: yup.number().min(0).required('Group size is required'),
  hotel: yup.string().defined(),
  guided: yup.string().defined(),
  images: yup.array().of(yup.string().required()).defined(),
  included: yup.mixed<LocalizedText[]>().defined(),
  excluded: yup.mixed<LocalizedText[]>().defined(),
  paymentDetails: yup.mixed<LocalizedText>().defined(),
  notes: yup.mixed<LocalizedText[]>().defined(),
  mealsInfo: yup.mixed<LocalizedText>().defined(),
  status: yup.mixed<TourStatus>().required('Status is required'),
});

export type GeneralTabFormData = yup.InferType<typeof generalTabSchema>;
```

Note: no submit handler here because `GeneralTab` receives `onSave` as a prop from the parent tour edit page. The parent already handles the API call.

- [ ] **Step 2: Rewrite GeneralTab.tsx**

Replace `src/components/admin/tabs/GeneralTab.tsx` entirely:

```tsx
'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {ImageUploadField} from '@/components/admin/ImageUploadField';
import {StatusPicker} from '@/components/admin/StatusPicker';
import {FormFieldError} from '@/components/admin/FormFieldError';
import {
  generalTabSchema,
  type GeneralTabFormData,
} from './GeneralTab.form-utils';

export type {GeneralTabFormData as GeneralTabData};

type GeneralTabProps = {
  initialData: GeneralTabFormData;
  destinations: Array<{id: string; name: string}>;
  tourId: string | null;
  onDestinationChange?: (destinationId: string) => void;
  onSave: (data: GeneralTabFormData) => Promise<void>;
};

export function GeneralTab({
  initialData,
  destinations,
  tourId,
  onDestinationChange,
  onSave,
}: GeneralTabProps) {
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: {errors, isSubmitting, isDirty},
    reset,
  } = useForm<GeneralTabFormData>({
    resolver: yupResolver(generalTabSchema),
    defaultValues: initialData,
    shouldFocusError: true,
  });

  const status = watch('status');
  const imageUrl = watch('imageUrl');
  const destinationId = watch('destinationId');

  async function onSubmit(data: GeneralTabFormData) {
    setSubmitError('');
    try {
      await onSave(data);
      reset(data);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="type-title-lg text-on-surface">General Info</h2>
        <StatusPicker
          value={status}
          onChange={(s) => {
            setValue('status', s, {shouldDirty: true});
          }}
        />
      </div>

      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-sm">
          {submitError}
        </div>
      )}

      {/* Basic fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Slug
          </label>
          <input
            type="text"
            {...register('slug')}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
          <FormFieldError message={errors.slug?.message} />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Destination
          </label>
          <select
            {...register('destinationId', {
              onChange: (e) => onDestinationChange?.(e.target.value),
            })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="">Select...</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <FormFieldError message={errors.destinationId?.message} />
        </div>
      </div>

      <div>
        <label className="block type-label-sm text-on-surface-secondary mb-1">
          Title
        </label>
        <input
          type="text"
          {...register('title')}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        />
        <FormFieldError message={errors.title?.message} />
      </div>

      {/* Localized descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description (EN)
          </label>
          <textarea
            rows={4}
            {...register('descriptionEn')}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description (VI)
          </label>
          <textarea
            rows={4}
            {...register('descriptionVi')}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
        </div>
      </div>

      {/* Numeric fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {key: 'price' as const, label: 'Price ($)'},
          {key: 'duration' as const, label: 'Duration (days)'},
          {key: 'distance' as const, label: 'Distance (km)'},
          {key: 'groupSize' as const, label: 'Group Size'},
        ].map(({key, label}) => (
          <div key={key}>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              {label}
            </label>
            <input
              type="number"
              {...register(key, {valueAsNumber: true})}
              min={0}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            />
            <FormFieldError message={errors[key]?.message} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          {key: 'transportation' as const, label: 'Transportation'},
          {key: 'hotel' as const, label: 'Hotel'},
          {key: 'guided' as const, label: 'Guided'},
        ].map(({key, label}) => (
          <div key={key}>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              {label}
            </label>
            <input
              type="text"
              {...register(key)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* Image */}
      <ImageUploadField
        entityType="tour"
        entityId={tourId}
        imageType="card"
        currentUrl={imageUrl}
        onUploadComplete={(url) =>
          setValue('imageUrl', url, {shouldDirty: true})
        }
        label="Card Image"
      />

      {/* Submit */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Saving...' : 'Save General'}
        </button>
      </div>

      {isDirty && (
        <p className="type-label-sm text-amber-500">Unsaved changes</p>
      )}
    </form>
  );
}
```

Note: `GeneralTabData` is re-exported as a type alias of `GeneralTabFormData` so existing imports from other files (`import type {GeneralTabData}`) continue to work without changes.

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | tail -5
```

Expected: successful build.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/tabs/GeneralTab.tsx src/components/admin/tabs/GeneralTab.form-utils.ts
git commit -m "feat: migrate Tour GeneralTab to react-hook-form + yup"
```

---

## Task 8: Migrate Tour Itinerary Tab

**Files:**

- Create: `src/components/admin/tabs/ItineraryTab.form-utils.ts`
- Modify: `src/components/admin/tabs/ItineraryTab.tsx`

This is a complex form with nested dynamic arrays (days → items). Uses `useFieldArray` with nested field arrays.

- [ ] **Step 1: Create ItineraryTab.form-utils.ts**

Create `src/components/admin/tabs/ItineraryTab.form-utils.ts`:

```typescript
import * as yup from 'yup';
import {localizedString} from '@/utils/form-helpers';

const itineraryItemSchema = yup.object({
  time: yup.string().required('Time is required'),
  description: localizedString('Description'),
});

const itineraryDaySchema = yup.object({
  dayLabel: localizedString('Day label'),
  items: yup.array().of(itineraryItemSchema).defined(),
});

export const itinerarySchema = yup.object({
  days: yup
    .array()
    .of(itineraryDaySchema)
    .min(1, 'At least one day required')
    .defined(),
});

export type ItineraryFormData = yup.InferType<typeof itinerarySchema>;
```

- [ ] **Step 2: Rewrite ItineraryTab.tsx**

Replace `src/components/admin/tabs/ItineraryTab.tsx` entirely:

```tsx
'use client';

import {useState, useCallback} from 'react';
import {useForm, useFieldArray, useWatch} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import type {ItineraryDay} from '@/types';
import {EditableProvider} from '@/components/admin/EditableContext';
import {LocalePicker} from '@/components/admin/LocalePicker';
import {AdminIntlProvider} from '@/components/admin/AdminIntlProvider';
import {TourItinerary} from '@/components/tour-itinerary';
import {
  itinerarySchema,
  type ItineraryFormData,
} from './ItineraryTab.form-utils';

type ItineraryTabProps = {
  initialData: ItineraryDay[];
  onSave: (itinerary: ItineraryDay[]) => Promise<void>;
};

export function ItineraryTab({initialData, onSave}: ItineraryTabProps) {
  const [locale, setLocale] = useState<'en' | 'vi'>('en');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    control,
    setValue,
    formState: {isDirty},
    reset,
    getValues,
  } = useForm<ItineraryFormData>({
    resolver: yupResolver(itinerarySchema),
    defaultValues: {days: initialData},
  });

  const {
    fields: dayFields,
    append: appendDay,
    remove: removeDay,
  } = useFieldArray({control, name: 'days'});

  const watchedDays = useWatch({control, name: 'days'}) as ItineraryDay[];

  function handleAddDay() {
    appendDay({
      dayLabel: {
        en: `Day ${dayFields.length + 1}`,
        vi: `Ngày ${dayFields.length + 1}`,
      },
      items: [],
    });
  }

  function handleAddItem(dayIndex: number) {
    const currentItems = getValues(`days.${dayIndex}.items`);
    setValue(
      `days.${dayIndex}.items`,
      [
        ...currentItems,
        {time: '00:00', description: {en: 'New activity', vi: 'Hoạt động mới'}},
      ],
      {shouldDirty: true},
    );
  }

  function handleRemoveItem(dayIndex: number, itemIndex: number) {
    const currentItems = getValues(`days.${dayIndex}.items`);
    setValue(
      `days.${dayIndex}.items`,
      currentItems.filter((_, i) => i !== itemIndex),
      {shouldDirty: true},
    );
  }

  const handleFieldChange = useCallback(
    (path: string, value: string | number) => {
      // path: "itinerary.0.items.1.description.en"
      // Convert to RHF path: "days.0.items.1.description.en"
      const rhfPath = path.replace(/^itinerary\./, 'days.');
      setValue(
        rhfPath as keyof ItineraryFormData | `days.${number}.${string}`,
        value as never,
        {shouldDirty: true},
      );
    },
    [setValue],
  );

  const handleRemoveItemFromPreview = useCallback((path: string) => {
    // path: "itinerary.0.items.1"
    const parts = path.split('.');
    const dayIndex = Number(parts[1]);
    const itemIndex = Number(parts[3]);
    handleRemoveItem(dayIndex, itemIndex);
  }, []);

  async function handleSave() {
    setSaving(true);
    setSubmitError('');
    try {
      const data = getValues();
      await onSave(data.days);
      reset(data);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Top toolbar */}
      <div className="border-b border-border p-4 flex flex-wrap items-center gap-3">
        {/* Day chips */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {dayFields.map((field, dayIndex) => (
            <div
              key={field.id}
              className="inline-flex items-center gap-2 bg-surface-elevated rounded-lg px-3 py-1.5 border border-border type-label-sm"
            >
              <span className="text-on-surface font-medium">
                {watchedDays?.[dayIndex]?.dayLabel[locale] ||
                  `Day ${dayIndex + 1}`}
              </span>
              <span className="text-on-surface-secondary">
                ({watchedDays?.[dayIndex]?.items.length ?? 0})
              </span>
              <button
                type="button"
                onClick={() => handleAddItem(dayIndex)}
                className="text-primary hover:text-primary-light cursor-pointer"
                title="Add item"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => removeDay(dayIndex)}
                className="text-red-400 hover:text-red-300 cursor-pointer"
                title="Delete day"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddDay}
            className="type-label-sm text-primary hover:text-primary-light px-3 py-1.5 border border-dashed border-primary/40 rounded-lg cursor-pointer"
          >
            + Add Day
          </button>
        </div>

        {/* Right side: locale, status, save */}
        <div className="flex items-center gap-3">
          <LocalePicker value={locale} onChange={setLocale} />
          {submitError && (
            <span className="type-label-sm text-red-400">{submitError}</span>
          )}
          {isDirty && (
            <span className="type-label-sm text-amber-500">Unsaved</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="bg-primary hover:bg-primary-light text-on-primary px-4 py-1.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="flex-1 p-5 overflow-y-auto">
        <p className="type-label-sm text-on-surface-secondary mb-4">
          Click any text to edit inline. Use + to add items, × to remove days.
        </p>
        <AdminIntlProvider>
          <EditableProvider
            locale={locale}
            onFieldChange={handleFieldChange}
            onRemoveItem={handleRemoveItemFromPreview}
          >
            <TourItinerary itinerary={watchedDays ?? []} locale={locale} />
          </EditableProvider>
        </AdminIntlProvider>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | tail -5
```

Expected: successful build. If there are type errors with the dynamic `setValue` path, adjust the cast. The `setValue` with string paths may need `as any` — RHF's strict path typing can be tricky with deeply nested dynamic paths from the `EditableProvider`:

```typescript
setValue(rhfPath as any, value as any, {shouldDirty: true});
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/tabs/ItineraryTab.tsx src/components/admin/tabs/ItineraryTab.form-utils.ts
git commit -m "feat: migrate Tour ItineraryTab to react-hook-form + useFieldArray"
```

---

## Task 9: Migrate Tour Pricing Tab

**Files:**

- Create: `src/components/admin/tabs/PricingTab.form-utils.ts`
- Modify: `src/components/admin/tabs/PricingTab.tsx`

- [ ] **Step 1: Create PricingTab.form-utils.ts**

Create `src/components/admin/tabs/PricingTab.form-utils.ts`:

```typescript
import * as yup from 'yup';
import {localizedString} from '@/utils/form-helpers';

const pricingTierSchema = yup.object({
  label: localizedString('Label'),
  description: yup
    .object({en: yup.string().defined(), vi: yup.string().defined()})
    .optional(),
  price: yup
    .number()
    .min(0, 'Price must be positive')
    .required('Price is required'),
  minGroupSize: yup.number().optional(),
  maxGroupSize: yup.number().optional(),
});

const pricingGroupSchema = yup.object({
  type: yup
    .string()
    .oneOf(['group-size', 'vehicle'] as const)
    .required('Type is required'),
  label: localizedString('Group label'),
  icon: yup.string().optional(),
  tiers: yup.array().of(pricingTierSchema).defined(),
});

export const pricingSchema = yup.object({
  groups: yup.array().of(pricingGroupSchema).defined(),
});

export type PricingFormData = yup.InferType<typeof pricingSchema>;
```

- [ ] **Step 2: Rewrite PricingTab.tsx**

Replace `src/components/admin/tabs/PricingTab.tsx` entirely:

```tsx
'use client';

import {useState, useCallback} from 'react';
import {useForm, useFieldArray, useWatch} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import type {PricingGroup} from '@/types';
import {EditableProvider} from '@/components/admin/EditableContext';
import {LocalePicker} from '@/components/admin/LocalePicker';
import {AdminIntlProvider} from '@/components/admin/AdminIntlProvider';
import {TourPricing} from '@/components/tour-pricing';
import {pricingSchema, type PricingFormData} from './PricingTab.form-utils';

type PricingTabProps = {
  initialData: PricingGroup[];
  onSave: (pricingGroups: PricingGroup[]) => Promise<void>;
};

export function PricingTab({initialData, onSave}: PricingTabProps) {
  const [locale, setLocale] = useState<'en' | 'vi'>('en');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    control,
    setValue,
    getValues,
    formState: {isDirty},
    reset,
    register,
  } = useForm<PricingFormData>({
    resolver: yupResolver(pricingSchema),
    defaultValues: {groups: initialData},
  });

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({control, name: 'groups'});

  const watchedGroups = useWatch({control, name: 'groups'}) as PricingGroup[];

  function handleAddGroup() {
    appendGroup({
      type: 'vehicle' as const,
      label: {en: 'New Group', vi: 'Nhóm mới'},
      tiers: [],
    });
  }

  function handleAddTier(groupIndex: number) {
    const group = getValues(`groups.${groupIndex}`);
    const currentTiers = group.tiers;
    setValue(
      `groups.${groupIndex}.tiers`,
      [
        ...currentTiers,
        {
          label: {en: 'New Tier', vi: 'Mức mới'},
          price: 0,
          minGroupSize: group.type === 'group-size' ? 2 : undefined,
          maxGroupSize: group.type === 'group-size' ? 4 : undefined,
        },
      ],
      {shouldDirty: true},
    );
  }

  function handleRemoveTier(groupIndex: number, tierIndex: number) {
    const currentTiers = getValues(`groups.${groupIndex}.tiers`);
    setValue(
      `groups.${groupIndex}.tiers`,
      currentTiers.filter((_, i) => i !== tierIndex),
      {shouldDirty: true},
    );
  }

  const handleFieldChange = useCallback(
    (path: string, value: string | number) => {
      // EditableProvider paths use the raw array indices
      // e.g., "0.tiers.1.price" -> "groups.0.tiers.1.price"
      const rhfPath = `groups.${path}`;
      setValue(rhfPath as any, value as any, {shouldDirty: true});
    },
    [setValue],
  );

  async function handleSave() {
    setSaving(true);
    setSubmitError('');
    try {
      const data = getValues();
      await onSave(data.groups as PricingGroup[]);
      reset(data);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Top toolbar */}
      <div className="border-b border-border p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="type-title-sm text-on-surface font-semibold">
            Pricing Groups
          </span>
          <button
            type="button"
            onClick={handleAddGroup}
            className="type-label-sm text-primary hover:text-primary-light px-3 py-1.5 border border-dashed border-primary/40 rounded-lg cursor-pointer"
          >
            + Add Group
          </button>
        </div>
        <div className="flex items-center gap-3">
          <LocalePicker value={locale} onChange={setLocale} />
          {submitError && (
            <span className="type-label-sm text-red-400">{submitError}</span>
          )}
          {isDirty && (
            <span className="type-label-sm text-amber-500">Unsaved</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="bg-primary hover:bg-primary-light text-on-primary px-4 py-1.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Two-column: editor + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
        {/* Editor */}
        <div className="p-5 overflow-y-auto space-y-4 border-r border-border">
          {groupFields.length === 0 && (
            <p className="type-body-sm text-on-surface-secondary">
              No pricing groups yet. Click &quot;+ Add Group&quot; to start.
            </p>
          )}

          {groupFields.map((field, gIdx) => {
            const group = watchedGroups?.[gIdx];
            if (!group) return null;

            return (
              <div
                key={field.id}
                className="rounded-lg border border-border overflow-hidden"
              >
                {/* Group header */}
                <div className="bg-surface-elevated px-4 py-3 flex items-center gap-3">
                  <select
                    value={group.type}
                    onChange={(e) =>
                      setValue(
                        `groups.${gIdx}.type`,
                        e.target.value as 'vehicle' | 'group-size',
                        {shouldDirty: true},
                      )
                    }
                    className="px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
                  >
                    <option value="vehicle">Vehicle</option>
                    <option value="group-size">Group Size</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Icon (e.g. fa-motorcycle)"
                    {...register(`groups.${gIdx}.icon`)}
                    className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => removeGroup(gIdx)}
                    className="type-label-sm text-red-400 hover:text-red-300 cursor-pointer shrink-0"
                  >
                    Delete
                  </button>
                </div>

                {/* Group label */}
                <div className="px-4 py-2 border-b border-border">
                  <label className="type-label-sm text-on-surface-secondary">
                    Group Label ({locale.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={group.label[locale]}
                    onChange={(e) =>
                      setValue(
                        `groups.${gIdx}.label.${locale}`,
                        e.target.value,
                        {shouldDirty: true},
                      )
                    }
                    className="w-full mt-1 px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                  />
                </div>

                {/* Tiers table */}
                <div className="px-4 py-3">
                  {group.tiers.length > 0 && (
                    <div className="space-y-2">
                      {/* Column headers */}
                      <div
                        className={`grid gap-2 type-label-sm text-on-surface-secondary ${
                          group.type === 'group-size'
                            ? 'grid-cols-[1fr_80px_60px_60px_28px]'
                            : 'grid-cols-[1fr_80px_28px]'
                        }`}
                      >
                        <span>Label ({locale.toUpperCase()})</span>
                        <span>Price ($)</span>
                        {group.type === 'group-size' && (
                          <>
                            <span>Min</span>
                            <span>Max</span>
                          </>
                        )}
                        <span />
                      </div>

                      {/* Tier rows */}
                      {group.tiers.map((tier, tIdx) => (
                        <div
                          key={tIdx}
                          className={`grid gap-2 items-center ${
                            group.type === 'group-size'
                              ? 'grid-cols-[1fr_80px_60px_60px_28px]'
                              : 'grid-cols-[1fr_80px_28px]'
                          }`}
                        >
                          <input
                            type="text"
                            value={tier.label[locale]}
                            onChange={(e) =>
                              setValue(
                                `groups.${gIdx}.tiers.${tIdx}.label.${locale}`,
                                e.target.value,
                                {shouldDirty: true},
                              )
                            }
                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                          />
                          <input
                            type="number"
                            value={tier.price}
                            onChange={(e) =>
                              setValue(
                                `groups.${gIdx}.tiers.${tIdx}.price`,
                                Number(e.target.value),
                                {shouldDirty: true},
                              )
                            }
                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                          />
                          {group.type === 'group-size' && (
                            <>
                              <input
                                type="number"
                                placeholder="min"
                                value={tier.minGroupSize ?? ''}
                                onChange={(e) =>
                                  setValue(
                                    `groups.${gIdx}.tiers.${tIdx}.minGroupSize`,
                                    Number(e.target.value),
                                    {shouldDirty: true},
                                  )
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                              />
                              <input
                                type="number"
                                placeholder="max"
                                value={tier.maxGroupSize ?? ''}
                                onChange={(e) =>
                                  setValue(
                                    `groups.${gIdx}.tiers.${tIdx}.maxGroupSize`,
                                    Number(e.target.value),
                                    {shouldDirty: true},
                                  )
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                              />
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(gIdx, tIdx)}
                            className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors cursor-pointer type-label-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleAddTier(gIdx)}
                    className="type-label-sm text-primary hover:text-primary-light mt-2 cursor-pointer"
                  >
                    + Add Tier
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live preview */}
        <div className="p-5 overflow-y-auto bg-surface-alt/30">
          <p className="type-label-sm text-on-surface-secondary mb-4">
            Live preview — click prices or labels to edit inline
          </p>
          <AdminIntlProvider>
            <EditableProvider locale={locale} onFieldChange={handleFieldChange}>
              <TourPricing
                pricingGroups={(watchedGroups ?? []) as PricingGroup[]}
                locale={locale}
              />
            </EditableProvider>
          </AdminIntlProvider>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | tail -5
```

Expected: successful build.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/tabs/PricingTab.tsx src/components/admin/tabs/PricingTab.form-utils.ts
git commit -m "feat: migrate Tour PricingTab to react-hook-form + useFieldArray"
```

---

## Task 10: Migrate Destination Highlights

**Files:**

- Create: `src/components/admin/DestinationHighlights.form-utils.ts`
- Modify: `src/components/admin/DestinationHighlights.tsx`

This component is different — it saves each highlight individually to the API (not a batch save). We migrate the "add highlight" mini-form to RHF. The inline editing and deletion stay as direct API calls since they're not a traditional form submit flow.

- [ ] **Step 1: Create DestinationHighlights.form-utils.ts**

Create `src/components/admin/DestinationHighlights.form-utils.ts`:

```typescript
import * as yup from 'yup';
import {api} from '@/routes';

export const addHighlightSchema = yup.object({
  text: yup.string().trim().required('Highlight text is required'),
});

export type AddHighlightFormData = yup.InferType<typeof addHighlightSchema>;

export const addHighlightDefaults: AddHighlightFormData = {
  text: '',
};

export async function submitAddHighlight(
  data: AddHighlightFormData,
  destinationId: string,
  locale: 'en' | 'vi',
): Promise<{error?: string}> {
  const field = locale === 'en' ? 'textEn' : 'textVi';
  const {error} = await api.admin.highlights.create({
    destinationId,
    [field]: data.text,
  });
  if (error) return {error};
  return {};
}
```

- [ ] **Step 2: Rewrite DestinationHighlights.tsx**

Replace `src/components/admin/DestinationHighlights.tsx` entirely:

```tsx
'use client';

import {useState, useEffect, useCallback} from 'react';
import Image from 'next/image';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {ImageUploadField} from './ImageUploadField';
import {FormFieldError} from './FormFieldError';
import {api} from '@/routes';
import {
  addHighlightSchema,
  addHighlightDefaults,
  submitAddHighlight,
  type AddHighlightFormData,
} from './DestinationHighlights.form-utils';

type Highlight = {
  id: string;
  textEn: string;
  textVi: string;
  imageUrl: string | null;
};

type DestinationHighlightsProps = {
  destinationId: string;
  locale: 'en' | 'vi';
};

export function DestinationHighlights({
  destinationId,
  locale,
}: DestinationHighlightsProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  const textField = locale === 'en' ? 'textEn' : 'textVi';

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
    reset,
  } = useForm<AddHighlightFormData>({
    resolver: yupResolver(addHighlightSchema),
    defaultValues: addHighlightDefaults,
    shouldFocusError: true,
  });

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

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  async function onSubmitAdd(data: AddHighlightFormData) {
    const {error} = await submitAddHighlight(data, destinationId, locale);
    if (!error) {
      reset();
      await fetchHighlights();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this highlight?')) return;
    await api.admin.highlights.delete(id);
    await fetchHighlights();
  }

  async function handleUpdateText(
    id: string,
    field: 'textEn' | 'textVi',
    value: string,
  ) {
    await api.admin.highlights.update(id, {[field]: value});
    await fetchHighlights();
  }

  async function handleImageUpload(id: string, imageUrl: string) {
    await api.admin.highlights.update(id, {imageUrl});
    await fetchHighlights();
  }

  if (loading) {
    return (
      <p className="type-body-sm text-on-surface-secondary">
        Loading highlights...
      </p>
    );
  }

  return (
    <div>
      <h2 className="type-title-lg text-on-surface mb-4">
        Destination Highlights
      </h2>

      {/* Existing highlights */}
      <div className="space-y-3 mb-6">
        {highlights.map((h) => (
          <div
            key={h.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-elevated"
          >
            <div className="w-16 h-16 shrink-0">
              {h.imageUrl ? (
                <Image
                  src={h.imageUrl}
                  alt={h.textEn}
                  width={64}
                  height={64}
                  className="rounded object-cover w-16 h-16"
                />
              ) : (
                <div className="w-16 h-16 rounded bg-surface-alt flex items-center justify-center type-label-sm text-on-surface-secondary">
                  No img
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <input
                type="text"
                value={h[textField]}
                onBlur={(e) => {
                  if (e.target.value !== h[textField]) {
                    handleUpdateText(h.id, textField, e.target.value);
                  }
                }}
                onChange={(e) => {
                  setHighlights((prev) =>
                    prev.map((x) =>
                      x.id === h.id ? {...x, [textField]: e.target.value} : x,
                    ),
                  );
                }}
                className="w-full px-2 py-1 rounded border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                placeholder={
                  locale === 'en' ? 'English text' : 'Vietnamese text'
                }
              />
              <ImageUploadField
                entityType="destination"
                entityId={h.id}
                imageType="card"
                currentUrl={h.imageUrl ?? ''}
                onUploadComplete={(url) => handleImageUpload(h.id, url)}
                label=""
              />
            </div>
            <button
              type="button"
              onClick={() => handleDelete(h.id)}
              className="type-label-sm text-red-400 hover:text-red-300 shrink-0 cursor-pointer"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Add new */}
      <form
        onSubmit={handleSubmit(onSubmitAdd)}
        className="p-4 rounded-lg border border-dashed border-border"
      >
        <h3 className="type-title-sm text-on-surface mb-3">Add Highlight</h3>
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <input
              type="text"
              {...register('text')}
              placeholder={locale === 'en' ? 'English text' : 'Vietnamese text'}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
            />
            <FormFieldError message={errors.text?.message} />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | tail -5
```

Expected: successful build.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/DestinationHighlights.tsx src/components/admin/DestinationHighlights.form-utils.ts
git commit -m "feat: migrate DestinationHighlights add-form to react-hook-form + yup"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Full build check**

```bash
pnpm build
```

Expected: successful build with no type errors.

- [ ] **Step 2: Lint check**

```bash
pnpm lint
```

Expected: no new lint errors.

- [ ] **Step 3: Manual smoke test checklist**

Run `pnpm dev` and verify each migrated form:

1. Login modal — enter invalid credentials, see error. Enter valid credentials, modal closes.
2. Contact page — submit empty form, see inline errors. Fill in, submit succeeds.
3. Admin users — create user with short password, see error. Create with valid data, user appears in table.
4. Destination general — create new destination with missing slug, see error. Fill in slug, save succeeds.
5. Tour general tab — change fields, see "Unsaved changes". Save, indicator disappears.
6. Tour itinerary tab — add day, add item, edit inline, save. Remove items.
7. Tour pricing tab — add group, add tier, edit prices, save. Switch group types.
8. Destination highlights — add highlight with empty text, see error. Add with text, appears in list.

- [ ] **Step 4: Final commit if any fixes needed**

If smoke testing revealed issues, fix and commit:

```bash
git add -A
git commit -m "fix: address smoke test issues in form migration"
```
