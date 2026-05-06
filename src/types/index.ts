// src/types/index.ts
import type {ReactNode} from 'react';
import type {Tour as VmtTour, DestinationWithStats} from '@/domain';

// Re-exports from VMT (transitional shim — to be removed once all consumers
// migrate to `import * as VMT from '@/domain'`).
export type {
  LocalizedText,
  Tour,
  TourStatus,
  ItineraryDay,
  ItineraryItem,
  PricingGroup,
  PricingTier,
  Destination,
  Highlight,
} from '@/domain';
export type {User as AdminUser} from '@/domain';
export type {Translation as TranslationRow} from '@/domain';

// Non-domain types kept here for now.
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
  tour: VmtTour;
};

export type TourCarouselProps = {
  tours: VmtTour[];
};

export type DestinationCardProps = {
  destination: DestinationWithStats;
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

export type AdminStats = {
  tourCount: number;
  destinationCount: number;
  userCount: number;
};
