import {useEffect} from 'react';
import Link from 'next/link';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {StatusPicker} from '@/components/admin/StatusPicker';
import type {TourStatus} from '@/types';

interface AdminTour {
  id: string;
  title: string;
  slug: string;
  status: TourStatus;
  destination: {name: string};
  price: number;
  duration: string;
}

export default function AdminToursList() {
  const {
    data: tours,
    loading,
    refetch,
  } = useAdminFetch<AdminTour[]>('/api/admin/tours');
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  async function handleDelete(id: string) {
    if (!confirm('Archive this tour?')) return;

    const res = await fetch(`/api/admin/tours/${id}`, {method: 'DELETE'});
    if (res.ok) {
      refetch();
    }
  }

  async function handleStatusChange(id: string, status: TourStatus) {
    const res = await fetch(`/api/admin/tours/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status}),
    });
    if (res.ok) {
      refetch();
    }
  }

  const tourList = tours ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Tours</h1>
        <Link
          href="/admin/tours/new"
          className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors cursor-pointer"
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
            {tourList.map((tour) => (
              <tr
                key={tour.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3 type-body-lg text-on-surface">
                  {tour.title}
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface-secondary">
                  {tour.destination.name}
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface">
                  ${tour.price}
                </td>
                <td className="px-4 py-3">
                  <StatusPicker
                    value={tour.status}
                    onChange={(status) => handleStatusChange(tour.id, status)}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/tours/${tour.id}/edit`}
                      className="type-label-sm text-primary hover:text-primary-light transition-colors cursor-pointer"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(tour.id)}
                      className="type-label-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      Archive
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
