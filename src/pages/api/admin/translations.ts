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
    const namespace = req.query.namespace as string | undefined;
    const where = namespace ? {namespace} : {};
    const translations = await prisma.translation.findMany({
      where,
      orderBy: [{namespace: 'asc'}, {key: 'asc'}],
    });
    return res.json(translations);
  }

  if (req.method === 'PUT') {
    const updates: Array<{
      id: string;
      key: string;
      namespace: string;
      valueVi: string;
      valueEn: string;
    }> = req.body;

    const results = await Promise.all(
      updates.map((item) =>
        prisma.translation.upsert({
          where: {
            namespace_key: {namespace: item.namespace, key: item.key},
          },
          update: {valueVi: item.valueVi, valueEn: item.valueEn},
          create: {
            namespace: item.namespace,
            key: item.key,
            valueVi: item.valueVi,
            valueEn: item.valueEn,
          },
        }),
      ),
    );
    return res.json(results);
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({error: 'Method not allowed'});
}
