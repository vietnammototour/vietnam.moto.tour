'use client';

import { useScrollDirection } from '@/hooks/useScrollDirection';

export function ScrollToTop() {
  const { scrollY } = useScrollDirection();
  const visible = scrollY > 400;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-300 hover:bg-primary-light ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
      aria-label="Scroll to top"
    >
      <i className="fa fa-arrow-up" />
    </button>
  );
}
