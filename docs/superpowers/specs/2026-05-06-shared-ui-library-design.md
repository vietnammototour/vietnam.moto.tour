# Shared UI Component Library — Design Spec

## Overview

Extract reusable UI primitives into `src/components/ui/` with consistent APIs, Vitest + RTL tests, and migrate all existing consumers.

## Decisions

| Decision       | Choice                                                        | Rationale                                                  |
| -------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| Location       | `src/components/ui/`                                          | "ui" convention, flat alongside existing component folders |
| Structure      | `Component/index.ts` + `Component.tsx` + `Component.test.tsx` | Consistent, discoverable                                   |
| Form input API | Uncontrolled, accepts `...register()`                         | Matches existing react-hook-form pattern                   |
| Button API     | Single component, `variant` prop                              | Simpler than separate exports                              |
| Testing        | Vitest + React Testing Library                                | Modern, fast, Next.js compatible                           |
| Import style   | Barrel export from `@/components/ui`                          | Single clean import path                                   |

## Components

### 1. Button

```tsx
type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;
```

**Variants mapped from existing patterns:**

- `primary`: `bg-primary hover:bg-primary-light text-on-primary rounded-lg type-label-sm uppercase transition-colors`
- `secondary`: `border border-border text-on-surface-secondary hover:bg-surface-alt rounded-lg transition-colors`
- `danger`: `bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors`
- `ghost`: `text-on-surface-secondary hover:bg-surface-alt rounded-lg transition-colors`

All variants include `cursor-pointer` and `disabled:opacity-50`.

**Sizes:**

- `sm`: `px-3 py-1.5 text-sm`
- `md`: `px-4 py-2` (default)
- `lg`: `px-6 py-2.5`

### 2. TextInput

```tsx
type TextInputProps = {
  label?: string;
  error?: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>;
```

Uses `FormField` internally for label/error/hint rendering. Accepts `ref` via `forwardRef` for react-hook-form `register()` compatibility.

**Base classes:** `w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary`

### 3. Textarea

```tsx
type TextareaProps = {
  label?: string;
  error?: string;
  hint?: string;
  rows?: number;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;
```

Same pattern as TextInput. `forwardRef` for register compatibility. Default `rows={4}`.

### 4. NumberInput

```tsx
type NumberInputProps = {
  label?: string;
  error?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
} & InputHTMLAttributes<HTMLInputElement>;
```

Wrapper around TextInput with `type="number"` baked in. Passes through min/max/step as HTML attributes.

### 5. FormField

```tsx
type FormFieldProps = {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
};
```

Layout wrapper: renders label (with optional required marker), children (the input), hint text, and error message. Used internally by TextInput/Textarea/NumberInput, also available standalone for custom inputs.

**Label classes:** `type-label-sm text-on-surface`
**Error classes:** `text-red-500 text-sm mt-1`
**Hint classes:** `text-on-surface-secondary text-sm mt-1`

### 6. Modal

```tsx
type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  children: ReactNode;
  footer?: ReactNode;
};
```

**Behavior:**

- Portal-rendered via `createPortal` to `document.body`
- Backdrop click closes (calls `onClose`)
- Escape key closes
- Focus trap within modal when open
- Body scroll lock when open
- Framer Motion enter/exit animations (fade backdrop + scale content)

**Sizes:**

- `sm`: `max-w-sm`
- `md`: `max-w-lg` (default)
- `lg`: `max-w-2xl`
- `full`: `max-w-5xl`

### 7. Tabs

```tsx
type TabItem = {
  key: string;
  label: string;
  disabled?: boolean;
};

type TabsProps = {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  children: ReactNode;
};

type TabPanelProps = {
  tabKey: string;
  children: ReactNode;
};
```

**Behavior:**

- Renders tab bar with active indicator
- Only the active `TabPanel` is rendered (unmounts inactive panels)
- Disabled tabs are visually muted and non-clickable
- Keyboard navigation (arrow keys) between tabs

**Classes:** Tab bar uses border-bottom pattern. Active tab gets `border-primary text-primary`. Disabled gets `opacity-50 cursor-not-allowed`.

### 8. SegmentedControl

```tsx
type SegmentedControlProps<T extends string> = {
  options: {value: T; label: string}[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
};
```

**Replaces:** LocalePicker, StatusPicker button-group pattern.

**Rendering:** Horizontal button group with shared border. Selected option gets `bg-primary text-on-primary`. Unselected gets `bg-surface text-on-surface-secondary hover:bg-surface-alt`.

### 9. Badge

```tsx
type BadgeProps = {
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  children: ReactNode;
};
```

**Variant colors:**

- `info`: `bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`
- `success`: `bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`
- `warning`: `bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`
- `danger`: `bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`
- `neutral`: `bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`

### 10. ImageUpload

```tsx
type ImageUploadProps = {
  value?: string;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  accept?: string;
  maxSize?: number;
  preview?: boolean;
  compact?: boolean;
  error?: string;
  label?: string;
};
```

**Behavior:**

- Drag-and-drop zone OR click-to-browse
- Shows current image preview when `value` is set
- Remove button calls `onRemove`
- File size validation against `maxSize`
- Compact mode: smaller preview, inline layout
- Error display for validation failures

