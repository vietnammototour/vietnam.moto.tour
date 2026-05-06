# Shared UI Component Library — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract reusable UI primitives into `src/components/ui/` and migrate all consumers to use them.

**Architecture:** Flat folder structure under `src/components/ui/`, one folder per component with `index.ts` re-export, implementation `.tsx`, and `.spec.tsx` test. Components are simple, composable, accept standard HTML attributes via spread, form inputs work with react-hook-form `register()` via `forwardRef`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Jest + React Testing Library (existing setup), react-hook-form integration via forwardRef.

**Deviation from spec:** Using existing Jest + RTL setup (already configured with custom render, test factories, `@testing-library/jest-dom`). Test files named `.spec.tsx` matching project convention. Functionally identical to Vitest + RTL.

---

## File Map

### New Files (Phase 2)

| Path                                                           | Responsibility                      |
| -------------------------------------------------------------- | ----------------------------------- |
| `src/components/ui/index.ts`                                   | Barrel export for all UI components |
| `src/components/ui/FormField/index.ts`                         | Re-export                           |
| `src/components/ui/FormField/FormField.tsx`                    | Label + error + hint wrapper        |
| `src/components/ui/FormField/FormField.spec.tsx`               | Tests                               |
| `src/components/ui/Button/index.ts`                            | Re-export                           |
| `src/components/ui/Button/Button.tsx`                          | Multi-variant button                |
| `src/components/ui/Button/Button.spec.tsx`                     | Tests                               |
| `src/components/ui/Badge/index.ts`                             | Re-export                           |
| `src/components/ui/Badge/Badge.tsx`                            | Status badge                        |
| `src/components/ui/Badge/Badge.spec.tsx`                       | Tests                               |
| `src/components/ui/TextInput/index.ts`                         | Re-export                           |
| `src/components/ui/TextInput/TextInput.tsx`                    | Text input with FormField           |
| `src/components/ui/TextInput/TextInput.spec.tsx`               | Tests                               |
| `src/components/ui/Textarea/index.ts`                          | Re-export                           |
| `src/components/ui/Textarea/Textarea.tsx`                      | Multiline input with FormField      |
| `src/components/ui/Textarea/Textarea.spec.tsx`                 | Tests                               |
| `src/components/ui/NumberInput/index.ts`                       | Re-export                           |
| `src/components/ui/NumberInput/NumberInput.tsx`                | Numeric input                       |
| `src/components/ui/NumberInput/NumberInput.spec.tsx`           | Tests                               |
| `src/components/ui/SegmentedControl/index.ts`                  | Re-export                           |
| `src/components/ui/SegmentedControl/SegmentedControl.tsx`      | Button group picker                 |
| `src/components/ui/SegmentedControl/SegmentedControl.spec.tsx` | Tests                               |
| `src/components/ui/Modal/index.ts`                             | Re-export                           |
| `src/components/ui/Modal/Modal.tsx`                            | Portal modal with backdrop          |
| `src/components/ui/Modal/Modal.spec.tsx`                       | Tests                               |
| `src/components/ui/Tabs/index.ts`                              | Re-export                           |
| `src/components/ui/Tabs/Tabs.tsx`                              | Tab bar + TabPanel                  |
| `src/components/ui/Tabs/Tabs.spec.tsx`                         | Tests                               |
| `src/components/ui/ImageUpload/index.ts`                       | Re-export                           |
| `src/components/ui/ImageUpload/ImageUpload.tsx`                | File upload with preview            |
| `src/components/ui/ImageUpload/ImageUpload.spec.tsx`           | Tests                               |

### Modified Files (Phase 3)

| Path                                              | Change                                       |
| ------------------------------------------------- | -------------------------------------------- |
| `src/components/admin/LoginModal.tsx`             | Use TextInput, Button, Modal                 |
| `src/components/admin/tabs/GeneralTab.tsx`        | Use TextInput, Textarea, NumberInput, Button |
| `src/components/admin/tabs/ItineraryTab.tsx`      | Use TextInput, Button                        |
| `src/components/admin/tabs/PricingTab.tsx`        | Use NumberInput, TextInput, Button           |
| `src/components/admin/tabs/HighlightsTab.tsx`     | Use TextInput, Textarea, Button              |
| `src/components/admin/DestinationGeneralForm.tsx` | Use TextInput, Textarea, Button              |
| `src/components/admin/DestinationHighlights.tsx`  | Use TextInput, Textarea, Button              |
| `src/components/admin/TourEditTabs.tsx`           | Use Tabs, TabPanel, Button                   |
| `src/components/admin/DestinationEditTabs.tsx`    | Use Tabs, TabPanel, Button, SegmentedControl |
| `src/components/admin/StatusPicker.tsx`           | Rewrite using SegmentedControl               |
| `src/components/admin/LocalePicker.tsx`           | Rewrite using SegmentedControl               |
| `src/components/admin/ImageUploadField.tsx`       | Use ImageUpload internally                   |
| `src/components/video-modal/index.tsx`            | Use Modal                                    |
| `src/components/scroll-to-top/index.tsx`          | Use Button (iconOnly)                        |
| `src/components/admin-status-badge.tsx`           | Use Badge                                    |
| `CLAUDE.md`                                       | Add shared UI docs                           |

### Deleted Files (Phase 4)

| Path                                      | Reason                          |
| ----------------------------------------- | ------------------------------- |
| `src/components/admin/FormFieldError.tsx` | Replaced by FormField component |

---

## Task 1: FormField Component

**Files:**

