import {useTranslations} from 'next-intl';
import {useSession} from 'next-auth/react';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

interface DashboardProps {
  stats: {
    tourCount: number;
    destinationCount: number;
    userCount: number;
  };
}

export default function AdminDashboard({stats}: DashboardProps) {
  const t = useTranslations('admin');
  const {data: session} = useSession();

  const statCards = [
    {label: t('totalTours'), value: stats.tourCount, icon: 'fa-route'},
    {
      label: t('totalDestinations'),
      value: stats.destinationCount,
      icon: 'fa-map-marker-alt',
    },
    {label: t('totalUsers'), value: stats.userCount, icon: 'fa-users'},
  ];

  return (
    <div>
      <h1 className="type-headline-sm mb-8">
        {t('welcome', {name: session?.user.name ?? ''})}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface-elevated rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className={`fas ${card.icon} text-xl text-primary`} />
              </div>
              <div>
                <p className="type-headline-sm">{card.value}</p>
                <p className="type-label-sm text-on-surface-secondary">
                  {card.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {redirect: {destination: '/', permanent: false}};
  }

  const [tourCount, destinationCount, userCount] = await Promise.all([
    prisma.tour.count({where: {isActive: true}}),
    prisma.destination.count({where: {isActive: true}}),
    prisma.user.count(),
  ]);

  return {
    props: {
      stats: {tourCount, destinationCount, userCount},
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
