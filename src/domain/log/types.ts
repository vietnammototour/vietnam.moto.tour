export type LogType = 'AUDIT' | 'AUTH' | 'ERROR';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export type LogEntryDTO = {
  id: string;
  createdAt: string;
  type: LogType;
  level: LogLevel;
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

export type LogFilters = {
  type?: LogType;
  level?: LogLevel;
  userId?: string;
  from?: string;
  to?: string;
};
