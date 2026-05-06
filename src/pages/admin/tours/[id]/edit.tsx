import {useEffect} from 'react';
import {useRouter} from 'next/router';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {TourEditTabs} from '@/components/Admin/TourEditTabs';
import type {TourStatus} from '@/types';

type Destination = {
  id: string;
  name: string;
};

export default function EditTour() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;

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

  const initialGeneral = {
    slug: tour.slug as string,
    destinationId: tour.destinationId as string,
    title: tour.title as string,
    titleVi: (tour.titleVi as string) ?? '',
    titleEn: (tour.titleEn as string) ?? '',
    imageUrl: (tour.imageUrl as string) ?? '',
    price: (tour.price as number) ?? 0,
    duration: (tour.duration as number) ?? 1,
    distance: (tour.distance as number) ?? 0,
    descriptionVi: (tour.descriptionVi as string) ?? '',
    descriptionEn: (tour.descriptionEn as string) ?? '',
    transportation: (tour.transportation as string) ?? '',
    groupSize: (tour.groupSize as number) ?? 2,
    hotel: (tour.hotel as string) ?? '',
    guided: (tour.guided as string) ?? '',
    images: (tour.images as string[]) ?? [],
    included: (tour.included as Array<{en: string; vi: string}>) ?? [],
    excluded: (tour.excluded as Array<{en: string; vi: string}>) ?? [],
    paymentDetails: (tour.paymentDetails as {en: string; vi: string}) ?? {
      en: '',
      vi: '',
    },
    notes: (tour.notes as Array<{en: string; vi: string}>) ?? [],
    mealsInfo: (tour.mealsInfo as {en: string; vi: string}) ?? {en: '', vi: ''},
    status: (tour.status as TourStatus) ?? 'DRAFT',
  };

  return (
    <TourEditTabs
      mode="edit"
      tourId={tour.id as string}
      destinations={destinations}
      initialGeneral={initialGeneral}
      initialItinerary={(tour.itinerary as never) ?? []}
      initialPricingGroups={(tour.pricingGroups as never) ?? []}
      initialHighlightIds={highlights.map((h) => h.id)}
    />
  );
}
