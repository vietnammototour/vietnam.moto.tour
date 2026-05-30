import {useMemo, useState} from 'react';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {GetStaticPropsContext} from 'next';
import Head from 'next/head';
import {
  RentalsHero,
  VehicleCard,
  RentalsFilter,
  RentalPolicy,
  RentalContactCta,
  type RentalsFilterValue,
} from '@/components/Rentals';
import {clipReveal, slideFromLeft, waveStagger} from '@/utils/motion-variants';
import type {Vehicle} from '@/domain';

type Props = {
  vehicles: Vehicle[];
};

export default function RentalsPage({vehicles}: Props) {
  const t = useTranslations('rentals');
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

      <div className="bg-surface text-on-surface">
        <RentalsHero backgroundImage="/assets/rentals-hero.jpg" />

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 lg:pt-20 pb-10">
          <p className="type-body-lg text-on-surface-secondary max-w-[60ch] leading-relaxed">
            {t('intro')}
          </p>
        </section>

        <section className="bg-surface py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 border-l-2 border-primary pl-4">
              <motion.span
                className="font-mono text-xs uppercase tracking-[0.05em] text-on-surface-secondary block"
                variants={slideFromLeft}
                initial="hidden"
                whileInView="visible"
                viewport={{once: true}}
              >
                {t('fleetEyebrow')}
              </motion.span>
              <motion.h2
                className="font-display text-2xl lg:text-4xl font-bold uppercase tracking-[0.05em] text-on-surface mt-2"
                variants={clipReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{once: true}}
              >
                {t('fleetTitle')}
              </motion.h2>
            </div>
          </div>

          <RentalsFilter
            value={filter}
            onChange={setFilter}
            count={filtered.length}
          />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((v, i) => (
                <motion.div
                  key={v.id}
                  custom={i}
                  variants={waveStagger(0.08)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{once: true}}
                >
                  <VehicleCard vehicle={v} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RentalPolicy />
        </div>

        <RentalContactCta />
      </div>
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
