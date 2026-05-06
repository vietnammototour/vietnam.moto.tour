'use client';

import {useCallback, useEffect, useState, type ReactNode} from 'react';
import {ThemeContext, type Theme} from './context';
import {getInitialTheme, setThemeCookie} from './utils';

export function ThemeProvider({children}: {children: ReactNode}) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

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
