import {getUrl, contactInfo} from '@/utils';

describe('getUrl', () => {
  it('returns path prefixed with /', () => {
    expect(getUrl('assets/images/logo.png')).toBe('/assets/images/logo.png');
  });

  it('handles empty string', () => {
    expect(getUrl('')).toBe('/');
  });
});

describe('contactInfo', () => {
  it('has a phone number', () => {
    expect(contactInfo.phone).toBe('+84-935-797-550');
  });

  it('has an email', () => {
    expect(contactInfo.email).toBe('easyridermotorbiketour@gmail.com');
  });

  it('has a YouTube link', () => {
    expect(contactInfo.youtubeLink).toContain('youtube.com');
  });

  it('has a TripAdvisor link', () => {
    expect(contactInfo.tripadvisorLink).toContain('tripadvisor.com');
  });

  it('has a WhatsApp number', () => {
    expect(contactInfo.whatsApp).toBeTruthy();
  });

  it('has an address', () => {
    expect(contactInfo.address).toBeTruthy();
  });

  it('has a city', () => {
    expect(contactInfo.city).toBe('Nha Trang City');
  });
});
