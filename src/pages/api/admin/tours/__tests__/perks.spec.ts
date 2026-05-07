import handler from '../[id]';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import type {NextApiRequest, NextApiResponse} from 'next';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tour: {findUnique: jest.fn(), update: jest.fn()},
    tourPerk: {deleteMany: jest.fn(), createMany: jest.fn()},
    perk: {findMany: jest.fn()},
    $transaction: jest.fn(),
  },
}));
jest.mock('@/lib/admin-auth', () => ({requireAdmin: jest.fn()}));

const mockReq = (o: Partial<NextApiRequest> = {}) =>
  ({method: 'PUT', query: {id: 't1'}, body: {}, ...o}) as NextApiRequest;

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
  (prisma.$transaction as jest.Mock).mockImplementation(
    async (arg: unknown) => {
      if (Array.isArray(arg)) return Promise.all(arg as Promise<unknown>[]);
      return arg;
    },
  );
  (prisma.tour.update as jest.Mock).mockResolvedValue({id: 't1'});
});

describe('PUT /api/admin/tours/[id] perks handling', () => {
  it('replaces TourPerk rows when includedPerkIds and excludedPerkIds provided', async () => {
    (prisma.perk.findMany as jest.Mock).mockResolvedValue([
      {id: 'a'},
      {id: 'b'},
      {id: 'c'},
    ]);
    const res = mockRes();
    await handler(
      mockReq({
        body: {
          includedPerkIds: ['a', 'b'],
          excludedPerkIds: ['c'],
        },
      }),
      res,
    );
    expect(prisma.tourPerk.deleteMany).toHaveBeenCalledWith({
      where: {tourId: 't1'},
    });
    expect(prisma.tourPerk.createMany).toHaveBeenCalledWith({
      data: [
        {tourId: 't1', perkId: 'a', bucket: 'INCLUDED'},
        {tourId: 't1', perkId: 'b', bucket: 'INCLUDED'},
        {tourId: 't1', perkId: 'c', bucket: 'EXCLUDED'},
      ],
    });
  });

  it('rejects when same perk appears in both buckets', async () => {
    const res = mockRes();
    await handler(
      mockReq({body: {includedPerkIds: ['a'], excludedPerkIds: ['a']}}),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.tourPerk.deleteMany).not.toHaveBeenCalled();
  });

  it('skips perk handling when neither key provided', async () => {
    const res = mockRes();
    await handler(mockReq({body: {title: 'Updated'}}), res);
    expect(prisma.tourPerk.deleteMany).not.toHaveBeenCalled();
    expect(prisma.tour.update).toHaveBeenCalled();
  });
});
