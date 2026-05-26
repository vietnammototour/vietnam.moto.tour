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
