import {useEffect} from 'react';
import type {GetServerSideProps} from 'next';
import {dehydrate} from '@tanstack/react-query';
import {getQueryClient} from '@/lib/queryClient';
import {useVehicles, useRestoreVehicle} from '@/queries/admin/vehicles';
import {vehicleKeys} from '@/queries/admin/vehicles.keys';
import {fetchVehiclesServer} from '@/queries/fetchers/admin/vehicles.server';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {Button} from '@/components/ui';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {routes} from '@/routes';
import type {Vehicle} from '@/domain';

export default function AdminRentalsArchive() {
  const {data: archived, isLoading} = useVehicles({archived: true});
  const restore = useRestoreVehicle();
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  const list = (archived ?? []) as Vehicle[];

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title="Rentals · Archive"
          actions={
            <Button
              variant="secondary"
              size="md"
              href={routes.admin.vehicles.list.path()}
              icon={<i className="fa fa-arrow-left text-xs" />}
            >
              Back to rentals
            </Button>
          }
        />
      }
    >
      {list.length === 0 ? (
        <p className="type-body-md text-on-surface-tertiary">
          No archived vehicles.
        </p>
      ) : (
        <table className="w-full bg-surface-elevated border border-border overflow-hidden">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                Vehicle
              </th>
              <th className="text-right px-4 py-2 type-label-sm text-on-surface-tertiary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 type-body-sm text-on-surface">
                  {v.brand} {v.model} ·{' '}
                  {v.type === 'SCOOTER' ? 'Scooter' : 'Bike'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost-primary"
                    size="sm"
                    onClick={() => restore.mutate(v.id)}
                    icon={<i className="fa fa-rotate-left" />}
                  >
                    Restore
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminPageShell>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const qc = getQueryClient();
  await qc.prefetchQuery({
    queryKey: vehicleKeys.list({archived: true}),
    queryFn: () => fetchVehiclesServer({archived: true}),
  });
  return {props: {dehydratedState: dehydrate(qc)}};
};
