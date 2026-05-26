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
