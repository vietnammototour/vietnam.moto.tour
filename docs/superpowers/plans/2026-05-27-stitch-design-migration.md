# Stitch "Apex Cinematic Tactical" Design Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate repo's visual theme from current amber/light system to the Stitch "Apex Cinematic Tactical" dark/brutalist tokens (mustard `#ffdb00`, sharp corners, Hanken Grotesk + JetBrains Mono, zero shadows), without rewriting component logic.

**Architecture:** Token-level remap. Keep semantic token names (`--color-primary`, `--color-surface`, `--color-border`) used across ~57 components; rewrite their _values_ in `globals.css` to match Stitch. Add new Stitch-specific tokens (`--color-primary-container`, `--color-on-surface-variant`) alongside. Replace fonts at the `next/font` layer. Touch `Button.tsx` once to drop `rounded-lg`. Sweep components only where hardcoded hex/radius/shadow leaks the old aesthetic.

**Tech Stack:** Tailwind CSS v4 `@theme`, `next/font/google`, React 19, Next.js 16 Pages Router. No new deps.

**Stitch project:** `4683768170577706110` — "Apex Cinematic Tactical". Source tokens live in `DESIGN.md` + `src/styles/design-tokens.css` (already seeded, not yet imported).

---

## File Structure

**Modify:**

- `src/styles/globals.css` — replace light/dark `@theme` color block, drop rounded-lg defaults, remove shadows from elevation tokens, switch font variables.
- `src/styles/design-tokens.css` — already exists, imported by `globals.css` after migration.
- `src/pages/_app.tsx` — swap `DM_Sans` + `Outbrave` for `Hanken_Grotesk` + `JetBrains_Mono` via `next/font/google`.
- `src/components/ui/Button/Button.tsx` — drop `rounded-lg` from `baseClassButton`, uppercase labels, recolor `ghost-danger`/`ghost-primary` to use new tokens.
- `src/components/ui/Button/Button.spec.tsx` — verify class no longer contains `rounded`.
- Any component with hardcoded hex / hardcoded `rounded-*` that visually fights the brutalist theme. Identified during Task 6 sweep.

**Create:**

- `scripts/lint-design-tokens.ts` — node script: greps `src/` for forbidden patterns (hex literals in `.tsx`, raw `rounded-` outside design-tokens, `shadow-elevation-*`). Run in CI.

**Out of scope:**

- Stitch screen-by-screen layout replication.
- New page designs (e.g., "Apex Tactical Dossier" About page).
- Dark/light theme toggle redesign — Stitch is dark-only, so the existing toggle becomes a no-op or is removed in a follow-up.

---

## Token Mapping

Old token → New value (Stitch). Names stay the same to minimize component churn unless noted.

| Token (kept name)              | Old value             | New value (Stitch)           |
| ------------------------------ | --------------------- | ---------------------------- |
| `--color-primary`              | `#b45309` (amber)     | `#ffdb00` (mustard) \*       |
| `--color-primary-light`        | `#d97706`             | `#ffe25c`                    |
| `--color-on-primary`           | `#ffffff`             | `#0a0a0a` (black on mustard) |
| `--color-secondary`            | `#0f766e` (teal)      | `#c8c6c5` (grey)             |
| `--color-secondary-light`      | `#14b8a6`             | `#474746`                    |
| `--color-surface`              | `#fafaf9` (light)     | `#131313`                    |
| `--color-surface-alt`          | `#f5f5f4`             | `#1c1b1b`                    |
| `--color-surface-elevated`     | `#ffffff`             | `#201f1f`                    |
| `--color-surface-inverse`      | `#1c1917`             | `#e5e2e1`                    |
| `--color-on-surface`           | `#1c1917`             | `#e5e2e1`                    |
| `--color-on-surface-secondary` | `#78716c`             | `#cfc6ab`                    |
| `--color-on-surface-inverse`   | `#ffffff`             | `#313030`                    |
| `--color-border`               | `#d6d3d1`             | `#333333`                    |
| `--color-border-subtle`        | `#e7e5e4`             | `#4c4732`                    |
| `--color-overlay`              | `rgba(0,0,0,0.5)`     | `rgba(0,0,0,0.85)`           |
| `--color-danger`               | `#dc2626`             | `#ffb4ab`                    |
| `--color-danger-hover`         | `#b91c1c`             | `#93000a`                    |
| `--font-sans`                  | `var(--font-dm-sans)` | `var(--font-hanken-grotesk)` |
| `--font-mono` (new)            | —                     | `var(--font-jetbrains-mono)` |
| `--font-outbrave`              | (local TTF/OTF)       | DELETE — replaced by Hanken  |
| `--shadow-elevation-*`         | amber-tinted shadows  | DELETE — zero-shadow policy  |

