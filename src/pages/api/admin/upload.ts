import type {NextApiRequest, NextApiResponse} from 'next';
import {requireAdmin} from '@/lib/admin-auth';
import {prisma} from '@/lib/prisma';
import {promises as fs} from 'fs';
import path from 'path';
import {IncomingForm, type File} from 'formidable';

// Disable Next.js body parser for multipart
export const config = {
  api: {
    bodyParser: false,
  },
};

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const VALID_ENTITY_TYPES = ['tour', 'destination'] as const;
const VALID_IMAGE_TYPES = ['card', 'hero'] as const;

type EntityType = (typeof VALID_ENTITY_TYPES)[number];
type ImageType = (typeof VALID_IMAGE_TYPES)[number];

function parseForm(
  req: NextApiRequest,
): Promise<{fields: Record<string, string>; file: File}> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: MAX_FILE_SIZE,
      filter: ({mimetype}) => !!mimetype && mimetype.startsWith('image/'),
    });

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) return reject(new Error('No file uploaded'));

      const parsed: Record<string, string> = {};
      for (const [key, val] of Object.entries(fields)) {
        parsed[key] = Array.isArray(val) ? val[0] : (val ?? '');
      }
      resolve({fields: parsed, file});
    });
  });
}

function getDestDir(entityType: EntityType, entityId: string): string {
  return path.join(UPLOAD_DIR, `${entityType}s`, entityId);
}

function getPublicUrl(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
): string {
  return `/uploads/${entityType}s/${entityId}/${imageType}.webp`;
}

async function updateDbField(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
  url: string,
) {
  if (entityType === 'destination') {
    const field = imageType === 'card' ? 'imageUrl' : 'heroImage';
    await prisma.destination.update({
      where: {id: entityId},
      data: {[field]: url},
    });
  } else {
    // Tour only has 'card' (imageUrl)
    await prisma.tour.update({where: {id: entityId}, data: {imageUrl: url}});
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'POST') {
    let parsed;
    try {
      parsed = await parseForm(req);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Invalid upload';
      return res.status(400).json({error: message});
    }

    const {fields, file} = parsed;
    const entityType = fields.entityType as EntityType;
    const entityId = fields.entityId;
    const imageType = fields.imageType as ImageType;

    // Validate entityType
    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      return res.status(400).json({error: `Invalid entityType: ${entityType}`});
    }

    // Validate imageType
    if (!VALID_IMAGE_TYPES.includes(imageType)) {
      return res.status(400).json({error: `Invalid imageType: ${imageType}`});
    }

    // hero only valid for destinations
    if (imageType === 'hero' && entityType !== 'destination') {
      return res
        .status(400)
        .json({error: 'hero imageType only valid for destinations'});
    }

    // Validate entity exists
    try {
      if (entityType === 'destination') {
        const dest = await prisma.destination.findUnique({
          where: {id: entityId},
        });
        if (!dest)
          return res.status(404).json({error: 'Destination not found'});
      } else {
        const tour = await prisma.tour.findUnique({where: {id: entityId}});
        if (!tour) return res.status(404).json({error: 'Tour not found'});
      }
    } catch {
      return res.status(404).json({error: 'Entity not found'});
    }

    // Save the uploaded file (already WebP from client-side processing)
    try {
      const destDir = getDestDir(entityType, entityId);
      await fs.mkdir(destDir, {recursive: true});

      const outputPath = path.join(destDir, `${imageType}.webp`);
      await fs.copyFile(file.filepath, outputPath);

      // Update DB
      const publicUrl = getPublicUrl(entityType, entityId, imageType);
      await updateDbField(entityType, entityId, imageType, publicUrl);

      // Clean up temp file
      await fs.unlink(file.filepath).catch(() => {});

      return res.json({success: true, url: publicUrl});
    } catch (err) {
      // Clean up temp file on failure
      await fs.unlink(file.filepath).catch(() => {});
      console.error('File save failed:', err);
      return res.status(500).json({
        error: 'File save failed',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (req.method === 'DELETE') {
    // Body parser is disabled for multipart, so parse JSON manually
    let body: {entityType: EntityType; entityId: string; imageType: ImageType};
    try {
      const raw = await new Promise<string>((resolve, reject) => {
        let data = '';
        req.on('data', (chunk: Buffer) => (data += chunk));
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      body = JSON.parse(raw);
    } catch {
      return res.status(400).json({error: 'Invalid JSON body'});
    }

    const {entityType, entityId, imageType} = body;

    if (
      !entityId ||
      !VALID_ENTITY_TYPES.includes(entityType) ||
      !VALID_IMAGE_TYPES.includes(imageType)
    ) {
      return res.status(400).json({error: 'Invalid parameters'});
    }

    const filePath = path.join(
      getDestDir(entityType, entityId),
      `${imageType}.webp`,
    );
    await fs.unlink(filePath).catch(() => {});

    await updateDbField(entityType, entityId, imageType, '');

    return res.json({success: true});
  }

  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
