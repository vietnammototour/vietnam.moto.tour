import type {NextApiRequest, NextApiResponse} from 'next';
import {requireAdmin} from '@/lib/admin-auth';
import {prisma} from '@/lib/prisma';
import {promises as fs} from 'fs';
import path from 'path';
import crypto from 'crypto';
import {IncomingForm, type File} from 'formidable';
import {resolveUploadPath} from '@/lib/upload-dir';
import {sniffImageFormat} from '@/lib/image-magic';
import {
  isValidEntityType,
  isValidImageType,
  isValidCombination,
  getDbField,
  type EntityType,
  type ImageType,
} from '@/lib/upload-entities';

export const config = {api: {bodyParser: false}};

const MAX_BYTES = 2 * 1024 * 1024;

function parseForm(req: NextApiRequest): Promise<{
  fields: Record<string, string>;
  file: File;
}> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: MAX_BYTES,
      filter: ({mimetype}) => mimetype === 'image/webp',
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) return reject(new Error('No file uploaded'));
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(fields)) {
        flat[k] = Array.isArray(v) ? v[0] : (v ?? '');
      }
      resolve({fields: flat, file});
    });
  });
}

async function checkEntityExists(
  entityType: EntityType,
  entityId: string,
): Promise<boolean> {
  if (entityType === 'tour') {
    return !!(await prisma.tour.findUnique({where: {id: entityId}}));
  }
  if (entityType === 'destination') {
    return !!(await prisma.destination.findUnique({where: {id: entityId}}));
  }
  if (entityType === 'highlight')
    return !!(await prisma.highlight.findUnique({where: {id: entityId}}));
  return !!(await prisma.collectionImage.findUnique({where: {id: entityId}}));
}

async function readPreviousUrl(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
): Promise<string | null> {
  if (entityType === 'destination' && imageType === 'hero') {
    const r = await prisma.destination.findUnique({where: {id: entityId}});
    return r?.heroImage ?? null;
  }
  if (entityType === 'tour') {
    const r = await prisma.tour.findUnique({where: {id: entityId}});
    return r?.imageUrl ?? null;
  }
  if (entityType === 'destination') {
    const r = await prisma.destination.findUnique({where: {id: entityId}});
    return r?.imageUrl ?? null;
  }
  if (entityType === 'highlight') {
    const r = await prisma.highlight.findUnique({where: {id: entityId}});
    return r?.imageUrl ?? null;
  }
  const r = await prisma.collectionImage.findUnique({where: {id: entityId}});
  return r?.url ?? null;
}

async function updateDb(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
  url: string | null,
) {
  const {model, field} = getDbField(entityType, imageType);
  const data = {[field]: url};
  if (model === 'tour') await prisma.tour.update({where: {id: entityId}, data});
  else if (model === 'destination')
    await prisma.destination.update({where: {id: entityId}, data});
  else if (model === 'highlight')
    await prisma.highlight.update({where: {id: entityId}, data});
  else await prisma.collectionImage.update({where: {id: entityId}, data});
}

async function unlinkPublicUrl(url: string | null | undefined) {
  if (!url || !url.startsWith('/uploads/')) return;
  try {
    const abs = resolveUploadPath(url.replace(/^\/uploads\//, ''));
    await fs.unlink(abs);
  } catch {
    /* best-effort */
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const ok = await requireAdmin(req, res);
  if (!ok) return;

  if (req.method === 'POST') return handlePost(req, res);
  if (req.method === 'DELETE') return handleDelete(req, res);
  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  let parsed;
  try {
    parsed = await parseForm(req);
  } catch (e) {
    return res
      .status(400)
      .json({error: e instanceof Error ? e.message : 'Invalid upload'});
  }
  const {fields, file} = parsed;
  const entityType = fields.entityType;
  const entityId = fields.entityId;
  const imageType = fields.imageType;

  if (!isValidEntityType(entityType))
    return res.status(400).json({error: `Invalid entityType: ${entityType}`});
  if (!isValidImageType(imageType))
    return res.status(400).json({error: `Invalid imageType: ${imageType}`});
  if (!isValidCombination(entityType, imageType))
    return res.status(400).json({error: 'Invalid entityType/imageType pair'});

  const exists = await checkEntityExists(entityType, entityId);
  if (!exists) {
    await fs.unlink(file.filepath).catch(() => {});
    return res.status(404).json({error: 'Entity not found'});
  }

  const head = await fs.readFile(file.filepath);
  // Node Buffers share an underlying ArrayBuffer pool — slice to get the exact
  // window before passing to the magic-byte sniffer.
  const sniff = sniffImageFormat(
    head.buffer.slice(head.byteOffset, head.byteOffset + head.byteLength),
  );
  if (sniff !== 'webp') {
    await fs.unlink(file.filepath).catch(() => {});
    return res.status(400).json({error: 'invalid_format'});
  }

  const hash = crypto
    .createHash('sha256')
    .update(head)
    .digest('hex')
    .slice(0, 8);

  const relDir = `${entityType}s/${entityId}`;
  const relFile = `${relDir}/${imageType}.${hash}.webp`;
  const absFile = resolveUploadPath(relFile);
  const tmpFile = absFile + '.tmp';

  try {
    await fs.mkdir(path.dirname(absFile), {recursive: true});
    await fs.writeFile(tmpFile, head);
    await fs.rename(tmpFile, absFile);
  } catch {
    await fs.unlink(tmpFile).catch(() => {});
    await fs.unlink(file.filepath).catch(() => {});
    return res.status(500).json({error: 'write_failed'});
  }

  const previousUrl = await readPreviousUrl(entityType, entityId, imageType);
  const publicUrl = `/uploads/${relFile}`;

  try {
    await updateDb(entityType, entityId, imageType, publicUrl);
  } catch {
    await fs.unlink(absFile).catch(() => {});
    await fs.unlink(file.filepath).catch(() => {});
    return res.status(500).json({error: 'db_update_failed'});
  }

  if (previousUrl && previousUrl !== publicUrl) {
    await unlinkPublicUrl(previousUrl);
  }
  await fs.unlink(file.filepath).catch(() => {});

  return res.status(200).json({url: publicUrl, hash, byteSize: head.length});
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  let body: {entityType: string; entityId: string; imageType: string};
  try {
    const chunks: Buffer[] = [];
    for await (const c of req) {
      chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
    }
    body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
  } catch {
    return res.status(400).json({error: 'Invalid JSON body'});
  }

  const {entityType, entityId, imageType} = body;
  if (!isValidEntityType(entityType) || !isValidImageType(imageType))
    return res.status(400).json({error: 'Invalid parameters'});
  if (!isValidCombination(entityType, imageType))
    return res.status(400).json({error: 'Invalid entityType/imageType pair'});

  const previous = await readPreviousUrl(entityType, entityId, imageType);
  try {
    await updateDb(entityType, entityId, imageType, null);
  } catch {
    return res.status(500).json({error: 'db_update_failed'});
  }
  if (previous) await unlinkPublicUrl(previous);
  return res.status(200).json({success: true});
}
