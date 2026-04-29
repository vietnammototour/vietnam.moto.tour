import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {TourForm} from '@/components/admin/TourForm';

interface Props {
  tour: Record<string, unknown>;
  destinations: Array<{id: string; name: string}>;
}

export default function EditTour({tour, destinations}: Props) {
  const initialData = {
    slug: tour.slug as string,
    destinationId: tour.destinationId as string,
    title: tour.title as string,
    titleVi: (tour.titleVi as string) ?? '',
    titleEn: (tour.titleEn as string) ?? '',
    imageUrl: (tour.imageUrl as string) ?? '',
    rating: (tour.rating as string) ?? '',
    price: (tour.price as number) ?? 0,
    duration: (tour.duration as string) ?? '',
    distance: (tour.distance as string) ?? '',
    descriptionVi: (tour.descriptionVi as string) ?? '',
    descriptionEn: (tour.descriptionEn as string) ?? '',
    transportation: (tour.transportation as string) ?? '',
    groupSize: (tour.groupSize as string) ?? '',
    hotel: (tour.hotel as string) ?? '',
    guided: (tour.guided as string) ?? '',
    heroImage: (tour.heroImage as string) ?? '',
    images: (tour.images as string[]) ?? [],
    highlights: (tour.highlights as Array<{en: string; vi: string}>) ?? [],
    itinerary: tour.itinerary as unknown[] as never,
    pricingGroups: tour.pricingGroups as unknown[] as never,
    included: (tour.included as Array<{en: string; vi: string}>) ?? [],
    excluded: (tour.excluded as Array<{en: string; vi: string}>) ?? [],
    paymentDetails: (tour.paymentDetails as {en: string; vi: string}) ?? {
      en: '',
      vi: '',
    },
    notes: (tour.notes as Array<{en: string; vi: string}>) ?? [],
    mealsInfo: (tour.mealsInfo as {en: string; vi: string}) ?? {en: '', vi: ''},
  };

  return (
    <div>
      <h1 className="type-headline-sm mb-6">Edit Tour</h1>
      <TourForm
        initialData={initialData}
        destinations={destinations}
        mode="edit"
        tourId={tour.id as string}
      />
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  const id = context.params?.id as string;
  const tour = await prisma.tour.findUnique({where: {id}});
  if (!tour) return {notFound: true};

  const destinations = await prisma.destination.findMany({
    where: {isActive: true},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  });

  return {
    props: {
      tour: JSON.parse(JSON.stringify(tour)),
      destinations: JSON.parse(JSON.stringify(destinations)),
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
