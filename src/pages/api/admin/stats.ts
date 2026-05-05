import type {NextApiRequest, NextApiResponse} from 'next';
import {requireAdmin} from '@/lib/admin-auth';
import {prisma} from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  if (req.method !== 'GET') {
    return res.status(405).json({error: 'Method not allowed'});
  }

  const [tourCount, destinationCount, userCount] = await Promise.all([
    prisma.tour.count({where: {status: {in: ['PUBLISHED', 'FEATURED']}}}),
    prisma.destination.count({where: {isActive: true}}),
    prisma.user.count(),
  ]);

  return res.status(200).json({tourCount, destinationCount, userCount});
}