\* Stitch defines `--color-primary` as `#fff8ec` (a near-white) and `--color-primary-container` as `#ffdb00` (the actual brand mustard). For the repo, we promote `#ffdb00` to `--color-primary` because that's what every component already binds to. Stitch's `primary` is preserved as `--color-on-primary-surface` for niche cases.

---

## Task 0: Branch + Backup

**Files:**

- N/A

- [ ] **Step 1: Create migration branch from current**

```bash
git checkout -b feat/stitch-design-migration
```

- [ ] **Step 2: Confirm clean working tree**

```bash
git status
```

Expected: working tree clean (or only the already-committed `DESIGN.md`, `design-tokens.css`, `.gitattributes`, `package.json` script additions).

- [ ] **Step 3: Snapshot current dev-server look (manual)**

Run `pnpm dev`, screenshot the home page and `/admin/users` in a browser. Save to `/tmp/pre-migration-home.png`, `/tmp/pre-migration-admin.png`. Used for visual diff later.

- [ ] **Step 4: Commit nothing — proceed**

---

## Task 1: Wire `design-tokens.css` import + remove old `@theme` colors

**Files:**

- Modify: `src/styles/globals.css:1-77`

- [ ] **Step 1: Read current `globals.css` lines 1-77 to confirm structure**

Run: `head -77 src/styles/globals.css`

Expected: `@import 'tailwindcss';` at line 1, light `@theme` block lines 7-53, dark overrides lines 55-77.

- [ ] **Step 2: Replace light `@theme` color block with new Stitch values**

Edit `src/styles/globals.css`, replace lines 8-23 (color tokens only) with:

```css
--color-primary: #ffdb00;
--color-primary-light: #ffe25c;
--color-primary-container: #ffdb00;
--color-on-primary: #0a0a0a;
--color-on-primary-container: #716000;
--color-danger: #ffb4ab;
--color-danger-hover: #93000a;
--color-on-danger: #690005;
--color-secondary: #c8c6c5;
--color-secondary-light: #474746;
--color-surface: #131313;
--color-surface-alt: #1c1b1b;
--color-surface-elevated: #201f1f;
--color-surface-inverse: #e5e2e1;
--color-on-surface: #e5e2e1;
--color-on-surface-secondary: #cfc6ab;
--color-on-surface-inverse: #313030;
--color-on-surface-tertiary: #989177;
--color-on-surface-accent: #ffdb00;
--color-border: #333333;
--color-border-subtle: #4c4732;
--color-overlay: rgba(0, 0, 0, 0.85);
```

- [ ] **Step 3: Delete dark-theme override block (lines 55-77)**

The Stitch design is dark-by-default. Remove the entire `[data-theme='dark'] { ... }` block from `globals.css`.

- [ ] **Step 4: Delete `--shadow-elevation-1/2/3` tokens from `@theme`**

In `globals.css`, find the three `--shadow-elevation-*` declarations and remove them. Stitch is zero-shadow.

- [ ] **Step 5: Run typecheck + build**

Run: `pnpm typecheck && pnpm build`

Expected: PASS. No CSS-related TypeScript errors (CSS is not typechecked, but build will validate Tailwind picks up the tokens).

- [ ] **Step 6: Visual smoke test**

Run: `pnpm dev`. Open `http://localhost:3000`. The site should now render with dark backgrounds and mustard primary. Layout may be visually broken in spots (rounded corners, shadows still applied via Tailwind utilities); that is expected — fixed in later tasks.

