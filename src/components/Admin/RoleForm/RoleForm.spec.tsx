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
import {RoleForm} from './RoleForm';

const messages = {
  admin: {
    roles: {
      keyLabel: 'Key',
      labelLabel: 'Label',
      orderLabel: 'Order',
      save: 'Save',
      validation: {
        keyFormat: 'key must be lowercase snake_case',
        labelViRequired: 'Vietnamese label required',
        labelEnRequired: 'English label required',
      },
    },
  },
};

function setup(props: Partial<React.ComponentProps<typeof RoleForm>> = {}) {
  const onSubmit = jest.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RoleForm mode="create" locale="en" onSubmit={onSubmit} {...props} />
    </NextIntlClientProvider>,
  );
  return {onSubmit};
}

describe('RoleForm', () => {
  it('disables key on edit', () => {
    setup({
      mode: 'edit',
      defaults: {key: 'founder', labelVi: 'X', labelEn: 'Y', order: 0},
    });
    expect(screen.getByLabelText('Key')).toBeDisabled();
  });

  it('submits valid data with EN locale', async () => {
    const {onSubmit} = setup({
      defaults: {key: '', labelVi: 'HD', labelEn: '', order: 0},
    });
    await userEvent.type(screen.getByLabelText('Key'), 'guide');
    await userEvent.type(screen.getByLabelText('Label'), 'Guide');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'guide',
        labelVi: 'HD',
        labelEn: 'Guide',
        order: 0,
      }),
    );
  });

  it('Label field binds to labelVi when locale=vi', async () => {
    const {onSubmit} = setup({
      locale: 'vi',
      defaults: {key: '', labelVi: '', labelEn: 'Guide', order: 0},
    });
    await userEvent.type(screen.getByLabelText('Key'), 'guide');
    await userEvent.type(screen.getByLabelText('Label'), 'HD');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        labelVi: 'HD',
        labelEn: 'Guide',
      }),
    );
  });

  it('errors on invalid key', async () => {
    setup({
      defaults: {key: '', labelVi: 'X', labelEn: 'Y', order: 0},
    });
    await userEvent.type(screen.getByLabelText('Key'), 'Invalid!');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(
      await screen.findByText('key must be lowercase snake_case'),
    ).toBeInTheDocument();
  });
});
