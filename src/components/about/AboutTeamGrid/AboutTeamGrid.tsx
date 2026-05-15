import {useTranslations} from 'next-intl';
import type {TeamMember} from '@/domain';
import {TeamMemberCard} from './TeamMemberCard';

type AboutTeamGridProps = {
  team: TeamMember[];
  locale: 'vi' | 'en';
};

export function AboutTeamGrid({team, locale}: AboutTeamGridProps) {
  const t = useTranslations('about.team');

  return (
    <section
      id="team"
      className="bg-secondary py-20 lg:py-32"
      aria-labelledby="team-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-12 lg:mb-20">
          <h2
            id="team-heading"
            className="type-headline-lg font-extrabold uppercase tracking-tight text-white"
          >
            {t('heading')}
          </h2>
          <p className="mt-3 max-w-xl text-white/70">{t('subhead')}</p>
        </header>
        {team.length === 0 ? (
          <p data-testid="team-empty" className="text-center text-white/60">
            —
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <li key={m.id}>
                <TeamMemberCard member={m} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
