import type {Perk, PerkCategory, PerkBucket} from './index';

describe('Perk domain types', () => {
  it('has the expected fields', () => {
    const p: Perk = {
      id: 'x',
      labelEn: 'Bike Hire',
      labelVi: 'Thuê xe',
      icon: 'fa-solid fa-motorcycle',
      category: 'TRANSPORT',
      archived: false,
    };
    expect(p.labelEn).toBe('Bike Hire');
  });

  it('PerkCategory accepts the enum values', () => {
    const c: PerkCategory = 'OTHER';
    expect(c).toBe('OTHER');
  });

  it('PerkBucket accepts INCLUDED / EXCLUDED', () => {
    const b: PerkBucket = 'INCLUDED';
    expect(b).toBe('INCLUDED');
  });
});
