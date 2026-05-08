import type {GetServerSidePropsContext} from 'next';

export default function EditTourRedirect() {
  return null;
}

export async function getServerSideProps({params}: GetServerSidePropsContext) {
  const id = params?.id;
  if (typeof id !== 'string') return {notFound: true};
  return {
    redirect: {
      destination: `/admin/tours/${id}/edit/general`,
      permanent: false,
    },
  };
}
