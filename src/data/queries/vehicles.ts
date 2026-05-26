import {prisma} from '@/lib/prisma';
import {toVehicle} from '@/domain/vehicle/mapper';
import type {Vehicle} from '@/domain/vehicle';

export async function getPublishedVehicles(): Promise<Vehicle[]> {
  try {
    const rows = await prisma.vehicle.findMany({
      where: {status: 'PUBLISHED'},
      orderBy: [{order: 'asc'}, {createdAt: 'desc'}],
    });
    return rows.map(toVehicle);
  } catch (error) {
    console.error('getPublishedVehicles: DB query failed', error);
    return [];
  }
}

export async function getVehiclesForAdmin(
  filters: {archived?: boolean} = {},
): Promise<Vehicle[]> {
  const where = (() => {
    if (filters.archived === true) return {status: 'ARCHIVED' as const};
    if (filters.archived === false) return {status: {not: 'ARCHIVED' as const}};
    return {};
  })();
  const rows = await prisma.vehicle.findMany({
    where,
    orderBy: [{order: 'asc'}, {createdAt: 'desc'}],
  });
  return rows.map(toVehicle);
}

export async function getVehicleByIdForAdmin(
  id: string,
): Promise<Vehicle | null> {
  const row = await prisma.vehicle.findUnique({where: {id}});
  return row ? toVehicle(row) : null;
}
