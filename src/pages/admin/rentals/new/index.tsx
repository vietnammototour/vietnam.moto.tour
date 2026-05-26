import type {GetServerSideProps} from 'next';
import {routes} from '@/routes';

export default function NewVehicleIndex() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {destination: routes.admin.vehicles.new.path(), permanent: false},
});
