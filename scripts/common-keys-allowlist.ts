export type CommonKeyMapping = {
  from: {namespace: string; key: string};
  to: {key: string};
  /** Optional override when VI/EN values differ across sources, or to
   *  resolve a collision with an existing common.<key>. */
  value?: {vi: string; en: string};
};

/**
 * Curated from the output of `pnpm i18n:scan`. Each mapping moves a duplicate
 * feature-namespaced key into the shared `common.*` namespace. Mappings for
 * keys accessed dynamically (e.g. `t(tab.key)`) are intentionally excluded —
 * the codemod only rewrites static string literals, and deleting their DB rows
 * would break runtime lookups.
 */
export const COMMON_KEY_MAPPINGS: CommonKeyMapping[] = [
  // breadcrumbHome — 6 sources, all "Home", VI varies in casing
  {
    from: {namespace: 'tours', key: 'breadcrumbHome'},
    to: {key: 'breadcrumbHome'},
    value: {vi: 'Trang chủ', en: 'Home'},
  },
  {
    from: {namespace: 'tourDetail', key: 'breadcrumbHome'},
    to: {key: 'breadcrumbHome'},
  },
  {
    from: {namespace: 'contact', key: 'breadcrumbHome'},
    to: {key: 'breadcrumbHome'},
  },
  {
    from: {namespace: 'about', key: 'breadcrumbHome'},
    to: {key: 'breadcrumbHome'},
  },
  {
    from: {namespace: 'rental', key: 'breadcrumbHome'},
    to: {key: 'breadcrumbHome'},
  },
  {
    from: {namespace: 'destinationDetail', key: 'breadcrumbHome'},
    to: {key: 'breadcrumbHome'},
  },

  // breadcrumbTours — 2 sources, EN "Tours", VI "Tours" vs "Tour"
  {
    from: {namespace: 'tours', key: 'breadcrumbTours'},
    to: {key: 'breadcrumbTours'},
    value: {vi: 'Tour', en: 'Tours'},
  },
  {
    from: {namespace: 'tourDetail', key: 'breadcrumbTours'},
    to: {key: 'breadcrumbTours'},
  },

  // whatsappUs — EN casing varies "WhatsApp Us" vs "WhatsApp us"
  {
    from: {namespace: 'tourDetail', key: 'whatsappUs'},
    to: {key: 'whatsappUs'},
    value: {vi: 'Nhắn WhatsApp', en: 'WhatsApp us'},
  },
  {
    from: {namespace: 'destinationDetail', key: 'whatsappUs'},
    to: {key: 'whatsappUs'},
  },

  // emailInquiry — EN casing varies
  {
    from: {namespace: 'tourDetail', key: 'emailInquiry'},
    to: {key: 'emailInquiry'},
    value: {vi: 'Gửi email', en: 'Email inquiry'},
  },
  {
    from: {namespace: 'destinationDetail', key: 'emailInquiry'},
    to: {key: 'emailInquiry'},
  },

  // home/about CTA strings (about.* rows are dead but safe to consolidate)
  {
    from: {namespace: 'home', key: 'planYourTrip'},
    to: {key: 'planYourTrip'},
    value: {
      vi: 'Lên kế hoạch chuyến đi cùng chúng tôi',
      en: 'Plan your trip with us',
    },
  },
  {from: {namespace: 'about', key: 'planYourTrip'}, to: {key: 'planYourTrip'}},

  {
    from: {namespace: 'home', key: 'bookTourNow'},
    to: {key: 'bookTourNow'},
    value: {vi: 'Đặt tour ngay', en: 'Book tour now'},
  },
  {from: {namespace: 'about', key: 'bookTourNow'}, to: {key: 'bookTourNow'}},

  {from: {namespace: 'home', key: 'readyToTravel'}, to: {key: 'readyToTravel'}},
  {
    from: {namespace: 'about', key: 'readyToTravel'},
    to: {key: 'readyToTravel'},
  },

  // section labels — tourDetail only; admin.{tours,destinations}.tabs.* are
  // accessed dynamically via `t(tab.key)` and excluded on purpose.
  {
    from: {namespace: 'tourDetail', key: 'highlights'},
    to: {key: 'highlights'},
    value: {vi: 'Điểm nổi bật', en: 'Highlights'},
  },
  {
    from: {namespace: 'tourDetail', key: 'itinerary'},
    to: {key: 'itinerary'},
    value: {vi: 'Lịch trình', en: 'Itinerary'},
  },
  {
    from: {namespace: 'tourDetail', key: 'pricing'},
    to: {key: 'pricing'},
    value: {vi: 'Bảng giá', en: 'Pricing'},
  },
];
