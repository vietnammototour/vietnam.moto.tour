import {useEffect} from 'react';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {TourEditTabs} from '@/components/Admin/TourEditTabs';
import type * as VMT from '@/domain';

type Destination = {
  id: string;
  name: string;
};

const emptyGeneral = {
  slug: '',
  destinationId: '',
  title: '',
  titleVi: '',
  titleEn: '',
  imageUrl: '',
  price: 0,
  duration: 1,
  distance: 0,
  descriptionVi: '',
  descriptionEn: '',
  transportation: '',
  groupSize: 2,
  hotel: '',
  guided: '',
  images: [] as string[],
  included: [] as Array<{en: string; vi: string}>,
  excluded: [] as Array<{en: string; vi: string}>,
  paymentDetails: {en: '', vi: ''},
  notes: [] as Array<{en: string; vi: string}>,
  mealsInfo: {en: '', vi: ''},
  status: 'DRAFT' as VMT.TourStatus,
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
