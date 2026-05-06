'use client';

import {useScrollDirection} from '@/hooks/useScrollDirection';
import {Button} from '@/components/ui';

export function ScrollToTop() {
  const {scrollY} = useScrollDirection();
  const visible = scrollY > 400;

  return (
    <Button
      variant="ghost"
      iconOnly
      onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
      className={`fixed bottom-20 right-8 z-50 h-11 w-11 rounded-lg bg-surface-elevated/15 dark:bg-black/40 backdrop-blur dark:backdrop-blur-lg border border-white/15 text-white shadow-sm hover:bg-surface-elevated/25 dark:hover:bg-black/50 transition-all duration-300 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
      aria-label="Scroll to top"
    >
      <i className="fa fa-arrow-up" />
    </Button>
  );
}
