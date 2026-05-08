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
    const destinationId = req.query.destinationId as string | undefined;
    const where = destinationId ? {destinationId} : {};
    const highlights = await prisma.highlight.findMany({
      where,
      orderBy: {createdAt: 'desc'},
    });
    return res.json(highlights);
  }

  if (req.method === 'POST') {
    const {
      destinationId,
      titleEn,
      titleVi,
      descriptionEn,
      descriptionVi,
      imageUrl,
    } = req.body;
    if (!destinationId) {
      return res.status(400).json({error: 'destinationId is required'});
    }
    const highlight = await prisma.highlight.create({
      data: {
        destinationId,
        titleEn: titleEn ?? '',
        titleVi: titleVi ?? '',
        descriptionEn: descriptionEn ?? '',
        descriptionVi: descriptionVi ?? '',
        imageUrl: imageUrl ?? null,
      },
    });
    return res.status(201).json(highlight);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
