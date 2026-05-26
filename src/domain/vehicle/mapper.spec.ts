import type {Vehicle as PrismaVehicle} from '@prisma/client';
import {toVehicle} from './mapper';

const baseRow = {
  id: 'v1',
  slug: 'honda-airblade',
  type: 'SCOOTER',
  brand: 'Honda',
  model: 'Airblade',
  cc: 125,
  quantity: 2,
  priceUsdPerDay: 8,
  imageUrl: '/uploads/v1.jpg',
  images: ['/uploads/v1.jpg', '/uploads/v2.jpg'],
  description: {en: 'Reliable city scooter.', vi: 'Xe ga đáng tin cậy.'},
  status: 'PUBLISHED',
  order: 0,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
} as unknown as PrismaVehicle;

describe('toVehicle', () => {
  it('converts Date fields to ISO strings', () => {
    const v = toVehicle(baseRow);
    expect(v.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(v.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('coerces missing description keys to empty strings', () => {
    const v = toVehicle({
      ...baseRow,
      description: {},
    } as unknown as PrismaVehicle);
    expect(v.description).toEqual({en: '', vi: ''});
  });

  it('defaults images to empty array if null', () => {
    const v = toVehicle({...baseRow, images: null} as unknown as PrismaVehicle);
    expect(v.images).toEqual([]);
  });

  it('passes through scalar fields untouched', () => {
    const v = toVehicle(baseRow);
    expect(v.brand).toBe('Honda');
    expect(v.priceUsdPerDay).toBe(8);
    expect(v.type).toBe('SCOOTER');
  });
});
