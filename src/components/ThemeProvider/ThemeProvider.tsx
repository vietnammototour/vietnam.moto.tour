'use client';

import {useCallback, useEffect, useState, type ReactNode} from 'react';
import {ThemeContext, type Theme} from './context';
import {readThemeCookie, setThemeCookie} from './utils';

export function ThemeProvider({children}: {children: ReactNode}) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = readThemeCookie();
    if (stored !== theme) setTheme(stored);
    document.documentElement.setAttribute('data-theme', stored);
    // run once on mount to sync state with cookie set pre-hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      setThemeCookie(next);
      document.documentElement.setAttribute('data-theme', next);

      // Page-wide crossfade transition
      document.documentElement.classList.add('theme-transitioning');
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 300);

      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{theme, toggleTheme}}>
      {children}
    </ThemeContext.Provider>
  );
}
