import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {promises as fs} from 'fs';
import {resolveUploadPath} from '@/lib/upload-dir';

const MIN_IMAGES = 1;

async function unlinkPublicUrl(url: string) {
  if (!url || !url.startsWith('/uploads/')) return;
  try {
    await fs.unlink(resolveUploadPath(url.replace(/^\/uploads\//, '')));
  } catch {
    /* best-effort */
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!(await requireAdmin(req, res))) return;
  const collectionId = req.query.id as string;
  const imageId = req.query.imageId as string;

  const image = await prisma.collectionImage.findUnique({where: {id: imageId}});
  if (!image || image.collectionId !== collectionId) {
    return res.status(404).json({error: 'Image not found'});
  }

  if (req.method === 'PATCH') {
    const {altEn, altVi} = req.body ?? {};
    const data: Record<string, unknown> = {};
    if (typeof altEn === 'string') data.altEn = altEn;
    if (typeof altVi === 'string') data.altVi = altVi;
    const updated = await prisma.collectionImage.update({
      where: {id: imageId},
      data,
    });
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    const count = await prisma.collectionImage.count({where: {collectionId}});
    if (count <= MIN_IMAGES) {
      return res.status(400).json({error: `min ${MIN_IMAGES} image required`});
    }
    await prisma.collectionImage.delete({where: {id: imageId}});
    if (image.url) await unlinkPublicUrl(image.url);
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
