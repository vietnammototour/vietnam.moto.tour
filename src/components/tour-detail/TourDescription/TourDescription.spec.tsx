import {render, screen, fireEvent} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {EditableProvider} from '@/components/Admin/EditableContext';
import {TourDescription} from './TourDescription';

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
    const msgs = React.useContext(MessagesContext);
    return (key: string) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const parts = fullKey.split('.');
      let cur: unknown = msgs;
      for (const part of parts) {
        if (cur == null || typeof cur !== 'object') return fullKey;
        cur = (cur as Record<string, unknown>)[part];
      }
      return typeof cur === 'string' ? cur : fullKey;
    };
  }
  return {NextIntlClientProvider, useTranslations};
});

const messages = {tourDetail: {aboutThisTour: 'About this tour'}};

function renderWithProviders(
  description: {en: string; vi: string},
  locale: 'en' | 'vi',
  onFieldChange = jest.fn(),
) {
  return {
    onFieldChange,
    ...render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <EditableProvider locale={locale} onFieldChange={onFieldChange}>
          <TourDescription description={description} locale={locale} />
        </EditableProvider>
      </NextIntlClientProvider>,
    ),
  };
}

describe('TourDescription editable mode', () => {
  it('renders a textarea pre-filled with the active locale value', () => {
    renderWithProviders({en: 'English copy', vi: 'Tiếng Việt'}, 'en');
    const textarea = screen.getByRole('textbox', {name: /about this tour/i});
    expect(textarea).toHaveValue('English copy');
  });

  it('emits onFieldChange with locale-scoped path on input', () => {
    const {onFieldChange} = renderWithProviders({en: 'old', vi: ''}, 'en');
    const textarea = screen.getByRole('textbox', {name: /about this tour/i});
    fireEvent.change(textarea, {target: {value: 'new copy'}});
    expect(onFieldChange).toHaveBeenCalledWith('description.en', 'new copy');
  });

  it('renders a paragraph (not textarea) when no EditableProvider is present', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TourDescription description={{en: 'Read-only', vi: ''}} locale="en" />
      </NextIntlClientProvider>,
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText('Read-only')).toBeInTheDocument();
  });
});
