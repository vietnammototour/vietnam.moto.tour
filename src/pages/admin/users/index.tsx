import {useEffect, useMemo, useState} from 'react';
import {useSession} from 'next-auth/react';
import {Button, ConfirmModal, LocaleSwitcher} from '@/components/ui';
import {Avatar} from '@/components/ui';
import type {AdminLocale} from '@/components/ui/LocaleSwitcher';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {DataGrid, type GridColumn} from '@/components/Admin/DataGrid';
import type * as VMT from '@/domain';

const check = (on: boolean) =>
  on ? (
    <i className="fa fa-check text-primary" aria-hidden="true" />
  ) : (
    <span className="text-on-surface-tertiary">—</span>
  );

export default function UsersListPage() {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('common');
  const [locale, setLocale] = useState<AdminLocale>('en');
  const {data: session} = useSession();
  const {setLoading: setAdminLoading} = useAdminLoading();
  const [users, setUsers] = useState<VMT.UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<VMT.UserAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.admin.users.list().then(({data}) => {
      if (data) setUsers(data);
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
    const {error} = await api.admin.users.delete(deleteTarget.id);
    setDeleting(false);
    if (error) {
      setDeleteError(error);
      return;
    }
    setUsers((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        (u.email ?? '').toLowerCase().includes(term),
    );
  }, [users, search]);

  const columns: GridColumn<VMT.UserAdmin>[] = useMemo(
    () => [
      {
        key: 'teamOrder',
        header: t('orderLabel'),
        track: '64px',
      },
      {
        key: 'photo',
        header: '',
        track: '48px',
        render: (u) => (
          <Avatar src={u.photo?.url ?? null} name={u.name} size="sm" />
        ),
      },
      {
        key: 'name',
        header: t('nameLabel'),
        track: 'minmax(0,1fr)',
        render: (u) => <span className="font-medium">{u.name}</span>,
      },
      {
        key: 'email',
        header: t('emailLabel'),
        track: 'minmax(0,1fr)',
        render: (u) => u.email ?? '—',
      },
      {
        key: 'role',
        header: t('roleLabel'),
        track: '120px',
        render: (u) =>
          locale === 'en'
            ? (u.orgRole?.labelEn ?? u.orgRole?.key ?? '—')
            : (u.orgRole?.labelVi ?? u.orgRole?.key ?? '—'),
      },
      {
        key: 'isCoreTeam',
        header: t('isCoreTeamLabel'),
        track: '100px',
        render: (u) => check(u.isCoreTeam),
      },
      {
        key: 'allowAuth',
        header: t('allowAuthLabel'),
        track: '120px',
        render: (u) => check(u.allowAuth),
      },
      {
        key: 'actions',
        header: '',
        track: '160px',
        align: 'end',
        render: (u) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost-primary"
              size="sm"
              href={routes.admin.users.edit.path({id: u.id})}
              icon={<i className="fa fa-pencil text-xs" />}
            >
              {tCommon('edit')}
            </Button>
            {session?.user.id !== u.id && (
              <Button
                variant="ghost-danger"
                size="sm"
                onClick={() => setDeleteTarget(u)}
                icon={<i className="fa fa-trash text-xs" />}
              >
                {tCommon('delete')}
              </Button>
            )}
          </div>
        ),
      },
    ],
    [t, tCommon, locale, session],
  );

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('title')}
          search={
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="cursor-text w-64 px-3 py-2 border border-border bg-surface-elevated"
            />
          }
          localeSwitcher={
            <LocaleSwitcher value={locale} onChange={setLocale} />
          }
          actions={
            <Button
              variant="primary"
              href={routes.admin.users.new.path()}
              icon={<i className="fa fa-plus text-xs" />}
            >
              {t('new')}
            </Button>
          }
        />
      }
    >
      <DataGrid
        columns={columns}
        items={filtered}
        rowKey={(u) => u.id}
        ariaLabel="Users"
        emptyState="No users yet."
      />
      <ConfirmModal
        open={!!deleteTarget}
        title={
          deleteTarget ? t('deleteConfirm', {name: deleteTarget.name}) : ''
        }
        confirmLabel={tCommon('delete')}
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
