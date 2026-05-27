# Common Translation Keys Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect duplicate translation keys across all namespaces, consolidate them into `common.*`, rewrite call sites, and drop legacy DB rows — driven by a human-curated allowlist.

**Architecture:** Three artifacts in `scripts/`: a read-only scanner that proposes candidates, a committed TypeScript allowlist (source of truth), and an applier that runs a codemod over `src/` and a Prisma cleanup in one go. The applier defaults to `--dry-run`; `--apply` mutates. Production cleanup is a manual one-shot SSH run post-merge.

**Tech Stack:** TypeScript, Node (`npx tsx`), Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`), Jest 30. **No new dependencies** — codemod uses regex passes against `.tsx`/`.ts` source (matches the project's existing pattern in `scripts/migrate-*-translations.ts`).

---

## File Structure

| Path                                   | Responsibility                                                                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/scan-common-translations.ts`  | Read-only scanner. Builds key-leaf and value-pair indexes from the `Translation` table. Emits diagnostic JSON + a TS starter block for the allowlist. |
| `scripts/common-keys-allowlist.ts`     | Committed source-of-truth. Exports `COMMON_KEY_MAPPINGS: CommonKeyMapping[]`. Curated by hand from scanner output.                                    |
| `scripts/apply-common-translations.ts` | Two-stage applier: (A) codemod over `src/**/*.{ts,tsx}`, (B) Prisma transaction. Default `--dry-run`.                                                 |
| `scripts/lib/translation-db.ts`        | Tiny shared module: builds a Prisma client with the pg adapter and loads `.env`.                                                                      |
| `scripts/lib/codemod.ts`               | Pure functions for the codemod (parse, rewrite, inject hook). Exported so it can be unit-tested.                                                      |
| `scripts/lib/codemod.spec.ts`          | Jest snapshot/unit tests for the codemod.                                                                                                             |
| `scripts/lib/scan.ts`                  | Pure scanner functions (group-by-key, group-by-value, candidate filter). Exported for tests.                                                          |
| `scripts/lib/scan.spec.ts`             | Jest unit tests for the scanner.                                                                                                                      |
| `scripts/lib/apply-db.ts`              | Pure functions describing the DB stage as a list of operations. Exported for tests.                                                                   |
| `scripts/lib/apply-db.spec.ts`         | Jest unit tests for the DB-stage planner.                                                                                                             |
| `.gitignore`                           | Add `scripts/.common-keys-candidates.json` and `scripts/migration-report.md`.                                                                         |
| `package.json`                         | Add scripts: `i18n:scan`, `i18n:apply`, `i18n:apply:write`.                                                                                           |
| `CLAUDE.md`                            | Add a reinforced rule about checking `common.*` first when adding any translation key.                                                                |

---

## Task 1: Scaffold shared DB helper

**Files:**

- Create: `scripts/lib/translation-db.ts`

- [ ] **Step 1: Create the helper**

```ts
// scripts/lib/translation-db.ts
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

function loadDotenvIfMissing() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.substring(0, eq);
    let value = trimmed.substring(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

export function createPrisma(): PrismaClient {
  loadDotenvIfMissing();
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }
  const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
  return new PrismaClient({adapter});
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/lib/translation-db.ts
git commit -m "chore(i18n): add shared Prisma helper for translation scripts"
```

---

## Task 2: Pure scanner functions + tests (TDD)

**Files:**

- Create: `scripts/lib/scan.ts`
- Test: `scripts/lib/scan.spec.ts`

- [ ] **Step 1: Write failing test**

```ts
// scripts/lib/scan.spec.ts
import {findCandidates, TranslationRow} from './scan';

const rows: TranslationRow[] = [
  {namespace: 'admin.users', key: 'cancel', valueVi: 'Hủy', valueEn: 'Cancel'},
  {namespace: 'admin.perks', key: 'cancel', valueVi: 'Hủy', valueEn: 'Cancel'},
  {namespace: 'common', key: 'save', valueVi: 'Lưu', valueEn: 'Save'},
  {namespace: 'admin.users', key: 'saveBtn', valueVi: 'Lưu', valueEn: 'Save'},
  {namespace: 'admin.users', key: 'uniqueField', valueVi: 'X', valueEn: 'X'},
];

describe('findCandidates', () => {
  it('groups by leaf key when at least two non-common namespaces share it', () => {
    const result = findCandidates(rows);
    const byKey = result.byKey.find((g) => g.key === 'cancel');
    expect(byKey?.sources.map((s) => s.namespace).sort()).toEqual([
      'admin.perks',
      'admin.users',
    ]);
  });

  it('groups by VI+EN value pair across namespaces', () => {
    const result = findCandidates(rows);
    const byValue = result.byValue.find(
      (g) => g.valueVi === 'Lưu' && g.valueEn === 'Save',
    );
    expect(byValue?.sources.length).toBeGreaterThanOrEqual(2);
    expect(byValue?.sources.some((s) => s.namespace === 'common')).toBe(true);
  });

  it('skips singletons', () => {
    const result = findCandidates(rows);
    expect(result.byKey.find((g) => g.key === 'uniqueField')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx jest scripts/lib/scan.spec.ts`
