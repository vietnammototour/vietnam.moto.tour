import {useRouter} from 'next/router';

type RoutePath = {path: (...args: never[]) => string};

export function useNavigate() {
  const router = useRouter();

  return {
    to(route: RoutePath, ...args: unknown[]) {
      const path = (route.path as (...a: unknown[]) => string)(...args);
      router.push(path);
    },
    replace(route: RoutePath, ...args: unknown[]) {
      const path = (route.path as (...a: unknown[]) => string)(...args);
      router.replace(path);
    },
    replaceUrl(route: RoutePath, ...args: unknown[]) {
      const path = (route.path as (...a: unknown[]) => string)(...args);
      window.history.replaceState(null, '', path);
    },
  };
}
