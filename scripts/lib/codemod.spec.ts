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
