import {useEffect} from 'react';
import type {GetServerSidePropsContext} from 'next';
import {useRouter} from 'next/router';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
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
    loading: tourLoading,
    error: tourError,
  } = useAdminFetch<Record<string, unknown>>(
    id ? `/api/admin/tours/${id}` : null,
  );
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

  const highlights = (tour.highlights as Array<{id: string}>) ?? [];
  const tourPerks =
    (tour.perks as Array<{perkId: string; bucket: 'INCLUDED' | 'EXCLUDED'}>) ??
    [];
  const initialIncludedPerkIds = tourPerks
    .filter((tp) => tp.bucket === 'INCLUDED')
    .map((tp) => tp.perkId);
  const initialExcludedPerkIds = tourPerks
    .filter((tp) => tp.bucket === 'EXCLUDED')
    .map((tp) => tp.perkId);

  const initialGeneral = {
    slug: tour.slug as string,
    destinationId: tour.destinationId as string,
    title: tour.title as string,
    titleVi: (tour.titleVi as string) ?? '',
    titleEn: (tour.titleEn as string) ?? '',
    duration: (tour.duration as number) ?? 1,
    distance: (tour.distance as number) ?? 0,
    descriptionVi: (tour.descriptionVi as string) ?? '',
    descriptionEn: (tour.descriptionEn as string) ?? '',
    transportation: (tour.transportation as string) ?? '',
    hotel: (tour.hotel as string) ?? '',
    guided: (tour.guided as string) ?? '',
  };

  const initialCard = {imageCard: savedSlot(tour.imageUrl as string | null)};

  return (
    <TourEditTabs
      activeTab={tab}
      mode="edit"
      tourId={tour.id as string}
      destinations={destinations}
      initialGeneral={initialGeneral}
      initialCard={initialCard}
      initialItinerary={(tour.itinerary as never) ?? []}
      initialPricingGroups={(tour.pricingGroups as never) ?? []}
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
  if (typeof tab !== 'string' || !isTourTab(tab)) {
    return {notFound: true};
  }
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
