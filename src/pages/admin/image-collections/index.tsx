import {useEffect, useMemo, useState} from 'react';
import type {GetServerSidePropsContext} from 'next';
import {useTranslations} from 'next-intl';
import {api, routes} from '@/routes';
import {Button, ConfirmModal} from '@/components/ui';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {DataGrid, type GridColumn} from '@/components/Admin/DataGrid';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';

type Row = {id: string; key: string; label: string; imageCount: number};

export default function ImageCollectionsListPage() {
  const t = useTranslations();
  const {setLoading: setAdminLoading} = useAdminLoading();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    api.admin.imageCollections.list().then((res) => {
      if (res.data) setRows(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function performDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await api.admin.imageCollections.delete(deleteTarget.id);
    setDeleting(false);
    if (res.error) {
      setDeleteError(res.error);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const columns = useMemo<GridColumn<Row>[]>(
    () => [
      {
        key: 'label',
        header: t('admin.imageCollections.label'),
        track: 'minmax(0,1fr)',
      },
      {
        key: 'key',
        header: t('admin.imageCollections.key'),
        track: 'minmax(0,1fr)',
        render: (r) => <span className="font-mono text-sm">{r.key}</span>,
      },
      {
        key: 'imageCount',
        header: t('admin.imageCollections.imageCount'),
        track: '120px',
      },
      {
        key: '__actions',
        header: '',
        track: 'max-content',
        align: 'end',
        render: (r) => (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost-primary"
              size="sm"
              href={routes.admin.imageCollections.edit.path({id: r.id})}
              icon={<i className="fa fa-pencil text-xs" />}
            >
              {t('common.edit')}
            </Button>
            <Button
              variant="ghost-danger"
              size="sm"
              onClick={() => setDeleteTarget(r)}
              icon={<i className="fa fa-trash text-xs" />}
            >
              {t('common.delete')}
            </Button>
          </div>
        ),
      },
    ],
    [t, setDeleteTarget],
  );

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('admin.imageCollections.title')}
          actions={
            <Button
              variant="primary"
              href={routes.admin.imageCollections.new.path()}
              icon={<i className="fa fa-plus text-xs" />}
            >
              {t('admin.imageCollections.new')}
            </Button>
          }
        />
      }
    >
      {loading && <p>{t('common.loading')}</p>}
      <DataGrid
        columns={columns}
        items={rows}
        rowKey={(r) => r.id}
        ariaLabel="Image collections"
        emptyState={
          !loading ? t('admin.imageCollections.empty') : undefined
        }
      />
      <ConfirmModal
        open={!!deleteTarget}
        title={t('admin.imageCollections.confirmDelete')}
        confirmLabel={t('common.delete')}
        variant="danger"
        loading={deleting}
        error={deleteError}
        onConfirm={performDelete}
        onCancel={() => {
          if (deleting) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
