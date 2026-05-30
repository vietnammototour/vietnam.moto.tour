import {useEffect} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type {GetServerSidePropsContext} from 'next';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {Button} from '@/components/ui';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {routes, api} from '@/routes';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {DataGrid, type GridColumn} from '@/components/Admin/DataGrid';

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

  const columns: GridColumn<AdminDestination>[] = [
    {
      key: 'name',
      header: 'Name',
      track: 'minmax(0,1fr)',
      render: (dest) => (
        <Link
          href={routes.admin.destinations.edit.path({id: dest.id})}
          className="group/link flex items-center gap-3 cursor-pointer"
        >
          {dest.imageUrl ? (
            <Image
              src={dest.imageUrl}
              alt=""
              width={75}
              height={50}
              unoptimized
              className="h-[50px] w-auto object-contain shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`h-[50px] w-[50px] bg-surface-alt flex items-center justify-center shrink-0 ${dest.imageUrl ? 'hidden' : ''}`}
          >
            <i className="fa fa-image text-on-surface-tertiary" />
          </div>
          <span className="type-body-lg text-primary group-hover/link:text-primary-light group-hover/link:underline transition-colors">
            {dest.nameEn || dest.nameVi}
          </span>
        </Link>
      ),
    },
    {
      key: 'tours',
      header: 'Tours',
      track: '80px',
      render: (dest) => dest._count.tours,
    },
    {
      key: 'highlights',
      header: 'Highlights',
      track: '96px',
      render: (dest) => dest._count.highlights,
    },
    {
      key: 'size',
      header: 'Size',
      track: '96px',
    },
    {
      key: 'actions',
      header: '',
      track: '140px',
      align: 'end',
      render: (dest) => (
        <Button
          variant="ghost-danger"
          size="sm"
          onClick={() => handleArchive(dest.id)}
          icon={<i className="fa fa-archive text-xs" />}
        >
          Archive
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title="Destinations"
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
      <DataGrid
        columns={columns}
        items={destList}
        rowKey={(dest) => dest.id}
        ariaLabel="Destinations"
        emptyState="No destinations yet."
      />
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
