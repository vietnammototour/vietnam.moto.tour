import {useSession} from 'next-auth/react';
import {useEffect} from 'react';
import Link from 'next/link';
import type {GetServerSidePropsContext} from 'next';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {routes} from '@/routes';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';

type AdminStats = {
  tourCount: number;
  destinationCount: number;
  userCount: number;
};

export default function AdminDashboard() {
  const {data: session} = useSession();
  const {data: stats, loading} = useAdminFetch<AdminStats>('/api/admin/stats');
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  const readouts = [
    {label: 'Tours', value: stats?.tourCount ?? 0, icon: 'fa-route'},
    {
      label: 'Destinations',
      value: stats?.destinationCount ?? 0,
      icon: 'fa-map-marker-alt',
    },
    {label: 'Users', value: stats?.userCount ?? 0, icon: 'fa-users'},
  ];

  const actions = [
    {
      label: 'Add tour',
      icon: 'fa-route',
      href: routes.admin.tours.new.path(),
    },
    {
      label: 'Add destination',
      icon: 'fa-map-marker-alt',
      href: routes.admin.destinations.new.path(),
    },
    {
      label: 'Add rental',
      icon: 'fa-motorcycle',
      href: routes.admin.vehicles.new.path(),
    },
    {
      label: 'Translations',
      icon: 'fa-language',
      href: routes.admin.translations.path(),
    },
    {
      label: 'Backups',
      icon: 'fa-database',
      href: routes.admin.backups.path(),
    },
  ];

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title="Dashboard"
          subtitle={
            <>
              Welcome back,{' '}
              <span className="text-on-surface font-medium">
                {session?.user.name ?? ''}
              </span>
              .
            </>
          }
        />
      }
    >
      <div className="space-y-10">
        <section>
          <h2 className="type-label-sm uppercase tracking-wider text-on-surface-tertiary mb-3">
            Field readout
          </h2>
          <div className="border border-border bg-surface-elevated grid grid-cols-1 sm:grid-cols-3 divide-y divide-border sm:divide-y-0 sm:divide-x">
            {readouts.map((r) => (
              <div key={r.label} className="px-6 py-6">
                <div className="flex items-center gap-2 type-label-sm uppercase tracking-wider text-on-surface-tertiary">
                  <i className={`fas ${r.icon} text-primary`} />
                  {r.label}
                </div>
                <div className="mt-3 font-mono text-5xl leading-none text-on-surface tabular-nums">
                  {String(r.value).padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="type-label-sm uppercase tracking-wider text-on-surface-tertiary mb-3">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {actions.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="group bg-surface-elevated hover:bg-surface-alt transition-colors px-5 py-6 flex flex-col gap-3 cursor-pointer"
              >
                <i
                  className={`fas ${a.icon} text-xl text-on-surface-tertiary group-hover:text-primary transition-colors`}
                />
                <span className="type-label-sm uppercase tracking-wider text-on-surface">
                  {a.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
