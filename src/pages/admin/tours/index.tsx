import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

interface AdminTour {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  destination: {name: string};
  price: number;
  duration: string;
}

interface Props {
  tours: AdminTour[];
}

export default function AdminToursList({tours: initialTours}: Props) {
  const [tours, setTours] = useState(initialTours);
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm('Deactivate this tour?')) return;

    const res = await fetch(`/api/admin/tours/${id}`, {method: 'DELETE'});
    if (res.ok) {
      setTours((prev) => prev.filter((t) => t.id !== id));
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/tours/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({isActive: !isActive}),
    });
    if (res.ok) {
      setTours((prev) =>
        prev.map((t) => (t.id === id ? {...t, isActive: !isActive} : t)),
      );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Tours</h1>
        <Link
          href="/admin/tours/new"
          className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors"
        >
          + New Tour
        </Link>
      </div>

      <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Title
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Destination
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Price
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
            {tours.map((tour) => (
              <tr
                key={tour.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3 type-body-sm text-on-surface">
                  {tour.title}
                </td>
                <td className="px-4 py-3 type-body-sm text-on-surface-secondary">
                  {tour.destination.name}
                </td>
                <td className="px-4 py-3 type-body-sm text-on-surface">
                  ${tour.price}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(tour.id, tour.isActive)}
                    className={`type-label-sm px-2 py-0.5 rounded ${
                      tour.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {tour.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/tours/${tour.id}/edit`}
                      className="type-label-sm text-primary hover:text-primary-light transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(tour.id)}
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

  const tours = await prisma.tour.findMany({
    orderBy: {createdAt: 'desc'},
    select: {
      id: true,
      title: true,
      slug: true,
      isActive: true,
      price: true,
      duration: true,
      destination: {select: {name: true}},
    },
  });

  return {
    props: {
      tours: JSON.parse(JSON.stringify(tours)),
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
