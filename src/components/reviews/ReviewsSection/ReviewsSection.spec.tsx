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
    return (key: string, params?: Record<string, unknown>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const parts = fullKey.split('.');
      let cur: unknown = messages;
      for (const part of parts) {
        if (cur == null || typeof cur !== 'object') return fullKey;
        cur = (cur as Record<string, unknown>)[part];
      }
      if (typeof cur !== 'string') return fullKey;
      if (params) {
        return cur.replace(/\{(\w+)\}/g, (_, k) =>
          params[k] != null ? String(params[k]) : `{${k}}`,
        );
      }
      return cur;
    };
  }
  function useLocale() {
    return 'en';
  }
  return {NextIntlClientProvider, useTranslations, useLocale};
});

import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {ReviewsSection} from './ReviewsSection';
import type {Review} from '@/domain';

const messages = {
  reviews: {
    heading: 'What riders say',
    eyebrow: 'Field reports',
    verifiedOn: 'Verified on TripAdvisor',
    viewAllOnTripAdvisor: 'View all on TripAdvisor',
    photoNth: 'Photo {n}',
  },
};

const review: Review = {
  id: 'r1',
  tourId: 't1',
  reviewerName: 'Jane Doe',
  reviewerLocation: 'London, UK',
  avatarUrl: null,
  rating: 5,
  title: 'Great',
  body: 'Loved it.',
  reviewDate: '2026-01-10T00:00:00.000Z',
  sourceUrl: 'https://www.tripadvisor.com/review/r1',
  images: [],
  isFeatured: true,
  displayOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe('ReviewsSection', () => {
  it('renders nothing when there are no reviews', () => {
    const {container} = renderWithIntl(<ReviewsSection reviews={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the heading and a card per review', () => {
    renderWithIntl(<ReviewsSection reviews={[review]} />);
    expect(screen.getByText('What riders say')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('links the global CTA to the TripAdvisor reviews URL', () => {
    renderWithIntl(<ReviewsSection reviews={[review]} />);
    const cta = screen.getByRole('link', {name: 'View all on TripAdvisor'});
    expect(cta).toHaveAttribute(
      'href',
      expect.stringContaining('tripadvisor.com'),
    );
  });
});
