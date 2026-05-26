import {useEffect} from 'react';
import Link from 'next/link';
import type {GetServerSideProps} from 'next';
import {dehydrate} from '@tanstack/react-query';
import {getQueryClient} from '@/lib/queryClient';
import {useTours, useToggleTourStatus} from '@/queries/admin/tours';
import {tourKeys} from '@/queries/admin/tours.keys';
import {fetchToursServer} from '@/queries/fetchers/admin/tours.server';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {StatusPicker} from '@/components/Admin/StatusPicker';
import {routes} from '@/routes';
import {Badge} from '@/components/ui';
import type * as VMT from '@/domain';

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

export default function AdminToursList() {
  const {data: tours, isLoading} = useTours({archived: false});
  const {data: archivedTours} = useTours({archived: true});
  const toggleStatus = useToggleTourStatus();
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  function handleStatusChange(id: string, status: VMT.TourStatus) {
    toggleStatus.mutate({id, status});
  }

  const archivedCount = archivedTours?.length ?? 0;
  const tourList = (tours ?? []) as unknown as AdminTour[];

  const groupedByDestination = (() => {
    const groups = new Map<string, {label: string; tours: AdminTour[]}>();
    for (const tour of tourList) {
      const key = tour.destination.nameEn || tour.destination.nameVi || '—';
      const bucket = groups.get(key) ?? {label: key, tours: []};
      bucket.tours.push(tour);
      groups.set(key, bucket);
    }
    return Array.from(groups.values())
      .map((g) => ({
        ...g,
        tours: [...g.tours].sort((a, b) =>
          (a.titleEn || a.titleVi).localeCompare(b.titleEn || b.titleVi),
        ),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  })();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Tours</h1>
        <div className="flex items-center gap-3">
          {archivedCount > 0 && (
            <Link
              href={routes.admin.tours.archive.path()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg type-label-sm uppercase border border-border text-on-surface-secondary hover:bg-surface-alt transition-colors cursor-pointer"
            >
              <i className="fa fa-archive text-xs" />
              Archive ({archivedCount})
            </Link>
          )}
          <Link
            href={routes.admin.tours.new.path()}
            className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors cursor-pointer"
          >
            + New Tour
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {groupedByDestination.map((group) => (
          <section
            key={group.label}
            className="bg-surface-elevated rounded-xl border border-border overflow-hidden"
          >
            <header className="flex items-center justify-between px-4 py-3 bg-surface-alt border-b border-border">
              <div className="flex items-center gap-2">
                <i className="fa fa-map-marker-alt text-on-surface-tertiary text-xs" />
                <h2 className="type-label-sm uppercase tracking-wide text-on-surface-secondary">
                  {group.label}
                </h2>
                <span className="type-body-sm text-on-surface-tertiary">
                  ({group.tours.length})
                </span>
              </div>
            </header>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                    Title
                  </th>
                  <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                    Pricing Type
                  </th>
                  <th className="text-right px-4 py-2 type-label-sm text-on-surface-tertiary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.tours.map((tour) => (
                  <tr
                    key={tour.id}
                    className="border-b border-border last:border-0 hover:bg-surface-alt/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={routes.admin.tours.edit.path({id: tour.id})}
                        className="group/link flex items-center gap-3 cursor-pointer"
                      >
                        {tour.imageUrl ? (
                          <img
                            src={tour.imageUrl}
                            alt=""
                            className="h-[50px] w-auto rounded object-contain shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove(
                                'hidden',
                              );
                            }}
                          />
                        ) : null}
                        <div
                          className={`h-[50px] w-[50px] rounded bg-surface-alt flex items-center justify-center shrink-0 ${tour.imageUrl ? 'hidden' : ''}`}
                        >
                          <i className="fa fa-image text-on-surface-tertiary" />
                        </div>
                        <span className="type-body-lg text-primary group-hover/link:text-primary-light group-hover/link:underline transition-colors">
                          {tour.titleEn || tour.titleVi}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const types = new Set(
                            (tour.pricingGroups ?? []).map((g) => g.type),
                          );
                          const hasGroup = types.has('group-size');
                          const hasVehicle = types.has('vehicle');
                          if (!hasGroup && !hasVehicle) {
                            return (
                              <span className="type-body-sm text-on-surface-tertiary">
                                —
                              </span>
                            );
                          }
                          return (
                            <>
                              {hasGroup && <Badge variant="info">Group</Badge>}
                              {hasVehicle && (
                                <Badge variant="success">Vehicle</Badge>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex">
                        <StatusPicker
                          value={tour.status}
                          onChange={(status) =>
                            handleStatusChange(tour.id, status)
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
        {groupedByDestination.length === 0 && !isLoading && (
          <div className="bg-surface-elevated rounded-xl border border-border p-8 text-center type-body-md text-on-surface-secondary">
            No tours yet.
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: tourKeys.list({archived: false}),
      queryFn: () => fetchToursServer({archived: false}),
    }),
    queryClient.prefetchQuery({
      queryKey: tourKeys.list({archived: true}),
      queryFn: () => fetchToursServer({archived: true}),
    }),
  ]);
  return {props: {dehydratedState: dehydrate(queryClient)}};
};
