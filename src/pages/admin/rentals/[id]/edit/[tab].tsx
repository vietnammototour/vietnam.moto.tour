import {useRouter} from 'next/router';
import type {GetServerSideProps} from 'next';
import {dehydrate} from '@tanstack/react-query';
import {getQueryClient} from '@/lib/queryClient';
import {isVehicleTab, routes, type VehicleTab} from '@/routes';
import {useVehicle, useUpdateVehicle} from '@/queries/admin/vehicles';
import {vehicleKeys} from '@/queries/admin/vehicles.keys';
import {fetchVehicleServer} from '@/queries/fetchers/admin/vehicles.server';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {VehicleEditTabs} from '@/components/Admin/VehicleEditTabs';
import {VehicleGeneralForm} from '@/components/Admin/VehicleGeneralForm';
import {VehicleDescriptionForm} from '@/components/Admin/VehicleDescriptionForm';
import {VehicleImagesForm} from '@/components/Admin/VehicleImagesForm';
import {flushImageSlots} from '@/lib/submit-with-images';
import type {ImageSlot} from '@/lib/image-slot';
import type {Vehicle} from '@/domain';

type Props = {id: string; tab: VehicleTab};

export default function EditVehiclePage({id, tab}: Props) {
  const router = useRouter();
  const {data: vehicle} = useVehicle(id);
  const update = useUpdateVehicle();

  const back = () => router.push(routes.admin.vehicles.list.path());
  const baseHref = (t: VehicleTab) =>
    routes.admin.vehicles.edit.path({id, tab: t});

  const typed = vehicle as Vehicle | undefined;

  return (
    <AdminPageShell
      header={
        <>
          <AdminPageHeader
            title={typed ? `${typed.brand} ${typed.model}` : 'Edit vehicle'}
          />
          <VehicleEditTabs active={tab} baseHref={baseHref} />
        </>
      }
    >
      {!typed ? (
        <p className="type-body-md text-on-surface-tertiary">Loading…</p>
      ) : (
        <>
          {tab === 'general' && (
            <VehicleGeneralForm
              initial={typed}
              onSubmit={async (values) => {
                await update.mutateAsync({
                  id,
                  input: values as unknown as Record<string, unknown>,
                });
              }}
              onCancel={back}
            />
          )}
          {tab === 'description' && (
            <VehicleDescriptionForm
              initial={typed.description}
              onSubmit={async (values) => {
                await update.mutateAsync({id, input: {description: values}});
              }}
              onCancel={back}
            />
          )}
          {tab === 'images' && (
            <VehicleImagesForm
              initial={{imageUrl: typed.imageUrl, images: typed.images}}
              onSubmit={async (values) => {
                const slot = values.imageUrl as ImageSlot;
                const {updated, errors} = await flushImageSlots({
                  entityType: 'vehicle',
                  entityId: id,
                  slots: {card: slot},
                });
                if (errors.card) throw new Error(errors.card);
                const resolved = (updated.card ?? slot) as ImageSlot;
                const nextImageUrl =
                  resolved.kind === 'saved' ? resolved.url : null;
                await update.mutateAsync({
                  id,
                  input: {imageUrl: nextImageUrl},
                });
              }}
              onCancel={back}
            />
          )}
        </>
      )}
    </AdminPageShell>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = String(ctx.params?.id ?? '');
  const tabParam = String(ctx.params?.tab ?? '');
  if (!isVehicleTab(tabParam)) {
    return {
      redirect: {
        destination: routes.admin.vehicles.edit.path({id}),
        permanent: false,
      },
    };
  }
  const qc = getQueryClient();
  await qc.prefetchQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => fetchVehicleServer(id),
  });
  return {
    props: {id, tab: tabParam, dehydratedState: dehydrate(qc)} as Props,
  };
};
