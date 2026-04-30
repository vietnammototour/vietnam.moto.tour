import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {DestinationForm} from '@/components/admin/DestinationForm';

export default function NewDestination() {
  return (
    <div>
      <h1 className="type-headline-sm mb-6">Create New Destination</h1>
      <DestinationForm mode="create" />
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  return {
    props: {
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
