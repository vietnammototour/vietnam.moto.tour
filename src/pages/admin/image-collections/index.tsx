import {useEffect, useState} from 'react';
import type {GetServerSidePropsContext} from 'next';
import {useTranslations} from 'next-intl';
import Link from 'next/link';
import {api, routes} from '@/routes';
import {Button} from '@/components/ui';

type Row = {id: string; key: string; label: string; imageCount: number};

export default function ImageCollectionsListPage() {
  const t = useTranslations();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.imageCollections.list().then((res) => {
      if (res.data) setRows(res.data);
      setLoading(false);
    });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm(t('admin.imageCollections.confirmDelete'))) return;
    const res = await api.admin.imageCollections.delete(id);
    if (!res.error) setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">
          {t('admin.imageCollections.title')}
        </h1>
        <Link href={routes.admin.imageCollections.new.path()}>
          <Button variant="primary">{t('admin.imageCollections.new')}</Button>
        </Link>
      </div>
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-on-surface-secondary">
          {t('admin.imageCollections.empty')}
        </p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="py-2">{t('admin.imageCollections.label')}</th>
              <th className="py-2">{t('admin.imageCollections.key')}</th>
              <th className="py-2">{t('admin.imageCollections.imageCount')}</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="py-3">{r.label}</td>
                <td className="py-3 font-mono text-sm">{r.key}</td>
                <td className="py-3">{r.imageCount}</td>
                <td className="py-3 flex gap-2 justify-end">
                  <Link
                    href={routes.admin.imageCollections.edit.path({id: r.id})}
                  >
                    <Button variant="secondary">{t('common.edit')}</Button>
                  </Link>
                  <Button variant="danger" onClick={() => handleDelete(r.id)}>
                    {t('common.delete')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
