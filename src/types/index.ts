import type {ReactNode} from 'react';

export type LocalizedText = {
  en: string;
  vi: string;
};

export interface ItineraryItem {
  time: string;
  description: LocalizedText;
}

export interface ItineraryDay {
  dayLabel: LocalizedText;
  items: ItineraryItem[];
}

export interface PricingTier {
  label: LocalizedText;
  price: number;
}

export interface Tour {
  id: number;
  title: string;
  imageUrl: string;
  rating: string;
  price: number;
  duration: string;
  distance: string;
  location: string;
  slug: string;
  description: LocalizedText;
  transportation: string;
  groupSize: string;
  hotel: string;
  guided: string;
  heroImage: string;
  images: string[];
  highlights: LocalizedText[];
  itinerary: ItineraryDay[];
  pricing: PricingTier[];
  included: LocalizedText[];
  excluded: LocalizedText[];
  paymentDetails: LocalizedText;
  notes: LocalizedText[];
  mealsInfo: LocalizedText;
}

export interface Destination {
  id: number;
  name: string;
  imageUrl: string;
  tours: number;
  size: 'small' | 'large';
}

export interface ContactInfo {
  phone: string;
  email: string;
  youtubeLink: string;
  tripadvisorLink: string;
  whatsApp: string;
  address: string;
  city: string;
}

export interface LayoutProps {
  children: ReactNode;
}

export interface TourCardProps {
  tour: Tour;
}

export interface TourCarouselProps {
  tours: Tour[];
}

export interface DestinationCardProps {
  destination: Destination;
}

export interface GalleryItemProps {
  imageSrc: string;
  alt: string;
  delay: number;
}

export interface PageHeaderProps {
  title: string;
  breadcrumbs: {label: string; href?: string}[];
  backgroundImage: string;
}

export interface VideoModalProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
}
