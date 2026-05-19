import {useMemo} from 'react';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import Head from 'next/head';
import {useRouter} from 'next/router';
import {PageHeader} from '@/components/PageHeader';
import {TourCard} from '@/components/TourCard';
import type * as VMT from '@/domain';

const fadeInUp = {
  hidden: {opacity: 0, y: 30},
  visible: {opacity: 1, y: 0, transition: {duration: 0.6}},
};

type ToursPageProps = {
  allTours: VMT.Tour[];
  isAdmin: boolean;
};

export default function Tours({allTours, isAdmin}: ToursPageProps) {
  const t = useTranslations('tours');
  const tMeta = useTranslations('meta');
  const router = useRouter();

  const tours = useMemo(() => {
    const destinationParam = router.query.destination;
    if (typeof destinationParam === 'string' && destinationParam) {
      const filtered = allTours.filter(
        (t) => t.destinationId === destinationParam,
      );
      if (filtered.length > 0) {
        return filtered;
      }
    }
    return allTours;
  }, [router.query.destination, allTours]);

  return (
    <>
      <Head>
        <title>{tMeta('toursTitle')}</title>
        <meta name="description" content={tMeta('toursDescription')} />
      </Head>

      <PageHeader
        title={t('title')}
        breadcrumbs={[
          {label: t('breadcrumbHome'), href: '/'},
          {label: t('breadcrumbTours')},
        ]}
        backgroundImage="https://data.agatetravel.com/images/photogallery/2025/halong-bay-hanoi-vietnam.jpg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {tours.map((tour, i) => (
              <motion.div
                key={tour.id}
                initial="hidden"
                whileInView="visible"
                viewport={{once: true}}
                variants={{
                  ...fadeInUp,
                  visible: {
                    ...fadeInUp.visible,
                    transition: {duration: 0.6, delay: i * 0.1},
                  },
                }}
              >
                <TourCard tour={tour} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps({
  req,
  res,
  locale,
}: GetServerSidePropsContext) {
  const {getAllTours, getMessagesFromDb} = await import('@/data/queries');
  const session = await getServerSession(req, res, authOptions);
  const isAdmin = session?.user?.orgRoleKey === 'admin';

  const [allTours, dbMessages] = await Promise.all([
    getAllTours(isAdmin),
    getMessagesFromDb(locale ?? 'vi'),
  ]);

  return {
    props: {
      allTours,
      isAdmin,
      messages: dbMessages,
    },
  };
}
