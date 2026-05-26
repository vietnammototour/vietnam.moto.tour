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
  const tc = useTranslations('common');
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

  const groupedTours = useMemo(() => {
    const groups = new Map<
      string,
      {id: string; label: string; tours: VMT.Tour[]}
    >();
    for (const tour of tours) {
      const label = tour.destinationName?.en || tour.destinationName?.vi || '—';
      const bucket = groups.get(tour.destinationId) ?? {
        id: tour.destinationId,
        label,
        tours: [],
      };
      bucket.tours.push(tour);
      groups.set(tour.destinationId, bucket);
    }
    return Array.from(groups.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [tours]);

  return (
    <>
      <Head>
        <title>{tMeta('toursTitle')}</title>
        <meta name="description" content={tMeta('toursDescription')} />
      </Head>

      <PageHeader
        title={t('title')}
        breadcrumbs={[
          {label: tc('breadcrumbHome'), href: '/'},
          {label: tc('breadcrumbTours')},
        ]}
        backgroundImage="https://data.agatetravel.com/images/photogallery/2025/halong-bay-hanoi-vietnam.jpg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-20">
          {groupedTours.map((group) => (
            <div key={group.id}>
              <div className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <i className="fa fa-map-marker-alt text-primary" />
                  <h2 className="type-headline-sm">{group.label}</h2>
                </div>
                <span className="type-body-sm text-on-surface-secondary">
                  {group.tours.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {group.tours.map((tour, i) => (
                  <motion.div
                    key={tour.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true}}
                    variants={{
                      ...fadeInUp,
                      visible: {
                        ...fadeInUp.visible,
                        transition: {duration: 0.6, delay: i * 0.05},
                      },
                    }}
                  >
                    <TourCard tour={tour} />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
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
