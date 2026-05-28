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

import {render, screen, fireEvent} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {RentalsFilter} from './RentalsFilter';

const messages = {
  rentals: {
    filter: {all: 'All', scooter: 'Scooters', bike: 'Bikes'},
    vehiclesCount: '3 vehicles',
  },
};

function withIntl(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {node}
    </NextIntlClientProvider>
  );
}

describe('RentalsFilter', () => {
  it('renders three options and calls onChange', () => {
    const onChange = jest.fn();
    render(
      withIntl(<RentalsFilter value="all" onChange={onChange} count={3} />),
    );
    fireEvent.click(screen.getByText('Scooters'));
    expect(onChange).toHaveBeenCalledWith('scooter');
  });

  it('marks the active option', () => {
    render(
      withIntl(<RentalsFilter value="bike" onChange={() => {}} count={3} />),
    );
    expect(
      screen.getByRole('button', {name: 'Bikes', pressed: true}),
    ).toBeInTheDocument();
  });
});
