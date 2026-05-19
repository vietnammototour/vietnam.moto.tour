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
    return 'vi';
  }
  return {NextIntlClientProvider, useTranslations, useLocale};
});

import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {AboutValueProps} from './AboutValueProps';

const messages = {
  about: {
    valueProps: {
      '01': {title: 'Locally Owned', body: 'L'},
      '02': {title: 'Off the Beaten Track', body: 'O'},
      '03': {title: 'All Rider Levels', body: 'A'},
      '04': {title: 'Local Knowledge', body: 'K'},
    },
  },
};

describe('AboutValueProps', () => {
  it('renders 4 cells', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutValueProps />
      </NextIntlClientProvider>,
    );
    [
      'Locally Owned',
      'Off the Beaten Track',
      'All Rider Levels',
      'Local Knowledge',
      'K',
    ].forEach((s) => expect(screen.getByText(s)).toBeInTheDocument());
  });

  it('renders numerals 01-04', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutValueProps />
      </NextIntlClientProvider>,
    );
    ['01', '02', '03', '04'].forEach((s) =>
      expect(screen.getByText(s)).toBeInTheDocument(),
    );
  });
});
