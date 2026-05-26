import {useCallback} from 'react';
import {useRouter} from 'next/router';
import type {AdminLocale} from '@/components/ui/LocaleSwitcher';

function parse(value: unknown): AdminLocale {
  return value === 'vi' ? 'vi' : 'en';
}

export function useAdminLocale(): [AdminLocale, (next: AdminLocale) => void] {
  const router = useRouter();
  const locale = parse(router.query.locale);

  const setLocale = useCallback(
    (next: AdminLocale) => {
      const query = {...router.query, locale: next};
      router.replace({pathname: router.pathname, query}, undefined, {
        shallow: true,
        scroll: false,
      });
    },
    [router],
  );

  return [locale, setLocale];
}
