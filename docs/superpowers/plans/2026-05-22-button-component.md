# Button Component Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all admin-area buttons into a single themed `Button` component with four variants — `primary`, `danger`, `secondary`, `link` — replacing raw `<button>` tags and dropping the legacy `ghost` variant.

**Architecture:** Extend the existing `src/components/ui/Button/Button.tsx`. Add themed CSS-var tokens for `danger`/`on-danger` so text color flips correctly between light/dark mode. Sweep 18 raw `<button>` usages in `src/pages/admin/**` and `src/components/Admin/**`. Migrate the two existing `ghost` consumers (`ScrollToTop`, `ItineraryTab`).

**Tech Stack:** React 19, Next.js 16 (Pages Router), TypeScript strict, Tailwind v4 (`@theme` block in `globals.css`), Jest + React Testing Library.

---

## Task 1: Add `danger`/`on-danger` theme tokens

**Files:**

- Modify: `src/styles/globals.css` (light `@theme` block ~lines 7–22, dark `.dark` block ~lines 53–67)

- [ ] **Step 1: Add light-mode tokens**

Insert into the `@theme { ... }` block after `--color-primary-light`:

```css
--color-danger: #dc2626;
--color-danger-hover: #b91c1c;
--color-on-danger: #ffffff;
```

- [ ] **Step 2: Add dark-mode tokens**

Insert into the `.dark { ... }` block alongside other `--color-*` overrides:

```css
--color-danger: #dc2626;
--color-danger-hover: #b91c1c;
--color-on-danger: #ffffff;
```

(Red bg stays the same hue; `on-danger` stays white in both modes for AA contrast on `#dc2626`.)

- [ ] **Step 3: Verify Tailwind picks up tokens**

Run: `pnpm build`
Expected: build succeeds. (Tailwind v4 with `@theme` auto-generates `bg-danger`, `text-on-danger`, `bg-danger-hover` utilities.)

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat(ui): add danger color theme tokens"
```

---

## Task 2: Rewrite Button to drop `ghost`, add `link`, theme `danger`

**Files:**

- Modify: `src/components/ui/Button/Button.tsx`
- Test: `src/components/ui/Button/Button.spec.tsx`

- [ ] **Step 1: Add failing tests for new variants**

Append to `Button.spec.tsx` inside the `describe('Button', () => { ... })`:

```tsx
it('renders primary variant by default', () => {
  render(<Button>Save</Button>);
  expect(screen.getByRole('button', {name: 'Save'})).toBeInTheDocument();
});

it('renders danger variant', () => {
  render(<Button variant="danger">Delete</Button>);
  expect(screen.getByRole('button', {name: 'Delete'})).toBeInTheDocument();
});

it('renders secondary variant', () => {
  render(<Button variant="secondary">Edit</Button>);
  expect(screen.getByRole('button', {name: 'Edit'})).toBeInTheDocument();
});

