import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {ImageCollectionEditor} from './ImageCollectionEditor';

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
    return (key: string, params?: Record<string, unknown>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const parts = fullKey.split('.');
      let cur: unknown = messages;
      for (const part of parts) {
        if (cur == null || typeof cur !== 'object') return fullKey;
        cur = (cur as Record<string, unknown>)[part];
      }
      if (typeof cur !== 'string') return fullKey;
      if (params) {
        return cur.replace(/\{(\w+)\}/g, (_, k) =>
          String(params[k] ?? `{${k}}`),
        );
      }
      return cur;
    };
  }
  function useLocale() {
    return 'vi';
  }
  return {NextIntlClientProvider, useTranslations, useLocale};
});

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({children}: {children: React.ReactNode}) => <>{children}</>,
  closestCenter: () => null,
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: () => ({}),
  useSensors: () => [],
}));
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({children}: {children: React.ReactNode}) => <>{children}</>,
  arrayMove: <T,>(arr: T[]) => arr,
  sortableKeyboardCoordinates: jest.fn(),
  rectSortingStrategy: jest.fn(),
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
jest.mock('@/routes', () => ({
  api: {
    admin: {
      imageCollections: {
        images: {
          add: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          reorder: jest.fn(),
        },
      },
      upload: {create: jest.fn()},
    },
  },
}));

const messages = {
  admin: {
    imageCollections: {
      addImage: 'Add',
      countHint: '{count}/{max}',
      altEn: 'EN',
      altVi: 'VI',
      replace: 'Replace',
      uploadHint: 'up',
      confirmDeleteImage: 'sure?',
      dragHandle: 'drag',
    },
  },
  common: {delete: 'Delete'},
};

const collection = {
  id: 'c1',
  key: 'home-gallery',
  label: 'Home',
  images: [
    {id: 'i1', collectionId: 'c1', url: '/a', altEn: '', altVi: '', order: 0},
    {id: 'i2', collectionId: 'c1', url: '/b', altEn: '', altVi: '', order: 1},
  ],
};

test('renders one card per image', () => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ImageCollectionEditor collection={collection} />
    </NextIntlClientProvider>,
  );
  expect(screen.getAllByText('EN').length).toBe(2);
});

test('add disabled at max=10', () => {
  const fullImages = Array.from({length: 10}).map((_, i) => ({
    id: `i${i}`,
    collectionId: 'c1',
    url: '/x',
    altEn: '',
    altVi: '',
    order: i,
  }));
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ImageCollectionEditor collection={{...collection, images: fullImages}} />
    </NextIntlClientProvider>,
  );
  expect(screen.getByRole('button', {name: 'Add'})).toBeDisabled();
});
