import {generalTabSchema} from './GeneralTab.form-utils';

describe('generalTabSchema tripadvisorLocationId', () => {
  const base = {
    slug: 's',
    destinationId: 'd',
    titleVi: 'v',
    titleEn: 'e',
    duration: 1,
    distance: 0,
    descriptionVi: '',
    descriptionEn: '',
    transportation: '',
    hotel: '',
    guided: '',
  };

  it('accepts a tripadvisorLocationId', async () => {
    const v = await generalTabSchema.validate({...base, tripadvisorLocationId: '5501636'});
    expect(v.tripadvisorLocationId).toBe('5501636');
  });

  it('accepts an omitted tripadvisorLocationId', async () => {
    await expect(generalTabSchema.validate(base)).resolves.toBeTruthy();
  });
});
