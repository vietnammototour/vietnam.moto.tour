import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const archivedParam = req.query.archived;
    const where =
      archivedParam === 'true'
        ? {isActive: false}
        : archivedParam === 'false'
          ? {isActive: true}
          : undefined;
    const destinations = await prisma.destination.findMany({
      where,
      orderBy: {createdAt: 'desc'},
      include: {_count: {select: {tours: true, highlights: true}}},
    });
    return res.json(destinations);
  }

  if (req.method === 'POST') {
    const data = req.body;
    const destination = await prisma.destination.create({
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi ?? '',
        nameEn: data.nameEn ?? '',
        imageUrl: data.imageUrl ?? '',
        heroImage: data.heroImage ?? '',
        descriptionVi: data.descriptionVi ?? '',
        descriptionEn: data.descriptionEn ?? '',
        size: data.size ?? 'small',
      },
    });
    return res.status(201).json(destination);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
