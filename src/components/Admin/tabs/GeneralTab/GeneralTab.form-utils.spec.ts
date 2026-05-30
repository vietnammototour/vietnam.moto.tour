import {generalTabSchema} from './GeneralTab.form-utils';

const base = {
  slug: 'da-lat',
  destinationId: 'd1',
  titleVi: 'Tour Da Lat',
  titleEn: 'Da Lat Tour',
  duration: 2,
  distance: 180,
  descriptionVi: '',
  descriptionEn: '',
  transportation: '',
  hotel: '',
  guided: '',
  tripAdvisorUrl: '',
};

describe('generalTabSchema', () => {
  it('defaults isFeatured to false when omitted', () => {
    expect(generalTabSchema.cast(base).isFeatured).toBe(false);
  });

  it('preserves an explicit isFeatured value', () => {
    expect(generalTabSchema.cast({...base, isFeatured: true}).isFeatured).toBe(
      true,
    );
  });
});
