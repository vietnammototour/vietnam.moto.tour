import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {Button, Badge, SegmentedControl} from '@/components/ui';
import {api} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {DataGrid, type GridColumn} from '@/components/Admin/DataGrid';

type BackupKind = 'db' | 'media';

type BackupMeta = {
  filename: string;
  createdAt: string;
  source: 'manual' | 'scheduled';
  byteSize: number;
  kind: BackupKind;
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

  const [kind, setKind] = useState<BackupKind>('db');
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [maxBackups, setMaxBackups] = useState(10);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.admin.backups.list(kind).then(({data}) => {
      if (data) {
        setBackups(data.backups);
        setMaxBackups(data.maxBackups);
      }
      setLoading(false);
    });
  }, [kind]);

  function handleKindChange(next: BackupKind) {
    setLoading(true);
    setKind(next);
  }

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    const {data, error: err} = await api.admin.backups.create(kind);
    setCreating(false);
    if (err || !data) {
      setError(err ?? t('createError'));
      return;
    }
    setBackups(data.backups);
    setMaxBackups(data.maxBackups);
  }

  const columns: GridColumn<BackupMeta>[] = [
    {
      key: 'createdAt',
      header: tCommon('created'),
      track: 'minmax(0,1fr)',
      render: (b) => (
        <span className="font-medium">
          {new Date(b.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'source',
      header: t('sourceLabel'),
      track: '140px',
      render: (b) => (
        <Badge variant={b.source === 'scheduled' ? 'info' : 'neutral'}>
          {b.source === 'scheduled' ? t('sourceScheduled') : t('sourceManual')}
        </Badge>
      ),
    },
    {
      key: 'byteSize',
      header: tCommon('size'),
      track: '120px',
      render: (b) => (
        <span className="text-on-surface-secondary tabular-nums">
          {formatBytes(b.byteSize)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      track: 'max-content',
      align: 'end',
      render: (b) => (
        <Button
          variant="ghost-primary"
          size="sm"
          href={api.admin.backups.downloadUrl(b.filename)}
          icon={<i className="fa fa-download text-xs" />}
        >
          {tCommon('download')}
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('title')}
          subtitle={t('subtitle', {count: maxBackups})}
          search={
            <SegmentedControl<BackupKind>
              value={kind}
              onChange={handleKindChange}
              options={[
                {value: 'db', label: t('kindDb')},
                {value: 'media', label: t('kindMedia')},
              ]}
            />
          }
          actions={
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={creating}
              icon={
                <i
                  className={`fa ${kind === 'media' ? 'fa-photo-film' : 'fa-database'} text-xs`}
                />
              }
            >
              {t('create')}
            </Button>
          }
        />
      }
    >
      {error && <p className="mb-4 text-danger type-label-sm">{error}</p>}
      <DataGrid<BackupMeta>
        columns={columns}
        items={backups}
        rowKey={(b) => b.filename}
        ariaLabel="Backups"
        emptyState={t('empty')}
      />
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
