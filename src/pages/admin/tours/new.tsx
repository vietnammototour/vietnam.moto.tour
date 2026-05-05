import {useEffect} from 'react';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {TourEditTabs} from '@/components/admin/TourEditTabs';
import type {TourStatus} from '@/types';

interface Destination {
  id: string;
  name: string;
}

const emptyGeneral = {
  slug: '',
  destinationId: '',
  title: '',
  titleVi: '',
  titleEn: '',
  imageUrl: '',
  rating: '',
  price: 0,
  duration: '',
  distance: '',
  descriptionVi: '',
  descriptionEn: '',
  transportation: '',
  groupSize: '',
  hotel: '',
  guided: '',
  images: [] as string[],
  included: [] as Array<{en: string; vi: string}>,
  excluded: [] as Array<{en: string; vi: string}>,
  paymentDetails: {en: '', vi: ''},
  notes: [] as Array<{en: string; vi: string}>,
  mealsInfo: {en: '', vi: ''},
  status: 'DRAFT' as TourStatus,
};

export default function NewTour() {
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
      mode="create"
      tourId={null}
      destinations={destinations}
      initialGeneral={emptyGeneral}
      initialItinerary={[]}
      initialPricingGroups={[]}
      initialHighlightIds={[]}
    />
  );
}
