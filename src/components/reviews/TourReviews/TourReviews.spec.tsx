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
import {TourReviews} from './TourReviews';
import type {Review} from '@/domain';

const messages = {
  reviews: {
    tourHeading: 'Traveller reviews',
    verifiedOn: 'Verified on TripAdvisor',
    viewAllOnTripAdvisor: 'View all on TripAdvisor',
    photoNth: 'Photo {n}',
  },
};

const review: Review = {
  id: 'r1',
  tourId: 't1',
  reviewerName: 'Jane Doe',
  reviewerLocation: null,
  avatarUrl: null,
  rating: 4,
  title: '',
  body: 'Solid ride.',
  reviewDate: '2026-01-10T00:00:00.000Z',
  sourceUrl: 'https://www.tripadvisor.com/review/r1',
  images: [],
  isFeatured: false,
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

describe('TourReviews', () => {
  it('renders nothing when there are no reviews', () => {
    const {container} = renderWithIntl(
      <TourReviews reviews={[]} tripAdvisorUrl={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a card per review', () => {
    renderWithIntl(<TourReviews reviews={[review]} tripAdvisorUrl={null} />);
    expect(screen.getByText('Solid ride.')).toBeInTheDocument();
  });

  it('shows the CTA only when a tripAdvisorUrl is provided', () => {
    const {rerender} = renderWithIntl(
      <TourReviews reviews={[review]} tripAdvisorUrl={null} />,
    );
    expect(
      screen.queryByRole('link', {name: 'View all on TripAdvisor'}),
    ).not.toBeInTheDocument();

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TourReviews
          reviews={[review]}
          tripAdvisorUrl="https://www.tripadvisor.com/AttractionProductReview-x"
        />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole('link', {name: 'View all on TripAdvisor'}),
    ).toHaveAttribute(
      'href',
      'https://www.tripadvisor.com/AttractionProductReview-x',
    );
  });
});