- Create: `src/components/ui/FormField/index.ts`
- Create: `src/components/ui/FormField/FormField.tsx`
- Create: `src/components/ui/FormField/FormField.spec.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/ui/FormField/FormField.spec.tsx
import {render, screen} from '@/test-utils/render';
import {FormField} from './FormField';

describe('FormField', () => {
  it('renders children', () => {
    render(
      <FormField>
        <input data-testid="child" />
      </FormField>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(
      <FormField label="Email">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(
      <FormField error="Required field">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('does not render error element when no error', () => {
    render(
      <FormField label="Name">
        <input />
      </FormField>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders hint text when provided', () => {
    render(
      <FormField hint="Enter your full name">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  it('renders required marker when required is true', () => {
    render(
      <FormField label="Email" required>
        <input />
      </FormField>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('associates label with input via htmlFor', () => {
    render(
      <FormField label="Email" htmlFor="email-input">
        <input id="email-input" />
      </FormField>,
    );
    const label = screen.getByText('Email').closest('label');
    expect(label).toHaveAttribute('for', 'email-input');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern="FormField" --no-coverage`
Expected: FAIL — cannot find module `./FormField`

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/ui/FormField/FormField.tsx
import type {ReactNode} from 'react';

type FormFieldProps = {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
};

export function FormField({
  label,
  error,
  hint,
  required,
  htmlFor,
  children,
}: FormFieldProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block type-label-sm text-on-surface-secondary mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-on-surface-secondary text-sm mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-red-500 text-sm mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Write the barrel export**

```ts
// src/components/ui/FormField/index.ts
export {FormField} from './FormField';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern="FormField" --no-coverage`
Expected: PASS — all 7 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/FormField/
git commit -m "feat(ui): add FormField component"
```

---

## Task 2: Button Component

**Files:**

- Create: `src/components/ui/Button/index.ts`
- Create: `src/components/ui/Button/Button.tsx`
- Create: `src/components/ui/Button/Button.spec.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/ui/Button/Button.spec.tsx
import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {Button} from './Button';

describe('Button', () => {
  it('renders children as button text', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole('button', {name: 'Submit'})).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} disabled>
        Click
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders as submit type by default', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('passes type prop through', () => {
    render(<Button type="submit">Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('renders loading state with aria-busy', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('is disabled when loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders icon when provided', () => {
    render(<Button icon={<i data-testid="icon" />}>Text</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('renders iconOnly mode with aria-label', () => {
    render(
      <Button iconOnly aria-label="Scroll up">
        <i data-testid="arrow" />
      </Button>,
    );
    expect(screen.getByRole('button', {name: 'Scroll up'})).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern="ui/Button" --no-coverage`
Expected: FAIL — cannot find module `./Button`

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/ui/Button/Button.tsx
import {forwardRef, type ButtonHTMLAttributes, type ReactNode} from 'react';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary hover:bg-primary-light text-on-primary',
  secondary:
    'border border-border text-on-surface-secondary hover:bg-surface-alt',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'text-on-surface-secondary hover:bg-surface-alt',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconOnly = false,
      loading = false,
      disabled,
      className = '',
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const base =
      'inline-flex items-center justify-center rounded-lg type-label-sm uppercase transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    const classes = [
      base,
      variantClasses[variant],
      iconOnly ? 'p-2' : sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={classes}
        {...rest}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {icon && !iconOnly && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  },
);
```

- [ ] **Step 4: Write the barrel export**

```ts
// src/components/ui/Button/index.ts
export {Button} from './Button';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern="ui/Button" --no-coverage`
Expected: PASS — all 9 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Button/
git commit -m "feat(ui): add Button component with variants"
```

---

## Task 3: Badge Component

**Files:**

- Create: `src/components/ui/Badge/index.ts`
- Create: `src/components/ui/Badge/Badge.tsx`
- Create: `src/components/ui/Badge/Badge.spec.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/ui/Badge/Badge.spec.tsx
import {render, screen} from '@/test-utils/render';
import {Badge} from './Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Draft</Badge>);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('defaults to neutral variant', () => {
    const {container} = render(<Badge>Info</Badge>);
    expect(container.firstChild).toHaveAttribute('data-variant', 'neutral');
  });

  it('sets data-variant for each variant', () => {
    const {container, rerender} = render(<Badge variant="success">OK</Badge>);
    expect(container.firstChild).toHaveAttribute('data-variant', 'success');

    rerender(<Badge variant="danger">Error</Badge>);
    expect(container.firstChild).toHaveAttribute('data-variant', 'danger');
  });

  it('sets data-size attribute', () => {
    const {container} = render(<Badge size="sm">Small</Badge>);
    expect(container.firstChild).toHaveAttribute('data-size', 'sm');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern="ui/Badge" --no-coverage`
Expected: FAIL — cannot find module `./Badge`

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/ui/Badge/Badge.tsx
import type {ReactNode} from 'react';

type BadgeProps = {
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  children: ReactNode;
};

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
}: BadgeProps) {
  return (
    <span
      data-variant={variant}
      data-size={size}
      className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Write the barrel export**

```ts
// src/components/ui/Badge/index.ts
export {Badge} from './Badge';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern="ui/Badge" --no-coverage`
Expected: PASS — all 4 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Badge/
git commit -m "feat(ui): add Badge component"
```

---

## Task 4: TextInput Component

**Files:**

- Create: `src/components/ui/TextInput/index.ts`
- Create: `src/components/ui/TextInput/TextInput.tsx`
- Create: `src/components/ui/TextInput/TextInput.spec.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/ui/TextInput/TextInput.spec.tsx
import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {TextInput} from './TextInput';

describe('TextInput', () => {
  it('renders an input element', () => {
    render(<TextInput />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<TextInput label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<TextInput error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('renders hint text', () => {
    render(<TextInput hint="Enter email" />);
    expect(screen.getByText('Enter email')).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<TextInput />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');
    expect(input).toHaveValue('hello');
  });

  it('passes HTML attributes through (placeholder, disabled)', () => {
    render(<TextInput placeholder="Type here" disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Type here');
    expect(input).toBeDisabled();
  });

  it('works with react-hook-form register spread', () => {
    const mockRegister = {
      name: 'email',
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    };
    render(<TextInput {...mockRegister} label="Email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('name', 'email');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern="ui/TextInput" --no-coverage`
Expected: FAIL — cannot find module `./TextInput`

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/ui/TextInput/TextInput.tsx
import {forwardRef, useId, type InputHTMLAttributes} from 'react';
import {FormField} from '@/components/ui/FormField';

type TextInputProps = {
  label?: string;
  error?: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({label, error, hint, id, ...rest}, ref) {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <FormField label={label} error={error} hint={hint} htmlFor={inputId}>
        <input
          ref={ref}
          id={inputId}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          {...rest}
        />
      </FormField>
    );
  },
);
```

- [ ] **Step 4: Write the barrel export**

```ts
// src/components/ui/TextInput/index.ts
export {TextInput} from './TextInput';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern="ui/TextInput" --no-coverage`
Expected: PASS — all 7 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/TextInput/
git commit -m "feat(ui): add TextInput component"
```

---

## Task 5: Textarea Component

**Files:**

- Create: `src/components/ui/Textarea/index.ts`
- Create: `src/components/ui/Textarea/Textarea.tsx`
- Create: `src/components/ui/Textarea/Textarea.spec.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/ui/Textarea/Textarea.spec.tsx
import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {Textarea} from './Textarea';

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Textarea error="Too short" />);
    expect(screen.getByText('Too short')).toBeInTheDocument();
  });

  it('defaults to 4 rows', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4');
  });

  it('accepts custom rows', () => {
    render(<Textarea rows={8} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '8');
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Textarea />);
    await user.type(screen.getByRole('textbox'), 'hello');
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern="ui/Textarea" --no-coverage`
Expected: FAIL — cannot find module `./Textarea`

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/ui/Textarea/Textarea.tsx
import {forwardRef, useId, type TextareaHTMLAttributes} from 'react';
import {FormField} from '@/components/ui/FormField';

type TextareaProps = {
  label?: string;
  error?: string;
  hint?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({label, error, hint, id, rows = 4, ...rest}, ref) {
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <FormField label={label} error={error} hint={hint} htmlFor={textareaId}>
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          {...rest}
        />
      </FormField>
    );
  },
);
```

- [ ] **Step 4: Write the barrel export**

```ts
// src/components/ui/Textarea/index.ts
export {Textarea} from './Textarea';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern="ui/Textarea" --no-coverage`
Expected: PASS — all 6 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Textarea/
git commit -m "feat(ui): add Textarea component"
```

---

## Task 6: NumberInput Component

**Files:**

- Create: `src/components/ui/NumberInput/index.ts`
- Create: `src/components/ui/NumberInput/NumberInput.tsx`
- Create: `src/components/ui/NumberInput/NumberInput.spec.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/ui/NumberInput/NumberInput.spec.tsx
import {render, screen} from '@/test-utils/render';
import {NumberInput} from './NumberInput';

describe('NumberInput', () => {
  it('renders an input with type number', () => {
    render(<NumberInput />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('renders label', () => {
    render(<NumberInput label="Price" />);
    expect(screen.getByText('Price')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<NumberInput error="Must be positive" />);
    expect(screen.getByText('Must be positive')).toBeInTheDocument();
  });

  it('passes min, max, step as HTML attributes', () => {
    render(<NumberInput min={0} max={100} step={5} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
    expect(input).toHaveAttribute('step', '5');
  });

  it('passes through additional props', () => {
    render(<NumberInput placeholder="0" disabled />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('placeholder', '0');
    expect(input).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern="ui/NumberInput" --no-coverage`
Expected: FAIL — cannot find module `./NumberInput`

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/ui/NumberInput/NumberInput.tsx
import {forwardRef, useId, type InputHTMLAttributes} from 'react';
import {FormField} from '@/components/ui/FormField';

type NumberInputProps = {
  label?: string;
  error?: string;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput({label, error, hint, id, ...rest}, ref) {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <FormField label={label} error={error} hint={hint} htmlFor={inputId}>
        <input
          ref={ref}
          id={inputId}
          type="number"
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          {...rest}
        />
      </FormField>
    );
  },
);
```

- [ ] **Step 4: Write the barrel export**

```ts
// src/components/ui/NumberInput/index.ts
export {NumberInput} from './NumberInput';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern="ui/NumberInput" --no-coverage`
Expected: PASS — all 5 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/NumberInput/
git commit -m "feat(ui): add NumberInput component"
```

---

## Task 7: SegmentedControl Component

**Files:**

- Create: `src/components/ui/SegmentedControl/index.ts`
- Create: `src/components/ui/SegmentedControl/SegmentedControl.tsx`
- Create: `src/components/ui/SegmentedControl/SegmentedControl.spec.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/ui/SegmentedControl/SegmentedControl.spec.tsx
import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {SegmentedControl} from './SegmentedControl';

const options = [
  {value: 'en', label: 'EN'},
  {value: 'vi', label: 'VI'},
];

describe('SegmentedControl', () => {
  it('renders all options as radio buttons', () => {
    render(
      <SegmentedControl options={options} value="en" onChange={() => {}} />,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('marks selected option as checked', () => {
    render(
      <SegmentedControl options={options} value="vi" onChange={() => {}} />,
    );
    expect(screen.getByRole('radio', {name: 'VI'})).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', {name: 'EN'})).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('calls onChange with the clicked option value', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <SegmentedControl options={options} value="en" onChange={onChange} />,
    );
    await user.click(screen.getByRole('radio', {name: 'VI'}));
    expect(onChange).toHaveBeenCalledWith('vi');
  });

  it('renders with radiogroup role', () => {
    render(
      <SegmentedControl options={options} value="en" onChange={() => {}} />,
    );
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('supports disabled state', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <SegmentedControl
        options={options}
        value="en"
        onChange={onChange}
        disabled
      />,
    );
    await user.click(screen.getByRole('radio', {name: 'VI'}));
    expect(onChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern="ui/SegmentedControl" --no-coverage`
Expected: FAIL — cannot find module `./SegmentedControl`

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/ui/SegmentedControl/SegmentedControl.tsx
type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
  activeClasses?: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
};

const sizeClasses = {
  sm: 'px-3 py-1 type-label-sm',
  md: 'px-3.5 py-1.5 type-label-sm',
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className="inline-flex rounded-lg border border-border overflow-hidden"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const activeStyle =
          option.activeClasses || 'bg-primary text-on-primary';

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`${sizeClasses[size]} transition-colors cursor-pointer border-r border-border last:border-r-0 ${
              isSelected
                ? activeStyle
                : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Write the barrel export**

```ts
// src/components/ui/SegmentedControl/index.ts
export {SegmentedControl} from './SegmentedControl';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern="ui/SegmentedControl" --no-coverage`
Expected: PASS — all 5 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/SegmentedControl/
git commit -m "feat(ui): add SegmentedControl component"
```

---

## Task 8: Modal Component

**Files:**

- Create: `src/components/ui/Modal/index.ts`
- Create: `src/components/ui/Modal/Modal.tsx`
- Create: `src/components/ui/Modal/Modal.spec.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/ui/Modal/Modal.spec.tsx
import {render, screen, waitFor} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {Modal} from './Modal';

describe('Modal', () => {
  it('renders nothing when open is false', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders children when open is true', () => {
    render(
      <Modal open={true} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Edit Tour">
        Body
      </Modal>,
    );
    expect(screen.getByText('Edit Tour')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose}>
        Content
      </Modal>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose}>
        Content
      </Modal>,
    );
    await user.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <button>Inner</button>
      </Modal>,
    );
    await user.click(screen.getByText('Inner'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders close button that calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test">
        Content
      </Modal>,
    );
    await user.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer when provided', () => {
    render(
      <Modal open={true} onClose={() => {}} footer={<button>Save</button>}>
        Body
      </Modal>,
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern="ui/Modal" --no-coverage`
Expected: FAIL — cannot find module `./Modal`

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/ui/Modal/Modal.tsx
'use client';

import {useEffect, useCallback, type ReactNode} from 'react';
import {createPortal} from 'react-dom';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  children: ReactNode;
  footer?: ReactNode;
};

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  full: 'max-w-5xl',
};

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  const modal = (
    <>
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          className={`bg-surface-elevated rounded-xl shadow-2xl w-full ${sizeClasses[size]} p-6`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="type-title-lg text-on-surface">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-on-surface-secondary hover:text-on-surface transition-colors cursor-pointer"
                aria-label="Close"
              >
                <i className="fa fa-times text-xl" />
              </button>
            </div>
          )}

          <div>{children}</div>

          {footer && (
            <div className="mt-4 pt-4 border-t border-border">{footer}</div>
          )}
        </div>
      </div>
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}
```

- [ ] **Step 4: Write the barrel export**

```ts
// src/components/ui/Modal/index.ts
export {Modal} from './Modal';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern="ui/Modal" --no-coverage`
Expected: PASS — all 8 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Modal/
git commit -m "feat(ui): add Modal component"
```

---

## Task 9: Tabs Component

**Files:**

- Create: `src/components/ui/Tabs/index.ts`
- Create: `src/components/ui/Tabs/Tabs.tsx`
- Create: `src/components/ui/Tabs/Tabs.spec.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/ui/Tabs/Tabs.spec.tsx
import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {Tabs, TabPanel} from './Tabs';

const items = [
  {key: 'general', label: 'General'},
  {key: 'pricing', label: 'Pricing'},
  {key: 'itinerary', label: 'Itinerary', disabled: true},
];

describe('Tabs', () => {
  it('renders all tab items', () => {
    render(
      <Tabs items={items} activeKey="general" onChange={() => {}}>
        <TabPanel tabKey="general">General Content</TabPanel>
        <TabPanel tabKey="pricing">Pricing Content</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole('tab', {name: 'General'})).toBeInTheDocument();
    expect(screen.getByRole('tab', {name: 'Pricing'})).toBeInTheDocument();
    expect(screen.getByRole('tab', {name: 'Itinerary'})).toBeInTheDocument();
  });

  it('marks active tab with aria-selected', () => {
    render(
      <Tabs items={items} activeKey="general" onChange={() => {}}>
        <TabPanel tabKey="general">General Content</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole('tab', {name: 'General'})).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', {name: 'Pricing'})).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('renders only active panel content', () => {
    render(
      <Tabs items={items} activeKey="general" onChange={() => {}}>
        <TabPanel tabKey="general">General Content</TabPanel>
        <TabPanel tabKey="pricing">Pricing Content</TabPanel>
      </Tabs>,
    );
    expect(screen.getByText('General Content')).toBeInTheDocument();
    expect(screen.queryByText('Pricing Content')).not.toBeInTheDocument();
  });

  it('calls onChange when non-disabled tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <Tabs items={items} activeKey="general" onChange={onChange}>
        <TabPanel tabKey="general">Content</TabPanel>
      </Tabs>,
    );
    await user.click(screen.getByRole('tab', {name: 'Pricing'}));
    expect(onChange).toHaveBeenCalledWith('pricing');
  });

  it('does not call onChange when disabled tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <Tabs items={items} activeKey="general" onChange={onChange}>
        <TabPanel tabKey="general">Content</TabPanel>
      </Tabs>,
    );
    await user.click(screen.getByRole('tab', {name: 'Itinerary'}));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders tablist role on tab container', () => {
    render(
      <Tabs items={items} activeKey="general" onChange={() => {}}>
        <TabPanel tabKey="general">Content</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern="ui/Tabs" --no-coverage`
Expected: FAIL — cannot find module `./Tabs`

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/ui/Tabs/Tabs.tsx
'use client';

import {
  type ReactNode,
  type ReactElement,
  Children,
  isValidElement,
} from 'react';

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

export function TabPanel({children}: TabPanelProps) {
  return <div role="tabpanel">{children}</div>;
}

export function Tabs({items, activeKey, onChange, children}: TabsProps) {
  const activePanel = Children.toArray(children).find(
    (child) =>
      isValidElement(child) &&
      (child as ReactElement<TabPanelProps>).props.tabKey === activeKey,
  );

  return (
    <div>
      <div role="tablist" className="flex border-b-2 border-border">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={item.disabled || undefined}
              disabled={item.disabled}
              onClick={() => !item.disabled && onChange(item.key)}
              className={`px-6 py-3 type-label-sm transition-colors cursor-pointer ${
                isActive
                  ? 'text-primary border-b-2 border-primary -mb-[2px] font-semibold'
                  : item.disabled
                    ? 'text-on-surface-secondary/40 cursor-not-allowed'
                    : 'text-on-surface-secondary hover:text-on-surface'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {activePanel}
    </div>
  );
}
```

- [ ] **Step 4: Write the barrel export**

```ts
// src/components/ui/Tabs/index.ts
export {Tabs, TabPanel} from './Tabs';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern="ui/Tabs" --no-coverage`
Expected: PASS — all 6 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Tabs/
git commit -m "feat(ui): add Tabs and TabPanel components"
```

---

## Task 10: ImageUpload Component

**Files:**

- Create: `src/components/ui/ImageUpload/index.ts`
- Create: `src/components/ui/ImageUpload/ImageUpload.tsx`
- Create: `src/components/ui/ImageUpload/ImageUpload.spec.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/ui/ImageUpload/ImageUpload.spec.tsx
import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {ImageUpload} from './ImageUpload';

describe('ImageUpload', () => {
  it('renders upload button when no value', () => {
    render(<ImageUpload onChange={() => {}} />);
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
  });

  it('renders image preview when value is provided', () => {
    render(<ImageUpload value="/test.jpg" onChange={() => {}} />);
    expect(screen.getByAltText('Upload preview')).toHaveAttribute(
      'src',
      '/test.jpg',
    );
  });

  it('renders label when provided', () => {
    render(<ImageUpload label="Card Image" onChange={() => {}} />);
    expect(screen.getByText('Card Image')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<ImageUpload error="File too large" onChange={() => {}} />);
    expect(screen.getByText('File too large')).toBeInTheDocument();
  });

  it('calls onChange with file when file is selected', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ImageUpload onChange={onChange} />);

    const file = new File(['png'], 'test.png', {type: 'image/png'});
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    expect(onChange).toHaveBeenCalledWith(file);
  });

  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    render(
      <ImageUpload value="/test.jpg" onChange={() => {}} onRemove={onRemove} />,
    );
    await user.click(screen.getByLabelText('Remove image'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('renders compact mode', () => {
    render(<ImageUpload compact onChange={() => {}} />);
    expect(screen.getByRole('button', {name: 'Upload'})).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern="ui/ImageUpload" --no-coverage`
Expected: FAIL — cannot find module `./ImageUpload`

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/ui/ImageUpload/ImageUpload.tsx
'use client';

import {useRef} from 'react';
import {Button} from '@/components/ui/Button';

type ImageUploadProps = {
  value?: string;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  accept?: string;
  maxSize?: number;
  compact?: boolean;
  error?: string;
  label?: string;
};

export function ImageUpload({
  value,
  onChange,
  onRemove,
  accept = 'image/*',
  maxSize,
  compact = false,
  error,
  label,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (maxSize && file.size > maxSize) {
      return;
    }

    onChange(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  if (compact) {
    return (
      <div>
        {label && (
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            {label}
          </label>
        )}
        <Button
          type="button"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          {value ? 'Change' : 'Upload'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      {label && (
        <label className="block type-label-sm text-on-surface-secondary mb-1">
          {label}
        </label>
      )}

      <div className="relative group border-2 border-dashed border-border rounded-lg overflow-hidden h-40">
        {value ? (
          <>
            <img
              src={value}
              alt="Upload preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white text-gray-800"
              >
                Replace
              </Button>
              {onRemove && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onRemove}
                  aria-label="Remove image"
                >
                  Delete
                </Button>
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center text-on-surface-secondary hover:text-primary transition-colors cursor-pointer"
          >
            <svg
              className="w-8 h-8 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="type-body-sm">Click to upload</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Write the barrel export**

```ts
// src/components/ui/ImageUpload/index.ts
export {ImageUpload} from './ImageUpload';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern="ui/ImageUpload" --no-coverage`
Expected: PASS — all 7 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/ImageUpload/
git commit -m "feat(ui): add ImageUpload component"
```

---

## Task 11: Barrel Export

**Files:**

- Create: `src/components/ui/index.ts`

- [ ] **Step 1: Create barrel file**

```ts
// src/components/ui/index.ts
export {FormField} from './FormField';
export {Button} from './Button';
export {Badge} from './Badge';
export {TextInput} from './TextInput';
export {Textarea} from './Textarea';
export {NumberInput} from './NumberInput';
export {SegmentedControl} from './SegmentedControl';
export {Modal} from './Modal';
export {Tabs, TabPanel} from './Tabs';
export {ImageUpload} from './ImageUpload';
```

- [ ] **Step 2: Verify imports resolve**

Run: `pnpm typecheck`
Expected: No errors related to `@/components/ui`

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/index.ts
git commit -m "feat(ui): add barrel export"
```

---

## Task 12: Migrate LoginModal

**Files:**

- Modify: `src/components/admin/LoginModal.tsx`

- [ ] **Step 1: Rewrite LoginModal to use shared components**

Replace the full file content with:

```tsx
// src/components/admin/LoginModal.tsx
'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {
  loginSchema,
  loginDefaults,
  submitLogin,
  type LoginFormData,
} from './LoginModal.form-utils';
import {TextInput, Button, Modal} from '@/components/ui';

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

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
      <TextInput
        label="Email"
        type="text"
        {...register('email')}
        error={errors.email?.message}
        autoComplete="username"
      />

      <TextInput
        label="Password"
        type="password"
        {...register('password')}
        error={errors.password?.message}
        autoComplete="current-password"
      />

      {submitError && (
        <p className="type-body-sm text-red-500" role="alert">
          {submitError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        loading={isSubmitting}
        className="w-full py-3"
      >
        Sign In
      </Button>
    </form>
  );
}

export function LoginModal({isOpen, onClose}: LoginModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} title="Admin Login" size="sm">
      <LoginForm onClose={onClose} />
    </Modal>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Run existing tests**

Run: `pnpm test -- --no-coverage`
Expected: All existing tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/LoginModal.tsx
git commit -m "refactor: migrate LoginModal to shared UI components"
```

---

## Task 13: Migrate StatusPicker and LocalePicker

**Files:**

- Modify: `src/components/admin/StatusPicker.tsx`
- Modify: `src/components/admin/LocalePicker.tsx`

- [ ] **Step 1: Rewrite StatusPicker**

```tsx
// src/components/admin/StatusPicker.tsx
import type {TourStatus} from '@/types';
import {SegmentedControl} from '@/components/ui';

const statusOptions: {
  value: TourStatus;
  label: string;
  activeClasses: string;
}[] = [
  {
    value: 'DRAFT',
    label: 'Draft',
    activeClasses: 'bg-amber-500 text-white border-amber-500',
  },
  {
    value: 'PUBLISHED',
    label: 'Published',
    activeClasses: 'bg-green-600 text-white border-green-600',
  },
  {
    value: 'FEATURED',
    label: 'Featured',
    activeClasses: 'bg-blue-500 text-white border-blue-500',
  },
  {
    value: 'ARCHIVED',
    label: 'Archived',
    activeClasses: 'bg-gray-500 text-white border-gray-500',
  },
];

type StatusPickerProps = {
  value: TourStatus;
  onChange: (status: TourStatus) => void;
  disabled?: boolean;
};

export function StatusPicker({
  value,
  onChange,
  disabled = false,
}: StatusPickerProps) {
  return (
    <SegmentedControl
      options={statusOptions}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
```

- [ ] **Step 2: Rewrite LocalePicker**

```tsx
// src/components/admin/LocalePicker.tsx
'use client';

import {SegmentedControl} from '@/components/ui';

type Locale = 'en' | 'vi';

const localeOptions: {value: Locale; label: string}[] = [
  {value: 'en', label: 'EN'},
  {value: 'vi', label: 'VI'},
];

type LocalePickerProps = {
  value: Locale;
  onChange: (locale: Locale) => void;
};

export function LocalePicker({value, onChange}: LocalePickerProps) {
  return (
    <SegmentedControl
      options={localeOptions}
      value={value}
      onChange={onChange}
    />
  );
}

export type {Locale};
```

- [ ] **Step 3: Run build and tests**

Run: `pnpm build && pnpm test -- --no-coverage`
Expected: Both pass

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/StatusPicker.tsx src/components/admin/LocalePicker.tsx
git commit -m "refactor: migrate StatusPicker and LocalePicker to SegmentedControl"
```

---

## Task 14: Migrate TourEditTabs and DestinationEditTabs

**Files:**

- Modify: `src/components/admin/TourEditTabs.tsx`
- Modify: `src/components/admin/DestinationEditTabs.tsx`

- [ ] **Step 1: Rewrite TourEditTabs to use Tabs + Button**

Replace the tab bar rendering and "Back" button. Keep all callback/state logic unchanged. Key changes:

In imports, add:

```tsx
import {Tabs, TabPanel, Button} from '@/components/ui';
```

Replace the "Back to Tours" button (line 109-113):

```tsx
<Button
  variant="secondary"
  onClick={() => navigate.to(routes.admin.tours.list)}
>
  Back to Tours
</Button>
```

Replace the tab bar + tab content (lines 118-178) with:

```tsx
<Tabs
  items={tabs.map((tab) => ({
    ...tab,
    key: tab.id,
    disabled: isTabDisabled(tab.id),
  }))}
  activeKey={activeTab}
  onChange={(key) => setActiveTab(key as TabId)}
>
  <TabPanel tabKey="general">
    <div className="p-5">
      <GeneralTab
        initialData={initialGeneral}
        destinations={destinations}
        tourId={tourId}
        onDestinationChange={setDestinationId}
        onSave={handleGeneralSave}
      />
    </div>
  </TabPanel>
  <TabPanel tabKey="itinerary">
    <ItineraryTab initialData={initialItinerary} onSave={handleItinerarySave} />
  </TabPanel>
  <TabPanel tabKey="pricing">
    <PricingTab initialData={initialPricingGroups} onSave={handlePricingSave} />
  </TabPanel>
  <TabPanel tabKey="highlights">
    <HighlightsTab
      tourId={tourId}
      destinationId={destinationId}
      initialSelectedIds={initialHighlightIds}
      destinations={destinations}
      onSave={handleHighlightsSave}
    />
  </TabPanel>
</Tabs>
```

Remove the `tabs` const (line 25-30) — inline into `items` prop.

- [ ] **Step 2: Rewrite DestinationEditTabs similarly**

Same pattern: replace tab bar with `<Tabs>` component, "Back" button with `<Button variant="secondary">`. Keep the locale picker positioned outside Tabs (in the header area alongside the back button or above tabs).

- [ ] **Step 3: Run build and tests**

Run: `pnpm build && pnpm test -- --no-coverage`
Expected: Both pass

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/TourEditTabs.tsx src/components/admin/DestinationEditTabs.tsx
git commit -m "refactor: migrate TourEditTabs and DestinationEditTabs to Tabs component"
```

---

## Task 15: Migrate GeneralTab Form Inputs

**Files:**

- Modify: `src/components/admin/tabs/GeneralTab.tsx`

- [ ] **Step 1: Replace inline inputs with shared components**

In imports, replace `FormFieldError` import with:

```tsx
import {TextInput, Textarea, NumberInput, Button} from '@/components/ui';
```

Replace each inline `<label>` + `<input>` + `<FormFieldError>` pattern with the equivalent shared component. For example, the slug field (lines 80-89):

Before:

```tsx
<div>
  <label className="block type-label-sm text-on-surface-secondary mb-1">
    Slug
  </label>
  <input type="text" {...register('slug')} className="w-full px-3 py-2 ..." />
  <FormFieldError message={errors.slug?.message} />
</div>
```

After:

```tsx
<TextInput label="Slug" {...register('slug')} error={errors.slug?.message} />
```

Apply the same transformation to:

- Title field → `<TextInput label="Title" {...register('title')} error={errors.title?.message} />`
- Description EN → `<Textarea label="Description (EN)" {...register('descriptionEn')} />`
- Description VI → `<Textarea label="Description (VI)" {...register('descriptionVi')} />`
- Price, Duration, Distance, GroupSize → `<NumberInput label="Price ($)" {...register('price', {valueAsNumber: true})} min={0} error={errors.price?.message} />`
- Transportation, Hotel, Guided → `<TextInput label="Transportation" {...register('transportation')} />`

Replace submit button with:

```tsx
<Button
  type="submit"
  disabled={isSubmitting || !isDirty}
  loading={isSubmitting}
  size="lg"
>
  Save General
</Button>
```

Keep the `<select>` for Destination (no Select component in shared lib — that's fine, leave it inline with its existing classes).

- [ ] **Step 2: Run build and tests**

Run: `pnpm build && pnpm test -- --no-coverage`
Expected: Both pass

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/tabs/GeneralTab.tsx
git commit -m "refactor: migrate GeneralTab to shared UI components"
```

---

## Task 16: Migrate ItineraryTab and PricingTab

**Files:**

- Modify: `src/components/admin/tabs/ItineraryTab.tsx`
- Modify: `src/components/admin/tabs/PricingTab.tsx`

- [ ] **Step 1: Read ItineraryTab and PricingTab**

Read both files, identify all inline `<input>`, `<button>`, `<label>` + `<FormFieldError>` patterns.

- [ ] **Step 2: Replace patterns in ItineraryTab**

Import `{TextInput, Button}` from `@/components/ui`. Replace each inline input/button with shared components. Same transformation pattern as Task 15.

- [ ] **Step 3: Replace patterns in PricingTab**

Import `{TextInput, NumberInput, Button}` from `@/components/ui`. Replace inline inputs and buttons.

- [ ] **Step 4: Run build and tests**

Run: `pnpm build && pnpm test -- --no-coverage`
Expected: Both pass

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/tabs/ItineraryTab.tsx src/components/admin/tabs/PricingTab.tsx
git commit -m "refactor: migrate ItineraryTab and PricingTab to shared UI components"
```

---

## Task 17: Migrate HighlightsTab, DestinationGeneralForm, DestinationHighlights

**Files:**

- Modify: `src/components/admin/tabs/HighlightsTab.tsx`
- Modify: `src/components/admin/DestinationGeneralForm.tsx`
- Modify: `src/components/admin/DestinationHighlights.tsx`

- [ ] **Step 1: Read all three files**

Identify inline input/button patterns in each.

- [ ] **Step 2: Migrate HighlightsTab**

Import `{TextInput, Textarea, Button}` from `@/components/ui`. Replace inline patterns.

- [ ] **Step 3: Migrate DestinationGeneralForm**

Same transformation. Replace inline inputs, textareas, and submit button.

- [ ] **Step 4: Migrate DestinationHighlights**

Same transformation.

- [ ] **Step 5: Run build and tests**

Run: `pnpm build && pnpm test -- --no-coverage`
Expected: Both pass

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/tabs/HighlightsTab.tsx src/components/admin/DestinationGeneralForm.tsx src/components/admin/DestinationHighlights.tsx
git commit -m "refactor: migrate HighlightsTab, DestinationGeneralForm, DestinationHighlights to shared UI"
```

---

## Task 18: Migrate VideoModal

**Files:**

- Modify: `src/components/video-modal/index.tsx`

- [ ] **Step 1: Rewrite VideoModal to use Modal**

```tsx
// src/components/video-modal/index.tsx
'use client';

import type {VideoModalProps} from '@/types';
import {Modal} from '@/components/ui';

export function VideoModal({videoUrl, isOpen, onClose}: VideoModalProps) {
  const embedUrl = videoUrl.replace('watch?v=', 'embed/') + '?autoplay=1';

  return (
    <Modal open={isOpen} onClose={onClose} size="full">
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          className="w-full h-full rounded-lg"
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Video"
        />
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Run the video-modal test**

Run: `pnpm test -- --testPathPattern="video-modal" --no-coverage`
Expected: PASS (existing tests should still work — test checks for presence of elements)

- [ ] **Step 3: Commit**

```bash
git add src/components/video-modal/index.tsx
git commit -m "refactor: migrate VideoModal to shared Modal component"
```

---

## Task 19: Migrate ScrollToTop and AdminStatusBadge

**Files:**

- Modify: `src/components/scroll-to-top/index.tsx`
- Modify: `src/components/admin-status-badge.tsx`

- [ ] **Step 1: Migrate ScrollToTop to use Button**

```tsx
// src/components/scroll-to-top/index.tsx
'use client';

import {useScrollDirection} from '@/hooks/useScrollDirection';
import {Button} from '@/components/ui';

export function ScrollToTop() {
  const {scrollY} = useScrollDirection();
  const visible = scrollY > 400;

  return (
    <Button
      variant="ghost"
      iconOnly
      onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
      className={`fixed bottom-20 right-8 z-50 h-11 w-11 rounded-lg bg-surface-elevated/15 dark:bg-black/40 backdrop-blur dark:backdrop-blur-lg border border-white/15 text-white shadow-sm hover:bg-surface-elevated/25 dark:hover:bg-black/50 transition-all duration-300 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
      aria-label="Scroll to top"
    >
      <i className="fa fa-arrow-up" />
    </Button>
  );
}
```

- [ ] **Step 2: Migrate AdminStatusBadge to use Badge**

```tsx
// src/components/admin-status-badge.tsx
import type {TourStatus} from '@/types';
import {Badge} from '@/components/ui';

const variantMap: Record<
  TourStatus,
  'warning' | 'success' | 'info' | 'neutral'
> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  FEATURED: 'info',
  ARCHIVED: 'neutral',
};

type AdminStatusBadgeProps = {
  status: TourStatus;
};

export function AdminStatusBadge({status}: AdminStatusBadgeProps) {
  if (status === 'PUBLISHED') return null;

  return (
    <span className="fixed top-20 right-4 z-50">
      <Badge variant={variantMap[status]}>
        {status.charAt(0) + status.slice(1).toLowerCase()} — Not Public
      </Badge>
    </span>
  );
}
```

- [ ] **Step 3: Run affected tests**

Run: `pnpm test -- --testPathPattern="(scroll-to-top|admin-status)" --no-coverage`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/scroll-to-top/index.tsx src/components/admin-status-badge.tsx
git commit -m "refactor: migrate ScrollToTop and AdminStatusBadge to shared UI"
```

---

## Task 20: Migrate ImageUploadField

**Files:**

- Modify: `src/components/admin/ImageUploadField.tsx`

- [ ] **Step 1: Refactor ImageUploadField to use shared ImageUpload internally**

The existing `ImageUploadField` has API logic (upload/delete calls) baked in. Keep this component as a domain-specific wrapper that uses the shared `ImageUpload` for the UI:

```tsx
// src/components/admin/ImageUploadField.tsx
'use client';

import {useState, useCallback} from 'react';
import {api} from '@/routes';
import {ImageUpload} from '@/components/ui';

type ImageUploadFieldProps = {
  entityType: 'tour' | 'destination';
  entityId: string | null;
  imageType: 'card' | 'hero';
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  label: string;
  compact?: boolean;
};

export function ImageUploadField({
  entityType,
  entityId,
  imageType,
  currentUrl,
  onUploadComplete,
  label,
  compact,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');

  const handleChange = useCallback(
    async (file: File | null) => {
      if (!file || !entityId) return;

      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);
      formData.append('imageType', imageType);

      try {
        const {data, error: uploadError} =
          await api.admin.upload.create(formData);
        if (uploadError) {
          setError(uploadError);
          return;
        }
        setPreviewUrl(`${data!.url}?t=${Date.now()}`);
        onUploadComplete(data!.url);
      } catch {
        setError('Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [entityId, entityType, imageType, onUploadComplete],
  );

  const handleRemove = useCallback(async () => {
    if (!entityId || !confirm('Delete this image?')) return;

    try {
      const {error: deleteError} = await api.admin.upload.delete({
        entityType,
        entityId,
        imageType,
      });
      if (!deleteError) {
        setPreviewUrl('');
        onUploadComplete('');
      }
    } catch {
      setError('Delete failed');
    }
  }, [entityId, entityType, imageType, onUploadComplete]);

  if (!entityId) {
    return (
      <div>
        {label && (
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            {label}
          </label>
        )}
        <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-surface-alt text-on-surface-secondary type-body-sm h-40">
          Save first to upload images
        </div>
      </div>
    );
  }

  return (
    <ImageUpload
      value={previewUrl || undefined}
      onChange={handleChange}
      onRemove={handleRemove}
      label={label}
      compact={compact}
      error={error}
    />
  );
}
```

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: Build passes

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ImageUploadField.tsx
git commit -m "refactor: migrate ImageUploadField to use shared ImageUpload"
```

---

## Task 21: Delete FormFieldError and Cleanup

**Files:**

- Delete: `src/components/admin/FormFieldError.tsx`
- Verify: No remaining imports of FormFieldError

- [ ] **Step 1: Search for remaining FormFieldError imports**

Run: `grep -r "FormFieldError" src/ --include="*.tsx" --include="*.ts"`
Expected: Should show zero results after migrations (Tasks 15-17 removed all usages)

- [ ] **Step 2: Delete FormFieldError.tsx**

```bash
rm src/components/admin/FormFieldError.tsx
```

- [ ] **Step 3: Run full test suite**

Run: `pnpm test -- --no-coverage`
Expected: All tests pass

- [ ] **Step 4: Run build**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove FormFieldError (replaced by FormField)"
```

---

## Task 22: Update CLAUDE.md

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: Add shared UI component section**

Add after the "### Code Style" section in CLAUDE.md:

```markdown
### Shared UI Components

Reusable primitives live in `src/components/ui/`. Each component follows:

- `ComponentName/index.ts` — re-export
- `ComponentName/ComponentName.tsx` — implementation
- `ComponentName/ComponentName.spec.tsx` — tests (Jest + RTL)

Import via `@/components/ui`. All form inputs accept react-hook-form `register()` spread via `forwardRef`.

Available: Button, TextInput, Textarea, NumberInput, FormField, Modal, Tabs, TabPanel, SegmentedControl, Badge, ImageUpload.

When adding form fields, use shared components instead of inline `<input>` + `<label>` + error patterns. When adding buttons, use `<Button variant="...">` instead of raw `<button>` with Tailwind classes.
```

- [ ] **Step 2: Update test command in Commands section**

Change:

```markdown
No test framework is configured.
```

To:

```markdown
pnpm test # Jest unit tests (watch mode)
pnpm test:run # Jest single run (CI)
```

Wait — looking at existing package.json, `test` already runs jest. Just remove the "No test framework" line and note the existing commands.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with shared UI library conventions"
```

---

## Task 23: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test -- --no-coverage`
Expected: All tests pass (existing + new UI component tests)

- [ ] **Step 2: Run type check**

Run: `pnpm typecheck`
Expected: No type errors

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: No lint errors

- [ ] **Step 4: Run production build**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 5: Verify no unused FormFieldError references**

Run: `grep -r "FormFieldError" src/`
Expected: Zero matches

- [ ] **Step 6: Commit any final fixes if needed**

Only if previous steps revealed issues. Otherwise, done.
