import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import {promises as fsp} from 'fs';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL.split('?')[0];
const adapter = new PrismaPg(dbUrl);
const prisma = new PrismaClient({adapter});

const KEY = 'home-gallery';
const SOURCE_DIR = path.join(process.cwd(), 'public/assets/images/gallery');
const FILES = [1, 2, 3, 4, 5].map((n) => `gallery-one-img-${n}.jpeg`);
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads');

async function main(): Promise<void> {
  const existing = await prisma.imageCollection.findUnique({where: {key: KEY}});
  if (existing) {
    console.log(`Collection ${KEY} already exists, skipping seed.`);
    return;
  }

  const altRows = await prisma.translation.findMany({
    where: {key: {in: FILES.map((_, i) => `galleryAlt${i + 1}`)}},
  });
  const altMap: Record<string, {en: string; vi: string}> = {};
  for (const r of altRows) {
    altMap[r.key] = {en: r.valueEn ?? '', vi: r.valueVi ?? ''};
  }

  const collection = await prisma.imageCollection.create({
    data: {key: KEY, label: 'Home Gallery'},
  });

  for (let i = 0; i < FILES.length; i++) {
    const filename = FILES[i];
    const srcPath = path.join(SOURCE_DIR, filename);
    const buf = await fsp.readFile(srcPath);
    const hash = crypto
      .createHash('sha256')
      .update(buf)
      .digest('hex')
      .slice(0, 8);
    const ext = path.extname(filename);
    const relDir = `collectionImages/seed`;
    const relFile = `${relDir}/${path.parse(filename).name}.${hash}${ext}`;
    const absDir = path.join(UPLOAD_DIR, relDir);
    const absFile = path.join(UPLOAD_DIR, relFile);
    await fsp.mkdir(absDir, {recursive: true});
    await fsp.writeFile(absFile, buf);

    await prisma.collectionImage.create({
      data: {
        collectionId: collection.id,
        url: `/uploads/${relFile}`,
        altEn: altMap[`galleryAlt${i + 1}`]?.en ?? '',
        altVi: altMap[`galleryAlt${i + 1}`]?.vi ?? '',
        order: i,
      },
    });
  }
  console.log(`Seeded ${FILES.length} images into ${KEY}.`);
}

main()
  .catch((e) => {
    console.error('Seed home-gallery failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
