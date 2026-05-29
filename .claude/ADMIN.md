# ADMIN.md

Canonical conventions for every page under `/admin/*`. Every admin page MUST conform. New admin pages start from this contract; existing pages get migrated in a follow-up.

Reference implementation for the shell: `src/pages/admin/tours/[id]/edit/[tab].tsx` + `src/components/Admin/TourEditTabs/TourEditTabs.tsx`.

---

## 1. Page shell

Every admin page renders inside a fixed-shell layout: **fixed header on top, fixed footer (optional) at bottom, scrollable content between**. The page itself never scrolls — only the middle region scrolls.

Use the shared `AdminPageShell` component:

```tsx
<AdminPageShell
  header={<AdminPageHeader ... />}
  footer={<AdminPageFooter ... />}  // optional
>
  {/* scrollable content */}
</AdminPageShell>
```

Structural contract:

```
<div h-full flex flex-col min-h-0>
  <header shrink-0 border-b>           ← fixed top
  <section flex-1 overflow-y-auto>     ← only scrollable region
  <footer shrink-0 detached pill>      ← fixed bottom, optional
</div>
```

- `AdminLayout` (`src/components/Admin/AdminLayout`) provides `h-screen overflow-hidden` + sidebar + `<main flex-1>`. `AdminPageShell` fills `<main>` and owns its own scroll.
- Never apply `overflow-y-auto` on the page root. Only the middle `<section>` scrolls.
- Content padding lives on the scrollable `<section>` (`p-6` or `p-8`), not on the shell root, so the header/footer can be flush.

### 1a. Header

- Always present.
- Left side: `AdminBreadcrumbs` on top, `<h1 class="type-headline-sm truncate">` below.
- Right side, in order: dirty indicator (if applicable) · `LocaleSwitcher` · primary action(s).
- `LocaleSwitcher` is always rendered in the top-right corner of the header. Never inline inside a form field, never inside the body.

### 1b. Footer (action bar)

- Optional. Only when the page has a primary action that should remain visible while scrolling (Save, Submit, Bulk archive, Row count).
- **Detached pill style**: floating card with margin from the bottom, not flush to viewport.
  - Tailwind: `mx-6 mb-6 rounded-xl border border-border bg-surface-elevated px-6 py-3 shadow-sm`
- Actions right-aligned. Status text (e.g., "Unsaved changes", row count) left-aligned.

---

## 2. Localization

- **One field per localized value, never two.** Forms and detail pages show a single editor with the `LocaleSwitcher` controlling which translation is being edited. (Already mandated by CLAUDE.md.)
- **List pages drop VI+EN columns.** Tables show the value in the currently active admin locale only. Locale switching is done via the header `LocaleSwitcher`.
- Active admin locale lives in URL query (`?locale=en|vi`) or per-page state — pick one and use it consistently. Default to `en`.
- **Localized fields stored as `{en, vi}` JSON, not split columns.** See CLAUDE.md → Code Style → "Localized DB columns…" for the convention. Admin forms continue to render one field + locale switcher; the switcher mutates the `en` or `vi` key inside the same JSON value rather than two separate columns.

### 2a. Translation namespacing — one namespace per page/scope

The `Translation` table's `namespace` column is what the Translations editor groups by (one sidebar entry per distinct namespace). Keep that list **compact**: every page or scope gets **exactly one namespace**, and all of its strings live there.

- **One namespace per admin page.** Use a single `admin.<page>` namespace (`admin.rentals`, `admin.tours`, `admin.users`). Do NOT fragment a page across many namespaces (`admin.rentals.list`, `admin.rentals.status`, `admin.rentals.tabs`, `admin.rentals.fields`, `admin.rentals.confirmDelete`). Each of those becomes a separate, near-empty sidebar entry — the anti-pattern these screenshots flagged.
- **Same for public pages and scopes.** One namespace per surface (`rentals`, not `rentals` + `rentals.filter` + `rentals.policy` + `rentals.policy.included`). Generic/shared UI strings live in the single `common` namespace (see CLAUDE.md → `common.*` rule).
- **Sub-sections are nested KEYS, not new namespaces.** Group within a namespace using dotted keys: `status.draft`, `tabs.general`, `policy.included.title`, `confirmDelete` — all under the one page namespace. The dots after the namespace are key structure, not additional namespaces.
- **Access via one `useTranslations('<namespace>')`** per component, then `t('status.draft')`. Reuse `common.*` for generic labels rather than redeclaring under the page namespace.
- **Migrating existing fragments:** consolidate the split rows into the page namespace (move `admin.rentals.list.title` → namespace `admin.rentals`, key `list.title`) in the relevant `prisma/seed-*-translations.ts`, update call sites, and re-seed. Goal: the Translations editor shows one entry per page, not a dozen.

---

## 3. Buttons

All buttons are `<Button>` from `src/components/ui/Button`. No raw `<button>` with Tailwind classes. No raw `<Link>` styled to look like a button — use `<Button as={Link} href=…>`.

### Variants

| Variant        | Use for                                                   | Look                                            |
| -------------- | --------------------------------------------------------- | ----------------------------------------------- |
| `primary`      | Main action: Save, Create, Add                            | Solid amber, `text-on-primary`, uppercase label |
| `secondary`    | Neutral action: Cancel, View archive                      | Outlined, `text-on-surface-secondary`           |
| `danger`       | Destructive confirm action inside modal: "Delete forever" | Solid red, white label                          |
| `ghost`        | Row-level edit, low-emphasis: Edit                        | Text only, `text-primary`, no background        |
| `ghost-danger` | Row-level destructive: Delete, Archive                    | Text only, `text-error`, no background          |

