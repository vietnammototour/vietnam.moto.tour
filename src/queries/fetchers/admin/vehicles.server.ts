import {getVehiclesForAdmin, getVehicleByIdForAdmin} from '@/data/queries';

const serialize = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const fetchVehiclesServer = async (filters: {archived?: boolean} = {}) =>
  serialize(await getVehiclesForAdmin(filters));

export const fetchVehicleServer = async (id: string) =>
  serialize(await getVehicleByIdForAdmin(id));
