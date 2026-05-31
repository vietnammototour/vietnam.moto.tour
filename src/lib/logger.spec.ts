import {scrub, writeLogEntry} from './logger';
import {prisma} from './prisma';

jest.mock('./prisma', () => ({
  prisma: {logEntry: {create: jest.fn()}},
}));

describe('scrub', () => {
  it('redacts sensitive keys recursively', () => {
    const input = {
      slug: 'tour-x',
      password: 'hunter2',
      nested: {token: 'abc', keep: 1},
      Authorization: 'Bearer z',
    };
    expect(scrub(input)).toEqual({
      slug: 'tour-x',
      password: '[REDACTED]',
      nested: {token: '[REDACTED]', keep: 1},
      Authorization: '[REDACTED]',
    });
  });

  it('passes through non-objects', () => {
    expect(scrub('x')).toBe('x');
    expect(scrub(null)).toBe(null);
  });
});

describe('writeLogEntry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a row with scrubbed meta', async () => {
    (prisma.logEntry.create as jest.Mock).mockResolvedValue({});
    await writeLogEntry({
      type: 'AUDIT',
      message: 'created',
      meta: {password: 'p'},
    });
    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'AUDIT',
        level: 'INFO',
        message: 'created',
        meta: {password: '[REDACTED]'},
      }),
    });
  });

  it('never throws when the DB write fails', async () => {
    (prisma.logEntry.create as jest.Mock).mockRejectedValue(new Error('db down'));
    await expect(
      writeLogEntry({type: 'ERROR', message: 'x'}),
    ).resolves.toBeUndefined();
  });
});
