import {useEffect} from 'react';
import type {GetServerSidePropsContext} from 'next';
import {useRouter} from 'next/router';
import {dehydrate} from '@tanstack/react-query';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {useTour} from '@/queries/admin/tours';
import {tourKeys} from '@/queries/admin/tours.keys';
import {fetchTourServer} from '@/queries/fetchers/admin/tours.server';
import {getQueryClient} from '@/lib/queryClient';
import {TourEditTabs} from '@/components/Admin/TourEditTabs';
import {savedSlot} from '@/lib/image-slot';
import {isTourTab, type TourTab} from '@/routes';

type Destination = {
  id: string;
  name: string;
  heroImage: string;
};

export default function EditTour() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  const tabParam = router.query.tab;
  const tab: TourTab =
    typeof tabParam === 'string' && isTourTab(tabParam) ? tabParam : 'general';

  const {
    data: tour,
    isLoading: tourLoading,
    error: tourError,
  } = useTour(id ?? undefined);
  const {data: destinations, loading: destLoading} = useAdminFetch<
    Destination[]
  >('/api/admin/destinations');
  const {setLoading} = useAdminLoading();

  const loading = tourLoading || destLoading;

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  if (tourError) {
    return (
      <div>
        <h1 className="type-headline-sm mb-6">Tour Not Found</h1>
        <p className="text-on-surface-secondary">
          The tour you are looking for does not exist or could not be loaded.
        </p>
      </div>
    );
  }

  if (!tour || !destinations) {
    return null;
  }

  const tourRecord = tour as unknown as Record<string, unknown>;
  const highlights = (tourRecord.highlights as Array<{id: string}>) ?? [];
  const tourPerks =
    (tourRecord.perks as Array<{
      perkId: string;
      bucket: 'INCLUDED' | 'EXCLUDED';
    }>) ?? [];
  const initialIncludedPerkIds = tourPerks
    .filter((tp) => tp.bucket === 'INCLUDED')
    .map((tp) => tp.perkId);
  const initialExcludedPerkIds = tourPerks
    .filter((tp) => tp.bucket === 'EXCLUDED')
    .map((tp) => tp.perkId);

  const initialGeneral = {
    slug: tourRecord.slug as string,
    destinationId: tourRecord.destinationId as string,
    title: tourRecord.title as string,
    titleVi: (tourRecord.titleVi as string) ?? '',
    titleEn: (tourRecord.titleEn as string) ?? '',
    duration: (tourRecord.duration as number) ?? 1,
    distance: (tourRecord.distance as number) ?? 0,
    descriptionVi: (tourRecord.descriptionVi as string) ?? '',
    descriptionEn: (tourRecord.descriptionEn as string) ?? '',
    transportation: (tourRecord.transportation as string) ?? '',
    hotel: (tourRecord.hotel as string) ?? '',
    guided: (tourRecord.guided as string) ?? '',
  };

  const initialCard = {
    imageCard: savedSlot(tourRecord.imageUrl as string | null),
  };

  return (
    <TourEditTabs
      activeTab={tab}
      mode="edit"
      tourId={tourRecord.id as string}
      destinations={destinations}
      initialGeneral={initialGeneral}
      initialCard={initialCard}
      initialItinerary={(tourRecord.itinerary as never) ?? []}
      initialPricingGroups={(tourRecord.pricingGroups as never) ?? []}
      initialHighlightIds={highlights.map((h) => h.id)}
      initialIncludedPerkIds={initialIncludedPerkIds}
      initialExcludedPerkIds={initialExcludedPerkIds}
    />
  );
}

export async function getServerSideProps({
  locale,
  params,
}: GetServerSidePropsContext) {
  const tab = params?.tab;
  const id = params?.id;
  if (typeof tab !== 'string' || !isTourTab(tab)) {
    return {notFound: true};
  }
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');

  const queryClient = getQueryClient();
  if (typeof id === 'string') {
    await queryClient.prefetchQuery({
      queryKey: tourKeys.detail(id),
      queryFn: () => fetchTourServer(id),
    });
  }

  return {
    props: {
      messages: messages ?? {},
      dehydratedState: dehydrate(queryClient),
    },
  };
}
