import Image from 'next/image';
import type * as VMT from '@/domain';

type Props = {
  destination: VMT.DestinationDetail;
  locale: 'en' | 'vi';
};

export function DestinationHero({destination, locale}: Props) {
  const description = destination.description[locale];

  return (
    <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
      <Image
        src={destination.heroImage || destination.imageUrl}
        alt={destination.name}
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-0 flex items-end">
        <div className="container mx-auto px-4 pb-12">
          <h1 className="type-display-md text-white mb-4">
            {destination.name}
          </h1>
          {description && (
            <p className="type-body-lg text-white/90 max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
