# React Hook Form + Yup Migration

## Overview

Migrate all forms in the codebase from raw `useState` to `react-hook-form` + `yup` for structured form state management and validation. Establish a `form-utils.ts` co-location convention.

## Dependencies

- `react-hook-form` — form state management
- `@hookform/resolvers` — connects yup to RHF
- `yup` — schema validation

## CLAUDE.md Rule

Add to Code Style section:

> **Form convention:** Every component or page that contains a form must have a co-located `form-utils.ts` file. This file exports: Yup validation schema, form TypeScript type (inferred via `yup.InferType`), default values, and submit handler. Components handle only rendering and `useForm()` wiring.

## File Convention

Each form component gets a co-located `form-utils.ts`:

```
src/components/admin/
  LoginModal.tsx
  LoginModal.form-utils.ts

src/components/admin/tabs/
  GeneralTab.tsx
  GeneralTab.form-utils.ts

src/pages/
  contact.tsx
  contact.form-utils.ts
```

## form-utils.ts Standard Structure

Each file exports four things:

1. **Schema** — Yup validation schema
2. **Type** — `yup.InferType` of the schema
3. **Defaults** — default form values
4. **Submit handler** — async function handling API submission, returns `{ error?: string }`

```typescript
import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
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
  if (result?.error) return {error: 'Invalid credentials'};
  return {};
}
```

## Component Wiring Pattern

```typescript
import {useForm, useFieldArray} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {schema, defaults, submitFn, FormData} from './Component.form-utils';

const {
  register,
  handleSubmit,
  formState: {errors, isDirty},
  reset,
} = useForm<FormData>({
  resolver: yupResolver(schema),
  defaultValues: defaults,
  shouldFocusError: true,
});

const onSubmit = async (data: FormData) => {
  const {error} = await submitFn(data);
  if (error) {
    /* show error */
  } else {
    reset(data);
  } // reset dirty baseline after save
};
```

## Error Display

- Inline per-field errors below each invalid field
- Auto-focus first invalid field on submit (`shouldFocusError: true`)
- Reusable `FormFieldError` component at `src/components/admin/FormFieldError.tsx`

```tsx
type FormFieldErrorProps = {
  message?: string;
};

export function FormFieldError({message}: FormFieldErrorProps) {
  if (!message) return null;
  return <p className="text-red-500 text-sm mt-1">{message}</p>;
}
```

## Dirty Tracking

Use RHF's built-in `formState.isDirty`. Call `reset(savedValues)` after successful save to update the baseline. Eliminates all custom `JSON.stringify` comparison code.

## Shared Utilities

**`src/utils/form-helpers.ts`** — shared helpers used across multiple forms:

```typescript
const localizedString = (label: string) =>
  yup.object({
    en: yup.string().required(`${label} (EN) is required`),
    vi: yup.string().required(`${label} (VI) is required`),
  });
```

No generic form factory or wrapper abstraction. Each form owns its own utils.

## Dynamic Arrays

Itinerary, Pricing, and Destination Highlights use `useFieldArray` for add/remove/reorder of dynamic lists. Schema validates full nested structure.

```typescript
export const itinerarySchema = yup.object({
  days: yup
    .array()
    .of(
      yup.object({
        title: yup.string().required('Day title is required'),
        items: yup
          .array()
          .of(
            yup.object({
              description: yup.string().required('Description is required'),
            }),
          )
          .min(1, 'At least one item per day'),
      }),
    )
    .min(1, 'At least one day required'),
});
```

## Migration Scope

### In Scope (8 forms)

| Form                   | File                         | Complexity |
| ---------------------- | ---------------------------- | ---------- |
| Login Modal            | `LoginModal.tsx`             | Simple     |
| Contact Page           | `pages/contact.tsx`          | Simple     |
| Users Creation         | `pages/admin/users.tsx`      | Medium     |
| Destination General    | `DestinationGeneralForm.tsx` | Medium     |
| Tour General Tab       | `tabs/GeneralTab.tsx`        | Medium     |
| Tour Itinerary Tab     | `tabs/ItineraryTab.tsx`      | Complex    |
| Tour Pricing Tab       | `tabs/PricingTab.tsx`        | Complex    |
| Destination Highlights | `DestinationHighlights.tsx`  | Complex    |

### Out of Scope

- **StatusPicker, LocalePicker** — controlled pickers, not forms
- **HighlightsTab** — checkbox selection, not a form
- **TranslationEditor** — bulk key-value editor, doesn't fit form pattern
- **ImageUploadField** — file upload component, stays as-is

## Migration Details Per Form

### Login Modal (`LoginModal.tsx`)

- Extract email/password `useState` → `useForm` with `loginSchema`
- Move `signIn` call to `submitLogin` in form-utils
- Remove manual `error`, `loading` state → use RHF `formState` + local submission state

### Contact Page (`pages/contact.tsx`)

- Currently placeholder with no logic. Wire up `useForm` with name/email/message schema
- Submit handler will be a no-op stub (`console.log`) until a contact API route is built separately

### Users Creation (`pages/admin/users.tsx`)

- Extract `newUser` useState → `useForm` with `userSchema`
- Move API call to `submitCreateUser` in form-utils
- Yup handles `minLength(8)` on password

### Destination General (`DestinationGeneralForm.tsx`)

- Props-driven form → `useForm` with `defaultValues` from props
- Replace `onFieldChange` callback pattern with RHF `register`
- Parent passes initial data, form-utils owns schema + submit

### Tour General Tab (`tabs/GeneralTab.tsx`)

- Replace `updateField` useState pattern with `useForm`
- Remove `JSON.stringify` dirty comparison → `isDirty`
- `reset(savedData)` after successful save

### Tour Itinerary Tab (`tabs/ItineraryTab.tsx`)

- `useFieldArray` for days array, nested `useFieldArray` for items per day
- Replace `setNestedValue` helper entirely
- Schema validates full nested structure

### Tour Pricing Tab (`tabs/PricingTab.tsx`)

- `useFieldArray` for pricing groups and tiers
- Replace `setNestedValue` helper
- Schema handles group type discrimination (vehicle vs group-size)

### Destination Highlights (`DestinationHighlights.tsx`)

- `useFieldArray` for highlights list
- Inline editing controlled by RHF
- Move add/delete API calls to form-utils

## Approach

Big bang migration — all 8 forms in one pass. Single PR.
