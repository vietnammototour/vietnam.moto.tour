import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {Button, Badge} from '@/components/ui';
import {api} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';

type BackupMeta = {
  filename: string;
  createdAt: string;
  source: 'manual' | 'scheduled';
  byteSize: number;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

export default function BackupsPage() {
  const t = useTranslations('admin.backups');
  const tCommon = useTranslations('common');
  const {setLoading: setAdminLoading} = useAdminLoading();

  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.admin.backups.list().then(({data}) => {
      if (data) setBackups(data.backups);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    const {data, error: err} = await api.admin.backups.create();
    setCreating(false);
    if (err || !data) {
      setError(err ?? t('createError'));
      return;
    }
    setBackups(data.backups);
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={creating}
              icon={<i className="fa fa-database text-xs" />}
            >
              {t('create')}
            </Button>
          }
        />
      }
    >
      {error && <p className="mb-4 text-danger type-label-sm">{error}</p>}
      {backups.length === 0 ? (
        <p className="text-on-surface-secondary">{t('empty')}</p>
      ) : (
        <table className="w-full bg-surface-elevated border border-border">
          <thead>
            <tr className="text-left type-label-sm uppercase text-on-surface-secondary">
              <th className="p-3">{tCommon('created')}</th>
              <th className="p-3">{t('sourceLabel')}</th>
              <th className="p-3">{tCommon('size')}</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.filename} className="border-t border-border">
                <td className="p-3 font-medium">
                  {new Date(b.createdAt).toLocaleString()}
                </td>
                <td className="p-3">
                  <Badge variant={b.source === 'scheduled' ? 'info' : 'neutral'}>
                    {b.source === 'scheduled'
                      ? t('sourceScheduled')
                      : t('sourceManual')}
                  </Badge>
                </td>
                <td className="p-3 text-on-surface-secondary tabular-nums">
                  {formatBytes(b.byteSize)}
                </td>
                <td className="p-3 text-right">
                  <Button
                    variant="ghost-primary"
                    size="sm"
                    href={api.admin.backups.downloadUrl(b.filename)}
                    icon={<i className="fa fa-download text-xs" />}
                  >
                    {tCommon('download')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
