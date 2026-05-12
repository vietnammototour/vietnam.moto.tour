import {useEffect} from 'react';
import Link from 'next/link';
import type {GetServerSideProps} from 'next';
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
  title: string;
  slug: string;
  status: VMT.TourStatus;
  destination: {name: string};
  pricingGroups: VMT.PricingGroup[];
  duration: string;
  imageUrl: string | null;
};

export default function AdminToursArchive() {
  const {data: tours, isLoading} = useTours({archived: true});
  const restore = useUpdateTour();
  const hardDelete = useDeleteTourHard();
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  function handleRestore(id: string) {
    restore.mutate({id, input: {status: 'DRAFT'}});
  }

  function handleHardDelete(id: string) {
    if (!confirm('Permanently delete this tour? This cannot be undone.'))
      return;
    hardDelete.mutate({id});
  }

  const tourList = (tours ?? []) as unknown as AdminTour[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Archived Tours</h1>
        <Link
          href={routes.admin.tours.list.path()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg type-label-sm uppercase border border-border text-on-surface-secondary hover:bg-surface-alt transition-colors cursor-pointer"
        >
          ← Back to Tours
        </Link>
      </div>

      <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
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
                      <img
                        src={tour.imageUrl}
                        alt=""
                        className="h-[50px] w-auto rounded object-contain shrink-0"
                      />
                    ) : (
                      <div className="h-[50px] w-[50px] rounded bg-surface-alt flex items-center justify-center shrink-0">
                        <i className="fa fa-image text-on-surface-tertiary" />
                      </div>
                    )}
                    <span className="type-body-lg text-on-surface">
                      {tour.title}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface-secondary">
                  {tour.destination.name}
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface">
                  ${getMinPrice(tour.pricingGroups)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(tour.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg type-label-sm text-on-surface-secondary border border-border hover:bg-surface-alt transition-colors cursor-pointer"
                    >
                      <i className="fa fa-rotate-left text-xs" />
                      Restore
                    </button>
                    <button
                      onClick={() => handleHardDelete(tour.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg type-label-sm text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                    >
                      <i className="fa fa-trash text-xs" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
