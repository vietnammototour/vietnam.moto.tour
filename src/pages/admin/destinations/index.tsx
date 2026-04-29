import {useState} from 'react';
import Link from 'next/link';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

interface AdminDestination {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count: {tours: number};
}

interface Props {
  destinations: AdminDestination[];
}

export default function AdminDestinationsList({destinations: initial}: Props) {
  const [destinations, setDestinations] = useState(initial);

  async function handleDelete(id: string) {
    if (!confirm('Deactivate this destination?')) return;

    const res = await fetch(`/api/admin/destinations/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setDestinations((prev) => prev.filter((d) => d.id !== id));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Destinations</h1>
        <Link
          href="/admin/destinations/new"
          className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors"
        >
          + New Destination
        </Link>
      </div>

      <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Name
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Tours
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Status
              </th>
              <th className="text-right px-4 py-3 type-label-sm text-on-surface-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {destinations.map((dest) => (
              <tr
                key={dest.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3 type-body-sm text-on-surface">
                  {dest.name}
                </td>
                <td className="px-4 py-3 type-body-sm text-on-surface-secondary">
                  {dest._count.tours}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`type-label-sm px-2 py-0.5 rounded ${
                      dest.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {dest.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/destinations/${dest.id}/edit`}
                      className="type-label-sm text-primary hover:text-primary-light transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(dest.id)}
                      className="type-label-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  const destinations = await prisma.destination.findMany({
    orderBy: {createdAt: 'desc'},
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      _count: {select: {tours: true}},
    },
  });

  return {
    props: {
      destinations: JSON.parse(JSON.stringify(destinations)),
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
