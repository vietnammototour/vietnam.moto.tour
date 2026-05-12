import type * as VMT from '@/domain';
import {http} from '../http';

export const fetchTours = (filters: {archived?: boolean} = {}) => {
  const qs = new URLSearchParams();
  if (filters.archived !== undefined)
    qs.set('archived', String(filters.archived));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return http<VMT.Tour[]>(`/api/admin/tours${suffix}`);
};

export const fetchTour = (id: string) =>
  http<VMT.Tour>(`/api/admin/tours/${id}`);

export const createTour = (input: Record<string, unknown>) =>
  http<VMT.Tour>('/api/admin/tours', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateTour = (id: string, input: Record<string, unknown>) =>
  http<VMT.Tour>(`/api/admin/tours/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

export const deleteTour = (id: string, opts?: {hard?: boolean}) => {
  const suffix = opts?.hard ? '?hard=true' : '';
  return http<void>(`/api/admin/tours/${id}${suffix}`, {method: 'DELETE'});
};