Expected: FAIL — `Cannot find module './scan'`.

- [ ] **Step 3: Implement scanner**

```ts
// scripts/lib/scan.ts
export type TranslationRow = {
  namespace: string;
  key: string;
  valueVi: string;
  valueEn: string;
};

export type KeyGroup = {
  key: string;
  sources: TranslationRow[];
};

export type ValueGroup = {
  valueVi: string;
  valueEn: string;
  sources: TranslationRow[];
};

export type ScanResult = {
  byKey: KeyGroup[];
  byValue: ValueGroup[];
};

export function findCandidates(rows: TranslationRow[]): ScanResult {
  const keyMap = new Map<string, TranslationRow[]>();
  const valueMap = new Map<string, TranslationRow[]>();

  for (const row of rows) {
    const keyBucket = keyMap.get(row.key) ?? [];
    keyBucket.push(row);
    keyMap.set(row.key, keyBucket);

    const valueKey = `${row.valueVi} ${row.valueEn}`;
    const valueBucket = valueMap.get(valueKey) ?? [];
    valueBucket.push(row);
    valueMap.set(valueKey, valueBucket);
  }

  const byKey: KeyGroup[] = [];
  for (const [key, sources] of keyMap) {
    const nonCommon = sources.filter((s) => s.namespace !== 'common');
    if (nonCommon.length >= 2) {
      byKey.push({key, sources: nonCommon});
    }
  }

  const byValue: ValueGroup[] = [];
  for (const [, sources] of valueMap) {
    if (sources.length < 2) continue;
    const hasNonCommon = sources.some((s) => s.namespace !== 'common');
    if (!hasNonCommon) continue;
    byValue.push({
      valueVi: sources[0].valueVi,
      valueEn: sources[0].valueEn,
      sources,
    });
  }

  return {byKey, byValue};
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx jest scripts/lib/scan.spec.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/scan.ts scripts/lib/scan.spec.ts
git commit -m "feat(i18n): add translation candidate scanner (pure)"
```

---

## Task 3: Scanner CLI script

**Files:**

- Create: `scripts/scan-common-translations.ts`
- Modify: `.gitignore`
- Modify: `package.json`

- [ ] **Step 1: Write the CLI**

```ts
// scripts/scan-common-translations.ts
import * as fs from 'fs';
import * as path from 'path';
import {createPrisma} from './lib/translation-db';
import {findCandidates, TranslationRow} from './lib/scan';

async function main() {
  const prisma = createPrisma();
  try {
    const rows = (await prisma.translation.findMany({
      select: {namespace: true, key: true, valueVi: true, valueEn: true},
    })) as TranslationRow[];

    const result = findCandidates(rows);

    const outPath = path.join(__dirname, '.common-keys-candidates.json');
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`Wrote ${outPath}`);
    console.log(
      `byKey groups: ${result.byKey.length}, byValue groups: ${result.byValue.length}`,
    );

    console.log('\n// --- starter block for common-keys-allowlist.ts ---');
    console.log('export const COMMON_KEY_MAPPINGS: CommonKeyMapping[] = [');
    for (const g of result.byKey) {
      for (const src of g.sources) {
        console.log(
          `  // { from: { namespace: '${src.namespace}', key: '${src.key}' }, to: { key: '${g.key}' } }, // "${src.valueEn}"`,
        );
      }
    }
    console.log('];');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Update `.gitignore`**

Append:

```
scripts/.common-keys-candidates.json
scripts/migration-report.md
```

- [ ] **Step 3: Add npm script**

Edit `package.json` — add inside `"scripts"`:

```json
"i18n:scan": "npx tsx scripts/scan-common-translations.ts",
```

- [ ] **Step 4: Smoke run**

Run: `pnpm i18n:scan`
Expected: prints group counts, writes `scripts/.common-keys-candidates.json`, prints starter block on stdout. No DB mutation.

- [ ] **Step 5: Commit**

```bash
git add scripts/scan-common-translations.ts .gitignore package.json
git commit -m "feat(i18n): add scan-common-translations CLI"
```

---

## Task 4: Allowlist type + empty seed

**Files:**

- Create: `scripts/common-keys-allowlist.ts`

- [ ] **Step 1: Write the file**

```ts
// scripts/common-keys-allowlist.ts
export type CommonKeyMapping = {
  from: {namespace: string; key: string};
  to: {key: string};
  /** Optional override when VI/EN values differ across sources, or to
   *  resolve a collision with an existing common.<key>. */
  value?: {vi: string; en: string};
};

export const COMMON_KEY_MAPPINGS: CommonKeyMapping[] = [];
```

