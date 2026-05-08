import type {GetServerSidePropsContext} from 'next';

export default function NewTourRedirect() {
  return null;
}

export async function getServerSideProps(_ctx: GetServerSidePropsContext) {
  return {
    redirect: {destination: '/admin/tours/new/general', permanent: false},
  };
}
