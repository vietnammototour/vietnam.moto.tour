import type {ReactNode} from 'react';

export type LocalizedText = {
  en: string;
  vi: string;
};

export type ItineraryItem = {
  time: string;
  description: LocalizedText;
};

export type ItineraryDay = {
  dayLabel: LocalizedText;
  items: ItineraryItem[];
};

export type PricingTier = {
  label: LocalizedText;
  description?: LocalizedText;
  price: number;
  minGroupSize?: number;
  maxGroupSize?: number;
};

export type PricingGroup = {
  type: 'group-size' | 'vehicle';
  label: LocalizedText;
  icon?: string;
  tiers: PricingTier[];
};

export type Highlight = {
  id: string;
  destinationId: string;
  textEn: string;
  textVi: string;
  imageUrl: string | null;
};

export type TourStatus = 'DRAFT' | 'PUBLISHED' | 'FEATURED' | 'ARCHIVED';

export type Tour = {
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
};

export type Destination = {
  id: number;
  name: string;
  imageUrl: string;
  heroImage: string;
  size: 'small' | 'large';
};

export type ContactInfo = {
  phone: string;
  email: string;
  youtubeLink: string;
  tripadvisorLink: string;
  whatsApp: string;
  address: string;
  city: string;
};

export type LayoutProps = {
  children: ReactNode;
};

export type TourCardProps = {
  tour: Tour;
};

export type TourCarouselProps = {
  tours: Tour[];
};

export type DestinationCardProps = {
  destination: Destination & {
    tourCount: number;
    hasCar: boolean;
    hasBike: boolean;
  };
};

export type GalleryItemProps = {
  imageSrc: string;
  alt: string;
  delay: number;
};

export type PageHeaderProps = {
  title: string;
  breadcrumbs: {label: string; href?: string}[];
  backgroundImage: string;
};

export type VideoModalProps = {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export type TranslationRow = {
  id: string;
  namespace: string;
  key: string;
  valueVi: string;
  valueEn: string;
};

export type AdminStats = {
  tourCount: number;
  destinationCount: number;
  userCount: number;
};
