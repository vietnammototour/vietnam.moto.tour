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
import {AboutHero} from './AboutHero';
import type {TeamMember} from '@/domain';

const role = {
  id: 'r1',
  key: 'founder',
  labelVi: 'NSL',
  labelEn: 'Founder',
  order: 0,
};
const make = (id: string, name: string): TeamMember => ({
  id,
  name,
  bioVi: '',
  bioEn: '',
  age: null,
  teamOrder: 0,
  role,
  photo: {url: `/uploads/${id}.jpg`, altVi: name, altEn: name},
});

const featured = [make('1', 'Thomas'), make('2', 'Hai'), make('3', 'Chan')];
const messages = {
  about: {
    hero: {
      eyebrow: 'About',
      headline: 'Riding the real Vietnam.',
      lead: 'Lead.',
      ctaMeetTeam: 'Meet the team',
    },
  },
};

describe('AboutHero', () => {
  it('renders text + CTA', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutHero featured={featured} locale="en" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Riding the real Vietnam.')).toBeInTheDocument();
    expect(screen.getByText('Lead.')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /Meet the team/i})).toHaveAttribute(
      'href',
      '#team',
    );
  });

  it('renders three polaroids', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AboutHero featured={featured} locale="en" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Thomas')).toBeInTheDocument();
    expect(screen.getByText('Hai')).toBeInTheDocument();
    expect(screen.getByText('Chan')).toBeInTheDocument();
  });
});
