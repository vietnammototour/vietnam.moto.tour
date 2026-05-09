import {render, screen, fireEvent} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {SortableImageCard} from './SortableImageCard';

// Override the global next-intl mock so NextIntlClientProvider actually resolves
// message keys using the messages fixture passed to the provider.
jest.mock('next-intl', () => {
  const React = require('react');
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

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));
jest.mock('@dnd-kit/utilities', () => ({
  CSS: {Transform: {toString: () => ''}},
}));

const messages = {
  admin: {
    imageCollections: {
      altEn: 'Alt EN',
      altVi: 'Alt VI',
      replace: 'Replace',
      uploadHint: 'Upload .webp',
    },
    common: {delete: 'Delete'},
  },
  common: {delete: 'Delete'},
};

const baseImage = {
  id: 'i1',
  collectionId: 'c1',
  url: '/uploads/x.webp',
  altEn: 'A',
  altVi: 'B',
  order: 0,
};

function renderCard(
  props: Partial<Parameters<typeof SortableImageCard>[0]> = {},
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SortableImageCard
        image={baseImage}
        canDelete
        onAltChange={jest.fn()}
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('SortableImageCard', () => {
  it('renders alt inputs with current values', () => {
    renderCard();
    expect(screen.getByLabelText('Alt EN')).toHaveValue('A');
    expect(screen.getByLabelText('Alt VI')).toHaveValue('B');
  });

  it('fires onAltChange when alt edited', () => {
    const onAltChange = jest.fn();
    renderCard({onAltChange});
    fireEvent.change(screen.getByLabelText('Alt EN'), {target: {value: 'New'}});
    expect(onAltChange).toHaveBeenCalledWith('i1', {altEn: 'New'});
  });

  it('disables delete when canDelete=false', () => {
    renderCard({canDelete: false});
    expect(screen.getByRole('button', {name: 'Delete'})).toBeDisabled();
  });
});
