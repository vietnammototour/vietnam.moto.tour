import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import type * as VMT from '@/domain';
import * as f from '@/queries/fetchers/admin/tours';
import {tourKeys} from './tours.keys';

export const useTours = (filters: {archived?: boolean} = {}) =>
  useQuery({
    queryKey: tourKeys.list(filters),
    queryFn: () => f.fetchTours(filters),
  });

export const useTour = (id: string | undefined) =>
  useQuery({
    queryKey: tourKeys.detail(id ?? '__never__'),
    queryFn: () => f.fetchTour(id as string),
    enabled: !!id,
  });

export const useCreateTour = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => f.createTour(input),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: tourKeys.all});
    },
  });
};

export const useUpdateTour = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: Record<string, unknown>}) =>
      f.updateTour(id, input),
    onSuccess: (_data, {id}) => {
      qc.invalidateQueries({queryKey: tourKeys.detail(id)});
      qc.invalidateQueries({queryKey: tourKeys.lists()});
    },
  });
};

type ToggleVars = {id: string; status: VMT.TourStatus};
type ToggleCtx = {
  snapshots: Array<[readonly unknown[], unknown]>;
};

export const useToggleTourStatus = () => {
  const qc = useQueryClient();
  return useMutation<VMT.Tour, Error, ToggleVars, ToggleCtx>({
    mutationFn: ({id, status}) => f.updateTour(id, {status}),
    onMutate: ({id, status}) => {
      void qc.cancelQueries({queryKey: tourKeys.lists()});
      const snapshots = qc.getQueriesData({queryKey: tourKeys.lists()});
      snapshots.forEach(([key, data]) => {
        if (!Array.isArray(data)) return;
        qc.setQueryData(
          key,
          data.map((t: {id: string}) => (t.id === id ? {...t, status} : t)),
        );
      });
      return {snapshots};
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({queryKey: tourKeys.lists()});
    },
  });
};

type DeleteVars = {id: string};
type DeleteCtx = {
  snapshots: Array<[readonly unknown[], unknown]>;
};

export const useDeleteTourHard = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, DeleteVars, DeleteCtx>({
    mutationFn: ({id}) => f.deleteTour(id, {hard: true}),
    onMutate: ({id}) => {
      void qc.cancelQueries({queryKey: tourKeys.lists()});
      const snapshots = qc.getQueriesData({queryKey: tourKeys.lists()});
      snapshots.forEach(([key, data]) => {
        if (!Array.isArray(data)) return;
        qc.setQueryData(
          key,
          data.filter((t: {id: string}) => t.id !== id),
        );
      });
      return {snapshots};
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({queryKey: tourKeys.all});
    },
  });
};
