import type {GetServerSidePropsContext} from 'next';

export default function EditDestinationRedirect() {
  return null;
}

export async function getServerSideProps({params}: GetServerSidePropsContext) {
  const id = params?.id;
  if (typeof id !== 'string') return {notFound: true};
  return {
    redirect: {
      destination: `/admin/destinations/${id}/edit/general`,
      permanent: false,
    },
  };
}
