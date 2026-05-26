import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toVehicle} from '@/domain/vehicle/mapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({error: 'Method not allowed'});
  }
  const id = String(req.query.id);
  const row = await prisma.vehicle.update({
    where: {id},
    data: {status: 'DRAFT'},
  });
  return res.json(toVehicle(row));
}
