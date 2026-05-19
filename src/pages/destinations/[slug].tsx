import Head from 'next/head';
import {useRouter} from 'next/router';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import type * as VMT from '@/domain';
import {DestinationHero} from '@/components/destination-detail/DestinationHero';
import {DestinationIntro} from '@/components/destination-detail/DestinationIntro';
import {DestinationHighlights} from '@/components/destination-detail/DestinationHighlights';
import {DestinationTours} from '@/components/destination-detail/DestinationTours';
import {DestinationCTA} from '@/components/destination-detail/DestinationCTA';

type Props = {
  destination: VMT.DestinationDetail;
};

export default function DestinationDetailPage({destination}: Props) {
  const router = useRouter();
  const locale = (router.locale ?? 'vi') as 'en' | 'vi';

  const metaDescription = destination.description[locale].slice(0, 160);

  return (
    <>
      <Head>
        <title>{destination.name[locale]}</title>
        <meta name="description" content={metaDescription} />
      </Head>

      <DestinationHero destination={destination} locale={locale} />

      <article className="py-12 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <DestinationIntro destination={destination} locale={locale} />
          <DestinationHighlights
            slug={destination.slug}
            initialHighlights={destination.highlights}
            total={destination.highlightsTotal}
            locale={locale}
          />
        </div>
      </article>

      <DestinationTours
        tours={destination.tours}
        destinationName={destination.name}
      />
      <DestinationCTA heroImage={destination.heroImage} />
    </>
  );
}

export async function getServerSideProps({
  req,
  res,
  params,
  locale,
}: GetServerSidePropsContext) {
  const slug = params?.slug;
  if (typeof slug !== 'string') return {notFound: true};

  const {getDestinationBySlug, getMessagesFromDb} =
    await import('@/data/queries');
  const session = await getServerSession(req, res, authOptions);
  const isAdmin = session?.user?.orgRoleKey === 'admin';

  const [destination, messages] = await Promise.all([
    getDestinationBySlug(slug, isAdmin),
    getMessagesFromDb(locale ?? 'vi'),
  ]);

  if (!destination) return {notFound: true};

  return {props: {destination, messages}};
}
