import type {LogEntryDTO, LogLevel, LogType} from './types';

type LogRow = {
  id: string;
  createdAt: Date;
  type: string;
  level: string;
  message: string;
  userId: string | null;
  userEmail: string | null;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  resource: string | null;
  resourceId: string | null;
  durationMs: number | null;
  ip: string | null;
  meta: unknown;
};

export function toLogEntry(row: LogRow): LogEntryDTO {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    type: row.type as LogType,
    level: row.level as LogLevel,
    message: row.message,
    userId: row.userId,
    userEmail: row.userEmail,
    method: row.method,
    path: row.path,
    statusCode: row.statusCode,
    resource: row.resource,
    resourceId: row.resourceId,
    durationMs: row.durationMs,
    ip: row.ip,
    meta: row.meta,
  };
}
