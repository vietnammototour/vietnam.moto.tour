import type {LogFilters as Filters} from '@/domain/log/types';

type Props = {
  value: Filters;
  onChange: (next: Filters) => void;
};

export function LogFilters({value, onChange}: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex flex-col text-sm" htmlFor="log-type">
        Type
        <select
          id="log-type"
          aria-label="Type"
          className="cursor-pointer rounded border px-2 py-1"
          value={value.type ?? ''}
          onChange={(e) =>
            onChange({...value, type: (e.target.value || undefined) as Filters['type']})
          }
        >
          <option value="">All</option>
          <option value="AUDIT">Audit</option>
          <option value="AUTH">Auth</option>
          <option value="ERROR">Error</option>
        </select>
      </label>

      <label className="flex flex-col text-sm" htmlFor="log-level">
        Level
        <select
          id="log-level"
          aria-label="Level"
          className="cursor-pointer rounded border px-2 py-1"
          value={value.level ?? ''}
          onChange={(e) =>
            onChange({...value, level: (e.target.value || undefined) as Filters['level']})
          }
        >
          <option value="">All</option>
          <option value="INFO">Info</option>
          <option value="WARN">Warn</option>
          <option value="ERROR">Error</option>
        </select>
      </label>

      <label className="flex flex-col text-sm" htmlFor="log-from">
        From
        <input
          id="log-from"
          aria-label="From"
          type="date"
          className="cursor-pointer rounded border px-2 py-1"
          value={value.from ?? ''}
          onChange={(e) => onChange({...value, from: e.target.value || undefined})}
        />
      </label>

      <label className="flex flex-col text-sm" htmlFor="log-to">
        To
        <input
          id="log-to"
          aria-label="To"
          type="date"
          className="cursor-pointer rounded border px-2 py-1"
          value={value.to ?? ''}
          onChange={(e) => onChange({...value, to: e.target.value || undefined})}
        />
      </label>
    </div>
  );
}
