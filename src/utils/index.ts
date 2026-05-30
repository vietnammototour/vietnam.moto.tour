import type {ContactInfo} from './contact';

export const getUrl = (path: string): string =>
  `${process.env.__NEXT_ROUTER_BASEPATH || ''}/${path}`;

/**
 * Normalizes an entity slug before persistence: trimmed and always lowercase.
 * Apply at every save site (see .claude/ADMIN.md — slug rule).
 */
export const normalizeSlug = (slug: string): string =>
  slug.trim().toLowerCase();

export const TRIPADVISOR_REVIEWS_URL =
  'https://www.tripadvisor.com/Attraction_Review-g293928-d5501636-Reviews-Vietnam_Motorcycle_Tour-Nha_Trang_Khanh_Hoa_Province.html';

/**
 * USD→VND exchange rate shown in tour payment notes. Single source of truth —
 * payment content stores the `{rate}` token, never the number, so updating the
 * rate is a one-line change here. Formatted per-locale at render time.
 */
export const EXCHANGE_RATE_VND = 26000;

/** Locale-formatted exchange rate string, e.g. "26,000" (en) / "26.000" (vi). */
export const formatExchangeRate = (locale: string): string =>
  EXCHANGE_RATE_VND.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US');

export const contactInfo: ContactInfo = {
  phone: '+84-935-797-550',
  email: 'easyridermotorbiketour@gmail.com',
  youtubeLink:
    'https://youtube.com/@vietnammotorcycletour6674?si=kOduPDV6PDhNygvJ',
  tripadvisorLink:
    'https://www.tripadvisor.com/Attraction_Review-g293928-d5501636-Reviews-Vietnam_Motorcycle_Tour-Nha_Trang_Khanh_Hoa_Province.html',
  whatsApp: '+84-935-797-550',
  address: 'Alley 05-07 Nguyen Trung Truc st.',
  city: 'Nha Trang City',
};
