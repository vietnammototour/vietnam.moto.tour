import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {TeamMemberCard} from './TeamMemberCard';
import type {TeamMember} from '@/domain';

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

const role = {
  id: 'r1',
  key: 'founder',
  labelVi: 'Người sáng lập',
  labelEn: 'Founder',
  order: 0,
};

const member: TeamMember = {
  id: '1',
  name: 'Thomas',
  bioVi: 'Người sáng lập từ 2009.',
  bioEn: 'Founder since 2009.',
  age: 42,
  teamOrder: 0,
  role,
  photo: {url: '/uploads/t.jpg', altVi: 'T', altEn: 'T'},
};

const messages = {about: {team: {ageSuffix: 'yo'}}};

function renderCard(locale: 'vi' | 'en', m: TeamMember = member) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TeamMemberCard member={m} locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe('TeamMemberCard', () => {
  it('renders name, role, bio, and age (en)', () => {
    renderCard('en');
    expect(screen.getByText('Thomas')).toBeInTheDocument();
    expect(screen.getByText('Founder')).toBeInTheDocument();
    expect(screen.getByText('Founder since 2009.')).toBeInTheDocument();
    expect(screen.getByText('42 yo')).toBeInTheDocument();
  });

  it('renders role + bio in Vietnamese', () => {
    renderCard('vi');
    expect(screen.getByText('Người sáng lập')).toBeInTheDocument();
    expect(screen.getByText('Người sáng lập từ 2009.')).toBeInTheDocument();
  });

  it('renders img with photo url + alt', () => {
    renderCard('en');
    const img = screen.getByRole('img', {name: 'T'}) as HTMLImageElement;
    expect(img.src).toContain('/uploads/t.jpg');
  });

  it('renders placeholder when photo is null', () => {
    renderCard('en', {...member, photo: null});
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('team-card-placeholder')).toBeInTheDocument();
  });

  it('omits age when null', () => {
    renderCard('en', {...member, age: null});
    expect(screen.queryByText(/\byo\b/)).not.toBeInTheDocument();
  });
});
