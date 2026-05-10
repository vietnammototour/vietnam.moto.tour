'use client';

import {NextIntlClientProvider} from 'next-intl';
import {useAdminFetch} from '@/hooks/useAdminFetch';

type LocaleMessages = Record<string, unknown>;
type MessagesResponse = {en: LocaleMessages; vi: LocaleMessages};

type Props = {
  children: React.ReactNode;
  locale?: 'en' | 'vi';
};

export function AdminIntlProvider({children, locale = 'en'}: Props) {
  const {data} = useAdminFetch<MessagesResponse>('/api/admin/messages');

  if (!data) return <>{children}</>;

  return (
    <NextIntlClientProvider locale={locale} messages={data[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}
