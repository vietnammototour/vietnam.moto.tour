import type * as VMT from '@/domain';
import {http} from '../http';

export const fetchVehicles = (filters: {archived?: boolean} = {}) => {
  const qs = new URLSearchParams();
  if (filters.archived !== undefined)
    qs.set('archived', String(filters.archived));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return http<VMT.Vehicle[]>(`/api/admin/vehicles${suffix}`);
};

export const fetchVehicle = (id: string) =>
  http<VMT.Vehicle>(`/api/admin/vehicles/${id}`);

export const createVehicle = (input: Record<string, unknown>) =>
  http<VMT.Vehicle>('/api/admin/vehicles', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateVehicle = (id: string, input: Record<string, unknown>) =>
  http<VMT.Vehicle>(`/api/admin/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

export const deleteVehicle = (id: string) =>
  http<void>(`/api/admin/vehicles/${id}`, {method: 'DELETE'});

export const restoreVehicle = (id: string) =>
  http<VMT.Vehicle>(`/api/admin/vehicles/${id}/restore`, {method: 'POST'});
