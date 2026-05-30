import {useState} from 'react';
import {useRouter} from 'next/router';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {ReviewForm} from '@/components/Admin/ReviewForm';
import {
  reviewFormDefaults,
  toReviewPayload,
  type ReviewFormValues,
} from '@/components/Admin/ReviewForm/ReviewForm.form-utils';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminPageFooter,
} from '@/components/Admin/AdminPageShell';
import {Button} from '@/components/ui';
import {api, routes} from '@/routes';
import type * as VMT from '@/domain';

type TourOption = {id: string; label: string};

type EditReviewPageProps = {
  review: VMT.Review;
  tours: TourOption[];
};

function toFormValues(review: VMT.Review): ReviewFormValues {
  const images = [...review.images];
  while (images.length < 5) images.push('');
  return {
    tourId: review.tourId,
    reviewerName: review.reviewerName,
    reviewerLocation: review.reviewerLocation ?? '',
    avatarUrl: review.avatarUrl ?? '',
    rating: review.rating,
    title: review.title,
    body: review.body,
    reviewDate: review.reviewDate.slice(0, 10),
    sourceUrl: review.sourceUrl,
    images: images.slice(0, 5),
    isFeatured: review.isFeatured,
    displayOrder: review.displayOrder,
  };
}

export default function EditReviewPage({review, tours}: EditReviewPageProps) {
  const router = useRouter();
  const t = useTranslations('admin.reviews');
  const tCommon = useTranslations('common');
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(values: ReviewFormValues) {
    setSubmitError(null);
    const {error} = await api.admin.reviews.update(
      review.id,
      toReviewPayload(values),
    );
    if (error) {
      setSubmitError(error);
      return;
    }
    router.push(routes.admin.reviews.list.path());
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('editTitle')}
          breadcrumbs={[
            {label: 'Admin', href: routes.admin.dashboard.path()},
            {label: t('title'), href: routes.admin.reviews.list.path()},
            {label: t('editTitle')},
          ]}
        />
      }
      footer={
        <AdminPageFooter
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => router.push(routes.admin.reviews.list.path())}
              >
                {tCommon('cancel')}
              </Button>
              <Button variant="primary" type="submit" form="review-form">
                {tCommon('save')}
              </Button>
            </>
          }
        />
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
      <ReviewForm
        tours={tours}
        defaults={{...reviewFormDefaults, ...toFormValues(review)}}
        onSubmit={onSubmit}
      />
    </AdminPageShell>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const {getMessagesFromDb, getToursForAdmin} = await import('@/data/queries');
  const {prisma} = await import('@/lib/prisma');
  const {toReview} = await import('@/domain/review/mapper');

  const id = ctx.params?.id as string;
  const row = await prisma.review.findUnique({where: {id}});
  if (!row) return {notFound: true};

  const [messages, tourRows] = await Promise.all([
    getMessagesFromDb(ctx.locale ?? 'vi'),
    getToursForAdmin({}),
  ]);
  const tours: TourOption[] = tourRows.map(
    (tr: {id: string; titleEn: string; slug: string}) => ({
      id: tr.id,
      label: tr.titleEn || tr.slug,
    }),
  );

  return {
    props: {messages: messages ?? {}, review: toReview(row), tours},
  };
}
