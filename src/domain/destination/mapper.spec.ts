import {toDestination} from './mapper';
import type {Destination as PrismaDestination} from '@prisma/client';

function row(overrides: Partial<PrismaDestination> = {}): PrismaDestination {
  return {
    id: 'd1',
    slug: 'mui-ne',
    nameVi: 'Mũi Né',
    nameEn: 'Mui Ne',
    imageUrl: '/m.jpg',
    heroImage: '/m-hero.jpg',
    descriptionVi: '',
    descriptionEn: '',
    size: 'small',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as PrismaDestination;
}

describe('toDestination', () => {
  it('returns name as a LocalizedText pair built from nameVi and nameEn', () => {
    const result = toDestination(row());
    expect(result.name).toEqual({vi: 'Mũi Né', en: 'Mui Ne'});
  });

  it('falls back to empty strings when localized values are missing', () => {
    const result = toDestination(row({nameVi: '', nameEn: ''}));
    expect(result.name).toEqual({vi: '', en: ''});
  });
});