- [ ] **Step 2: Commit**

```bash
git add scripts/common-keys-allowlist.ts
git commit -m "feat(i18n): add empty common-keys allowlist"
```

---

## Task 5: DB-stage planner + tests (TDD)

**Files:**

- Create: `scripts/lib/apply-db.ts`
- Test: `scripts/lib/apply-db.spec.ts`

- [ ] **Step 1: Write failing test**

```ts
// scripts/lib/apply-db.spec.ts
import {planDbOperations} from './apply-db';
import type {CommonKeyMapping} from '../common-keys-allowlist';
import type {TranslationRow} from './scan';

const allowlist: CommonKeyMapping[] = [
  {from: {namespace: 'admin.users', key: 'cancel'}, to: {key: 'cancel'}},
  {from: {namespace: 'admin.perks', key: 'cancel'}, to: {key: 'cancel'}},
];

const rows: TranslationRow[] = [
  {namespace: 'admin.users', key: 'cancel', valueVi: 'Hủy', valueEn: 'Cancel'},
  {namespace: 'admin.perks', key: 'cancel', valueVi: 'Hủy', valueEn: 'Cancel'},
];

describe('planDbOperations', () => {
  it('produces an upsert + delete per mapping', () => {
    const plan = planDbOperations(allowlist, rows, {forceOverwrite: false});
    expect(plan.ops).toEqual([
      {
        type: 'upsert',
        namespace: 'common',
        key: 'cancel',
        valueVi: 'Hủy',
        valueEn: 'Cancel',
      },
      {type: 'delete', namespace: 'admin.users', key: 'cancel'},
      {type: 'delete', namespace: 'admin.perks', key: 'cancel'},
    ]);
    expect(plan.errors).toEqual([]);
  });

  it('skips silently when source row is already gone (idempotent)', () => {
    const plan = planDbOperations(allowlist, [], {forceOverwrite: false});
    expect(plan.ops).toEqual([]);
    expect(plan.errors).toEqual([]);
  });

  it('errors on conflicting source values without explicit override', () => {
    const conflictRows: TranslationRow[] = [
      {
        namespace: 'admin.users',
        key: 'cancel',
        valueVi: 'Hủy',
        valueEn: 'Cancel',
      },
      {
        namespace: 'admin.perks',
        key: 'cancel',
        valueVi: 'Bỏ',
        valueEn: 'Abort',
      },
    ];
    const plan = planDbOperations(allowlist, conflictRows, {
      forceOverwrite: false,
    });
    expect(plan.errors.length).toBeGreaterThan(0);
    expect(plan.errors[0]).toMatch(/conflict/i);
  });

  it('errors on collision with existing common.key of different value', () => {
    const conflictRows: TranslationRow[] = [
      {namespace: 'common', key: 'cancel', valueVi: 'Khác', valueEn: 'Other'},
      {
        namespace: 'admin.users',
        key: 'cancel',
        valueVi: 'Hủy',
        valueEn: 'Cancel',
      },
      {
        namespace: 'admin.perks',
        key: 'cancel',
        valueVi: 'Hủy',
        valueEn: 'Cancel',
      },
    ];
    const plan = planDbOperations(allowlist, conflictRows, {
      forceOverwrite: false,
    });
    expect(plan.errors.length).toBeGreaterThan(0);
    expect(plan.errors[0]).toMatch(/collision/i);
  });

  it('honors forceOverwrite and explicit value override', () => {
    const conflictRows: TranslationRow[] = [
      {namespace: 'common', key: 'cancel', valueVi: 'Khác', valueEn: 'Other'},
      {
        namespace: 'admin.users',
        key: 'cancel',
        valueVi: 'Hủy',
        valueEn: 'Cancel',
      },
    ];
    const overrideList: CommonKeyMapping[] = [
      {
        from: {namespace: 'admin.users', key: 'cancel'},
        to: {key: 'cancel'},
        value: {vi: 'Hủy', en: 'Cancel'},
      },
    ];
    const plan = planDbOperations(overrideList, conflictRows, {
      forceOverwrite: true,
    });
    expect(plan.errors).toEqual([]);
    expect(plan.ops[0]).toEqual({
      type: 'upsert',
      namespace: 'common',
      key: 'cancel',
      valueVi: 'Hủy',
      valueEn: 'Cancel',
    });
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx jest scripts/lib/apply-db.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement planner**

```ts
// scripts/lib/apply-db.ts
import type {CommonKeyMapping} from '../common-keys-allowlist';
import type {TranslationRow} from './scan';

