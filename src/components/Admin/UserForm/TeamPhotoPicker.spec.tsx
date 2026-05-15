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
import userEvent from '@testing-library/user-event';
import {NextIntlClientProvider} from 'next-intl';
import {TeamPhotoPicker} from './TeamPhotoPicker';

const messages = {
  admin: {
    users: {
      pickImage: 'Select photo',
      removeImage: 'Remove',
      modalTitle: 'Choose a team photo',
    },
  },
};

const images = [
  {id: 'i1', url: '/uploads/a.jpg', altVi: '', altEn: 'A'},
  {id: 'i2', url: '/uploads/b.jpg', altVi: '', altEn: 'B'},
];

function setup(value: string | null = null) {
  const onChange = jest.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TeamPhotoPicker images={images} value={value} onChange={onChange} />
    </NextIntlClientProvider>,
  );
  return {onChange};
}

describe('TeamPhotoPicker', () => {
  it('opens modal', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', {name: 'Select photo'}));
    expect(screen.getByText('Choose a team photo')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('selects and closes', async () => {
    const {onChange} = setup();
    await userEvent.click(screen.getByRole('button', {name: 'Select photo'}));
    await userEvent.click(screen.getByRole('img', {name: 'A'}));
    expect(onChange).toHaveBeenCalledWith('i1');
    expect(screen.queryByText('Choose a team photo')).not.toBeInTheDocument();
  });

  it('removes selection', async () => {
    const {onChange} = setup('i1');
    await userEvent.click(screen.getByRole('button', {name: 'Remove'}));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
