import {useRouter} from 'next/router';
import type {GetServerSideProps} from 'next';
import {isVehicleTab, routes, type VehicleTab} from '@/routes';
import {useCreateVehicle} from '@/queries/admin/vehicles';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {VehicleEditTabs} from '@/components/Admin/VehicleEditTabs';
import {VehicleGeneralForm} from '@/components/Admin/VehicleGeneralForm';
import type {Vehicle} from '@/domain';

type Props = {tab: VehicleTab};

export default function NewVehiclePage({tab}: Props) {
  const router = useRouter();
  const create = useCreateVehicle();

  const handleGeneralSubmit = async (values: Record<string, unknown>) => {
    const v = (await create.mutateAsync(values)) as Vehicle;
    await router.replace(
      routes.admin.vehicles.edit.path({id: v.id, tab: 'description'}),
    );
  };

  return (
    <AdminPageShell
      header={
        <>
          <AdminPageHeader title="Add vehicle" />
          <VehicleEditTabs
            active={tab}
            baseHref={(t) => routes.admin.vehicles.new.path({tab: t})}
          />
        </>
      }
    >
      {tab === 'general' && (
        <VehicleGeneralForm
          initial={null}
          onSubmit={(values) =>
            handleGeneralSubmit(values as unknown as Record<string, unknown>)
          }
          onCancel={() => router.push(routes.admin.vehicles.list.path())}
        />
      )}
      {tab === 'description' && (
        <p className="type-body-md text-on-surface-tertiary">
          Save the General tab first to enable description editing.
        </p>
      )}
      {tab === 'images' && (
        <p className="type-body-md text-on-surface-tertiary">
          Save the General tab first to enable image uploads.
        </p>
      )}
    </AdminPageShell>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const tabParam = String(ctx.params?.tab ?? '');
  if (!isVehicleTab(tabParam)) {
    return {
      redirect: {
        destination: routes.admin.vehicles.new.path(),
        permanent: false,
      },
    };
  }
  return {props: {tab: tabParam}};
};
