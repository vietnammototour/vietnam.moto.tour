import {type Theme} from './context';

export function getInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  const match = document.cookie.match(/(?:^|; )NEXT_THEME=(\w+)/);
  return match?.[1] === 'dark' ? 'dark' : 'light';
}

export function setThemeCookie(theme: Theme) {
  document.cookie = `NEXT_THEME=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}