export type DbOp =
  | {
      type: 'upsert';
      namespace: 'common';
      key: string;
      valueVi: string;
      valueEn: string;
    }
  | {type: 'delete'; namespace: string; key: string};

export type DbPlan = {ops: DbOp[]; errors: string[]};

export type PlanOptions = {forceOverwrite: boolean};

function findRow(rows: TranslationRow[], ns: string, key: string) {
  return rows.find((r) => r.namespace === ns && r.key === key);
}

export function planDbOperations(
  mappings: CommonKeyMapping[],
  rows: TranslationRow[],
  opts: PlanOptions,
): DbPlan {
  const ops: DbOp[] = [];
  const errors: string[] = [];

  const byTarget = new Map<string, CommonKeyMapping[]>();
  for (const m of mappings) {
    const bucket = byTarget.get(m.to.key) ?? [];
    bucket.push(m);
    byTarget.set(m.to.key, bucket);
  }

  for (const [commonKey, group] of byTarget) {
    const sources = group
      .map((m) => ({m, row: findRow(rows, m.from.namespace, m.from.key)}))
      .filter((x) => x.row !== undefined) as {
      m: CommonKeyMapping;
      row: TranslationRow;
    }[];

    if (sources.length === 0) continue;

    let canonicalVi: string;
    let canonicalEn: string;
    const explicitOverride = group.find((m) => m.value)?.value;
    if (explicitOverride) {
      canonicalVi = explicitOverride.vi;
      canonicalEn = explicitOverride.en;
    } else {
      const first = sources[0].row;
      const conflict = sources.find(
        (s) =>
          s.row.valueVi !== first.valueVi || s.row.valueEn !== first.valueEn,
      );
      if (conflict) {
        errors.push(
          `Source value conflict for common.${commonKey}: ` +
            `${first.namespace}.${first.key}=("${first.valueVi}","${first.valueEn}") vs ` +
            `${conflict.row.namespace}.${conflict.row.key}=("${conflict.row.valueVi}","${conflict.row.valueEn}"). ` +
            `Add an explicit "value" override on the mapping.`,
        );
        continue;
      }
      canonicalVi = first.valueVi;
      canonicalEn = first.valueEn;
    }

    const existing = findRow(rows, 'common', commonKey);
    if (
      existing &&
      (existing.valueVi !== canonicalVi || existing.valueEn !== canonicalEn) &&
      !opts.forceOverwrite &&
      !explicitOverride
    ) {
      errors.push(
        `Collision with existing common.${commonKey}=("${existing.valueVi}","${existing.valueEn}") ` +
          `vs incoming ("${canonicalVi}","${canonicalEn}"). ` +
          `Re-run with --force-overwrite or add an explicit "value" override.`,
      );
      continue;
    }

    ops.push({
      type: 'upsert',
      namespace: 'common',
      key: commonKey,
      valueVi: canonicalVi,
      valueEn: canonicalEn,
    });
    for (const s of sources) {
      ops.push({
        type: 'delete',
        namespace: s.m.from.namespace,
        key: s.m.from.key,
      });
    }
  }

  return {ops, errors};
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx jest scripts/lib/apply-db.spec.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/apply-db.ts scripts/lib/apply-db.spec.ts
git commit -m "feat(i18n): add DB-stage operation planner"
```

---

## Task 6: Codemod pure functions + tests (TDD)

**Files:**

- Create: `scripts/lib/codemod.ts`
- Test: `scripts/lib/codemod.spec.ts`

- [ ] **Step 1: Write failing test**

```ts
// scripts/lib/codemod.spec.ts
import {rewriteSource, CodemodMapping} from './codemod';

const mappings: CodemodMapping[] = [
  {fromNamespace: 'admin.users', fromKey: 'cancel', toKey: 'cancel'},
];

describe('rewriteSource', () => {
  it('replaces t("key") with tc("commonKey") and injects hook', () => {
    const input = `
import {useTranslations} from 'next-intl';
export function UserForm() {
  const t = useTranslations('admin.users');
  return <button>{t('cancel')}</button>;
}
`;
    const {output, changes, manual} = rewriteSource(
      'UserForm.tsx',
      input,
      mappings,
    );
    expect(manual).toEqual([]);
    expect(changes.length).toBe(1);
    expect(output).toContain("const tc = useTranslations('common')");
    expect(output).toContain("tc('cancel')");
    expect(output).not.toContain("t('cancel')");
    expect(output).toContain("const t = useTranslations('admin.users')");
  });

  it('reuses existing common hook when present', () => {
    const input = `
import {useTranslations} from 'next-intl';
export function UserForm() {
  const t = useTranslations('admin.users');
  const tc = useTranslations('common');
  return <><span>{tc('save')}</span><button>{t('cancel')}</button></>;
}
`;
    const {output} = rewriteSource('UserForm.tsx', input, mappings);
    const matches = output.match(/useTranslations\('common'\)/g) ?? [];
    expect(matches.length).toBe(1);
    expect(output).toContain("tc('cancel')");
  });

  it('reports manual when binding is destructured', () => {
    const input = `
import {useTranslations} from 'next-intl';
export function Weird() {
  const {raw: t} = useTranslations('admin.users') as any;
  return <>{t('cancel')}</>;
}
`;
    const {manual, changes} = rewriteSource('Weird.tsx', input, mappings);
    expect(changes).toEqual([]);
    expect(manual.length).toBe(1);
  });

  it('no-ops when namespace not used in file', () => {
    const input = `
import {useTranslations} from 'next-intl';
export function Other() {
  const t = useTranslations('admin.perks');
  return <>{t('cancel')}</>;
}
`;
    const {output, changes} = rewriteSource('Other.tsx', input, mappings);
    expect(output).toBe(input);
    expect(changes).toEqual([]);
  });

  it('chooses a non-colliding alias if `tc` is already taken', () => {
    const input = `
import {useTranslations} from 'next-intl';
export function UserForm() {
  const t = useTranslations('admin.users');
  const tc = 'someUnrelatedVar';
  return <button>{t('cancel')}</button>;
}
`;
    const {output, changes} = rewriteSource('UserForm.tsx', input, mappings);
    expect(changes.length).toBe(1);
    expect(output).toMatch(/const tc2 = useTranslations\('common'\)/);
    expect(output).toContain("tc2('cancel')");
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx jest scripts/lib/codemod.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement codemod**

```ts
// scripts/lib/codemod.ts
export type CodemodMapping = {
  fromNamespace: string;
  fromKey: string;
  toKey: string;
};

export type Change = {
  fromNamespace: string;
  fromKey: string;
  toKey: string;
  alias: string;
};

export type ManualEntry = {reason: string};

export type RewriteResult = {
  output: string;
  changes: Change[];
  manual: ManualEntry[];
};

function escRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findHookBinding(
  source: string,
  namespace: string,
): {binding: string} | {destructured: true} | null {
  const ns = escRe(namespace);
  const re = new RegExp(
    `const\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*useTranslations\\(\\s*['"]${ns}['"]\\s*\\)\\s*;?`,
    'm',
  );
  const m = re.exec(source);
  if (m) return {binding: m[1]};
  const destructRe = new RegExp(
    `const\\s*\\{[^}]*\\}\\s*=\\s*useTranslations\\(\\s*['"]${ns}['"]\\s*\\)`,
    'm',
  );
  if (destructRe.test(source)) return {destructured: true};
  return null;
}

function findExistingCommonAlias(source: string): string | null {
  const re =
    /const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*useTranslations\(\s*['"]common['"]\s*\)/m;
  const m = re.exec(source);
  return m ? m[1] : null;
}

function pickAlias(source: string, preferred: string): string {
  if (!new RegExp(`\\b${preferred}\\b`).test(source)) return preferred;
  let n = 2;
  while (new RegExp(`\\b${preferred}${n}\\b`).test(source)) n++;
  return `${preferred}${n}`;
}

export function rewriteSource(
  _filename: string,
  source: string,
  mappings: CodemodMapping[],
): RewriteResult {
  let output = source;
  const changes: Change[] = [];
  const manual: ManualEntry[] = [];

  const byNs = new Map<string, CodemodMapping[]>();
  for (const m of mappings) {
    const bucket = byNs.get(m.fromNamespace) ?? [];
    bucket.push(m);
    byNs.set(m.fromNamespace, bucket);
  }

  for (const [ns, group] of byNs) {
    const hook = findHookBinding(output, ns);
    if (!hook) continue;
    if ('destructured' in hook) {
      manual.push({
        reason: `Destructured useTranslations('${ns}') — rewrite manually.`,
      });
      continue;
    }

    const {binding} = hook;

    let alias = findExistingCommonAlias(output);
    let mustInject = false;
    if (!alias) {
      alias = pickAlias(output, 'tc');
      mustInject = true;
    }

    let touched = false;
    for (const m of group) {
      const callRe = new RegExp(
        `\\b${binding}\\(\\s*(['"\`])${escRe(m.fromKey)}\\1\\s*\\)`,
        'g',
      );
      if (!callRe.test(output)) continue;
      output = output.replace(callRe, `${alias}('${m.toKey}')`);
      changes.push({
        fromNamespace: m.fromNamespace,
        fromKey: m.fromKey,
        toKey: m.toKey,
        alias,
      });
      touched = true;
    }

    if (touched && mustInject) {
      const reFresh = new RegExp(
        `const\\s+${binding}\\s*=\\s*useTranslations\\(\\s*['"]${escRe(ns)}['"]\\s*\\)\\s*;?`,
        'm',
      );
      const m2 = reFresh.exec(output);
      if (m2) {
        const insertAt = m2.index + m2[0].length;
        const injection = `\n  const ${alias} = useTranslations('common');`;
        output = output.slice(0, insertAt) + injection + output.slice(insertAt);
      }
    }
  }

  return {output, changes, manual};
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx jest scripts/lib/codemod.spec.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/codemod.ts scripts/lib/codemod.spec.ts
git commit -m "feat(i18n): add regex-based codemod for translation hooks"
```

---

## Task 7: Apply CLI — wiring + dry-run

**Files:**

- Create: `scripts/apply-common-translations.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the applier**

```ts
// scripts/apply-common-translations.ts
import * as fs from 'fs';
import * as path from 'path';
import {createPrisma} from './lib/translation-db';
import {COMMON_KEY_MAPPINGS, CommonKeyMapping} from './common-keys-allowlist';
import {planDbOperations, DbOp} from './lib/apply-db';
import {
  rewriteSource,
  CodemodMapping,
  Change,
  ManualEntry,
} from './lib/codemod';
import type {TranslationRow} from './lib/scan';

type CliFlags = {apply: boolean; forceOverwrite: boolean};

function parseFlags(argv: string[]): CliFlags {
  return {
    apply: argv.includes('--apply'),
    forceOverwrite: argv.includes('--force-overwrite'),
  };
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

type FileResult = {file: string; changes: Change[]; manual: ManualEntry[]};

function runCodemod(
  srcRoot: string,
  mappings: CommonKeyMapping[],
  apply: boolean,
): FileResult[] {
  const cmMappings: CodemodMapping[] = mappings.map((m) => ({
    fromNamespace: m.from.namespace,
    fromKey: m.from.key,
    toKey: m.to.key,
  }));
  const results: FileResult[] = [];
  for (const file of walk(srcRoot)) {
    const input = fs.readFileSync(file, 'utf-8');
    const {output, changes, manual} = rewriteSource(file, input, cmMappings);
    if (changes.length === 0 && manual.length === 0) continue;
    results.push({file, changes, manual});
    if (apply && output !== input) fs.writeFileSync(file, output);
  }
  return results;
}

function writeReport(results: FileResult[], reportPath: string) {
  const lines: string[] = ['# Migration Report', ''];
  const withChanges = results.filter((r) => r.changes.length > 0);
  const withManual = results.filter((r) => r.manual.length > 0);

  lines.push(`## Rewritten (${withChanges.length} files)`, '');
  for (const r of withChanges) {
    lines.push(`### ${path.relative(process.cwd(), r.file)}`);
    for (const c of r.changes) {
      lines.push(
        `- \`${c.fromNamespace}.${c.fromKey}\` -> \`common.${c.toKey}\` (alias \`${c.alias}\`)`,
      );
    }
    lines.push('');
  }

  lines.push(`## Manual review (${withManual.length} files)`, '');
  for (const r of withManual) {
    lines.push(`### ${path.relative(process.cwd(), r.file)}`);
    for (const m of r.manual) lines.push(`- ${m.reason}`);
    lines.push('');
  }

  fs.writeFileSync(reportPath, lines.join('\n'));
}

async function execDb(prisma: ReturnType<typeof createPrisma>, ops: DbOp[]) {
  await prisma.$transaction(async (tx) => {
    for (const op of ops) {
      if (op.type === 'upsert') {
        await tx.translation.upsert({
          where: {namespace_key: {namespace: op.namespace, key: op.key}},
          create: {
            namespace: op.namespace,
            key: op.key,
            valueVi: op.valueVi,
            valueEn: op.valueEn,
          },
          update: {valueVi: op.valueVi, valueEn: op.valueEn},
        });
      } else {
        await tx.translation.deleteMany({
          where: {namespace: op.namespace, key: op.key},
        });
      }
    }
  });
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  if (COMMON_KEY_MAPPINGS.length === 0) {
    console.log('Allowlist is empty. Nothing to do.');
    return;
  }

  const prisma = createPrisma();
  try {
    const rows = (await prisma.translation.findMany({
      select: {namespace: true, key: true, valueVi: true, valueEn: true},
    })) as TranslationRow[];

    const dbPlan = planDbOperations(COMMON_KEY_MAPPINGS, rows, {
      forceOverwrite: flags.forceOverwrite,
    });

    if (dbPlan.errors.length > 0) {
      console.error('DB plan errors. Refusing to proceed:');
      for (const e of dbPlan.errors) console.error('  - ' + e);
      process.exit(1);
    }

    const srcRoot = path.join(__dirname, '..', 'src');
    const fileResults = runCodemod(srcRoot, COMMON_KEY_MAPPINGS, flags.apply);
    const reportPath = path.join(__dirname, 'migration-report.md');
    writeReport(fileResults, reportPath);

    console.log(
      `Code rewrites: ${fileResults.reduce((n, r) => n + r.changes.length, 0)}`,
    );
    console.log(
      `Manual entries: ${fileResults.reduce((n, r) => n + r.manual.length, 0)}`,
    );
    console.log(`DB ops: ${dbPlan.ops.length}`);
    console.log(`Report: ${reportPath}`);

    if (!flags.apply) {
      console.log('Dry run. Re-run with --apply to write files and mutate DB.');
      return;
    }

    await execDb(prisma, dbPlan.ops);
    console.log('Applied.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add npm scripts**

Edit `package.json` — append in `"scripts"`:

```json
"i18n:apply": "npx tsx scripts/apply-common-translations.ts",
"i18n:apply:write": "npx tsx scripts/apply-common-translations.ts --apply"
```

- [ ] **Step 3: Dry-run smoke**

Run: `pnpm i18n:apply`
Expected: `Allowlist is empty. Nothing to do.`

- [ ] **Step 4: Commit**

```bash
git add scripts/apply-common-translations.ts package.json
git commit -m "feat(i18n): add apply-common-translations CLI with dry-run default"
```

---

## Task 8: Populate the allowlist (human-in-the-loop)

**Files:**

- Modify: `scripts/common-keys-allowlist.ts`

- [ ] **Step 1: Run the scanner**

Run: `pnpm i18n:scan`
Expected: writes `scripts/.common-keys-candidates.json`, prints starter block on stdout.

- [ ] **Step 2: Review candidates**

Open `scripts/.common-keys-candidates.json`. For each candidate group decide:

- Real duplicate of a generic UI string → include.
- Domain word that happens to share a leaf name → leave out.

Generic UI strings to look for: `cancel`, `save`, `delete`, `edit`, `add`, `remove`, `back`, `close`, `confirm`, `loading`, `search`, `yes`, `no`, `password`, `role`, `email`, `name`, etc.

- [ ] **Step 3: Edit `scripts/common-keys-allowlist.ts`**

Paste the curated mappings into `COMMON_KEY_MAPPINGS`. Example:

```ts
export const COMMON_KEY_MAPPINGS: CommonKeyMapping[] = [
  {from: {namespace: 'admin.users', key: 'cancel'}, to: {key: 'cancel'}},
  {from: {namespace: 'admin.perks', key: 'cancel'}, to: {key: 'cancel'}},
  {from: {namespace: 'admin.roles', key: 'save'}, to: {key: 'save'}},
];
```

- [ ] **Step 4: Dry-run**

Run: `pnpm i18n:apply`
Expected: prints `Code rewrites: N`, `Manual entries: M`, `DB ops: K`. Files and DB unchanged. If errors print, fix the allowlist (`value` overrides, drop bad mappings) and re-run.

- [ ] **Step 5: Commit (allowlist only)**

```bash
git add scripts/common-keys-allowlist.ts
git commit -m "feat(i18n): populate common-keys allowlist"
```

---

## Task 9: Apply locally, verify

**Files:**

- Modify: `src/**/*.{ts,tsx}` (mechanical, via codemod)
- DB: local Postgres

- [ ] **Step 1: Run apply**

Run: `pnpm i18n:apply:write`
Expected: prints `Applied.` Files in `src/` modified per `migration-report.md`. Local DB has `common.*` upserts + legacy rows deleted.

- [ ] **Step 2: Type-check + tests**

Run: `pnpm build`
Expected: PASS.

Run: `pnpm test -- --watchAll=false`
Expected: PASS.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: PASS. If the codemod left unused `useTranslations('<ns>')` hooks behind, ESLint may flag them as unused — remove by hand and re-run.

- [ ] **Step 4: Browser smoke**

Run: `pnpm dev`
Click through the admin pages most affected (Users, Perks, Roles, Tours). Confirm:

- No raw keys (`ADMIN.USERS.CANCEL`) visible.
- Buttons render localized labels in VI and EN.

- [ ] **Step 5: Resolve any `Manual review` entries**

Open `scripts/migration-report.md`. For each file listed under "Manual review", edit by hand to switch the destructured/aliased binding to use `common.*`.

- [ ] **Step 6: Re-run dry-run and verify clean**

Run: `pnpm i18n:apply`
Expected: `Code rewrites: 0`, `Manual entries: 0` (or only entries intentionally left), `DB ops: 0`.

- [ ] **Step 7: Commit codemod output**

```bash
git add src
git commit -m "refactor(i18n): consolidate duplicate UI keys into common namespace"
```

---

## Task 10: Update seed files to stop re-introducing legacy keys

**Files:**

- Modify: any `prisma/seed-*-translations.ts` and `scripts/seed-*-translations.ts` that write rows under namespaces now mapped to `common`.

- [ ] **Step 1: Identify affected seed files**

Open `scripts/common-keys-allowlist.ts` and list the `from.namespace` + `from.key` pairs. For each pair, grep the seed files:

Run: `grep -rn "key: 'cancel'" prisma scripts`
(repeat per migrated key; or use a single grep with the union of keys)

Run: `grep -rn "namespace: 'admin.users'" prisma scripts`
(repeat per migrated namespace)

- [ ] **Step 2: Remove migrated entries from seed sources**

For every legacy row now mapped into `common`, delete that entry from the seed file that wrote it. If the corresponding `common.<key>` row is missing from `prisma/seed-admin-translations.ts` (or wherever common keys live), add it once there.

- [ ] **Step 3: Re-run seeds against a scratch DB**

```bash
pnpm prisma migrate reset --skip-generate --force
pnpm prisma db seed
pnpm i18n:apply
```

Expected: final `pnpm i18n:apply` reports `Code rewrites: 0`, `DB ops: 0` — seeds no longer produce legacy rows.

- [ ] **Step 4: Commit**

```bash
git add prisma scripts
git commit -m "chore(i18n): drop migrated keys from seed files"
```

---

## Task 11: Add CLAUDE.md rule about minding `common.*`

**Files:**

- Modify: `CLAUDE.md`

The user has explicitly requested this CLAUDE.md update.

- [ ] **Step 1: Reinforce the existing rule**

CLAUDE.md already has a "Reuse common translation keys" bullet under "Code Style". Add a follow-up bullet immediately after it:

```markdown
- **Check `common.*` before adding any translation key.** Before introducing `<namespace>.<key>` (where `<namespace>` ≠ `common`), grep `src/messages` / the `Translation` table for an existing `common.<key>` with the same VI/EN values, AND look for the same leaf key under other feature namespaces. If either match exists, reuse `common.*` (extending it if needed). Run `pnpm i18n:scan` periodically to surface duplicates that slipped through; curate `scripts/common-keys-allowlist.ts` and run `pnpm i18n:apply:write` to consolidate. Duplicating a generic UI string under a feature namespace is a CLAUDE.md violation, not a stylistic preference.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): require checking common.* before adding translation keys"
```

---

## Task 12: PR + production cleanup runbook

**Files:** none in repo — operational steps.

- [ ] **Step 1: Open PR**

Push the branch and open a PR. PR description must include:

- Summary of mappings consolidated (paste a short table — namespace.key -> common.key).
- Instruction block for post-merge VPS cleanup (Step 2 below).
- Note: codemod was regex-based; no new dependencies added.

- [ ] **Step 2: Document the VPS one-shot**

In the PR description, include this runbook:

```
After merge + auto-deploy completes:

1. SSH to VPS as ci-cd user.
2. cd /var/www/vietnam-moto-tours
3. pnpm i18n:apply           # dry-run, verify "DB ops: N" matches expectation
4. pnpm i18n:apply:write     # mutates DB
5. pm2ci restart all         # only if needed; usually deploy already restarted
6. Smoke-check the site
```

- [ ] **Step 3: Hand off**

After PR merges and the runbook is executed, cleanup is complete. The allowlist stays in the repo for audit; the scanner can be re-run any time more duplicates accumulate.

---

## Self-Review

**Spec coverage:**

- Scanner (key + value indexes, scope = all namespaces) — Tasks 2, 3.
- Allowlist (typed TS, committed) — Tasks 4, 8.
- Applier (codemod + DB stage, dry-run default) — Tasks 5, 6, 7, 9.
- Conflict handling (value conflicts, common-key collision, `--force-overwrite`, explicit `value` overrides) — Task 5 tests + applier wiring.
- Codemod ambiguity reporting — Task 6 manual-entry test + Task 9 step 5.
- Idempotency — Task 5 test + Task 9 step 6.
- Seed-file drift — Task 10.
- Manual one-shot VPS cleanup (option B from brainstorming) — Task 12.
- CLAUDE.md reinforcement (user request) — Task 11.
- Testing requirements (scanner, applier, codemod unit tests; no styling assertions) — Tasks 2, 5, 6.
- No new dependencies — regex codemod (Task 6).

**Placeholder scan:** None.

**Type consistency:** `TranslationRow`, `CommonKeyMapping`, `DbOp`, `DbPlan`, `CodemodMapping`, `Change`, `ManualEntry`, `RewriteResult` are defined once in Tasks 2/4/5/6 and referenced with the same names in Task 7. CLI flags (`--apply`, `--force-overwrite`) are consistent across planner, applier, and runbook.

**Decision recorded:** Codemod is regex-based (not `ts-morph`) because `ts-morph` is not currently a dependency and CLAUDE.md forbids new deps without approval. Existing `scripts/migrate-*-translations.ts` files use the same regex approach.
