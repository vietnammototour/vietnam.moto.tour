import {useEffect} from 'react';
import Link from 'next/link';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {Button} from '@/components/ui';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {routes, api} from '@/routes';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';

type AdminDestination = {
  id: string;
  nameVi: string;
  nameEn: string;
  slug: string;
  isActive: boolean;
  imageUrl: string | null;
  size: string;
  _count: {tours: number; highlights: number};
};

export default function AdminDestinationsList() {
  const {
    data: destinations,
    loading,
    refetch,
  } = useAdminFetch<AdminDestination[]>(
    '/api/admin/destinations?archived=false',
  );
  const {data: archivedDestinations} = useAdminFetch<AdminDestination[]>(
    '/api/admin/destinations?archived=true',
  );
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  async function handleArchive(id: string) {
    const {error} = await api.admin.destinations.update(id, {isActive: false});
    if (!error) refetch();
  }

  const destList = destinations ?? [];
  const archivedCount = archivedDestinations?.length ?? 0;

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title="Destinations"
          breadcrumbs={[
            {label: 'Admin', href: routes.admin.dashboard.path()},
            {label: 'Destinations'},
          ]}
          actions={
            <>
              {archivedCount > 0 && (
                <Button
                  variant="secondary"
                  href={routes.admin.destinations.archive.path()}
                  icon={<i className="fa fa-archive text-xs" />}
                >
                  Archive ({archivedCount})
                </Button>
              )}
              <Button
                variant="primary"
                href={routes.admin.destinations.new.path()}
                icon={<i className="fa fa-plus text-xs" />}
              >
                Add destination
              </Button>
            </>
          }
        />
      }
    >
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
                Highlights
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Size
              </th>
              <th className="text-right px-4 py-3 type-label-sm text-on-surface-secondary" />
            </tr>
          </thead>
          <tbody>
            {destList.map((dest) => (
              <tr
                key={dest.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={routes.admin.destinations.edit.path({id: dest.id})}
                    className="group/link flex items-center gap-3 cursor-pointer"
                  >
                    {dest.imageUrl ? (
                      <img
                        src={dest.imageUrl}
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
                      className={`h-[50px] w-[50px] rounded bg-surface-alt flex items-center justify-center shrink-0 ${dest.imageUrl ? 'hidden' : ''}`}
                    >
                      <i className="fa fa-image text-on-surface-tertiary" />
                    </div>
                    <span className="type-body-lg text-primary group-hover/link:text-primary-light group-hover/link:underline transition-colors">
                      {dest.nameEn || dest.nameVi}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface-secondary">
                  {dest._count.tours}
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface-secondary">
                  {dest._count.highlights}
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface-secondary">
                  {dest.size}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost-danger"
                    size="sm"
                    onClick={() => handleArchive(dest.id)}
                    icon={<i className="fa fa-archive text-xs" />}
                  >
                    Archive
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPageShell>
  );
}
