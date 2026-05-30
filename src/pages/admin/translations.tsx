import {useEffect, useState} from 'react';
import type {GetServerSidePropsContext} from 'next';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {TranslationEditor} from '@/components/Admin/TranslationEditor';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {LocaleSwitcher} from '@/components/ui';
import {useAdminLocale} from '@/hooks/useAdminLocale';
import type * as VMT from '@/domain';

export default function AdminTranslations() {
  const {data, loading} = useAdminFetch<VMT.Translation[]>(
    '/api/admin/translations',
  );
  const {setLoading} = useAdminLoading();
  const [locale, setLocale] = useAdminLocale();
  const [filter, setFilter] = useState('');

  const translations = data ?? [];
  const namespaces = [...new Set(translations.map((t) => t.namespace))].sort();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title="Translations"
          search={
            <input
              type="search"
              placeholder="Search keys or values..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="cursor-text w-64 px-3 py-2 border border-border bg-surface-elevated"
            />
          }
          localeSwitcher={
            <LocaleSwitcher value={locale} onChange={setLocale} />
          }
        />
      }
    >
      {translations.length > 0 && (
        <TranslationEditor
          translations={translations}
          namespaces={namespaces}
          locale={locale}
          filter={filter}
        />
      )}
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
