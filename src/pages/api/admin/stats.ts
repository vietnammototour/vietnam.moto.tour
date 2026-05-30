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

  const [
    tourCount,
    reviewCount,
    destinationCount,
    vehicleCount,
    perkCount,
    imageCollectionCount,
    userCount,
    roleCount,
  ] = await Promise.all([
    prisma.tour.count(),
    prisma.review.count(),
    prisma.destination.count(),
    prisma.vehicle.count(),
    prisma.perk.count(),
    prisma.imageCollection.count(),
    prisma.user.count(),
    prisma.orgRole.count(),
  ]);

  return res.status(200).json({
    tourCount,
    reviewCount,
    destinationCount,
    vehicleCount,
    perkCount,
    imageCollectionCount,
    userCount,
    roleCount,
  });
}
