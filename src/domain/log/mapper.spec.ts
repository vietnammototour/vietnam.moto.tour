import {toLogEntry} from './mapper';

describe('toLogEntry', () => {
  it('maps a Prisma LogEntry row to a DTO with ISO createdAt and all fields passed through', () => {
    const row = {
      id: 'log-1',
      createdAt: new Date('2026-05-31T10:00:00.000Z'),
      type: 'AUDIT',
      level: 'INFO',
      message: 'Tour created',
      userId: 'user-42',
      userEmail: 'admin@example.com',
      method: 'POST',
      path: '/api/admin/tours',
      statusCode: 201,
      resource: 'tour',
      resourceId: null,
      durationMs: 123,
      ip: '127.0.0.1',
      meta: {requestBody: {slug: 'x'}},
    };

    const dto = toLogEntry(row);

    expect(dto).toEqual({
      id: 'log-1',
      createdAt: '2026-05-31T10:00:00.000Z',
      type: 'AUDIT',
      level: 'INFO',
      message: 'Tour created',
      userId: 'user-42',
      userEmail: 'admin@example.com',
      method: 'POST',
      path: '/api/admin/tours',
      statusCode: 201,
      resource: 'tour',
      resourceId: null,
      durationMs: 123,
      ip: '127.0.0.1',
      meta: {requestBody: {slug: 'x'}},
    });
  });
});
