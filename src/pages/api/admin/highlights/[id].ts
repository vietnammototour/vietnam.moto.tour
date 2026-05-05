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

  if (req.method === 'PUT') {
    const {textEn, textVi, imageUrl} = req.body;
    const updateData: Record<string, unknown> = {};
    if (textEn !== undefined) updateData.textEn = textEn;
    if (textVi !== undefined) updateData.textVi = textVi;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const highlight = await prisma.highlight.update({
      where: {id},
      data: updateData,
    });
    return res.json(highlight);
  }

  if (req.method === 'DELETE') {
    await prisma.highlight.delete({where: {id}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
