import Link from 'next/link';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
};

export function AdminBreadcrumbs({items}: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 type-body-sm text-on-surface-secondary mb-2"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-on-surface-secondary/60" aria-hidden>
                /
              </span>
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? 'text-on-surface type-label-lg font-medium'
                    : 'text-on-surface-secondary'
                }
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
