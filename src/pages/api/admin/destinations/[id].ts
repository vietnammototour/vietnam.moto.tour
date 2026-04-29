import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = req.query.id as string;

  if (req.method === 'GET') {
    const destination = await prisma.destination.findUnique({where: {id}});
    if (!destination)
      return res.status(404).json({error: 'Destination not found'});
    return res.json(destination);
  }

  if (req.method === 'PUT') {
    const data = req.body;
    const destination = await prisma.destination.update({
      where: {id},
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi,
        nameEn: data.nameEn,
        imageUrl: data.imageUrl,
        descriptionVi: data.descriptionVi,
        descriptionEn: data.descriptionEn,
        size: data.size,
        isActive: data.isActive,
      },
    });
    return res.json(destination);
  }

  if (req.method === 'DELETE') {
    await prisma.destination.update({where: {id}, data: {isActive: false}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
