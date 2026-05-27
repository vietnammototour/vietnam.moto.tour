import {useEffect, useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {Button, ConfirmModal} from '@/components/ui';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {routes, api} from '@/routes';

type AdminDestination = {
  id: string;
  nameVi: string;
  nameEn: string;
  slug: string;
  isActive: boolean;
  imageUrl: string | null;
  _count: {tours: number};
};

export default function AdminDestinationsArchive() {
  const {
    data: destinations,
    loading,
    refetch,
  } = useAdminFetch<AdminDestination[]>(
    '/api/admin/destinations?archived=true',
  );
  const {setLoading} = useAdminLoading();
  const [deleteTarget, setDeleteTarget] = useState<AdminDestination | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  async function handleRestore(id: string) {
    const {error} = await api.admin.destinations.update(id, {isActive: true});
    if (!error) refetch();
  }

  function handleHardDelete(dest: AdminDestination) {
    setDeleteError(null);
    if (dest._count.tours > 0) {
      setDeleteError(
        'Cannot delete: destination has tours. Reassign or delete its tours first.',
      );
    }
    setDeleteTarget(dest);
  }

  async function performHardDelete() {
    if (!deleteTarget) return;
    if (deleteTarget._count.tours > 0) return;
    setDeleting(true);
    setDeleteError(null);
    const {error} = await api.admin.destinations.delete(deleteTarget.id, {
      hard: true,
    });
    setDeleting(false);
    if (error) {
      setDeleteError(error);
      return;
    }
    setDeleteTarget(null);
    refetch();
  }

  const destList = destinations ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Archived Destinations</h1>
        <Link
          href={routes.admin.destinations.list.path()}
          className="inline-flex items-center gap-1.5 px-4 py-2 type-label-sm uppercase border border-border text-on-surface-secondary hover:bg-surface-alt transition-colors cursor-pointer"
        >
          ← Back to Destinations
        </Link>
      </div>

      <div className="bg-surface-elevated border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Name
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Tours
              </th>
              <th className="text-right px-4 py-3 type-label-sm text-on-surface-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {destList.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center type-body-lg text-on-surface-tertiary"
                >
                  No archived destinations.
                </td>
              </tr>
            )}
            {destList.map((dest) => (
              <tr
                key={dest.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {dest.imageUrl ? (
                      <Image
                        src={dest.imageUrl}
                        alt=""
                        width={75}
                        height={50}
                        unoptimized
                        className="h-[50px] w-auto object-contain shrink-0"
                      />
                    ) : (
                      <div className="h-[50px] w-[50px] bg-surface-alt flex items-center justify-center shrink-0">
                        <i className="fa fa-image text-on-surface-tertiary" />
                      </div>
                    )}
                    <span className="type-body-lg text-on-surface">
                      {dest.nameEn || dest.nameVi}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface-secondary">
                  {dest._count.tours}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestore(dest.id)}
                    >
                      <i className="fa fa-rotate-left text-xs mr-1.5" />
                      Restore
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={dest._count.tours > 0}
                      onClick={() => handleHardDelete(dest)}
                    >
                      <i className="fa fa-trash text-xs mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        open={!!deleteTarget}
        title="Permanently delete this destination?"
        description={
          deleteTarget && deleteTarget._count.tours > 0
            ? 'Cannot delete: destination has tours. Reassign or delete its tours first.'
            : 'This cannot be undone.'
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        error={deleteError}
        onConfirm={performHardDelete}
        onCancel={() => {
          if (deleting) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
