import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) {
  const candidatePaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '..', '.env'), // worktree → main project root
  ];
  let envPath: string | null = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      envPath = p;
      break;
    }
  }
  if (envPath) {
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

type VehicleSeed = {
  slug: string;
  type: 'SCOOTER' | 'BIKE';
  brand: string;
  model: string;
  cc: number;
  quantity: number;
  priceUsdPerDay: number;
  imageFile: string;
  descriptionVi: string;
  descriptionEn: string;
  order: number;
};

const vehicles: VehicleSeed[] = [
  {
    slug: 'honda-airblade-125',
    type: 'SCOOTER',
    brand: 'Honda',
    model: 'Airblade 125',
    cc: 125,
    quantity: 2,
    priceUsdPerDay: 8,
    imageFile: 'Scooter automatic Honda Airblade 125cc.jpeg',
    descriptionEn:
      'Automatic city scooter. Light, easy to handle, and well suited to coastal day trips.',
    descriptionVi:
      'Xe ga tự động trong phố. Nhẹ, dễ điều khiển và phù hợp cho các chuyến đi ven biển trong ngày.',
    order: 0,
  },
  {
    slug: 'honda-enduro-xr-150l',
    type: 'BIKE',
    brand: 'Honda',
    model: 'Enduro XR 150L',
    cc: 150,
    quantity: 2,
    priceUsdPerDay: 18,
    imageFile: 'Honda Enduro XR 150L.jpeg',
    descriptionEn:
      'Manual enduro motorcycle. Higher ground clearance and torque — built for mountain passes and rough roads.',
    descriptionVi:
      'Xe enduro số sàn. Khoảng sáng gầm cao và mô-men xoắn lớn — thiết kế cho đèo núi và đường gồ ghề.',
    order: 1,
  },
];

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'public', 'uploads');
const PUBLIC_URL_PREFIX = process.env.UPLOAD_PUBLIC_URL ?? '/uploads';

async function main() {
  const vehiclesDir = path.join(__dirname, '..', 'src', 'rentals');
  const targetDir = path.join(UPLOAD_DIR, 'vehicles');
  fs.mkdirSync(targetDir, {recursive: true});

  for (const v of vehicles) {
    const srcPath = path.join(vehiclesDir, v.imageFile);
    if (!fs.existsSync(srcPath)) {
      console.warn(`Skipping ${v.slug}: source image not found at ${srcPath}`);
      continue;
    }
    const ext = path.extname(v.imageFile);
    const targetName = `${v.slug}${ext}`;
    const targetPath = path.join(targetDir, targetName);
    fs.copyFileSync(srcPath, targetPath);
    const imageUrl = `${PUBLIC_URL_PREFIX}/vehicles/${targetName}`;

    await prisma.vehicle.upsert({
      where: {slug: v.slug},
      update: {
        type: v.type,
        brand: v.brand,
        model: v.model,
        cc: v.cc,
        quantity: v.quantity,
        priceUsdPerDay: v.priceUsdPerDay,
        imageUrl,
        description: {en: v.descriptionEn, vi: v.descriptionVi},
        order: v.order,
      },
      create: {
        slug: v.slug,
        type: v.type,
        brand: v.brand,
        model: v.model,
        cc: v.cc,
        quantity: v.quantity,
        priceUsdPerDay: v.priceUsdPerDay,
        imageUrl,
        description: {en: v.descriptionEn, vi: v.descriptionVi},
        status: 'PUBLISHED',
        order: v.order,
      },
    });
    console.log(`Seeded vehicle: ${v.slug} -> ${imageUrl}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
