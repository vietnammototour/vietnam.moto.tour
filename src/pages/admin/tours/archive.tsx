import {useEffect, useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type {GetServerSideProps} from 'next';
import {Button, ConfirmModal} from '@/components/ui';
import {dehydrate} from '@tanstack/react-query';
import {getQueryClient} from '@/lib/queryClient';
import {
  useTours,
  useUpdateTour,
  useDeleteTourHard,
} from '@/queries/admin/tours';
import {tourKeys} from '@/queries/admin/tours.keys';
import {fetchToursServer} from '@/queries/fetchers/admin/tours.server';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {routes} from '@/routes';
import type * as VMT from '@/domain';
import {getMinPrice} from '@/domain';

type AdminTour = {
  id: string;
  titleVi: string;
  titleEn: string;
  slug: string;
  status: VMT.TourStatus;
  destination: {nameVi: string; nameEn: string};
  pricingGroups: VMT.PricingGroup[];
  duration: string;
  imageUrl: string | null;
};

export default function AdminToursArchive() {
  const {data: tours, isLoading} = useTours({archived: true});
  const restore = useUpdateTour();
  const hardDelete = useDeleteTourHard();
  const {setLoading} = useAdminLoading();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  function handleRestore(id: string) {
    restore.mutate({id, input: {status: 'DRAFT'}});
  }

  function performHardDelete() {
    if (!deleteId) return;
    hardDelete.mutate(
      {id: deleteId},
      {
        onSettled: () => setDeleteId(null),
      },
    );
  }

  const tourList = (tours ?? []) as unknown as AdminTour[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Archived Tours</h1>
        <Link
          href={routes.admin.tours.list.path()}
          className="inline-flex items-center gap-1.5 px-4 py-2 type-label-sm uppercase border border-border text-on-surface-secondary hover:bg-surface-alt transition-colors cursor-pointer"
        >
          ← Back to Tours
        </Link>
      </div>

      <div className="bg-surface-elevated border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Title
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Destination
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Price
              </th>
              <th className="text-right px-4 py-3 type-label-sm text-on-surface-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {tourList.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center type-body-lg text-on-surface-tertiary"
                >
                  No archived tours.
                </td>
              </tr>
            )}
            {tourList.map((tour) => (
              <tr
                key={tour.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {tour.imageUrl ? (
                      <Image
                        src={tour.imageUrl}
                        alt=""
                        width={75}
                        height={50}
                        unoptimized
                        className="h-[50px] w-auto object-contain shrink-0"
                      />
                    ) : (
                      <div className="h-[50px] w-[50px] bg-surface-alt flex items-center justify-center shrink-0">
                        <i className="fa fa-image text-on-surface-tertiary" />
                      </div>
                    )}
                    <span className="type-body-lg text-on-surface">
                      {tour.titleEn || tour.titleVi}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface-secondary">
                  {tour.destination.nameEn || tour.destination.nameVi}
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface">
                  ${getMinPrice(tour.pricingGroups)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestore(tour.id)}
                    >
                      <i className="fa fa-rotate-left text-xs mr-1.5" />
                      Restore
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteId(tour.id)}
                    >
                      <i className="fa fa-trash text-xs mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        open={!!deleteId}
        title="Permanently delete this tour?"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={hardDelete.isPending}
        onConfirm={performHardDelete}
        onCancel={() => {
          if (hardDelete.isPending) return;
          setDeleteId(null);
        }}
      />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: tourKeys.list({archived: true}),
    queryFn: () => fetchToursServer({archived: true}),
  });
  return {props: {dehydratedState: dehydrate(queryClient)}};
};
