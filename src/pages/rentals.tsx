import {useMemo, useState} from 'react';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {GetStaticPropsContext} from 'next';
import Head from 'next/head';
import {PageHeader} from '@/components/PageHeader';
import {
  VehicleCard,
  RentalsFilter,
  RentalPolicy,
  RentalContactCta,
  type RentalsFilterValue,
} from '@/components/Rentals';
import type {Vehicle} from '@/domain';

type Props = {
  vehicles: Vehicle[];
};

const fadeInUp = {
  hidden: {opacity: 0, y: 30},
  visible: {opacity: 1, y: 0, transition: {duration: 0.6}},
};

export default function RentalsPage({vehicles}: Props) {
  const t = useTranslations('rentals');
  const tc = useTranslations('common');
  const tMeta = useTranslations('meta');
  const [filter, setFilter] = useState<RentalsFilterValue>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return vehicles;
    const type = filter === 'scooter' ? 'SCOOTER' : 'BIKE';
    return vehicles.filter((v) => v.type === type);
  }, [vehicles, filter]);

  return (
    <>
      <Head>
        <title>{tMeta('rentalsTitle')}</title>
        <meta name="description" content={tMeta('rentalsDescription')} />
      </Head>

      <PageHeader
        title={t('title')}
        breadcrumbs={[
          {label: tc('breadcrumbHome'), href: '/'},
          {label: t('breadcrumbRental')},
        ]}
        backgroundImage="https://vietnammotorcycletours.com/storage/2022/04/AR500963-1920x1280.jpg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 mb-10">
            <p className="type-body-lg text-on-surface-secondary max-w-3xl">
              {t('subtitle')}
            </p>
            <RentalsFilter value={filter} onChange={setFilter} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filtered.map((v, i) => (
              <motion.div
                key={v.id}
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
                <VehicleCard vehicle={v} />
              </motion.div>
            ))}
          </div>

          <RentalPolicy />
          <RentalContactCta />
        </div>
      </section>
    </>
  );
}

export async function getStaticProps({locale}: GetStaticPropsContext) {
  const {getMessagesFromDb, getPublishedVehicles} =
    await import('@/data/queries');
  const [messages, vehicles] = await Promise.all([
    getMessagesFromDb(locale ?? 'vi'),
    getPublishedVehicles(),
  ]);

  return {
    props: {messages, vehicles},
    revalidate: 60,
  };
}
