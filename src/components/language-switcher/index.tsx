'use client';

import { useRouter } from 'next/router';

export const LanguageSwitcher = () => {
  const router = useRouter();
  const { locale, asPath } = router;

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.push(asPath, asPath, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1 text-sm font-semibold">
      <button
        onClick={() => switchLocale('vi')}
        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
          locale === 'vi'
            ? 'text-primary font-bold'
            : 'text-neutral-500 hover:text-neutral-900'
        }`}
      >
        VI
      </button>
      <span className="text-neutral-300">|</span>
      <button
        onClick={() => switchLocale('en')}
        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
          locale === 'en'
            ? 'text-primary font-bold'
            : 'text-neutral-500 hover:text-neutral-900'
        }`}
      >
        EN
      </button>
    </div>
  );
};
