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
import {VehicleCard} from './VehicleCard';
import type {Vehicle} from '@/domain';

const messages = {
  rentals: {
    perDay: '/ day',
    cc: 'cc',
    available: 'Available',
    outOfStock: 'Out of stock',
    type: {scooter: 'Scooter', bike: 'Bike'},
  },
};

const vehicle: Vehicle = {
  id: 'v1',
  slug: 'honda-airblade-125',
  type: 'SCOOTER',
  brand: 'Honda',
  model: 'Airblade 125',
  cc: 125,
  quantity: 2,
  priceUsdPerDay: 8,
  imageUrl: '/uploads/vehicles/honda-airblade-125.jpeg',
  images: [],
  description: {en: '', vi: ''},
  status: 'PUBLISHED',
  order: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function withIntl(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {node}
    </NextIntlClientProvider>
  );
}

describe('VehicleCard', () => {
  it('renders brand, model, type, cc, and price', () => {
    render(withIntl(<VehicleCard vehicle={vehicle} />));
    expect(screen.getByText('Honda Airblade 125')).toBeInTheDocument();
    expect(screen.getByText(/Scooter/)).toBeInTheDocument();
    expect(screen.getByText(/125\s*cc/)).toBeInTheDocument();
    expect(screen.getByText('$8')).toBeInTheDocument();
    expect(screen.getByText('/ day')).toBeInTheDocument();
  });

  it('shows availability when quantity > 0', () => {
    render(withIntl(<VehicleCard vehicle={vehicle} />));
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('shows out of stock when quantity is 0', () => {
    render(withIntl(<VehicleCard vehicle={{...vehicle, quantity: 0}} />));
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });
});
