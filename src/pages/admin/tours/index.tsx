import {useEffect} from 'react';
import Link from 'next/link';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {StatusPicker} from '@/components/Admin/StatusPicker';
import {routes, api} from '@/routes';
import {Badge} from '@/components/ui';
import type * as VMT from '@/domain';

type AdminTour = {
  id: string;
  title: string;
  slug: string;
  status: VMT.TourStatus;
  destination: {name: string};
  pricingGroups: VMT.PricingGroup[];
  duration: string;
  imageUrl: string | null;
};

export default function AdminToursList() {
  const {
    data: tours,
    loading,
    refetch,
  } = useAdminFetch<AdminTour[]>('/api/admin/tours?archived=false');
  const {data: archivedTours} = useAdminFetch<AdminTour[]>(
    '/api/admin/tours?archived=true',
  );
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  async function handleStatusChange(id: string, status: VMT.TourStatus) {
    const {error} = await api.admin.tours.update(id, {status});
    if (!error) {
      refetch();
    }
  }

  const archivedCount = archivedTours?.length ?? 0;

  const tourList = tours ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Tours</h1>
        <div className="flex items-center gap-3">
          {archivedCount > 0 && (
            <Link
              href={routes.admin.tours.archive.path()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg type-label-sm uppercase border border-border text-on-surface-secondary hover:bg-surface-alt transition-colors cursor-pointer"
            >
              <i className="fa fa-archive text-xs" />
              Archive ({archivedCount})
            </Link>
          )}
          <Link
            href={routes.admin.tours.new.path()}
            className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors cursor-pointer"
          >
            + New Tour
          </Link>
        </div>
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
                Pricing Type
              </th>
              <th className="text-right px-4 py-3 type-label-sm text-on-surface-secondary">
                Status
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
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const types = new Set(
                        (tour.pricingGroups ?? []).map((g) => g.type),
                      );
                      const hasGroup = types.has('group-size');
                      const hasVehicle = types.has('vehicle');
                      if (!hasGroup && !hasVehicle) {
                        return (
                          <span className="type-body-sm text-on-surface-tertiary">
                            —
                          </span>
                        );
                      }
                      return (
                        <>
                          {hasGroup && <Badge variant="info">Group</Badge>}
                          {hasVehicle && (
                            <Badge variant="success">Vehicle</Badge>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex">
                    <StatusPicker
                      value={tour.status}
                      onChange={(status) => handleStatusChange(tour.id, status)}
                    />
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
