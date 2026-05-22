# Button Component Unification — Design

## Goal

Single `Button` component in `src/components/ui/Button/` covering four variants — `primary`, `danger`, `secondary`, `link` — that matches the admin-area visual style (rounded, uppercase, themed text). All admin-area buttons ("Edit", "Delete", "Archive", "New X", "Save", "Cancel", inline links) must consume this component. No raw `<button>` tags remain in admin pages or admin components.

## Visual Reference

Reference screenshot: amber-filled "NEW COLLECTION" primary, outlined "EDIT" secondary, red-filled "DELETE" danger. All uppercase, rounded corners, medium weight.

## Variants

| Variant   | Background   | Border          | Text token        | Hover                    | Use                                |
| --------- | ------------ | --------------- | ----------------- | ------------------------ | ---------------------------------- |
| primary   | `bg-primary` | none            | `text-on-primary` | `hover:bg-primary-light` | Main CTA (Save, Create, New X)     |
| danger    | `bg-danger`  | none            | `text-on-danger`  | `hover:bg-danger-hover`  | Destructive (Delete, Archive)      |
| secondary | transparent  | `border-border` | `text-on-surface` | `hover:bg-surface-alt`   | Neutral (Edit, Cancel, tab toggle) |
| link      | none         | none            | `text-primary`    | `hover:underline`        | Inline navigation, subtle action   |

All four use themed CSS vars — values flip between light/dark mode automatically.

## Theme Tokens

Add to `src/styles/globals.css`:

```css
/* light */
--color-on-danger: #ffffff;
--color-danger: #dc2626; /* red-600 */
--color-danger-hover: #b91c1c; /* red-700 */

/* dark */
--color-on-danger: #ffffff;
--color-danger: #dc2626;
--color-danger-hover: #b91c1c;
```

Existing tokens reused: `--color-primary`, `--color-primary-light`, `--color-on-primary`, `--color-on-surface`, `--color-border`, `--color-surface-alt`.

Tailwind v4 theme block exposes them as `bg-danger`, `text-on-danger`, etc.

## API

```ts
type ButtonProps = {
  variant?: 'primary' | 'danger' | 'secondary' | 'link';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;
```

`forwardRef<HTMLButtonElement, ButtonProps>` preserved. Default `variant="primary"`, `size="md"`, `type="button"`.

## Styling

Base classes:

```
inline-flex items-center justify-center rounded-lg uppercase tracking-wide
type-label-sm font-semibold transition-colors cursor-pointer
disabled:opacity-50 disabled:cursor-not-allowed
```

Sizes:

| Size | Padding       | Height (approx) |
| ---- | ------------- | --------------- |
| sm   | `px-3 py-1.5` | 32px            |
| md   | `px-5 py-2`   | 40px            |
| lg   | `px-6 py-2.5` | 48px            |

`iconOnly` overrides padding to `p-2` (square).

`link` variant strips: `uppercase`, `rounded-lg` (kept for focus ring), `tracking-wide`. Adds `hover:underline`.

Loading: spinner replaces icon + label, `disabled` set, `aria-busy="true"`.

## Migration Scope

### Drop `ghost` variant

Two existing usages:

1. `src/components/Layout/components/ScrollToTop/ScrollToTop.tsx:12` — floating scroll-to-top button. Migrate to `variant="secondary" iconOnly`; bespoke chrome stays as `className` override (backdrop, fixed positioning).
2. `src/components/Admin/tabs/ItineraryTab/ItineraryTab.tsx:135` — "+" add-item button. Migrate to `variant="secondary" size="sm" iconOnly`.

### Admin sweep

18 raw `<button>` tags across 13 files (audit result):

- `src/pages/admin/tours/archive.tsx`
- `src/pages/admin/users/index.tsx`
- `src/pages/admin/destinations/index.tsx`
- `src/pages/admin/destinations/archive.tsx`
- `src/pages/admin/roles/index.tsx`
- `src/components/Admin/tabs/PerksTab/PerkChip.tsx`
- `src/components/Admin/UserForm/TeamPhotoPicker.tsx`
- `src/components/Admin/AdminLayout/AdminLayout.tsx`
- `src/components/Admin/AdminBreadcrumbs/AdminBreadcrumbs.tsx`
- `src/components/Admin/TranslationEditor/TranslationEditor.tsx`
- `src/components/Admin/ImageCollectionEditor/SortableImageCard.tsx`
- `src/components/Admin/CardImagePreview/CardImagePreview.tsx`
- `src/components/Admin/DestinationHighlights/DestinationHighlights.tsx`

Mapping rules per label/intent:

- "Delete", "Archive", "Remove", "Restore" (destructive) → `danger`
- "Edit", "Cancel", tab-toggles, neutral icon actions → `secondary`
- "Save", "Create", "New X", primary submit → `primary`
- Breadcrumb crumbs, inline text actions (e.g., "Change", "View") → `link`

Each raw `<button>` is reviewed individually during migration — mapping is a default, not a rigid rule.

### Out of scope

- Public-site pages (`src/pages/index.tsx`, hero, contact). No changes there in this work.
- Form input wrappers (`TextInput`, `Textarea`) — already use shared components.

## Testing

Extend `src/components/ui/Button/Button.spec.tsx`:

- Render each variant; assert correct role + accessible name.
- `disabled` prop: assert `aria-disabled`/`disabled` attr + click not fired.
- `loading` prop: assert `aria-busy="true"`, disabled, no label fired on click.
- `iconOnly`: assert label still accessible via `aria-label`.

No class assertions, no style assertions (per CLAUDE.md testing rules).

## Risks / Notes

- `ScrollToTop` is a public-site component, not admin — but it is the only remaining `ghost` consumer outside admin. Migrated as part of dropping `ghost`.
- `Tailwind v4` theme tokens: confirm `@theme` block in `globals.css` is what exposes vars to utility classes; add new tokens there.
- Some admin "buttons" are actually `<Link>` (`next/link`) — those stay as `<Link>` and are out of scope unless visually inconsistent.

## Acceptance

- `Button.tsx` exports the four variants only. `ghost` removed from type union.
- `grep -r "<button" src/pages/admin src/components/Admin` returns zero matches.
- `grep -r "variant=\"ghost\"" src` returns zero matches.
- `pnpm build` passes (typecheck clean).
- `pnpm test` passes including new variant tests.
