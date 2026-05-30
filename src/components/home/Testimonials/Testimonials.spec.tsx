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

import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {Testimonials} from './Testimonials';
import {contactInfo} from '@/utils';

jest.mock('framer-motion', () => ({
  motion: new Proxy({}, {get: () => (p: {children?: React.ReactNode}) => p.children}),
}));

function renderWithIntl() {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{
        home: {testimonialsEyebrow: 'EB', testimonialsTitle: 'TITLE', reviewsAttribution: 'Real reviews on TripAdvisor'},
        common: {readReviews: 'Read reviews'},
      }}
    >
      <Testimonials />
    </NextIntlClientProvider>,
  );
}

describe('Testimonials', () => {
  it('renders the live TripAdvisor reviews widget for the business location', () => {
    const {container} = renderWithIntl();
    expect(
      container.querySelector(`script[src*="locationId=${contactInfo.tripadvisorLocationId}"]`),
    ).not.toBeNull();
  });

  it('links to the TripAdvisor listing', () => {
    renderWithIntl();
    expect(screen.getByRole('link', {name: 'Read reviews'})).toHaveAttribute(
      'href',
      contactInfo.tripadvisorLink,
    );
  });

  it('shows no fabricated reviewer names', () => {
    renderWithIntl();
    expect(screen.queryByText(/Marcus Lindqvist/)).toBeNull();
  });
});
