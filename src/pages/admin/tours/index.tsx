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
import {Badge, Button, LocaleSwitcher} from '@/components/ui';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {useAdminLocale} from '@/hooks/useAdminLocale';
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
  const [locale, setLocale] = useAdminLocale();
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

  const pickTitle = (t: AdminTour) =>
    locale === 'vi' ? t.titleVi || t.titleEn : t.titleEn || t.titleVi;
  const pickDestination = (t: AdminTour) =>
    locale === 'vi'
      ? t.destination.nameVi || t.destination.nameEn
      : t.destination.nameEn || t.destination.nameVi;

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title="Tours"
          breadcrumbs={[
            {label: 'Admin', href: routes.admin.dashboard.path()},
            {label: 'Tours'},
          ]}
          localeSwitcher={
            <LocaleSwitcher value={locale} onChange={setLocale} />
          }
          actions={
            <>
              {archivedCount > 0 && (
                <Button
                  variant="secondary"
                  size="md"
                  href={routes.admin.tours.archive.path()}
                  icon={<i className="fa fa-archive text-xs" />}
                >
                  Archive ({archivedCount})
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                href={routes.admin.tours.new.path()}
                icon={<i className="fa fa-plus text-xs" />}
              >
                Add tour
              </Button>
            </>
          }
        />
      }
    >
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
                Pricing Type
              </th>
              <th className="text-right px-4 py-3 type-label-sm text-on-surface-secondary">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {tourList.map((tour) => (
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
                      {pickTitle(tour)}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface-secondary">
                  {pickDestination(tour)}
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
                      onChange={(status) => handleStatusChange(tour.id, status)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPageShell>
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
