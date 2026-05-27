# Common Translation Keys Consolidation — Design

**Date:** 2026-05-26
**Status:** Draft

## Problem

Per-feature translation namespaces (`admin.users`, `admin.perks`, `admin.roles`, `tours`, `home`, etc.) duplicate generic UI strings (`cancel`, `edit`, `delete`, `save`, `back`, `loading`, `search`, `role`, `password`, …). CLAUDE.md already mandates reuse via `common.*`, but legacy keys keep landing under feature namespaces. Result:

- Untranslated leaks in UI (e.g., `ADMIN.USERS.CANCEL` rendered literally).
- DB bloat in `Translation` table.
- No mechanical enforcement.

## Goal

Detect duplicates across all namespaces, consolidate to `common.*`, rewrite call sites, and drop the legacy DB rows — once, deterministically, with a manual-curation gate.

## Non-Goals

- Auto-detection of unused keys.
- Locale value normalization (trim, casing).
- Rollback script — git revert + DB re-seed is the recovery path.
- CI integration. Cleanup is a one-shot manual run on the VPS post-merge.
- Reorganizing the `common.*` key set itself.

## Architecture

Three artifacts, two scripts, one committed allowlist.

```
scripts/scan-common-translations.ts    (read-only scanner; outputs candidates)
scripts/common-keys-allowlist.ts       (committed source-of-truth mappings)
scripts/apply-common-translations.ts   (codemod + DB cleanup; --dry-run by default)
```

### Components

#### 1. `scripts/scan-common-translations.ts`

- Reads every row of `Translation` from the DB.
- Builds two indexes:
  - **By leaf key** — `cancel` → `[admin.users.cancel, admin.perks.cancel, …]`
  - **By value pair** — `("Hủy","Cancel")` → `[admin.users.cancelBtn, common.cancel, …]`
- Emits candidates when either index has ≥2 entries AND at least one entry is NOT already under `common`.
- Scope: **all namespaces** (not just `admin.*`).
- Output:
  - `scripts/.common-keys-candidates.json` (gitignored) — full diagnostic dump.
  - Stdout: a TypeScript starter block ready to paste into `common-keys-allowlist.ts`.

#### 2. `scripts/common-keys-allowlist.ts`

Committed source-of-truth. Human curates after running the scanner.

```ts
export type CommonKeyMapping = {
  from: {namespace: string; key: string};
  to: {key: string}; // always lands under 'common'
  // Optional override when VI/EN values differ across sources, or when
  // collision with an existing common.<key> requires explicit resolution.
  value?: {vi: string; en: string};
};

export const COMMON_KEY_MAPPINGS: CommonKeyMapping[] = [
  // { from: { namespace: 'admin.users', key: 'cancel' }, to: { key: 'cancel' } },
];
```

#### 3. `scripts/apply-common-translations.ts`

Two stages, executed in order. Default `--dry-run`; requires `--apply` to mutate.

**Stage A — Codemod over `src/**/\*.{ts,tsx}`\*\*

For each mapping `{from: {ns, key}, to: {key: commonKey}}`:

1. Find files calling `useTranslations('<ns>')`. Read the actual binding name (commonly `t`).
2. Find calls of `<binding>('<key>')` in that file.
3. Replace with `tc('<commonKey>')`.
4. If file lacks `useTranslations('common')`, inject `const tc = useTranslations('common')` adjacent to the existing hook.
5. If the original hook still has other keys in use, leave it. Never delete the legacy hook in this pass — non-common keys may remain.

Emits `migration-report.md` listing every file/line rewritten. Files with destructured `useTranslations` bindings or other ambiguity are reported as **manual** and skipped.

**Stage B — DB cleanup via Prisma**

For each mapping, inside a single `prisma.$transaction`:

1. Upsert `common.<commonKey>` using the value from the `from` row (or the explicit `value` override).
2. Delete the `<ns>.<key>` row.
3. Idempotent — if the `from` row no longer exists, skip without error.

Logs row counts before/after.

## Data Flow

```
1. pnpm tsx scripts/scan-common-translations.ts
   → reads DB → writes candidates JSON + stdout TS block

2. Edit scripts/common-keys-allowlist.ts
   → paste TS block, prune false positives, add value overrides as needed

3. pnpm tsx scripts/apply-common-translations.ts
   → dry-run; prints code diff + DB diff, no mutation

4. pnpm tsx scripts/apply-common-translations.ts --apply
   → rewrites src/, mutates local DB

5. pnpm build && pnpm test && manual smoke
   → verify nothing renders raw keys

6. Commit allowlist + codemod changes; open PR; merge to main
   → deploy runs as usual (no script in CI)

7. SSH to VPS, run: pnpm tsx scripts/apply-common-translations.ts --apply
   → cleans prod DB rows (idempotent; safe to re-run)
```

## Error Handling

- **Value conflicts.** Two `from` rows resolve to different VI/EN values → script refuses, requires explicit `value` override in the mapping. Loud failure with row list.
- **Collision with existing `common.<key>`.** Target `common.<key>` already exists with a different value → require `--force-overwrite` flag OR explicit `value` override in the mapping.
- **Codemod ambiguity.** Destructured or aliased `useTranslations` binding the script can't resolve → reported as manual in `migration-report.md`, no automatic rewrite.
- **Transaction rollback.** Any DB error aborts the whole `$transaction`. Code rewrites happen on the filesystem before DB stage — if DB stage fails after code stage succeeds, the code changes are already on disk, which is fine: rerun DB stage independently.

## Testing

- Unit test the candidate scanner against fixture rows (key-match and value-match cases).
- Unit test the mapping applier (DB stage) against a test SQLite instance or mocked Prisma client.
- Snapshot test the codemod on 2–3 representative `.tsx` fixtures, including an admin page with `useTranslations('admin.users')` calling `t('cancel')` → expect `tc('cancel')` + hook injection.
- No styling assertions (per CLAUDE.md testing rule).

## Open Questions / Risks

- **`ts-morph` dependency.** Codemod stage benefits from an AST tool. If `ts-morph` is not already available, decide at implementation time between adding it (requires user approval per CLAUDE.md) vs. a regex-only pass with a narrower safety envelope.
- **Seed-file drift.** Existing `prisma/seed-*-translations.ts` and `scripts/seed-*-translations.ts` files may re-insert legacy keys on next deploy. Implementation plan must update or annotate seeds to stop writing rows now owned by `common.*`.

## Out of Scope (YAGNI)

- Auto-detecting unused keys.
- Locale-value normalization.
- Rollback script.
- CI integration / deploy-hook automation.
