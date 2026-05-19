import {useTranslations} from 'next-intl';
import type {TeamMember} from '@/domain';

type TeamMemberCardProps = {
  member: TeamMember;
  locale: 'vi' | 'en';
};

export function TeamMemberCard({member, locale}: TeamMemberCardProps) {
  const t = useTranslations('about.team');
  const roleLabel = locale === 'vi' ? member.role.labelVi : member.role.labelEn;
  const bio = locale === 'vi' ? member.bioVi : member.bioEn;
  const alt = locale === 'vi' ? member.photo?.altVi : member.photo?.altEn;
  const ageText = member.age != null ? `${member.age} ${t('ageSuffix')}` : null;

  return (
    <article className="group relative overflow-hidden bg-secondary">
      <div className="aspect-[3/4] w-full bg-surface-alt">
        {member.photo?.url ? (
          <img
            src={member.photo.url}
            alt={alt ?? member.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            data-testid="team-card-placeholder"
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center text-white/40"
          />
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
        <p className="type-label-sm uppercase tracking-widest text-primary">
          {roleLabel}
        </p>
        <h3 className="type-headline-sm font-extrabold uppercase tracking-tight">
          {member.name}
        </h3>
        {ageText ? (
          <p className="mt-1 text-xs text-white/60">{ageText}</p>
        ) : null}
        <p className="mt-2 max-h-0 overflow-hidden text-sm text-white/80 transition-[max-height] duration-500 group-hover:max-h-40">
          {bio}
        </p>
      </div>
    </article>
  );
}
