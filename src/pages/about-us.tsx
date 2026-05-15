import Head from 'next/head';
import {useTranslations} from 'next-intl';
import type {GetStaticPropsContext} from 'next';
import type {TeamMember} from '@/domain';
import {
  AboutHero,
  AboutStory,
  AboutValueProps,
  AboutTeamGrid,
  AboutCta,
} from '@/components/about';

type AboutUsProps = {
  team: TeamMember[];
  locale: 'vi' | 'en';
};

export default function AboutUs({team, locale}: AboutUsProps) {
  const tMeta = useTranslations('about.meta');

  return (
    <>
      <Head>
        <title>{tMeta('title')}</title>
        <meta name="description" content={tMeta('description')} />
      </Head>
      <AboutHero featured={team.slice(0, 3)} locale={locale} />
      <AboutStory />
      <AboutValueProps />
      <AboutTeamGrid team={team} locale={locale} />
      <AboutCta />
    </>
  );
}

export async function getStaticProps({locale}: GetStaticPropsContext) {
  const {getMessagesFromDb, getTeamForPublic} = await import('@/data/queries');
  const resolvedLocale = (locale ?? 'vi') as 'vi' | 'en';
  const [messages, team] = await Promise.all([
    getMessagesFromDb(resolvedLocale),
    getTeamForPublic(),
  ]);
  return {props: {messages, team, locale: resolvedLocale}, revalidate: 60};
}