- [ ] **Step 7: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat(design): swap @theme color tokens to Stitch Apex values"
```

---

## Task 2: Swap fonts to Hanken Grotesk + JetBrains Mono

**Files:**

- Modify: `src/pages/_app.tsx:6,18-40`
- Modify: `src/styles/globals.css:27` (the `--font-sans` line)
- Modify: `src/styles/globals.css:88-160` (custom `@utility type-*` blocks reference `--font-outbrave`)

- [ ] **Step 1: Read current `_app.tsx` font setup**

Run: `head -50 src/pages/_app.tsx`

- [ ] **Step 2: Replace `DM_Sans` import + Outbrave local font with Hanken Grotesk + JetBrains Mono**

In `src/pages/_app.tsx`:

```ts
import {Hanken_Grotesk, JetBrains_Mono} from 'next/font/google';

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken-grotesk',
  weight: ['400', '500', '700', '800'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500'],
  display: 'swap',
});
```

Delete the `localFont({ src: [...outbrave...] })` block entirely.

- [ ] **Step 3: Update the `<main>` / wrapping element className**

In the same file, replace any class string containing `dmSans.variable` or `outbrave.variable` with `${hankenGrotesk.variable} ${jetbrainsMono.variable}`.

- [ ] **Step 4: Update `globals.css` `--font-sans` token**

In `src/styles/globals.css` line 27, replace:

```css
--font-sans: var(--font-dm-sans), 'DM Sans', sans-serif;
```

with:

```css
--font-sans: var(--font-hanken-grotesk), 'Hanken Grotesk', sans-serif;
--font-mono: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
```

- [ ] **Step 5: Replace `var(--font-outbrave)` in `@utility type-*` blocks**

In `src/styles/globals.css`, every `@utility type-display-lg`, `type-display-sm`, etc. that references `var(--font-outbrave)` — change to `var(--font-hanken-grotesk)`. Add `text-transform: uppercase; letter-spacing: 0.05em;` to the headline utilities to match Stitch's all-caps headline rule.

- [ ] **Step 6: Delete `public/assets/fonts/outbrave.ttf` and `.otf` (optional, but safe)**

Run:

```bash
rm public/assets/fonts/outbrave.ttf public/assets/fonts/outbrave.otf
```

Skip if any non-React asset (PDFs, exports) still uses the file.

- [ ] **Step 7: Build + visual check**

Run: `pnpm build && pnpm dev`. Confirm body copy is now Hanken Grotesk. Headlines uppercase.

- [ ] **Step 8: Commit**

```bash
git add src/pages/_app.tsx src/styles/globals.css public/assets/fonts/
git commit -m "feat(design): swap fonts to Hanken Grotesk + JetBrains Mono"
```

---

## Task 3: Update `Button` primitive for brutalist shape + caps

**Files:**

- Modify: `src/components/ui/Button/Button.tsx:57`
- Modify: `src/components/ui/Button/Button.spec.tsx`

- [ ] **Step 1: Write failing test — Button should NOT have `rounded` in its base class**

Edit `src/components/ui/Button/Button.spec.tsx`. Add:

```ts
it('renders without rounded corners (brutalist shape)', () => {
  render(<Button>Click</Button>);
  const btn = screen.getByRole('button');
  expect(btn.className).not.toMatch(/rounded/);
});
```

Note: CLAUDE.md bans tests that assert on styling. This test is an exception explicitly tied to the brutalist design contract — document the exception in a comment on the test, and once the design has stabilized post-migration, consider removing the test in favor of the `lint:design` script (Task 7) which catches the same regression at the source layer.

- [ ] **Step 2: Run test, confirm failure**

Run: `pnpm test --testPathPattern=Button.spec`

Expected: FAIL — current `baseClassButton` includes `rounded-lg`.

- [ ] **Step 3: Remove `rounded-lg` from `baseClassButton`**

In `src/components/ui/Button/Button.tsx:57`, change:

```ts
const baseClassButton =
  'inline-flex items-center justify-center rounded-lg type-label-sm uppercase tracking-wide font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
```

to:

```ts
const baseClassButton =
  'inline-flex items-center justify-center type-label-sm uppercase tracking-wider font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
```

Also remove `rounded-full` from the loading spinner span (line 87) — replace with `aspect-square`.

- [ ] **Step 4: Run tests**

Run: `pnpm test --testPathPattern=Button.spec`

Expected: PASS.

- [ ] **Step 5: Visual check — admin "Add user" button**

Run `pnpm dev`. Navigate to `/admin/users`. The Add User button should be rectangular, mustard background, black text, uppercase.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Button/Button.tsx src/components/ui/Button/Button.spec.tsx
git commit -m "feat(design): rectangular brutalist Button primitive"
```

---

## Task 4: Remove `rounded-*` from shared UI primitives

