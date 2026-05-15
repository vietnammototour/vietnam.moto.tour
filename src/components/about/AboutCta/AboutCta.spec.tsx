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
import {AboutCta} from './AboutCta';

const messages = {
  about: {
    cta: {
      headline: 'Ready to ride?',
      subhead: 'Tell us.',
      button: 'Plan your tour',
    },
  },
};

describe('AboutCta', () => {
  it('renders content + contact link', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutCta />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Ready to ride?')).toBeInTheDocument();
    expect(screen.getByText('Tell us.')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /plan your tour/i})).toHaveAttribute(
      'href',
      '/contact',
    );
  });
});