it('renders link variant', () => {
  render(<Button variant="link">More</Button>);
  expect(screen.getByRole('button', {name: 'More'})).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm they pass with current code (variants still accept TS literal)**

Run: `pnpm test -- Button.spec`
Expected: existing tests pass. New tests pass for `primary`/`danger`/`secondary`. `link` test fails TypeScript compile (`'link'` not assignable to variant union).

- [ ] **Step 3: Rewrite Button.tsx**

Replace full contents of `src/components/ui/Button/Button.tsx`:

```tsx
import {forwardRef, type ButtonHTMLAttributes, type ReactNode} from 'react';

type ButtonProps = {
  variant?: 'primary' | 'danger' | 'secondary' | 'link';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary hover:bg-primary-light text-on-primary',
  danger: 'bg-danger hover:bg-danger-hover text-on-danger',
  secondary: 'border border-border text-on-surface hover:bg-surface-alt',
  link: 'text-primary hover:underline',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2',
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
    const isLink = variant === 'link';

    const base = isLink
      ? 'inline-flex items-center justify-center type-label-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
      : 'inline-flex items-center justify-center rounded-lg type-label-sm uppercase tracking-wide font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

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

- [ ] **Step 4: Run tests to verify**

Run: `pnpm test -- Button.spec`
Expected: all tests pass including the four variant tests.

- [ ] **Step 5: Typecheck**

Run: `pnpm build`
Expected: build fails with TS errors at every `variant="ghost"` site (ScrollToTop, ItineraryTab). That is expected — Task 3 fixes them. Do NOT proceed if other unrelated TS errors appear.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Button/Button.tsx src/components/ui/Button/Button.spec.tsx
git commit -m "feat(ui): replace Button ghost with link variant, theme danger"
```

---

## Task 3: Migrate `ghost` usages

**Files:**

- Modify: `src/components/Layout/components/ScrollToTop/ScrollToTop.tsx`
- Modify: `src/components/Admin/tabs/ItineraryTab/ItineraryTab.tsx`

- [ ] **Step 1: Update ScrollToTop**

In `ScrollToTop.tsx`, change line 12 from `variant="ghost"` to `variant="secondary"`. Full Button block becomes:

```tsx
<Button
  variant="secondary"
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
```

(The `className` override keeps the bespoke floating chrome — text/border color overridden inline.)

- [ ] **Step 2: Update ItineraryTab**

In `ItineraryTab.tsx:135`, change `variant="ghost"` to `variant="secondary"`. The "+" button block becomes:

```tsx
<Button
  type="button"
  variant="secondary"
  size="sm"
  onClick={() => handleAddItem(dayIndex)}
  title="Add item"
>
  +
</Button>
```

- [ ] **Step 3: Verify no `ghost` references remain**

Run: `grep -rn "variant=\"ghost\"\|'ghost'" src`
Expected: zero matches.

- [ ] **Step 4: Build + test**

Run: `pnpm build && pnpm test -- --watchAll=false`
Expected: build passes, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout/components/ScrollToTop/ScrollToTop.tsx src/components/Admin/tabs/ItineraryTab/ItineraryTab.tsx
git commit -m "refactor(ui): migrate ghost button usages to secondary"
```

---

## Task 4: Audit raw `<button>` tags in admin and classify

**Files:**

- Create: `docs/superpowers/plans/2026-05-22-button-migration-audit.md` (scratch — delete at end of Task 9)

- [ ] **Step 1: Generate full list**

Run: `grep -rn "<button" src/pages/admin src/components/Admin > /tmp/admin-buttons.txt && cat /tmp/admin-buttons.txt`
Expected: ~18 matches across 13 files.

- [ ] **Step 2: Write classified audit**

Create `docs/superpowers/plans/2026-05-22-button-migration-audit.md` with one entry per raw `<button>` in this format:

```
- file:line — context (label/onClick intent) — TARGET variant
```

Example entries:

```
- src/pages/admin/users/index.tsx:142 — "Delete user" button — danger
- src/components/Admin/AdminBreadcrumbs/AdminBreadcrumbs.tsx:30 — crumb click handler — link
```

Classification rules (defaults — review per-call):

- Destructive (Delete/Archive/Remove/Restore) → `danger`
- Primary submit (Save/Create/New X) → `primary`
- Neutral (Edit/Cancel/tab toggle/icon action) → `secondary`
- Inline text action (breadcrumb crumb, "Change", "View") → `link`

- [ ] **Step 3: Commit audit**

```bash
git add docs/superpowers/plans/2026-05-22-button-migration-audit.md
git commit -m "docs: classify admin raw button usages for migration"
```

---

## Task 5: Migrate `src/pages/admin/**` raw buttons

**Files (modify):**

- `src/pages/admin/tours/archive.tsx`
- `src/pages/admin/users/index.tsx`
- `src/pages/admin/destinations/index.tsx`
- `src/pages/admin/destinations/archive.tsx`
- `src/pages/admin/roles/index.tsx`

- [ ] **Step 1: For each file, open and identify each `<button>`**

Use the audit file from Task 4 to know which variant each gets.

- [ ] **Step 2: Replace each raw `<button>` with `<Button variant="...">`**

For each match: replace `<button ... className="...tailwind...">Label</button>` with `<Button variant="X" size="Y" onClick={...}>Label</Button>`. Remove any `className` props that duplicate Button's base styling (background, padding, rounded, uppercase) — keep only positional classes (margin, width override, grid placement).

Ensure `import {Button} from '@/components/ui'` is present at top of each file.

If a raw button used custom colors that don't map (e.g., a yellow "warning" style), default to `secondary` and add a TODO comment in the migration audit doc — do NOT invent a new variant.

- [ ] **Step 3: Per-file verification**

After editing each file: run `pnpm tsc --noEmit` (or `pnpm build`). Expected: no new errors in the file. Fix any prop/type issues immediately.

- [ ] **Step 4: Verify no raw `<button>` in `src/pages/admin/**`\*\*

Run: `grep -rn "<button" src/pages/admin`
Expected: zero matches.

- [ ] **Step 5: Build + smoke test**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin
git commit -m "refactor(admin): replace raw button tags with Button component (pages)"
```

---

## Task 6: Migrate `src/components/Admin/**` raw buttons — batch A (layout/breadcrumbs/translation)

**Files (modify):**

- `src/components/Admin/AdminLayout/AdminLayout.tsx`
- `src/components/Admin/AdminBreadcrumbs/AdminBreadcrumbs.tsx`
- `src/components/Admin/TranslationEditor/TranslationEditor.tsx`

- [ ] **Step 1: Replace each raw `<button>` per the audit**

Same replacement pattern as Task 5 Step 2. Breadcrumb crumbs → `link`. Layout toggles (sidebar collapse) → `secondary iconOnly`. Translation editor save/clear → `primary`/`secondary`.

- [ ] **Step 2: Run unit tests for affected components**

Run: `pnpm test -- AdminBreadcrumbs TranslationEditor AdminLayout --watchAll=false`
Expected: all pass. If specs assert on `<button>` element, update to `getByRole('button', {name: ...})`.

- [ ] **Step 3: Verify no raw `<button>` in these files**

Run: `grep -n "<button" src/components/Admin/AdminLayout/AdminLayout.tsx src/components/Admin/AdminBreadcrumbs/AdminBreadcrumbs.tsx src/components/Admin/TranslationEditor/TranslationEditor.tsx`
Expected: zero matches.

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin/AdminLayout src/components/Admin/AdminBreadcrumbs src/components/Admin/TranslationEditor
git commit -m "refactor(admin): use Button in layout/breadcrumbs/translation editor"
```

---

## Task 7: Migrate `src/components/Admin/**` raw buttons — batch B (forms/images/perks)

**Files (modify):**

- `src/components/Admin/tabs/PerksTab/PerkChip.tsx`
- `src/components/Admin/UserForm/TeamPhotoPicker.tsx`
- `src/components/Admin/ImageCollectionEditor/SortableImageCard.tsx`
- `src/components/Admin/CardImagePreview/CardImagePreview.tsx`
- `src/components/Admin/DestinationHighlights/DestinationHighlights.tsx`

- [ ] **Step 1: Replace each raw `<button>` per the audit**

Common patterns here: remove/delete icon buttons → `danger iconOnly size="sm"`; pick/select chips → `secondary`; drag handles stay as `<button>` only if they need raw DOM hooks for sortable lib — in that case leave them and document the exception in the audit doc.

- [ ] **Step 2: Run unit tests for affected components**

Run: `pnpm test -- PerkChip TeamPhotoPicker SortableImageCard CardImagePreview DestinationHighlights --watchAll=false`
Expected: all pass. Update any assertions that target raw `<button>` styling.

- [ ] **Step 3: Verify no raw `<button>` in these files**

Run: `grep -n "<button" src/components/Admin/tabs/PerksTab/PerkChip.tsx src/components/Admin/UserForm/TeamPhotoPicker.tsx src/components/Admin/ImageCollectionEditor/SortableImageCard.tsx src/components/Admin/CardImagePreview/CardImagePreview.tsx src/components/Admin/DestinationHighlights/DestinationHighlights.tsx`
Expected: zero matches, OR documented sortable-handle exception only.

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin/tabs src/components/Admin/UserForm src/components/Admin/ImageCollectionEditor src/components/Admin/CardImagePreview src/components/Admin/DestinationHighlights
git commit -m "refactor(admin): use Button in form pickers, image editors, perks"
```

---

## Task 8: Full admin sweep verification

- [ ] **Step 1: Verify zero raw buttons in admin tree**

Run: `grep -rn "<button" src/pages/admin src/components/Admin`
Expected: zero matches (or only documented exceptions from Task 7).

- [ ] **Step 2: Verify zero `ghost` references**

Run: `grep -rn "variant=\"ghost\"\|'ghost'" src`
Expected: zero matches.

- [ ] **Step 3: Full build**

Run: `pnpm build`
Expected: succeeds, no TS errors.

- [ ] **Step 4: Full lint**

Run: `pnpm lint`
Expected: no new errors.

- [ ] **Step 5: Full test suite**

Run: `pnpm test -- --watchAll=false`
Expected: all pass.

- [ ] **Step 6: Manual smoke test**

Run: `pnpm dev`
Visit `/admin/users`, `/admin/roles`, `/admin/tours`, `/admin/destinations`, `/admin/image-collections`. Verify:

- "Edit" buttons render as outlined secondary
- "Delete"/"Archive" buttons render as red danger
- "New X" / "Save" buttons render as amber primary
- Breadcrumbs / inline actions render as link style
- Dark mode: primary text is dark on amber bg, danger text is white on red bg
- Light mode: primary text is white on amber bg

Stop dev server when done.

- [ ] **Step 7: Commit (if any cleanup edits needed)**

If smoke test surfaced issues, fix them and:

```bash
git add -A
git commit -m "fix(admin): button visual cleanup after migration"
```

---

## Task 9: Cleanup audit doc

- [ ] **Step 1: Remove the scratch audit file**

```bash
git rm docs/superpowers/plans/2026-05-22-button-migration-audit.md
git commit -m "chore: remove button migration scratch audit"
```

---

## Acceptance Criteria

- `grep -rn "<button" src/pages/admin src/components/Admin` → zero matches (or only documented sortable-handle exceptions).
- `grep -rn "variant=\"ghost\"\|'ghost'" src` → zero matches.
- `Button.tsx` type union is `'primary' | 'danger' | 'secondary' | 'link'`.
- `pnpm build`, `pnpm lint`, `pnpm test` all pass.
- Manual smoke test confirms text contrast flips correctly between light/dark mode for all four variants.
