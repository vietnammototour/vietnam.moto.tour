import {useEffect} from 'react';
import Link from 'next/link';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';

interface AdminDestination {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  imageUrl: string | null;
  _count: {tours: number};
}

export default function AdminDestinationsList() {
  const {
    data: destinations,
    loading,
    refetch,
  } = useAdminFetch<AdminDestination[]>('/api/admin/destinations');
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  async function handleDelete(id: string) {
    if (!confirm('Deactivate this destination?')) return;

    const res = await fetch(`/api/admin/destinations/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      refetch();
    }
  }

  const destList = destinations ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Destinations</h1>
        <Link
          href="/admin/destinations/new"
          className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors cursor-pointer"
        >
          + New Destination
        </Link>
      </div>

      <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="px-4 py-3"></th>
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
            {destList.map((dest) => (
              <tr
                key={dest.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3">
                  {dest.imageUrl ? (
                    <img
                      src={dest.imageUrl}
                      alt=""
                      className="h-[75px] w-auto rounded object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove(
                          'hidden',
                        );
                      }}
                    />
                  ) : null}
                  <div
                    className={`h-[75px] w-[75px] rounded bg-surface-alt flex items-center justify-center ${dest.imageUrl ? 'hidden' : ''}`}
                  >
                    <i className="fa fa-image text-on-surface-tertiary text-lg" />
                  </div>
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface">
                  {dest.name}
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface-secondary">
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
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/destinations/${dest.id}/edit`}
                      className="type-label-sm text-primary hover:text-primary-light transition-colors cursor-pointer"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(dest.id)}
                      className="type-label-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer"
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
