'use client';

import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useTheme} from '@/components/theme-provider';

export default function ThemeToggle() {
  const {theme, toggleTheme} = useTheme();
  const t = useTranslations('ThemeToggle');
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-on-surface-inverse">{t('label')}</span>
      <button
        role="switch"
        aria-checked={isDark}
        aria-label={t(isDark ? 'dark' : 'light')}
        onClick={toggleTheme}
        className="relative flex h-6 w-11 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300"
        style={{
          backgroundColor: isDark ? '#F59E0B' : '#D6D3D1',
        }}
      >
        {/* Sun icon (left side) */}
        <motion.span
          className="absolute left-1 text-xs"
          animate={{
            scale: isDark ? 0.8 : 1.2,
            opacity: isDark ? 0.4 : 1,
          }}
          transition={{type: 'spring', stiffness: 500, damping: 30}}
          aria-hidden
        >
          &#9728;
        </motion.span>

        {/* Moon icon (right side) */}
        <motion.span
          className="absolute right-1 text-xs"
          animate={{
            scale: isDark ? 1.2 : 0.8,
            opacity: isDark ? 1 : 0.4,
          }}
          transition={{type: 'spring', stiffness: 500, damping: 30}}
          aria-hidden
        >
          &#9790;
        </motion.span>

        {/* Thumb */}
        <motion.span
          className="z-10 block h-5 w-5 rounded-full shadow-md"
          style={{
            backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
          }}
          animate={{x: isDark ? 20 : 0}}
          transition={{type: 'spring', stiffness: 500, damping: 30}}
          aria-hidden
        />
      </button>
    </div>
  );
}
