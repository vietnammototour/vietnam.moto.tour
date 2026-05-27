import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
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

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title="Rentals"
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
      <div className="space-y-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by brand or model…"
          className="cursor-text w-full max-w-md px-3 py-2 border border-border bg-surface-elevated"
        />

        {grouped.length === 0 && (
          <p className="type-body-md text-on-surface-tertiary">
            No vehicles yet. Click &quot;Add vehicle&quot; to create the first
            one.
          </p>
        )}

        {grouped.map((group) => (
          <section
            key={group.type}
            className="bg-surface-elevated border border-border overflow-hidden"
          >
            <header className="flex items-center justify-between px-4 py-3 bg-surface-alt border-b border-border">
              <h2 className="type-label-sm uppercase tracking-wide text-on-surface-secondary">
                {group.type === 'SCOOTER' ? 'Scooters' : 'Bikes'}
              </h2>
              <span className="type-body-sm text-on-surface-tertiary">
                ({group.items.length})
              </span>
            </header>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                    Vehicle
                  </th>
                  <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                    CC
                  </th>
                  <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                    Qty
                  </th>
                  <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                    Price/day
                  </th>
                  <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                    Status
                  </th>
                  <th className="text-right px-4 py-2 type-label-sm text-on-surface-tertiary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={routes.admin.vehicles.edit.path({id: v.id})}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        {v.imageUrl ? (
                          <img
                            src={v.imageUrl}
                            alt=""
                            className="h-[40px] w-auto object-cover"
                          />
                        ) : null}
                        <span className="type-title-sm text-on-surface">
                          {v.brand} {v.model}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 type-body-sm text-on-surface-secondary">
                      {v.cc}
                    </td>
                    <td className="px-4 py-3 type-body-sm text-on-surface-secondary">
                      {v.quantity}
                    </td>
                    <td className="px-4 py-3 type-body-sm text-on-surface-secondary">
                      ${v.priceUsdPerDay}
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{v.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

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
