import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { GetStaticPropsContext } from 'next';
import Head from 'next/head';
import { PageHeader } from '@/components/page-header';
import { TourCard } from '@/components/tour-card';
import { toursData } from '@/data';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Tours() {
  const t = useTranslations('tours');
  const tMeta = useTranslations('meta');

  return (
    <>
      <Head>
        <title>{tMeta('toursTitle')}</title>
        <meta name="description" content={tMeta('toursDescription')} />
      </Head>

      <PageHeader
        title={t('title')}
        breadcrumbs={[
          { label: t('breadcrumbHome'), href: '/' },
          { label: t('breadcrumbTours') },
        ]}
        backgroundImage="https://data.agatetravel.com/images/photogallery/2025/halong-bay-hanoi-vietnam.jpg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {toursData.map((tour, i) => (
              <motion.div
                key={tour.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ ...fadeInUp, visible: { ...fadeInUp.visible, transition: { duration: 0.6, delay: i * 0.1 } } }}
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

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
}
