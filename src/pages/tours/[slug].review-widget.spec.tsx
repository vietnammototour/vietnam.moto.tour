// Override the global next-intl mock so NextIntlClientProvider actually resolves
// message keys using the messages fixture passed to the provider.
jest.mock('next-intl', () => {
  const React = require('react') as typeof import('react');
  const MessagesContext = React.createContext<Record<string, unknown>>({});
  function NextIntlClientProvider({
    children,
    messages = {},
  }: {
    children: React.ReactNode;
    locale?: string;
    messages?: Record<string, unknown>;
  }) {
    return React.createElement(
      MessagesContext.Provider,
      {value: messages},
      children,
    );
  }
  function useTranslations(namespace?: string) {
    const messages = React.useContext(MessagesContext);
    return (key: string) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const parts = fullKey.split('.');
      let cur: unknown = messages;
      for (const part of parts) {
        if (cur == null || typeof cur !== 'object') return fullKey;
        cur = (cur as Record<string, unknown>)[part];
      }
      return typeof cur === 'string' ? cur : fullKey;
    };
  }
  function useLocale() {
    return 'en';
  }
  return {NextIntlClientProvider, useTranslations, useLocale};
});

import {render} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import TourDetail from './[slug]';
import {buildTour} from '@/test-utils/factories';

jest.mock('next/router', () => ({useRouter: () => ({locale: 'en'})}));

// The page module imports next-auth/next + @/lib/auth at the top level for
// getServerSideProps. next-auth ships untransformed ESM (openid-client), which
// jest cannot parse, so stub these out — they are unused by the rendered component.
jest.mock('next-auth/next', () => ({getServerSession: jest.fn()}));
jest.mock('@/lib/auth', () => ({authOptions: {}}));

// Use the repo's manual framer-motion mock, extended with the scroll/in-view
// hooks that TourHero relies on (the shared mock does not export them).
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('@/__mocks__/framer-motion');
  const motionValue = {
    get: () => 0,
    set: () => {},
    onChange: () => () => {},
    on: () => () => {},
  };
  return {
    ...actual,
    useScroll: () => ({scrollY: motionValue, scrollYProgress: motionValue}),
    useInView: () => true,
  };
});

function renderTour(tripadvisorLocationId: string | null) {
  const tour = {...buildTour(), tripadvisorLocationId};
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{
        tourDetail: {reviewsTitle: 'TripAdvisor reviews', pricingPerPerson: '/person'},
        common: {readReviews: 'Read reviews'},
        meta: {tourDetailTitle: 'x'},
      }}
    >
      <TourDetail tour={tour} isAdmin={false} />
    </NextIntlClientProvider>,
  );
}

describe('tour detail TripAdvisor reviews', () => {
  it('uses the tour-specific location id when present', () => {
    const {container} = renderTour('9999999');
    expect(container.querySelector('script[src*="locationId=9999999"]')).not.toBeNull();
  });

  it('falls back to the business location id when the tour has none', () => {
    const {container} = renderTour(null);
    expect(container.querySelector('script[src*="locationId=5501636"]')).not.toBeNull();
  });

  it('falls back when the tour location id is an empty string', () => {
    const {container} = renderTour('');
    expect(container.querySelector('script[src*="locationId=5501636"]')).not.toBeNull();
  });
});
