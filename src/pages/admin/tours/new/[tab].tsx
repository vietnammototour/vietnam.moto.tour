import {useEffect} from 'react';
import type {GetServerSidePropsContext} from 'next';
import {useRouter} from 'next/router';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {TourEditTabs} from '@/components/Admin/TourEditTabs';
import {emptySlot} from '@/lib/image-slot';
import {isTourTab, type TourTab} from '@/routes';

type DestinationApiRow = {
  id: string;
  nameVi: string;
  nameEn: string;
  heroImage: string;
};

type Destination = {
  id: string;
  name: string;
  heroImage: string;
};

const emptyGeneral = {
  slug: '',
  destinationId: '',
  titleVi: '',
  titleEn: '',
  duration: 1,
  distance: 0,
  descriptionVi: '',
  descriptionEn: '',
  transportation: '',
  hotel: '',
  guided: '',
  tripAdvisorUrl: '',
};

export default function NewTour() {
  const router = useRouter();
  const tabParam = router.query.tab;
  const tab: TourTab =
    typeof tabParam === 'string' && isTourTab(tabParam) ? tabParam : 'general';

  const {data: destinationsRaw, loading} = useAdminFetch<DestinationApiRow[]>(
    '/api/admin/destinations',
  );
  const destinations: Destination[] | null = destinationsRaw
    ? destinationsRaw.map((d) => ({
        id: d.id,
        name: d.nameEn || d.nameVi,
        heroImage: d.heroImage,
      }))
    : null;
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  if (loading || !destinations) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 p-8">
      <TourEditTabs
        activeTab={tab}
        mode="create"
        tourId={null}
        destinations={destinations}
        initialGeneral={emptyGeneral}
        initialCard={{imageCard: emptySlot}}
        initialItinerary={[]}
        initialPricingGroups={[]}
        initialHighlightIds={[]}
        initialIncludedPerkIds={[]}
        initialExcludedPerkIds={[]}
      />
    </div>
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
  if (tab !== 'general') {
    return {
      redirect: {destination: '/admin/tours/new/general', permanent: false},
    };
  }
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
