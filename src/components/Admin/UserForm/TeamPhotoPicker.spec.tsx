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

const listMock = jest.fn();
const getMock = jest.fn();
const createMock = jest.fn();

jest.mock('@/routes', () => ({
  api: {
    admin: {
      imageCollections: {
        list: (...a: unknown[]) => listMock(...a),
        get: (...a: unknown[]) => getMock(...a),
        create: (...a: unknown[]) => createMock(...a),
        images: {add: jest.fn(), delete: jest.fn()},
      },
      upload: {create: jest.fn()},
    },
  },
}));

jest.mock('@/lib/image-transcode', () => ({
  transcodeImage: jest.fn(),
}));

import {render, screen, waitFor} from '@testing-library/react';
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
  listMock.mockResolvedValue({
    data: [{id: 'c1', key: 'team', label: 'Team', imageCount: 2}],
  });
  getMock.mockResolvedValue({
    data: {id: 'c1', key: 'team', label: 'Team', images},
  });
  const onChange = jest.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TeamPhotoPicker value={value} onChange={onChange} />
    </NextIntlClientProvider>,
  );
  return {onChange};
}

describe('TeamPhotoPicker', () => {
  it('opens modal and lists fetched images', async () => {
    setup();
    await waitFor(() => expect(getMock).toHaveBeenCalled());
    await userEvent.click(screen.getByRole('button', {name: 'Select photo'}));
    expect(screen.getByText('Choose a team photo')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(2),
    );
  });

  it('selects and closes', async () => {
    const {onChange} = setup();
    await waitFor(() => expect(getMock).toHaveBeenCalled());
    await userEvent.click(screen.getByRole('button', {name: 'Select photo'}));
    const img = await screen.findByRole('img', {name: 'A'});
    await userEvent.click(img);
    expect(onChange).toHaveBeenCalledWith('i1');
  });

  it('removes selection', async () => {
    const {onChange} = setup('i1');
    await waitFor(() => expect(getMock).toHaveBeenCalled());
    await userEvent.click(screen.getByRole('button', {name: 'Remove'}));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('creates team collection if missing', async () => {
    listMock.mockResolvedValue({data: []});
    createMock.mockResolvedValue({
      data: {id: 'c-new', key: 'team', label: 'Team Photos'},
    });
    getMock.mockResolvedValue({
      data: {id: 'c-new', key: 'team', label: 'Team Photos', images: []},
    });
    const onChange = jest.fn();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TeamPhotoPicker value={null} onChange={onChange} />
      </NextIntlClientProvider>,
    );
    await waitFor(() => expect(createMock).toHaveBeenCalled());
  });
});
