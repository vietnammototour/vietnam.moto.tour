import {getLogs, pruneLogs} from './logs';
import {prisma} from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    logEntry: {
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

beforeEach(() => jest.clearAllMocks());

describe('getLogs', () => {
  it('builds a where clause from filters and returns mapped rows + total', async () => {
    (prisma.logEntry.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'l1',
        createdAt: new Date('2026-05-31T00:00:00.000Z'),
        type: 'ERROR',
        level: 'ERROR',
        message: 'boom',
        userId: null,
        userEmail: null,
        method: 'GET',
        path: '/api/admin/tours',
        statusCode: 500,
        resource: 'tours',
        resourceId: null,
        durationMs: 5,
        ip: null,
        meta: null,
      },
    ]);
    (prisma.logEntry.count as jest.Mock).mockResolvedValue(1);

    const result = await getLogs(
      {type: 'ERROR', from: '2026-05-01T00:00:00.000Z'},
      {page: 1, pageSize: 25},
    );

    expect(prisma.logEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          type: 'ERROR',
          createdAt: {gte: new Date('2026-05-01T00:00:00.000Z')},
        },
        orderBy: {createdAt: 'desc'},
        take: 25,
        skip: 0,
      }),
    );
    expect(result.total).toBe(1);
    expect(result.rows[0]).toEqual(
      expect.objectContaining({id: 'l1', createdAt: '2026-05-31T00:00:00.000Z'}),
    );
  });
});

describe('pruneLogs', () => {
  it('deletes AUTH/AUDIT older than 90d and ERROR older than 30d', async () => {
    (prisma.logEntry.deleteMany as jest.Mock).mockResolvedValue({count: 3});
    const now = new Date('2026-05-31T00:00:00.000Z');
    await pruneLogs(now);
    expect(prisma.logEntry.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            type: {in: ['AUTH', 'AUDIT']},
            createdAt: {lt: new Date('2026-03-02T00:00:00.000Z')},
          },
          {type: 'ERROR', createdAt: {lt: new Date('2026-05-01T00:00:00.000Z')}},
        ],
      },
    });
  });
});
