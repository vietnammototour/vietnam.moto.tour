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
        <RentalsHero backgroundImage="https://vietnammotorcycletours.com/storage/2022/04/AR500963-1920x1280.jpg" />

        <section className="px-6 sm:px-10 lg:px-12 pb-10">
          <p className="type-body-lg text-white max-w-[60ch]">{t('intro')}</p>
        </section>

        <RentalsFilter
          value={filter}
          onChange={setFilter}
          count={filtered.length}
        />

        <section className="px-6 sm:px-10 lg:px-12 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </section>

        <div className="py-8 overflow-hidden" aria-hidden>
          <div className="h-px bg-primary w-[110%] -ml-[5%] -rotate-[1.5deg]" />
        </div>

        <div className="px-6 sm:px-10 lg:px-12">
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
