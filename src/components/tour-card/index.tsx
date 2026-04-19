import Link from 'next/link';
import type { TourCardProps } from '@/types';

export const TourCard = ({ tour }: TourCardProps) => {
  const { title, imageUrl, rating, price, duration, distance, location } = tour;

  return (
    <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col">
      <div className="relative overflow-hidden aspect-[3/2]">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10" />
        <button
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center text-neutral-500 hover:text-primary hover:bg-white transition-all"
          aria-label="Add to favorites"
        >
          <i className="fa fa-heart text-sm" />
        </button>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-sm text-primary font-semibold mb-2">
          <i className="fa fa-star text-xs" /> {rating}
        </div>
        <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary transition-colors">
          <Link href="/tours">{title}</Link>
        </h3>
        <p className="text-neutral-500 text-sm mb-4">
          <span className="text-primary font-bold text-lg">${price}</span> / Per Person
        </p>
        <ul className="flex items-center gap-4 text-xs text-neutral-500 mt-auto pt-4 border-t border-neutral-100">
          <li className="flex items-center gap-1"><i className="fa fa-clock text-primary" /> {duration}</li>
          <li className="flex items-center gap-1"><i className="fa fa-road text-primary" /> {distance}</li>
          <li className="flex items-center gap-1"><i className="fa fa-map-marker-alt text-primary" /> {location}</li>
        </ul>
      </div>
    </div>
  );
};
