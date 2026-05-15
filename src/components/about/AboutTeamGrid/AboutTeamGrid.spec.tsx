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
import {AboutTeamGrid} from './AboutTeamGrid';
import type {TeamMember} from '@/domain';

const role = {
  id: 'r1',
  key: 'founder',
  labelVi: 'Người sáng lập',
  labelEn: 'Founder',
  order: 0,
};
const team: TeamMember[] = [
  {
    id: '1',
    name: 'Thomas',
    bioVi: 'a',
    bioEn: 'a',
    age: null,
    teamOrder: 0,
    role,
    photo: null,
  },
  {
    id: '2',
    name: 'Hai',
    bioVi: 'b',
    bioEn: 'b',
    age: null,
    teamOrder: 1,
    role,
    photo: null,
  },
];
const messages = {
  about: {team: {heading: 'The Crew', subhead: 'Sub', ageSuffix: 'yo'}},
};

function renderGrid(items: TeamMember[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AboutTeamGrid team={items} locale="en" />
    </NextIntlClientProvider>,
  );
}

describe('AboutTeamGrid', () => {
  it('renders heading + subhead', () => {
    renderGrid(team);
    expect(screen.getByText('The Crew')).toBeInTheDocument();
    expect(screen.getByText('Sub')).toBeInTheDocument();
  });

  it('renders one card per member', () => {
    renderGrid(team);
    expect(screen.getByText('Thomas')).toBeInTheDocument();
    expect(screen.getByText('Hai')).toBeInTheDocument();
  });

  it('renders empty-state', () => {
    renderGrid([]);
    expect(screen.getByTestId('team-empty')).toBeInTheDocument();
  });
});
