import {useSession} from 'next-auth/react';
import {useEffect} from 'react';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import type {AdminStats} from '@/types';

export default function AdminDashboard() {
  const {data: session} = useSession();
  const {data: stats, loading} = useAdminFetch<AdminStats>('/api/admin/stats');
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  const statCards = [
    {label: 'Total Tours', value: stats?.tourCount ?? 0, icon: 'fa-route'},
    {
      label: 'Total Destinations',
      value: stats?.destinationCount ?? 0,
      icon: 'fa-map-marker-alt',
    },
    {label: 'Total Users', value: stats?.userCount ?? 0, icon: 'fa-users'},
  ];

  return (
    <div>
      <h1 className="type-headline-sm mb-8">
        Welcome back, {session?.user.name ?? ''}
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
