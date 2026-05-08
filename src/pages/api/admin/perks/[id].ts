import type {NextApiRequest, NextApiResponse} from 'next';
import type {PerkCategory} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

const VALID_CATEGORIES: PerkCategory[] = [
  'TRANSPORT',
  'FOOD',
  'ACCOMMODATION',
  'GUIDE',
  'SUPPORT',
  'OTHER',
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = req.query.id as string;

  if (req.method === 'GET') {
    const perk = await prisma.perk.findUnique({where: {id}});
    if (!perk) return res.status(404).json({error: 'Perk not found'});
    return res.json(perk);
  }

  if (req.method === 'PUT') {
    const {labelEn, labelVi, icon, category} = req.body ?? {};
    const data: Record<string, unknown> = {};
    if (typeof labelEn === 'string') data.labelEn = labelEn;
    if (typeof labelVi === 'string') data.labelVi = labelVi;
    if (typeof icon === 'string') data.icon = icon;
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({error: 'category is invalid'});
      }
      data.category = category;
    }

    const perk = await prisma.perk.update({where: {id}, data});
    return res.json(perk);
  }

  if (req.method === 'DELETE') {
    const usage = await prisma.tourPerk.count({where: {perkId: id}});
    if (usage > 0) {
      return res.status(409).json({
        error: `Perk is in use by ${usage} tour(s). Remove it from those tours first.`,
      });
    }
    await prisma.perk.delete({where: {id}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
