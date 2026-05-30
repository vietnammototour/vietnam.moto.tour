import {useSession} from 'next-auth/react';
import Link from 'next/link';
import type {GetServerSidePropsContext} from 'next';
import {routes} from '@/routes';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';

export default function AdminDashboard() {
  const {data: session} = useSession();

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
