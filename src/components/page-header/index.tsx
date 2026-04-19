import Link from 'next/link';
import type {PageHeaderProps} from '@/types';

export function PageHeader({
  title,
  breadcrumbs,
  backgroundImage,
}: PageHeaderProps) {
  return (
    <section className="relative">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{backgroundImage: `url(${backgroundImage})`}}
        />
        <div className="absolute inset-0 bg-overlay" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center h-full">
          <h2 className="text-4xl md:text-5xl font-bold text-on-surface-inverse">
            {title}
          </h2>
        </div>
      </div>
      <div className="bg-surface-alt py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-on-surface-secondary">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-on-surface-secondary">/</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-primary transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-on-surface font-medium">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
