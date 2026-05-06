import {useEffect} from 'react';
import {useRouter} from 'next/router';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {DestinationEditTabs} from '@/components/Admin/DestinationEditTabs';

export default function EditDestination() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;

  const {
    data: destination,
    loading,
    error,
  } = useAdminFetch<Record<string, unknown>>(
    id ? `/api/admin/destinations/${id}` : null,
  );
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  if (error) {
    return (
      <div>
        <h1 className="type-headline-sm mb-6">Destination Not Found</h1>
        <p className="text-on-surface-secondary">
          The destination you are looking for does not exist or could not be
          loaded.
        </p>
      </div>
    );
  }

  if (!destination) {
    return null;
  }

  const initialData = {
    slug: destination.slug as string,
    name: destination.name as string,
    nameVi: (destination.nameVi as string) ?? '',
    nameEn: (destination.nameEn as string) ?? '',
    imageUrl: (destination.imageUrl as string) ?? '',
    heroImage: (destination.heroImage as string) ?? '',
    descriptionVi: (destination.descriptionVi as string) ?? '',
    descriptionEn: (destination.descriptionEn as string) ?? '',
    size: (destination.size as string) ?? 'small',
  };

  return (
    <DestinationEditTabs
      mode="edit"
      destinationId={destination.id as string}
      initialData={initialData}
    />
  );
}
