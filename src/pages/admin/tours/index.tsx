import {useEffect, useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type {GetServerSideProps} from 'next';
import {dehydrate} from '@tanstack/react-query';
import {getQueryClient} from '@/lib/queryClient';
import {useTours, useToggleTourStatus} from '@/queries/admin/tours';
import {tourKeys} from '@/queries/admin/tours.keys';
import {fetchToursServer} from '@/queries/fetchers/admin/tours.server';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {StatusPicker} from '@/components/Admin/StatusPicker';
import {routes} from '@/routes';
import {Button, LocaleSwitcher} from '@/components/ui';
import type {AdminLocale} from '@/components/ui/LocaleSwitcher';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {DataGrid, type GridColumn} from '@/components/Admin/DataGrid';
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
  const [locale, setLocale] = useState<AdminLocale>('en');
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
    locale === 'en' ? t.titleEn || t.titleVi : t.titleVi || t.titleEn;
  const pickDestination = (d: AdminTour['destination']) =>
    locale === 'en' ? d.nameEn || d.nameVi : d.nameVi || d.nameEn;

  const groupedByDestination = (() => {
    const groups = new Map<string, {label: string; tours: AdminTour[]}>();
    for (const tour of tourList) {
      const key = pickDestination(tour.destination) || '—';
      const bucket = groups.get(key) ?? {label: key, tours: []};
      bucket.tours.push(tour);
      groups.set(key, bucket);
    }
    return Array.from(groups.values())
      .map((g) => ({
        ...g,
        tours: [...g.tours].sort((a, b) =>
          pickTitle(a).localeCompare(pickTitle(b)),
        ),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  })();

  const columns: GridColumn<AdminTour>[] = [
    {
      key: 'title',
      header: 'Title',
      track: 'minmax(0,1fr)',
      render: (tour) => (
        <Link
          href={routes.admin.tours.edit.path({id: tour.id})}
          className="flex items-center gap-3 cursor-pointer"
        >
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
            <span className="h-[50px] w-[50px] bg-surface-alt flex items-center justify-center shrink-0">
              <i className="fa fa-image text-on-surface-tertiary" />
            </span>
          )}
          <span className="type-body-lg text-primary hover:underline">
            {pickTitle(tour)}
          </span>
        </Link>
      ),
    },
    {
      key: 'pricing',
      header: 'Pricing Type',
      track: '160px',
      render: (tour) => {
        const types = new Set((tour.pricingGroups ?? []).map((g) => g.type));
        const hasGroup = types.has('group-size');
        const hasVehicle = types.has('vehicle');
        if (!hasGroup && !hasVehicle)
          return <span className="text-on-surface-tertiary">—</span>;
        const chip =
          'type-label-sm uppercase tracking-wide bg-surface-alt border border-border text-on-surface-secondary px-2 py-0.5';
        return (
          <div className="flex items-center gap-1.5">
            {hasGroup && <span className={chip}>Group</span>}
            {hasVehicle && <span className={chip}>Vehicle</span>}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      track: '180px',
      align: 'end',
      render: (tour) => (
        <div className="inline-flex justify-end">
          <StatusPicker
            value={tour.status}
            onChange={(status) => handleStatusChange(tour.id, status)}
          />
        </div>
      ),
    },
  ];

  const sections = groupedByDestination.map((g) => ({
    id: g.label,
    label: g.label,
    count: g.tours.length,
    items: g.tours,
  }));

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title="Tours"
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
      <DataGrid
        columns={columns}
        sections={sections}
        rowKey={(t) => t.id}
        ariaLabel="Tours"
        emptyState="No tours yet."
      />
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
