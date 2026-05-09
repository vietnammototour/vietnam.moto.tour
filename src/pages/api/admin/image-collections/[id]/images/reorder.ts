import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!(await requireAdmin(req, res))) return;
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({error: 'Method not allowed'});
  }
  const collectionId = req.query.id as string;
  const {ids} = req.body ?? {};
  if (!Array.isArray(ids) || ids.some((x) => typeof x !== 'string')) {
    return res.status(400).json({error: 'ids must be string[]'});
  }
  const existing = await prisma.collectionImage.findMany({
    where: {collectionId},
    select: {id: true},
  });
  const existingIds = new Set(existing.map((r: {id: string}) => r.id));
  if (
    existing.length !== ids.length ||
    !ids.every((id: string) => existingIds.has(id))
  ) {
    return res
      .status(400)
      .json({error: 'ids must match collection images exactly'});
  }
  await prisma.$transaction(
    ids.map((id: string, order: number) =>
      prisma.collectionImage.update({where: {id}, data: {order}}),
    ),
  );
  return res.status(204).end();
}
