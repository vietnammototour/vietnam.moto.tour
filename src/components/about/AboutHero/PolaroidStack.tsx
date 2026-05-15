import type {TeamMember} from '@/domain';

type PolaroidStackProps = {
  featured: TeamMember[];
  locale: 'vi' | 'en';
};

export function PolaroidStack({featured, locale}: PolaroidStackProps) {
  return (
    <div className="relative h-[28rem] w-full">
      {featured.slice(0, 3).map((m, i) => {
        const rotation = ['-rotate-6', 'rotate-2', '-rotate-3'][i] ?? '';
        const offset =
          ['left-0 top-0', 'left-1/4 top-8', 'left-1/2 top-4'][i] ?? '';
        const alt = locale === 'vi' ? m.photo?.altVi : m.photo?.altEn;
        const role = locale === 'vi' ? m.role.labelVi : m.role.labelEn;
        return (
          <figure
            key={m.id}
            className={`absolute ${offset} ${rotation} w-48 transform shadow-2xl`}
          >
            <div className="aspect-[3/4] w-full bg-surface-alt">
              {m.photo?.url ? (
                <img
                  src={m.photo.url}
                  alt={alt ?? m.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <figcaption className="bg-white px-3 py-2 text-xs">
              <span className="block font-semibold">{m.name}</span>
              <span className="text-on-surface-secondary">{role}</span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
