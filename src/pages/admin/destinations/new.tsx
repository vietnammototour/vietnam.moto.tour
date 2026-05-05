import {DestinationEditTabs} from '@/components/admin/DestinationEditTabs';

const emptyData = {
  slug: '',
  name: '',
  nameVi: '',
  nameEn: '',
  imageUrl: '',
  heroImage: '',
  descriptionVi: '',
  descriptionEn: '',
  size: 'small',
};

export default function NewDestination() {
  return (
    <DestinationEditTabs
      mode="create"
      destinationId={null}
      initialData={emptyData}
    />
  );
}
