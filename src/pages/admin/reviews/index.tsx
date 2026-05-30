import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {Button, ConfirmModal} from '@/components/ui';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {ReviewerAvatar} from '@/components/reviews/ReviewerAvatar';
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
      <div className="space-y-6">
        {groupedByTour.map((group) => (
          <section
            key={group.id}
            className="bg-surface-elevated border border-border overflow-hidden"
          >
            <header className="flex items-center gap-2 px-4 py-3 bg-surface-alt border-b border-border">
              <i className="fa fa-route text-on-surface-tertiary text-xs" />
              <h2 className="type-label-sm uppercase tracking-wide text-on-surface-secondary">
                {group.label}
              </h2>
              <span className="type-body-sm text-on-surface-tertiary">
                ({group.reviews.length})
              </span>
            </header>
            <table className="w-full">
              <thead>
                <tr className="text-left type-label-sm uppercase text-on-surface-secondary">
                  <th className="p-3">{t('reviewerNameLabel')}</th>
                  <th className="p-3">{t('ratingLabel')}</th>
                  <th className="p-3">{t('featuredColumn')}</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {group.reviews.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <ReviewerAvatar
                          name={r.reviewerName}
                          avatarUrl={r.avatarUrl}
                          size="sm"
                        />
                        <span>{r.reviewerName}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <StarRating rating={r.rating} size="sm" />
                    </td>
                    <td className="p-3">
                      {r.isFeatured ? t('featuredYes') : ''}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
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
