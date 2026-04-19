import Link from 'next/link';
import type { DestinationCardProps } from '@/types';

export const DestinationCard = ({ destination }: DestinationCardProps) => {
  const { name, imageUrl, tours } = destination;

  return (
    <div className="group relative rounded-lg overflow-hidden aspect-square">
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h2 className="text-xl font-bold text-white mb-1">
          <Link href="/tours" className="hover:text-primary-light transition-colors">{name}</Link>
        </h2>
        <span className="inline-block bg-primary/90 text-white text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
          {tours} tours
        </span>
      </div>
    </div>
  );
};
