# Modern Tooling: Pre-commit Hooks + Formatting

## Summary

Add Prettier for code formatting, Husky + lint-staged for git hooks, and integrate ESLint with Prettier to prevent rule conflicts. The goal is to catch errors before they hit CI and enforce consistent formatting automatically.

## Architecture

```
Pre-commit (lint-staged, ~3s)
  ├── *.{ts,tsx} → ESLint --fix + Prettier --write
  └── *.{json,css,md} → Prettier --write

Pre-push (tsc, ~5-10s)
  └── tsc --noEmit (full project type-check)

CI on PR (existing + new)
  └── next build (full build validation)
```

## New Dependencies (devDependencies)

- `prettier` — code formatter
- `husky` — git hook manager
- `lint-staged` — run commands on staged files only
- `eslint-config-prettier` — disables ESLint rules that conflict with Prettier

## Changes

### 1. Prettier

- No `.prettierrc` — use Prettier defaults (2-space indent, double quotes, semicolons, 80 char width)
- Add `.prettierignore`:
  ```
  .next/
  node_modules/
  pnpm-lock.yaml
  public/
  ```

### 2. Husky + lint-staged

- Run `husky init` to create `.husky/` directory (tracked in git)
- `.husky/pre-commit`: runs `pnpm lint-staged`
- `.husky/pre-push`: runs `pnpm run typecheck`
- lint-staged config in `package.json`:
  ```json
  {
    "lint-staged": {
      "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
      "*.{json,css,md}": ["prettier --write"]
    }
  }
  ```
- `prepare` script in `package.json` runs `husky` on install

### 3. ESLint + Prettier integration

- Add `eslint-config-prettier` as the last entry in `eslint.config.mjs` to disable conflicting rules
- ESLint and Prettier run as separate tools via lint-staged (no `eslint-plugin-prettier`)

### 4. Package.json scripts

New scripts:

- `"format"` — `prettier --write .`
- `"format:check"` — `prettier --check .`
- `"typecheck"` — `tsc --noEmit`
- `"prepare"` — `husky`

Existing scripts (`dev`, `build`, `start`, `lint`) unchanged.

## Out of Scope

- TSLint (deprecated, absorbed into typescript-eslint which is already included via eslint-config-next)
- `eslint-plugin-prettier` (separate tools is cleaner and faster)
- Build on pre-commit (moved to CI on PR)
- Test framework setup
- Bundle analysis / dependency auditing
