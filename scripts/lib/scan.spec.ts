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
