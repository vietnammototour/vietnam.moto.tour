import type {LocalizedText} from '../shared/localized-text';

export type VehicleType = 'SCOOTER' | 'BIKE';
export type VehicleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type Vehicle = {
  id: string;
  slug: string;
  type: VehicleType;
  brand: string;
  model: string;
  cc: number;
  quantity: number;
  priceUsdPerDay: number;
  imageUrl: string | null;
  images: string[];
  description: LocalizedText;
  status: VehicleStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
};