### Sizes

- `md` (default): `px-4 py-2`, `type-label-sm uppercase`
- `sm`: `px-3 py-1.5`, `type-label-sm` (used for in-row actions)

### Icons

- Every button accepts an `icon` prop (FontAwesome class). Render as leading icon: `<i class="fa fa-… text-xs mr-1.5" />`.
- Primary "add" button MUST use `icon="fa-plus"` and label `Add {Entity}` (e.g., `Add tour`, `Add destination`, `Add role`).
- Edit button: `icon="fa-pen"`, label `Edit`.
- Delete button: `icon="fa-trash"`, label `Delete`.
- Archive button: `icon="fa-archive"`, label `Archive` (count optional, suffix in parens).

### Rules

- Every interactive button has `cursor-pointer` (already required by CLAUDE.md).
- Label casing: `md` size = uppercase, `sm` size = sentence case.
- Color tokens come from `--color-primary`, `--color-error`, `--color-on-*` — never hard-coded hex.

---

## 4. List pages

Every list page (`tours`, `destinations`, `perks`, `roles`, `users`, `image-collections`, `translations`) follows the same structure:

- **Header**: breadcrumbs · h1 · `Archive ({count})` link (only if archived items exist) · `Add {entity}` primary button · `LocaleSwitcher`
- **Body**: table or grouped sections, scrollable
- **Footer** (optional): row count, bulk-action toolbar

Table conventions:

- Headers: `type-label-sm uppercase text-on-surface-secondary`, padding `px-4 py-3`, `bg-surface-alt` row.
- Row hover: `hover:bg-surface-alt/50`.
- Row actions live in the last cell, right-aligned, `<Button variant="ghost" size="sm">` for edit and `<Button variant="ghost-danger" size="sm">` for delete/archive — separated by `gap-2`.
- First column with a name + image: link the whole cell to the edit route via `<Link>` wrapping the image + name.

---

## 5. Edit / create pages

- **Header**: breadcrumbs · entity title (editable slug allowed) · dirty indicator · `LocaleSwitcher`
- **Body**: `Tabs` (when entity has multiple sections) + active `TabPanel`. Content scrolls.
- **Footer**: per-tab save button, right-aligned in the detached pill.

---

## 6. Destructive actions

- Never use native `window.confirm()`. Use the shared `ConfirmModal` (`src/components/ui/ConfirmModal`).
- Modal pattern: title (`Delete role?`), body (consequence + entity label), `Cancel` (`secondary`) + confirm (`danger`).
- Error states from the API surface inline in the modal, not as `alert()`.

---

## 7. Select / dropdown

- Always use the shared `Select` from `src/components/ui/Select`. **Never** use a raw native `<select>` — its dropdown panel is OS-styled and ignores our theme tokens (looks broken in dark mode).
- API: pass `options: {value, label, disabled?}[]` + controlled `value` + `onChange(value: string)`. No `<option>` children.
- The component renders a styled trigger + custom popover panel that uses `bg-surface-elevated`, `text-on-surface`, and the primary color for the selected item — so it respects both dark and light themes automatically.
- Supports `placeholder`, `label`, `error`, `hint`, `selectSize` (`sm` | `md`), `fullWidth`, `disabled`, `aria-label`, keyboard navigation (`↑/↓/Home/End/Enter/Esc`), and outside-click dismissal.

---

## 8. Forms

- Every form has a co-located `*.form-utils.ts` (Yup schema, type, defaults, submit handler) — already mandated by CLAUDE.md.
- Form fields use shared `FormField`, `TextInput`, `Textarea`, `NumberInput`, `Select` from `src/components/ui`.
- Form submit button lives in the **page footer**, not inline at the end of the form.

---

## 9. Per-page audit checklist

For each admin page, verify:

- [ ] Wrapped in `AdminPageShell`
- [ ] Page itself does not scroll; only the middle section scrolls
- [ ] Header has breadcrumbs + h1 on the left
- [ ] `LocaleSwitcher` rendered in header top-right
- [ ] Primary "Add" button uses `<Button variant="primary" icon="fa-plus">Add …</Button>`
- [ ] No raw `<button>` or styled `<Link>` for actions
- [ ] Row edit uses `variant="ghost-primary"`, row delete/archive uses `variant="ghost-danger"`
- [ ] No `window.confirm()` — uses `ConfirmModal`
- [ ] No raw native `<select>` — uses shared `Select` with `options` prop
- [ ] List page tables show single active-locale value, not VI+EN columns
- [ ] Footer (if present) uses detached pill style
- [ ] No inline styles, no hard-coded colors

---

## 10. Migration order (follow-up work)

1. Build `AdminPageShell`, `AdminPageHeader`, `AdminPageFooter`, `LocaleSwitcher`, `ConfirmModal`. Extend `Button` with `ghost`, `ghost-danger`, `icon`, `size` props if missing.
2. Migrate list pages: tours → destinations → perks → roles → users → image-collections → translations.
3. Migrate edit pages: align tour-edit shell to use the new `AdminPageShell` primitives instead of inline divs.
4. Delete dead inline shell code.

Each migration is a separate commit; each entity group is a separate PR.