**Files:**

- Modify: `src/components/ui/TextInput/TextInput.tsx`
- Modify: `src/components/ui/Textarea/Textarea.tsx`
- Modify: `src/components/ui/NumberInput/NumberInput.tsx`
- Modify: `src/components/ui/Select/Select.tsx`
- Modify: `src/components/ui/Modal/Modal.tsx`
- Modify: `src/components/ui/ConfirmModal/ConfirmModal.tsx`
- Modify: `src/components/ui/Tabs/Tabs.tsx`
- Modify: `src/components/ui/SegmentedControl/SegmentedControl.tsx`
- Modify: `src/components/ui/Badge/Badge.tsx`
- Modify: `src/components/ui/FormField/FormField.tsx`
- Modify: `src/components/ui/ImageUpload/ImageUpload.tsx`

For each file:

- [ ] **Step 1: Open the file and locate every Tailwind `rounded-*` class.**
- [ ] **Step 2: Delete the class (no replacement — sharp corners per Stitch).**
- [ ] **Step 3: Add `border border-border` if the element previously relied on shadow/radius to imply structure.**
- [ ] **Step 4: Run that component's spec file.**

```bash
pnpm test --testPathPattern=<ComponentName>.spec
```

Expected: PASS (existing tests do not assert on `rounded-*` because CLAUDE.md bans styling assertions).

- [ ] **Step 5: After all 11 primitives done, commit**

```bash
git add src/components/ui
git commit -m "feat(design): remove rounded corners from UI primitives"
```

---

## Task 5: Add `--font-mono` to `globals.css` type utilities

**Files:**

- Modify: `src/styles/globals.css`

- [ ] **Step 1: Add new utilities for monospace tokens**

Append to `globals.css`:

```css
@utility type-mono-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

@utility type-mono-data {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.4;
}
```

- [ ] **Step 2: Build to confirm Tailwind picks them up**

Run: `pnpm build`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat(design): add mono type utilities (label, data)"
```

---

## Task 6: Component sweep — remove hardcoded hex + rounded leaks

**Files:** the 49 files identified by `rg -l 'rounded-' src/components/`.

- [ ] **Step 1: Generate the working list**

Run:

```bash
rg -l 'rounded-' src/components/ > /tmp/rounded-files.txt
rg -l '#[0-9a-fA-F]{6}' src/components/ --type tsx >> /tmp/rounded-files.txt
sort -u /tmp/rounded-files.txt > /tmp/sweep-list.txt
wc -l /tmp/sweep-list.txt
```

Expected: ~50 files.

- [ ] **Step 2: For each file, replace hardcoded hex with semantic token**

Forbidden patterns and their replacements:

| Pattern                                                   | Replace with                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| Hardcoded `#fff` / `#ffffff`                              | `text-on-surface` or `bg-surface-elevated`                    |
| `#000` / `#0a0a0a`                                        | `bg-surface` or `text-surface`                                |
| `#b45309` / `#d97706` / `#f59e0b` (old amber)             | `text-primary` / `bg-primary`                                 |
| `rounded-lg` / `rounded-md` / `rounded-full` (decorative) | DELETE                                                        |
| `rounded-full` (avatars, status dots)                     | Replace with sharp 0px (Stitch rule: squares for status dots) |
| `shadow-elevation-*` / `shadow-md` / `shadow-lg`          | DELETE                                                        |

- [ ] **Step 3: Run typecheck + tests after each batch of ~10 files**

```bash
pnpm typecheck
pnpm test
```

- [ ] **Step 4: Spot-check pages in dev server**

Run `pnpm dev`. Visit `/`, `/tours`, `/destinations`, `/rentals`, `/admin/users`, `/admin/tours`. Document any remaining visual issues in `/tmp/sweep-notes.md` for follow-up — do not block on perfect parity.

- [ ] **Step 5: Commit in batches of ~10 files**

```bash
git add src/components/<batch>
git commit -m "feat(design): sweep <batch-name> for Stitch tokens"
```

---

## Task 7: Add `scripts/lint-design-tokens.ts` to catch regressions

**Files:**

- Create: `scripts/lint-design-tokens.ts`
- Modify: `package.json` (add `lint:design` script)

- [ ] **Step 1: Write the script**

Create `scripts/lint-design-tokens.ts` — uses `spawnSync` with an argv array (no shell, no injection surface — pattern is a hardcoded constant):

