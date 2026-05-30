import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type {GetServerSideProps} from 'next';
import {dehydrate} from '@tanstack/react-query';
import {getQueryClient} from '@/lib/queryClient';
import {useVehicles, useDeleteVehicle} from '@/queries/admin/vehicles';
import {vehicleKeys} from '@/queries/admin/vehicles.keys';
import {fetchVehiclesServer} from '@/queries/fetchers/admin/vehicles.server';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {routes} from '@/routes';
import {Badge, Button} from '@/components/ui';
import {ConfirmModal} from '@/components/ui/ConfirmModal';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {DataGrid, type GridColumn} from '@/components/Admin/DataGrid';
import type {Vehicle} from '@/domain';

export default function AdminRentalsList() {
  const {data: vehicles, isLoading} = useVehicles({archived: false});
  const {data: archivedVehicles} = useVehicles({archived: true});
  const del = useDeleteVehicle();
  const {setLoading} = useAdminLoading();
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  const list = (vehicles ?? []) as Vehicle[];
  const archivedCount = archivedVehicles?.length ?? 0;
  const term = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!term) return list;
    return list.filter(
      (v) =>
        v.brand.toLowerCase().includes(term) ||
        v.model.toLowerCase().includes(term),
    );
  }, [list, term]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Vehicle[]>();
    for (const v of filtered) {
      const key = v.type;
      const bucket = groups.get(key) ?? [];
      bucket.push(v);
      groups.set(key, bucket);
    }
    return Array.from(groups.entries())
      .map(([type, items]) => ({
        type,
        items: [...items].sort(
          (a, b) => a.order - b.order || a.brand.localeCompare(b.brand),
        ),
      }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }, [filtered]);

  const columns: GridColumn<Vehicle>[] = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      track: 'minmax(0,1fr)',
      render: (v) => (
        <Link
          href={routes.admin.vehicles.edit.path({id: v.id})}
          className="flex items-center gap-3 cursor-pointer"
        >
          {v.imageUrl ? (
            <Image
              src={v.imageUrl}
              alt=""
              width={60}
              height={40}
              unoptimized
              className="h-[40px] w-auto object-cover"
            />
          ) : null}
          <span className="type-title-sm text-on-surface">
            {v.brand} {v.model}
          </span>
        </Link>
      ),
    },
    {key: 'cc', header: 'CC', track: '64px', render: (v) => v.cc},
    {key: 'qty', header: 'Qty', track: '56px', render: (v) => v.quantity},
    {
      key: 'price',
      header: 'Price/day',
      track: '96px',
      render: (v) => `$${v.priceUsdPerDay}`,
    },
    {
      key: 'status',
      header: 'Status',
      track: '120px',
      render: (v) => <Badge>{v.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      track: '160px',
      align: 'end',
      render: (v) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost-primary"
            size="sm"
            href={routes.admin.vehicles.edit.path({id: v.id})}
            icon={<i className="fa fa-pencil" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost-danger"
            size="sm"
            onClick={() => setConfirmId(v.id)}
            icon={<i className="fa fa-trash" />}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const sections = grouped.map((g) => ({
    id: g.type,
    label: g.type === 'SCOOTER' ? 'Scooters' : 'Bikes',
    count: g.items.length,
    items: g.items,
  }));

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title="Rentals"
          search={
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by brand or model…"
              className="cursor-text w-64 px-3 py-2 border border-border bg-surface-elevated"
            />
          }
          actions={
            <>
              {archivedCount > 0 && (
                <Button
                  variant="secondary"
                  size="md"
                  href={routes.admin.vehicles.archive.path()}
                  icon={<i className="fa fa-archive text-xs" />}
                >
                  Archive ({archivedCount})
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                href={routes.admin.vehicles.new.path()}
                icon={<i className="fa fa-plus text-xs" />}
              >
                Add vehicle
              </Button>
            </>
          }
        />
      }
    >
      <DataGrid
        columns={columns}
        sections={sections}
        rowKey={(v) => v.id}
        ariaLabel="Rentals"
        emptyState={'No vehicles yet. Click "Add vehicle" to create the first one.'}
      />

      <ConfirmModal
        open={confirmId !== null}
        title="Archive this vehicle?"
        description="This vehicle will move to the archive and be hidden from the public page. You can restore it later."
        confirmLabel="Archive"
        onConfirm={async () => {
          if (confirmId) await del.mutateAsync(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </AdminPageShell>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const qc = getQueryClient();
  await qc.prefetchQuery({
    queryKey: vehicleKeys.list({archived: false}),
    queryFn: () => fetchVehiclesServer({archived: false}),
  });
  await qc.prefetchQuery({
    queryKey: vehicleKeys.list({archived: true}),
    queryFn: () => fetchVehiclesServer({archived: true}),
  });
  return {props: {dehydratedState: dehydrate(qc)}};
};
