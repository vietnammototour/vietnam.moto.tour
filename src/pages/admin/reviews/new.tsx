import {useState} from 'react';
import {useRouter} from 'next/router';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {ReviewCardEditor} from '@/components/Admin/ReviewCardEditor';
import {
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

type TourOption = {id: string; label: string};

export default function NewReviewPage({tours}: {tours: TourOption[]}) {
  const router = useRouter();
  const t = useTranslations('admin.reviews');
  const tCommon = useTranslations('common');
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(values: ReviewFormValues) {
    setSubmitError(null);
    const {error} = await api.admin.reviews.create(toReviewPayload(values));
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
          title={t('add')}
          breadcrumbs={[
            {label: 'Admin', href: routes.admin.dashboard.path()},
            {label: t('title'), href: routes.admin.reviews.list.path()},
            {label: t('add')},
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
      <ReviewCardEditor tours={tours} onSubmit={onSubmit} />
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb, getToursForAdmin} = await import('@/data/queries');
  const [messages, rawTours] = await Promise.all([
    getMessagesFromDb(locale ?? 'vi'),
    getToursForAdmin({}),
  ]);
  const tours: TourOption[] = rawTours.map(
    (row: {id: string; titleEn: string; slug: string}) => ({
      id: row.id,
      label: row.titleEn || row.slug,
    }),
  );
  return {props: {messages: messages ?? {}, tours}};
}
