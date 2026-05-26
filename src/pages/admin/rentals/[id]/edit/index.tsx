import type {GetServerSideProps} from 'next';
import {routes} from '@/routes';

export default function EditVehicleIndex() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const id = String(ctx.params?.id ?? '');
  return {
    redirect: {
      destination: routes.admin.vehicles.edit.path({id}),
      permanent: false,
    },
  };
};
