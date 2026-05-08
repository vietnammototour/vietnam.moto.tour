import {useRouter} from 'next/router';
import type {TabDescriptor} from './registry';

type TabbedRoute<K extends string = string> = {
  tabs: readonly TabDescriptor<K>[];
};

export function useActiveTab<K extends string>(
  route: TabbedRoute<K>,
  fallback: K,
): K {
  const router = useRouter();
  const raw = router.query.tab;
  const found = route.tabs.find((t) => t.key === raw);
  return found?.key ?? fallback;
}
