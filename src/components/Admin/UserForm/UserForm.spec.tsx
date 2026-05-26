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
import {UserForm} from './UserForm';

const messages = {
  admin: {
    users: {
      nameLabel: 'Name',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      roleLabel: 'Role',
      bioLabel: 'Bio',
      birthDateLabel: 'Birth date',
      orderLabel: 'Order',
      isCoreTeamLabel: 'Core team',
      allowAuthLabel: 'Allow sign-in',
      save: 'Save',
      pickImage: 'Select photo',
      removeImage: 'Remove',
      modalTitle: 'Choose a team photo',
      validation: {
        nameRequired: 'Name required',
        emailRequired: 'Email required',
        emailFormat: 'Email format invalid',
        passwordRequired: 'Password required',
        passwordShort: 'Password too short',
        roleRequired: 'Role required',
      },
    },
  },
};

const roles = [
  {id: 'r1', key: 'admin', labelVi: 'Quản trị', labelEn: 'Admin', order: 0},
  {
    id: 'r2',
    key: 'founder',
    labelVi: 'Người sáng lập',
    labelEn: 'Founder',
    order: 1,
  },
];

function setup() {
  const onSubmit = jest.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <UserForm
        mode="create"
        locale="en"
        roles={roles}
        images={[]}
        onSubmit={onSubmit}
      />
      <button type="submit" form="user-form">
        Save
      </button>
    </NextIntlClientProvider>,
  );
  return {onSubmit};
}

async function pickRole(roleLabel: string) {
  await userEvent.click(screen.getByRole('button', {name: 'Role'}));
  await userEvent.click(screen.getByRole('option', {name: roleLabel}));
}

describe('UserForm', () => {
  it('populates role select', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', {name: 'Role'}));
    expect(screen.getByRole('option', {name: 'Admin'})).toBeInTheDocument();
    expect(screen.getByRole('option', {name: 'Founder'})).toBeInTheDocument();
  });

  it('submits valid data', async () => {
    const {onSubmit} = setup();
    await userEvent.type(screen.getByLabelText('Name'), 'Alice');
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Password'), 'longpass1');
    await pickRole('Admin');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Alice',
        email: 'a@b.com',
        password: 'longpass1',
        orgRoleId: 'r1',
      }),
    );
  });

  it('errors when password too short', async () => {
    setup();
    await userEvent.type(screen.getByLabelText('Name'), 'A');
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await pickRole('Admin');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(await screen.findByText('Password too short')).toBeInTheDocument();
  });

  it('allows empty auth fields when allowAuth=false', async () => {
    const {onSubmit} = setup();
    await userEvent.click(screen.getByLabelText('Allow sign-in'));
    await userEvent.type(screen.getByLabelText('Name'), 'Thomas');
    await pickRole('Founder');
    await userEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Thomas',
        allowAuth: false,
        orgRoleId: 'r2',
      }),
    );
  });
});
