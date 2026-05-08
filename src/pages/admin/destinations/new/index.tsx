import type {GetServerSidePropsContext} from 'next';

export default function NewDestinationRedirect() {
  return null;
}

export async function getServerSideProps(_ctx: GetServerSidePropsContext) {
  return {
    redirect: {
      destination: '/admin/destinations/new/general',
      permanent: false,
    },
  };
}
