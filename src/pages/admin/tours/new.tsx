import {useEffect} from 'react';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {TourForm} from '@/components/admin/TourForm';

interface Destination {
  id: string;
  name: string;
}

export default function NewTour() {
  const {data: destinations, loading} = useAdminFetch<Destination[]>(
    '/api/admin/destinations',
  );
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  return (
    <div>
      {!loading && destinations && (
        <TourForm destinations={destinations} mode="create" />
      )}
    </div>
  );
}
