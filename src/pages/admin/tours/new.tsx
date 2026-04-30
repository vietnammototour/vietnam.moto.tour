import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {TourForm} from '@/components/admin/TourForm';

interface Props {
  destinations: Array<{id: string; name: string}>;
}

export default function NewTour({destinations}: Props) {
  return (
    <div>
      <h1 className="type-headline-sm mb-6">Create New Tour</h1>
      <TourForm destinations={destinations} mode="create" />
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  const destinations = await prisma.destination.findMany({
    where: {isActive: true},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  });

  return {
    props: {
      destinations: JSON.parse(JSON.stringify(destinations)),
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
