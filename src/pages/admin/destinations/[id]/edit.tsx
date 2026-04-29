import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {DestinationForm} from '@/components/admin/DestinationForm';

interface Props {
  destination: Record<string, unknown>;
}

export default function EditDestination({destination}: Props) {
  const initialData = {
    slug: destination.slug as string,
    name: destination.name as string,
    nameVi: (destination.nameVi as string) ?? '',
    nameEn: (destination.nameEn as string) ?? '',
    imageUrl: (destination.imageUrl as string) ?? '',
    descriptionVi: (destination.descriptionVi as string) ?? '',
    descriptionEn: (destination.descriptionEn as string) ?? '',
    size: (destination.size as string) ?? 'small',
  };

  return (
    <div>
      <h1 className="type-headline-sm mb-6">Edit Destination</h1>
      <DestinationForm
        initialData={initialData}
        mode="edit"
        destinationId={destination.id as string}
      />
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  const id = context.params?.id as string;
  const destination = await prisma.destination.findUnique({where: {id}});
  if (!destination) return {notFound: true};

  return {
    props: {
      destination: JSON.parse(JSON.stringify(destination)),
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
