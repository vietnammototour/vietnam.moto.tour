import handler from '../[id]';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import type {NextApiRequest, NextApiResponse} from 'next';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    perk: {findUnique: jest.fn(), update: jest.fn(), delete: jest.fn()},
    tourPerk: {count: jest.fn()},
  },
}));
jest.mock('@/lib/admin-auth', () => ({requireAdmin: jest.fn()}));

const mockReq = (o: Partial<NextApiRequest> = {}) =>
  ({method: 'GET', query: {id: 'p1'}, body: {}, ...o}) as NextApiRequest;

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.end = jest.fn().mockReturnThis();
  res.setHeader = jest.fn();
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue(true);
});

describe('GET /api/admin/perks/[id]', () => {
  it('returns 404 when not found', async () => {
    (prisma.perk.findUnique as jest.Mock).mockResolvedValue(null);
    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns the perk', async () => {
    (prisma.perk.findUnique as jest.Mock).mockResolvedValue({id: 'p1'});
    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith({id: 'p1'});
  });
});

describe('PUT /api/admin/perks/[id]', () => {
  it('updates allowed fields', async () => {
    (prisma.perk.update as jest.Mock).mockResolvedValue({id: 'p1'});
    const res = mockRes();
    await handler(
      mockReq({
        method: 'PUT',
        body: {
          labelEn: 'New',
          labelVi: 'New',
          icon: 'i',
          category: 'FOOD',
          archived: true,
        },
      }),
      res,
    );
    expect(prisma.perk.update).toHaveBeenCalledWith({
      where: {id: 'p1'},
      data: {
        labelEn: 'New',
        labelVi: 'New',
        icon: 'i',
        category: 'FOOD',
        archived: true,
      },
    });
  });
});

describe('DELETE /api/admin/perks/[id]', () => {
  it('returns 409 when perk is in use', async () => {
    (prisma.tourPerk.count as jest.Mock).mockResolvedValue(2);
    const res = mockRes();
    await handler(mockReq({method: 'DELETE'}), res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.perk.delete).not.toHaveBeenCalled();
  });

  it('deletes when not in use', async () => {
    (prisma.tourPerk.count as jest.Mock).mockResolvedValue(0);
    (prisma.perk.delete as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    await handler(mockReq({method: 'DELETE'}), res);
    expect(prisma.perk.delete).toHaveBeenCalledWith({where: {id: 'p1'}});
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
