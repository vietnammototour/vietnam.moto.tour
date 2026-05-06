'use client';

import {useRouter} from 'next/router';

export const LanguageSwitcher = () => {
  const router = useRouter();
  const {locale, asPath} = router;

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.push(asPath, asPath, {locale: newLocale});
  };

  return (
    <div className="flex items-center gap-1 type-label-lg">
      <button
        onClick={() => switchLocale('vi')}
        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
          locale === 'vi'
            ? 'text-on-surface-accent'
            : 'text-on-surface-secondary hover:text-on-surface'
        }`}
      >
        VI
      </button>
      <span className="text-on-surface-secondary">|</span>
      <button
        onClick={() => switchLocale('en')}
        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
          locale === 'en'
            ? 'text-on-surface-accent'
            : 'text-on-surface-secondary hover:text-on-surface'
        }`}
      >
        EN
      </button>
    </div>
  );
};