```ts
import {spawnSync} from 'node:child_process';

const FORBIDDEN = [
  {
    pattern: '#[0-9a-fA-F]{6}',
    glob: 'src/components/**/*.{ts,tsx}',
    label: 'hardcoded hex color',
  },
  {
    pattern: 'rounded-(sm|md|lg|xl|2xl|3xl|full)',
    glob: 'src/components/**/*.{ts,tsx}',
    label: 'rounded utility',
  },
  {
    pattern: 'shadow-elevation',
    glob: 'src/**/*.{ts,tsx,css}',
    label: 'shadow-elevation token',
  },
];

let failed = false;
for (const {pattern, glob, label} of FORBIDDEN) {
  const result = spawnSync('rg', ['-n', '--glob', glob, pattern], {
    encoding: 'utf8',
  });
  if (result.status === 0 && result.stdout.trim()) {
    console.error(`\n[design-lint] FAIL: ${label}\n${result.stdout}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log('[design-lint] PASS');
```

- [ ] **Step 2: Add npm script**

Edit `package.json`, add to `scripts`:

```json
"lint:design": "npx tsx scripts/lint-design-tokens.ts"
```

- [ ] **Step 3: Run the script — confirm zero violations after Task 6 sweep**

Run: `pnpm lint:design`

Expected: `[design-lint] PASS`. If FAIL, return to Task 6 for the listed files.

- [ ] **Step 4: Commit**

```bash
git add scripts/lint-design-tokens.ts package.json
git commit -m "chore(design): add lint:design script to catch token regressions"
```

---

## Task 8: Update `DESIGN.md` last-synced + decide on ThemeToggle

**Files:**

- Modify: `DESIGN.md` (header)
- Delete (option A): `src/components/ui/ThemeToggle/`

- [ ] **Step 1: Decide on ThemeToggle**

Read `src/components/ui/ThemeToggle/ThemeToggle.tsx`. Stitch is dark-only — the toggle is now decorative. Options:

- **A.** Delete `ThemeToggle` and remove from header layout. Recommended.
- **B.** Keep the component, no-op the click handler.

Default: **A.** If user prefers B, skip the delete step.

- [ ] **Step 2: If option A — remove ThemeToggle**

```bash
rm -rf src/components/ui/ThemeToggle
```

Then `rg -l 'ThemeToggle' src/` and remove every import + JSX usage.

- [ ] **Step 3: Update `DESIGN.md` header**

Change `<!-- last-synced: 2026-05-27 -->` to today's date. Confirm `<!-- stitch-project: 4683768170577706110 -->` is correct.

- [ ] **Step 4: Final build + lint + tests**

```bash
pnpm typecheck && pnpm lint && pnpm lint:design && pnpm test && pnpm build
```

Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(design): remove ThemeToggle + final cleanup"
```

---

## Verification Checklist (after Task 8)

- [ ] `pnpm build` — succeeds.
- [ ] `pnpm test` — all unit tests pass.
- [ ] `pnpm lint:design` — zero violations.
- [ ] Dev server `/` renders dark background, mustard CTAs, Hanken Grotesk body.
- [ ] Dev server `/admin/users` — admin shell renders, Add User button rectangular mustard, edit/delete row actions function.
- [ ] No console errors in browser.
- [ ] Diff against `/tmp/pre-migration-*.png` shows expected aesthetic shift, not broken layout.

---

## Risks & Open Questions

- **Dark-only:** Stitch theme has no light variant. Existing users on `[data-theme='light']` will see the dark theme regardless. Decide whether to surface this in product copy or just ship it. If light theme must persist, this plan needs a second token layer — out of scope here.
- **Marketing screenshots/SEO previews:** Old screenshots in `public/og-*.png` show the amber theme. Regenerate after merge.
- **Customer impact:** This is a major visual shift. Confirm with the product owner before merging to `main`.
- **Tour cards / destination cards:** likely use `rounded-2xl` heavily for "friendly" feel. Stitch demands 0px. This will look jarring to existing visitors — flag for design review post-merge.
- **Test exception:** Task 3 adds one rounded-corner assertion to `Button.spec.tsx`, an explicit exception to CLAUDE.md's styling-assertion ban. Justified by the brutalist contract and superseded by `lint:design` (Task 7); revisit after stabilization.
