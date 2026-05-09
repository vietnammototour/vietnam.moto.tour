import {useEffect} from 'react';
import type {GetServerSidePropsContext} from 'next';
import {useRouter} from 'next/router';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {TourEditTabs} from '@/components/Admin/TourEditTabs';
import {type ImageSlot} from '@/lib/image-slot';
import {isTourTab, type TourTab} from '@/routes';
import type * as VMT from '@/domain';

type Destination = {
  id: string;
  name: string;
  heroImage: string;
};

const emptyGeneral = {
  slug: '',
  destinationId: '',
  title: '',
  titleVi: '',
  titleEn: '',
  imageCard: {kind: 'empty'} as ImageSlot,
  duration: 1,
  distance: 0,
  descriptionVi: '',
  descriptionEn: '',
  transportation: '',
  hotel: '',
  guided: '',
  images: [] as string[],
  paymentDetails: {en: '', vi: ''},
  notes: [] as Array<{en: string; vi: string}>,
  mealsInfo: {en: '', vi: ''},
  status: 'DRAFT' as VMT.TourStatus,
};

export default function NewTour() {
  const router = useRouter();
  const tabParam = router.query.tab;
  const tab: TourTab =
    typeof tabParam === 'string' && isTourTab(tabParam) ? tabParam : 'general';

  const {data: destinations, loading} = useAdminFetch<Destination[]>(
    '/api/admin/destinations',
  );
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  if (loading || !destinations) return null;

  return (
    <TourEditTabs
      activeTab={tab}
      mode="create"
      tourId={null}
      destinations={destinations}
      initialGeneral={emptyGeneral}
      initialItinerary={[]}
      initialPricingGroups={[]}
      initialHighlightIds={[]}
      initialIncludedPerkIds={[]}
      initialExcludedPerkIds={[]}
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
  if (tab !== 'general') {
    return {
      redirect: {destination: '/admin/tours/new/general', permanent: false},
    };
  }
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
