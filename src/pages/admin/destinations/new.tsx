import {DestinationForm} from '@/components/admin/DestinationForm';

export default function NewDestination() {
  return (
    <div>
      <h1 className="type-headline-sm mb-6">Create New Destination</h1>
      <DestinationForm mode="create" />
    </div>
  );
}
