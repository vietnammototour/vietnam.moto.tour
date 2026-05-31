import type {ReactNode} from 'react';
import {Modal} from '@/components/ui/Modal';
import type {LogEntryDTO} from '@/domain/log/types';

type Props = {
  entry: LogEntryDTO | null;
  open: boolean;
  onClose: () => void;
};

function Row({label, value}: {label: string; value: ReactNode}) {
  return (
    <div className="flex gap-2 py-1 text-sm">
      <span className="w-28 shrink-0 font-medium text-gray-500">{label}</span>
      <span className="break-all">{value ?? '—'}</span>
    </div>
  );
}

export function LogDetailDrawer({entry, open, onClose}: Props) {
  if (!entry) return null;
  return (
    <Modal open={open} onClose={onClose} title="Log detail" size="lg">
      <Row label="Time" value={entry.createdAt} />
      <Row label="Type" value={entry.type} />
      <Row label="Level" value={entry.level} />
      <Row label="Message" value={entry.message} />
      <Row label="User" value={entry.userEmail ?? entry.userId} />
      <Row label="Method" value={entry.method} />
      <Row label="Path" value={entry.path} />
      <Row label="Status" value={entry.statusCode} />
      <Row
        label="Resource"
        value={[entry.resource, entry.resourceId].filter(Boolean).join('/')}
      />
      <Row
        label="Duration"
        value={entry.durationMs != null ? `${entry.durationMs}ms` : null}
      />
      <Row label="IP" value={entry.ip} />
      <div className="mt-3">
        <span className="text-sm font-medium text-gray-500">Meta</span>
        <pre className="mt-1 max-h-80 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
          {JSON.stringify(entry.meta, null, 2)}
        </pre>
      </div>
    </Modal>
  );
}
