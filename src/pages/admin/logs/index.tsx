import {useCallback, useEffect, useRef, useState} from 'react';
import type {GetServerSidePropsContext} from 'next';
import {Button} from '@/components/ui';
import {DataGrid, type GridColumn} from '@/components/Admin/DataGrid';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {LogFilters} from '@/components/Admin/Logs/LogFilters';
import {LogDetailDrawer} from '@/components/Admin/Logs/LogDetailDrawer';
import {api} from '@/routes';
import type {LogEntryDTO, LogFilters as Filters} from '@/domain/log/types';

const REFRESH_MS = 10_000;

const columns: GridColumn<LogEntryDTO>[] = [
  {
    key: 'createdAt',
    header: 'Time',
    track: '180px',
    render: (r) => new Date(r.createdAt).toLocaleString(),
  },
  {key: 'type', header: 'Type', track: '90px'},
  {key: 'level', header: 'Level', track: '80px'},
  {key: 'message', header: 'Message', track: 'minmax(0,2fr)'},
  {
    key: 'path',
    header: 'Path',
    track: 'minmax(0,1fr)',
    render: (r) => r.path ?? '—',
  },
  {
    key: 'statusCode',
    header: 'Status',
    track: '80px',
    align: 'end',
    render: (r) => r.statusCode ?? '—',
  },
];

export default function LogsPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [rows, setRows] = useState<LogEntryDTO[]>([]);
  const [selected, setSelected] = useState<LogEntryDTO | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(() => {
    api.admin.logs
      .list({...filters, page: 1, pageSize: 100})
      .then(({data}) => {
        if (data) setRows(data.rows);
      });
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!autoRefresh) return;
    timer.current = setInterval(load, REFRESH_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [autoRefresh, load]);

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title="Logs"
          subtitle="Server activity & audit trail"
        />
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <LogFilters value={filters} onChange={setFilters} />
          <Button
            variant={autoRefresh ? 'primary' : 'secondary'}
            onClick={() => setAutoRefresh((v) => !v)}
          >
            {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
          </Button>
        </div>
        <DataGrid
          columns={columns}
          items={rows}
          rowKey={(r) => r.id}
          onRowClick={setSelected}
          ariaLabel="Server logs"
          emptyState="No log entries."
        />
      </div>
      <LogDetailDrawer
        entry={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
