import type {ReactNode} from 'react';

export function useTranslations(namespace?: string) {
  return (key: string, params?: Record<string, unknown>) => {
    if (params) {
      return `${key}:${JSON.stringify(params)}`;
    }
    return key;
  };
}

export function useLocale() {
  return 'vi';
}

export function NextIntlClientProvider({
  children,
}: {
  children: ReactNode;
  locale?: string;
  messages?: Record<string, unknown>;
  timeZone?: string;
}) {
  return children;
}
