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
  description?: LocalizedText;
  price: number;
  minGroupSize?: number;
  maxGroupSize?: number;
}

export interface PricingGroup {
  type: 'group-size' | 'vehicle';
  label: LocalizedText;
  icon?: string;
  tiers: PricingTier[];
}

export interface Highlight {
  id: string;
  destinationId: string;
  textEn: string;
  textVi: string;
  imageUrl: string | null;
}

export type TourStatus = 'DRAFT' | 'PUBLISHED' | 'FEATURED' | 'ARCHIVED';

export interface Tour {
  id: number;
  title: string;
  imageUrl: string;
  price: number;
  duration: number;
  distance: number;
  destinationId: number;
  slug: string;
  status: TourStatus;
  description: LocalizedText;
  transportation: string;
  groupSize: number;
  hotel: string;
  guided: string;
  destinationHeroImage: string;
  images: string[];
  highlights: Highlight[];
  itinerary: ItineraryDay[];
  pricingGroups: PricingGroup[];
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
  heroImage: string;
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
  destination: Destination & {
    tourCount: number;
    hasCar: boolean;
    hasBike: boolean;
  };
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
