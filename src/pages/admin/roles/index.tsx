import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Button, ConfirmModal, LocaleSwitcher, Modal} from '@/components/ui';
import type {AdminLocale} from '@/components/ui/LocaleSwitcher';
import type {GetServerSidePropsContext} from 'next';
import {RoleForm} from '@/components/Admin/RoleForm';
import type {RoleFormValues} from '@/components/Admin/RoleForm/RoleForm.form-utils';
import {api} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {DataGrid} from '@/components/Admin/DataGrid';
import type {GridColumn} from '@/components/Admin/DataGrid';
import type * as VMT from '@/domain';

type Editing = {mode: 'create'} | {mode: 'edit'; role: VMT.OrgRole};

export default function RolesListPage() {
  const t = useTranslations('admin.roles');
  const tCommon = useTranslations('common');
  const [locale, setLocale] = useState<AdminLocale>('en');
  const {setLoading: setAdminLoading} = useAdminLoading();
  const [roles, setRoles] = useState<VMT.OrgRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VMT.OrgRole | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    api.admin.roles.list().then(({data}) => {
      if (data) setRoles(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  function openCreate() {
    setSubmitError(null);
    setEditing({mode: 'create'});
  }

  function openEdit(role: VMT.OrgRole) {
    setSubmitError(null);
    setEditing({mode: 'edit', role});
  }

  function closeForm() {
    setEditing(null);
    setSubmitError(null);
  }

  async function onSubmit(values: RoleFormValues) {
    if (!editing) return;
    setSubmitError(null);
    const payload = values as unknown as Record<string, unknown>;
    if (editing.mode === 'create') {
      const {data, error} = await api.admin.roles.create(payload);
      if (error || !data) {
        setSubmitError(error ?? 'Failed to create role');
        return;
      }
      setRoles((prev) => [...prev, data]);
    } else {
      const {data, error} = await api.admin.roles.update(
        editing.role.id,
        payload,
      );
      if (error || !data) {
        setSubmitError(error ?? 'Failed to save role');
        return;
      }
      setRoles((prev) => prev.map((r) => (r.id === data.id ? data : r)));
    }
    closeForm();
  }

  async function performDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const {error} = await api.admin.roles.delete(deleteTarget.id);
    setDeleting(false);
    if (error) {
      setDeleteError(error.includes('Role in use') ? t('deleteInUse') : error);
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const modalTitle = (() => {
    if (editing?.mode !== 'edit') return t('new');
    const label =
      locale === 'en' ? editing.role.labelEn : editing.role.labelVi;
    return label || t('edit');
  })();

  const columns: GridColumn<VMT.OrgRole>[] = [
    {
      key: 'order',
      header: t('orderLabel'),
      track: '64px',
    },
    {
      key: 'key',
      header: t('keyLabel'),
      track: 'minmax(0,1fr)',
      render: (r) => <span className="font-mono text-sm">{r.key}</span>,
    },
    {
      key: 'label',
      header: t('labelLabel'),
      track: 'minmax(0,1fr)',
      render: (r) => (locale === 'en' ? r.labelEn : r.labelVi),
    },
    {
      key: 'actions',
      header: '',
      track: '160px',
      align: 'end',
      render: (r) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost-primary"
            size="sm"
            onClick={() => openEdit(r)}
            icon={<i className="fa fa-pencil text-xs" />}
          >
            {tCommon('edit')}
          </Button>
          <Button
            variant="ghost-danger"
            size="sm"
            onClick={() => setDeleteTarget(r)}
            icon={<i className="fa fa-trash text-xs" />}
          >
            {tCommon('delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('title')}
          localeSwitcher={
            <LocaleSwitcher value={locale} onChange={setLocale} />
          }
          actions={
            <Button
              variant="primary"
              onClick={openCreate}
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
        items={roles}
        rowKey={(r) => r.id}
        ariaLabel="Roles"
        emptyState="No roles yet."
      />

      <Modal
        open={!!editing}
        onClose={closeForm}
        size="lg"
        title={modalTitle}
        footer={
          <div className="flex items-center justify-between">
            <LocaleSwitcher value={locale} onChange={setLocale} />
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={closeForm}>
                {t('cancel')}
              </Button>
              <Button variant="primary" type="submit" form="role-form">
                {t('save')}
              </Button>
            </div>
          </div>
        }
      >
        {submitError && (
          <div
            role="alert"
            className="mb-4 bg-error/10 text-error type-body-sm p-3 border border-error/30"
          >
            {submitError}
          </div>
        )}
        {editing && (
          <RoleForm
            mode={editing.mode}
            locale={locale}
            defaults={editing.mode === 'edit' ? editing.role : undefined}
            onSubmit={onSubmit}
          />
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        title={
          deleteTarget ? t('deleteConfirm', {label: deleteTarget.labelEn}) : ''
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
