# Modern Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Prettier, Husky, and lint-staged so that formatting and linting are enforced on every commit, type-checking on every push, and the codebase stays consistent without manual effort.

**Architecture:** Pre-commit hook runs lint-staged (ESLint + Prettier on staged files). Pre-push hook runs `tsc --noEmit`. ESLint config extended with eslint-config-prettier to prevent rule conflicts.

**Tech Stack:** Prettier, Husky, lint-staged, eslint-config-prettier, pnpm

---

### Task 1: Install dependencies

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml` (auto-generated)

- [ ] **Step 1: Install Prettier, Husky, lint-staged, eslint-config-prettier**

Run:

```bash
pnpm add -D prettier husky lint-staged eslint-config-prettier
```

Expected: All four packages added to `devDependencies` in `package.json`.

- [ ] **Step 2: Verify installation**

Run:

```bash
pnpm prettier --version && pnpm husky --version && echo "OK"
```

Expected: Version numbers printed, then "OK".

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add prettier, husky, lint-staged, eslint-config-prettier"
```

---

### Task 2: Configure Prettier

**Files:**

- Create: `.prettierignore`

- [ ] **Step 1: Create `.prettierignore`**

Create `.prettierignore` with this content:

```
.next/
node_modules/
pnpm-lock.yaml
public/
```

No `.prettierrc` file — we use Prettier defaults (2-space indent, double quotes, semicolons, 80 char width).

- [ ] **Step 2: Verify Prettier runs**

Run:

```bash
pnpm prettier --check "src/**/*.{ts,tsx}" 2>&1 | head -20
```

Expected: Either "All matched files use Prettier code style!" or a list of files that would be reformatted. Both are fine — confirms Prettier is working.

- [ ] **Step 3: Commit**

```bash
git add .prettierignore
git commit -m "chore: add prettierignore"
```

---

### Task 3: Add package.json scripts

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Add new scripts to `package.json`**

Add these scripts (leave existing `dev`, `build`, `start`, `lint` untouched):

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "prepare": "husky"
  }
}
```

- [ ] **Step 2: Verify scripts work**

Run:

```bash
pnpm run format:check 2>&1 | tail -5
```

Expected: Prettier check output (pass or fail listing files — both OK at this stage).

Run:

```bash
pnpm run typecheck
```

Expected: No errors (project already compiles under strict mode).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add format, format:check, typecheck, prepare scripts"
```

---

### Task 4: Configure ESLint + Prettier integration

**Files:**

- Modify: `eslint.config.mjs`

- [ ] **Step 1: Add eslint-config-prettier to ESLint config**

Update `eslint.config.mjs` to this:

```js
import {defineConfig, globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettierConfig from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'public/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
```

Key change: imported `eslint-config-prettier` and added it as the last config entry (before `globalIgnores`) so it disables ESLint rules that conflict with Prettier.

- [ ] **Step 2: Verify ESLint still works**

Run:

```bash
pnpm lint
```

Expected: No errors (same as before, just with Prettier-conflicting rules disabled).

- [ ] **Step 3: Commit**

```bash
git add eslint.config.mjs
git commit -m "chore: integrate eslint-config-prettier to disable conflicting rules"
```

---

### Task 5: Set up Husky and git hooks

**Files:**

- Create: `.husky/pre-commit`
- Create: `.husky/pre-push`

- [ ] **Step 1: Initialize Husky**

Run:

```bash
pnpm exec husky init
```

Expected: Creates `.husky/` directory with a default `pre-commit` file.

- [ ] **Step 2: Configure pre-commit hook**

Replace the content of `.husky/pre-commit` with:

```bash
pnpm lint-staged
```

- [ ] **Step 3: Create pre-push hook**

Create `.husky/pre-push` with:

```bash
pnpm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add .husky/
git commit -m "chore: add husky pre-commit and pre-push hooks"
```

---

### Task 6: Configure lint-staged

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Add lint-staged config to `package.json`**

Add this top-level key to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

- [ ] **Step 2: Test lint-staged with a dry run**

Run:

```bash
echo "test" >> src/pages/index.tsx && git add src/pages/index.tsx
pnpm lint-staged 2>&1 | tail -10
git checkout src/pages/index.tsx
```

Expected: lint-staged runs ESLint and Prettier on the staged file, then we restore the file.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add lint-staged config for ts, tsx, json, css, md files"
```

---

### Task 7: Format existing codebase

**Files:**

- Modify: all `src/**/*.{ts,tsx}`, `*.json`, `*.css`, `*.md` files

- [ ] **Step 1: Run Prettier on the entire codebase**

Run:

```bash
pnpm run format
```

Expected: Prettier reformats all files to match defaults. Output shows list of files changed.

- [ ] **Step 2: Verify ESLint still passes**

Run:

```bash
pnpm lint
```

Expected: No errors.

- [ ] **Step 3: Verify TypeScript still compiles**

Run:

```bash
pnpm run typecheck
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: format entire codebase with prettier defaults"
```

---

### Task 8: Final verification

- [ ] **Step 1: Verify the full pre-commit flow works end-to-end**

Make a small whitespace change, stage it, and commit:

```bash
echo "" >> src/pages/index.tsx
git add src/pages/index.tsx
git commit -m "test: verify pre-commit hook"
```

Expected: lint-staged runs ESLint + Prettier on `src/pages/index.tsx` before the commit succeeds.

- [ ] **Step 2: Revert the test commit**

```bash
git reset --soft HEAD~1
git checkout src/pages/index.tsx
```

- [ ] **Step 3: Verify pre-push hook**

Run the typecheck manually (same command the hook uses):

```bash
pnpm run typecheck
```

Expected: No errors — confirms the pre-push hook will pass.