## File Structure

```
src/components/ui/
├── index.ts
├── Button/
│   ├── index.ts
│   ├── Button.tsx
│   └── Button.test.tsx
├── TextInput/
│   ├── index.ts
│   ├── TextInput.tsx
│   └── TextInput.test.tsx
├── Textarea/
│   ├── index.ts
│   ├── Textarea.tsx
│   └── Textarea.test.tsx
├── NumberInput/
│   ├── index.ts
│   ├── NumberInput.tsx
│   └── NumberInput.test.tsx
├── FormField/
│   ├── index.ts
│   ├── FormField.tsx
│   └── FormField.test.tsx
├── Modal/
│   ├── index.ts
│   ├── Modal.tsx
│   └── Modal.test.tsx
├── Tabs/
│   ├── index.ts
│   ├── Tabs.tsx
│   ├── TabPanel.tsx
│   └── Tabs.test.tsx
├── SegmentedControl/
│   ├── index.ts
│   ├── SegmentedControl.tsx
│   └── SegmentedControl.test.tsx
├── Badge/
│   ├── index.ts
│   ├── Badge.tsx
│   └── Badge.test.tsx
└── ImageUpload/
    ├── index.ts
    ├── ImageUpload.tsx
    └── ImageUpload.test.tsx
```

## Migration Plan

### Phase 1: Setup

- Install dev deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@vitejs/plugin-react`
- Create `vitest.config.ts` with React plugin, path aliases, jsdom environment
- Create `src/test/setup.ts` for RTL matchers
- Add `"test": "vitest"` and `"test:run": "vitest run"` to package.json scripts

### Phase 2: Build Components (order matters — dependencies first)

1. FormField (no deps)
2. Button (no deps)
3. Badge (no deps)
4. TextInput (depends on FormField)
5. Textarea (depends on FormField)
6. NumberInput (depends on TextInput)
7. SegmentedControl (no deps)
8. Modal (no deps)
9. Tabs + TabPanel (no deps)
10. ImageUpload (depends on Button)
11. Barrel `index.ts`

### Phase 3: Migrate Consumers

Each migration is a file-by-file replacement:

| Consumer                           | Components replaced                                   |
| ---------------------------------- | ----------------------------------------------------- |
| `admin/LoginModal.tsx`             | TextInput, Button, Modal                              |
| `admin/tabs/GeneralTab.tsx`        | TextInput, Textarea, NumberInput, Button, ImageUpload |
| `admin/tabs/ItineraryTab.tsx`      | TextInput, Button                                     |
| `admin/tabs/PricingTab.tsx`        | NumberInput, TextInput, Button                        |
| `admin/tabs/HighlightsTab.tsx`     | TextInput, Textarea, Button                           |
| `admin/DestinationGeneralForm.tsx` | TextInput, Textarea, Button                           |
| `admin/DestinationHighlights.tsx`  | TextInput, Textarea, Button                           |
| `admin/FormFieldError.tsx`         | DELETE — replaced by FormField                        |
| `admin/StatusPicker.tsx`           | Refactor to use SegmentedControl                      |
| `admin/LocalePicker.tsx`           | Refactor to use SegmentedControl                      |
| `admin/TourEditTabs.tsx`           | Tabs, TabPanel                                        |
| `admin/DestinationEditTabs.tsx`    | Tabs, TabPanel                                        |
| `admin/ImageUploadField.tsx`       | DELETE — replaced by ImageUpload                      |
| `video-modal/index.tsx`            | Modal                                                 |
| `scroll-to-top/index.tsx`          | Button (iconOnly)                                     |
| `admin-status-badge.tsx`           | Badge                                                 |

### Phase 4: Cleanup & Documentation

- Remove dead code and unused imports
- Update CLAUDE.md with shared library section
- Run `pnpm build` to verify no regressions
- Run `pnpm lint` to verify no lint errors
- Run `pnpm test:run` to verify all tests pass

## CLAUDE.md Addition

```markdown
### Shared UI Components

Reusable primitives live in `src/components/ui/`. Each component follows:

- `ComponentName/index.ts` — re-export
- `ComponentName/ComponentName.tsx` — implementation
- `ComponentName/ComponentName.test.tsx` — Vitest + RTL tests

Import via `@/components/ui`. All form inputs accept react-hook-form `register()` spread.
Available: Button, TextInput, Textarea, NumberInput, FormField, Modal, Tabs, TabPanel, SegmentedControl, Badge, ImageUpload.

Run tests: `pnpm test` (watch) or `pnpm test:run` (CI).
```

## Testing Strategy

Per CLAUDE.md: tests verify **behavior, content, structure** — never styling.

Each component test covers:

- **Renders correctly** — expected elements present in DOM
- **Props work** — variants/sizes/disabled reflected in attributes or aria
- **Events fire** — onClick, onChange, onClose called with correct args
- **Accessibility** — proper roles, aria-labels, keyboard interaction
- **Edge cases** — loading state, disabled state, error state, empty state

No assertions on CSS classes, inline styles, or computed styles.
