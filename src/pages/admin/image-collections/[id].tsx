import type {GetServerSidePropsContext} from 'next';
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {prisma} from '@/lib/prisma';
import {toImageCollection} from '@/domain/image-collection/mapper';
import type {ImageCollection} from '@/domain';
import {
  ImageCollectionEditor,
  AddImageButton,
  useImageCollectionImages,
} from '@/components/Admin/ImageCollectionEditor';
import {api, routes} from '@/routes';
import {TextInput, LocaleSwitcher} from '@/components/ui';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {useAdminLocale} from '@/hooks/useAdminLocale';

type Props = {collection: ImageCollection};

export default function EditImageCollectionPage({collection}: Props) {
  const t = useTranslations();
  const [locale, setLocale] = useAdminLocale();
  const [label, setLabel] = useState(collection.label);
  const [savedLabel, setSavedLabel] = useState(collection.label);
  const [saving, setSaving] = useState(false);
  const state = useImageCollectionImages(collection);

  async function saveLabel() {
    if (label === savedLabel) return;
    setSaving(true);
    const res = await api.admin.imageCollections.update(collection.id, {label});
    setSaving(false);
    if (!res.error) setSavedLabel(label);
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={savedLabel || collection.key}
          breadcrumbs={[
            {label: 'Admin', href: routes.admin.dashboard.path()},
            {
              label: t('admin.imageCollections.title'),
              href: routes.admin.imageCollections.list.path(),
            },
            {label: collection.key},
          ]}
          localeSwitcher={
            <LocaleSwitcher value={locale} onChange={setLocale} />
          }
          actions={
            <AddImageButton disabled={!state.canAdd} onPick={state.handleAdd} />
          }
        />
      }
    >
      <div className="space-y-6">
        <div className="bg-surface-elevated rounded-xl border border-border p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label={t('admin.imageCollections.key')}
              value={collection.key}
              disabled
            />
            <TextInput
              label={t('admin.imageCollections.label')}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={saveLabel}
              hint={(() => {
                if (saving) return 'Saving…';
                if (label !== savedLabel) return 'Unsaved';
                return undefined;
              })()}
            />
          </div>
        </div>

        <ImageCollectionEditor state={state} locale={locale} />
      </div>
    </AdminPageShell>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const id = ctx.params?.id as string;
  const {getMessagesFromDb} = await import('@/data/queries');
  const row = await prisma.imageCollection.findUnique({
    where: {id},
    include: {images: {orderBy: {order: 'asc'}}},
  });
  if (!row) return {notFound: true};
  const messages = await getMessagesFromDb(ctx.locale ?? 'vi');
  return {
    props: {
      collection: toImageCollection(row),
      messages: messages ?? {},
    },
  };
}
