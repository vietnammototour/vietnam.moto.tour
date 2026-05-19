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
import {AboutStory} from './AboutStory';

const messages = {
  about: {story: {pullQuote: '100% locally owned.', body: 'One.\n\nTwo.'}},
};

describe('AboutStory', () => {
  it('renders pull quote', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutStory />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('100% locally owned.')).toBeInTheDocument();
  });

  it('renders paragraphs', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutStory />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('One.')).toBeInTheDocument();
    expect(screen.getByText('Two.')).toBeInTheDocument();
  });
});
