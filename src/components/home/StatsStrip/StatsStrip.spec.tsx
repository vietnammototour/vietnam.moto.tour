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
import {StatsStrip} from './StatsStrip';

const messages = {
  home: {
    stats: {
      years: {label: 'YEARS', value: '12'},
      routes: {label: 'ROUTES', value: '47'},
      km: {label: 'KM RIDDEN', value: '1.2M'},
      riders: {label: 'RIDERS', value: '4500+'},
    },
  },
};

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <StatsStrip />
    </NextIntlClientProvider>,
  );
}

describe('StatsStrip', () => {
  it('renders all four stat values', () => {
    renderWithIntl();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
    expect(screen.getByText('1.2M')).toBeInTheDocument();
    expect(screen.getByText('4500+')).toBeInTheDocument();
  });

  it('renders all four stat labels', () => {
    renderWithIntl();
    expect(screen.getByText('YEARS')).toBeInTheDocument();
    expect(screen.getByText('ROUTES')).toBeInTheDocument();
    expect(screen.getByText('KM RIDDEN')).toBeInTheDocument();
    expect(screen.getByText('RIDERS')).toBeInTheDocument();
  });
});
