import type { ReactNode } from 'react';

export interface Tour {
  id: number;
  title: string;
  imageUrl: string;
  rating: string;
  price: number;
  duration: string;
  distance: string;
  location: string;
}

export interface Destination {
  id: number;
  name: string;
  imageUrl: string;
  tours: number;
  width: string;
  height: string;
  colClass: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  youtubeLink: string;
  tripadvisorLink: string;
  instagramLink: string;
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
  delay: number;
}
