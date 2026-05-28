import {useMemo, useState} from 'react';
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

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
          <p className="type-body-lg text-white max-w-[60ch]">{t('intro')}</p>
        </section>

        <RentalsFilter
          value={filter}
          onChange={setFilter}
          count={filtered.length}
        />

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border-subtle border border-border-subtle">
            {filtered.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </section>

        <div className="py-8 overflow-hidden" aria-hidden>
          <div className="h-px bg-primary w-[110%] -ml-[5%] -rotate-[1.5deg]" />
        </div>

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
