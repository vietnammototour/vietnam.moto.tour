import {prisma} from '@/lib/prisma';
import {toLogEntry} from '@/domain/log/mapper';
import type {LogEntryDTO, LogFilters} from '@/domain/log/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export type LogPage = {page: number; pageSize: number};

function buildWhere(filters: LogFilters) {
  const where: Record<string, unknown> = {};
  if (filters.type) where.type = filters.type;
  if (filters.level) where.level = filters.level;
  if (filters.userId) where.userId = filters.userId;
  if (filters.from || filters.to) {
    const range: Record<string, Date> = {};
    if (filters.from) range.gte = new Date(filters.from);
    if (filters.to) range.lte = new Date(filters.to);
    where.createdAt = range;
  }
  return where;
}

export async function getLogs(
  filters: LogFilters,
  page: LogPage,
): Promise<{rows: LogEntryDTO[]; total: number}> {
  const where = buildWhere(filters);
  const [rows, total] = await Promise.all([
    prisma.logEntry.findMany({
      where,
      orderBy: {createdAt: 'desc'},
      take: page.pageSize,
      skip: (page.page - 1) * page.pageSize,
    }),
    prisma.logEntry.count({where}),
  ]);
  return {rows: rows.map(toLogEntry), total};
}

export async function pruneLogs(now: Date): Promise<number> {
  const result = await prisma.logEntry.deleteMany({
    where: {
      OR: [
        {
          type: {in: ['AUTH', 'AUDIT']},
          createdAt: {lt: new Date(now.getTime() - 90 * DAY_MS)},
        },
        {type: 'ERROR', createdAt: {lt: new Date(now.getTime() - 30 * DAY_MS)}},
      ],
    },
  });
  return result.count;
}
