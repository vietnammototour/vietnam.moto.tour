import {useEffect} from 'react';
import Link from 'next/link';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {StatusPicker} from '@/components/Admin/StatusPicker';
import {routes, api} from '@/routes';
import type {TourStatus} from '@/types';

type AdminTour = {
  id: string;
  title: string;
  slug: string;
  status: TourStatus;
  destination: {name: string};
  price: number;
  duration: string;
  imageUrl: string | null;
};

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

    const {error} = await api.admin.tours.delete(id);
    if (!error) {
      refetch();
    }
  }

  async function handleStatusChange(id: string, status: TourStatus) {
    const {error} = await api.admin.tours.update(id, {status});
    if (!error) {
      refetch();
    }
  }

  const tourList = tours ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Tours</h1>
        <Link
          href={routes.admin.tours.new.path()}
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
                <td className="px-4 py-3">
                  <Link
                    href={routes.admin.tours.edit.path({id: tour.id})}
                    className="group/link flex items-center gap-3 cursor-pointer"
                  >
                    {tour.imageUrl ? (
                      <img
                        src={tour.imageUrl}
                        alt=""
                        className="h-[50px] w-auto rounded object-contain shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove(
                            'hidden',
                          );
                        }}
                      />
                    ) : null}
                    <div
                      className={`h-[50px] w-[50px] rounded bg-surface-alt flex items-center justify-center shrink-0 ${tour.imageUrl ? 'hidden' : ''}`}
                    >
                      <i className="fa fa-image text-on-surface-tertiary" />
                    </div>
                    <span className="type-body-lg text-primary group-hover/link:text-primary-light group-hover/link:underline transition-colors">
                      {tour.title}
                    </span>
                  </Link>
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
                  <button
                    onClick={() => handleDelete(tour.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg type-label-sm text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                  >
                    <i className="fa fa-archive text-xs" />
                    Archive
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
