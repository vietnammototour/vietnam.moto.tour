import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {Avatar, Button, ConfirmModal} from '@/components/ui';
import {DataGrid, type GridColumn} from '@/components/Admin/DataGrid';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {StarRating} from '@/components/reviews/StarRating';
import type * as VMT from '@/domain';

type ReviewRow = VMT.Review & {
  tour: {id: string; slug: string; titleEn: string};
};

export default function ReviewsListPage() {
  const t = useTranslations('admin.reviews');
  const tCommon = useTranslations('common');
  const {setLoading: setAdminLoading} = useAdminLoading();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.admin.reviews.list().then(({data}) => {
      if (data) setReviews(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function performDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const {error} = await api.admin.reviews.delete(deleteTarget.id);
    setDeleting(false);
    if (error) return;
    setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const groupedByTour = (() => {
    const groups = new Map<
      string,
      {id: string; label: string; reviews: ReviewRow[]}
    >();
    for (const r of reviews) {
      const bucket = groups.get(r.tour.id) ?? {
        id: r.tour.id,
        label: r.tour.titleEn || '—',
        reviews: [],
      };
      bucket.reviews.push(r);
      groups.set(r.tour.id, bucket);
    }
    return Array.from(groups.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  })();

  const columns = useMemo<GridColumn<ReviewRow>[]>(
    () => [
      {
        key: 'reviewer',
        header: t('reviewerNameLabel'),
        track: 'minmax(0,1fr)',
        render: (r) => (
          <div className="flex items-center gap-3">
            <Avatar src={r.avatarUrl} name={r.reviewerName} size="sm" />
            <span>{r.reviewerName}</span>
          </div>
        ),
      },
      {
        key: 'rating',
        header: t('ratingLabel'),
        track: '120px',
        render: (r) => <StarRating rating={r.rating} size="sm" />,
      },
      {
        key: 'featured',
        header: t('featuredColumn'),
        track: '90px',
        render: (r) =>
          r.isFeatured ? (
            <i className="fa fa-check text-primary" aria-label={t('featuredYes')} />
          ) : (
            <span className="text-on-surface-tertiary">—</span>
          ),
      },
      {
        key: 'actions',
        header: '',
        track: 'max-content',
        align: 'end',
        render: (r) => (
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost-primary"
              size="sm"
              href={routes.admin.reviews.edit.path({id: r.id})}
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
    ],
    [t, tCommon],
  );

  const sections = useMemo(
    () =>
      groupedByTour.map((group) => ({
        id: group.id,
        label: group.label,
        count: group.reviews.length,
        items: group.reviews,
      })),
    [groupedByTour],
  );

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('title')}
          actions={
            <Button
              variant="primary"
              href={routes.admin.reviews.new.path()}
              icon={<i className="fa fa-plus text-xs" />}
            >
              {t('add')}
            </Button>
          }
        />
      }
    >
      <DataGrid
        columns={columns}
        sections={sections}
        rowKey={(r) => r.id}
        ariaLabel="Reviews"
        emptyState="No reviews yet."
      />
      <ConfirmModal
        open={!!deleteTarget}
        title={
          deleteTarget
            ? t('deleteConfirm', {name: deleteTarget.reviewerName})
            : ''
        }
        confirmLabel={tCommon('delete')}
        variant="danger"
        loading={deleting}
        onConfirm={performDelete}
        onCancel={() => {
          if (deleting) return;
          setDeleteTarget(null);
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
