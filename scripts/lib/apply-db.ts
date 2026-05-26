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
