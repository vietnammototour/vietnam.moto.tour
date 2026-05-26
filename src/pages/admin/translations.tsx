import {useEffect} from 'react';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {TranslationEditor} from '@/components/Admin/TranslationEditor';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import type * as VMT from '@/domain';

export default function AdminTranslations() {
  const {data, loading} = useAdminFetch<VMT.Translation[]>(
    '/api/admin/translations',
  );
  const {setLoading} = useAdminLoading();

  const translations = data ?? [];
  const namespaces = [...new Set(translations.map((t) => t.namespace))].sort();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  return (
    <AdminPageShell header={<AdminPageHeader title="Translations" />}>
      {translations.length > 0 && (
        <TranslationEditor
          translations={translations}
          namespaces={namespaces}
        />
      )}
    </AdminPageShell>
  );
}
