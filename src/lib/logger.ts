import pino from 'pino';
import {prisma} from './prisma';
import type {LogLevel, LogType} from '@/domain/log/types';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: undefined,
});

const SECRET_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'apikey',
  'accesstoken',
  'refreshtoken',
];

export function scrub(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(scrub);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SECRET_KEYS.includes(k.toLowerCase()) ? '[REDACTED]' : scrub(v);
  }
  return out;
}

export type WriteLogInput = {
  type: LogType;
  level?: LogLevel;
  message: string;
  userId?: string | null;
  userEmail?: string | null;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  resource?: string | null;
  resourceId?: string | null;
  durationMs?: number | null;
  ip?: string | null;
  meta?: unknown;
};

export async function writeLogEntry(input: WriteLogInput): Promise<void> {
  try {
    await prisma.logEntry.create({
      data: {
        type: input.type,
        level: input.level ?? 'INFO',
        message: input.message,
        userId: input.userId ?? null,
        userEmail: input.userEmail ?? null,
        method: input.method ?? null,
        path: input.path ?? null,
        statusCode: input.statusCode ?? null,
        resource: input.resource ?? null,
        resourceId: input.resourceId ?? null,
        durationMs: input.durationMs ?? null,
        ip: input.ip ?? null,
        meta: input.meta === undefined ? undefined : (scrub(input.meta) as never),
      },
    });
  } catch (err) {
    logger.error({err}, 'writeLogEntry failed');
  }
}

export async function logAudit(input: Omit<WriteLogInput, 'type'>): Promise<void> {
  logger.info({...input, type: 'AUDIT'}, input.message);
  await writeLogEntry({...input, type: 'AUDIT'});
}

export async function logAuth(input: Omit<WriteLogInput, 'type'>): Promise<void> {
  logger.info({...input, type: 'AUTH'}, input.message);
  await writeLogEntry({...input, type: 'AUTH'});
}

export async function logError(input: Omit<WriteLogInput, 'type'>): Promise<void> {
  logger.error({...input, type: 'ERROR'}, input.message);
  await writeLogEntry({level: 'ERROR', ...input, type: 'ERROR'});
}
