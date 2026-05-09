import type {GetServerSidePropsContext} from 'next';
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {prisma} from '@/lib/prisma';
import {toImageCollection} from '@/domain/image-collection/mapper';
import type {ImageCollection} from '@/domain';
import {ImageCollectionEditor} from '@/components/Admin/ImageCollectionEditor';
import {api} from '@/routes';
import {Button, TextInput} from '@/components/ui';

type Props = {collection: ImageCollection};

export default function EditImageCollectionPage({collection}: Props) {
  const t = useTranslations();
  const [label, setLabel] = useState(collection.label);
  const [savedLabel, setSavedLabel] = useState(collection.label);
  const [saving, setSaving] = useState(false);

  async function saveLabel() {
    if (label === savedLabel) return;
    setSaving(true);
    const res = await api.admin.imageCollections.update(collection.id, {label});
    setSaving(false);
    if (!res.error) setSavedLabel(label);
  }

  return (
    <div>
      <div className="mb-6">
        <p className="type-label-sm text-on-surface-secondary mb-1">
          {t('admin.imageCollections.key')}:{' '}
          <span className="font-mono">{collection.key}</span>
        </p>
        <div className="flex gap-2 items-end">
          <div className="flex-1 max-w-md">
            <TextInput
              label={t('admin.imageCollections.label')}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={saveLabel}
            />
          </div>
          <Button
            variant="secondary"
            type="button"
            onClick={saveLabel}
            disabled={saving || label === savedLabel}
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
      <ImageCollectionEditor collection={collection} />
    </div>
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
