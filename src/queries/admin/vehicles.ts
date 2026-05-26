import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import type * as VMT from '@/domain';
import * as f from '@/queries/fetchers/admin/vehicles';
import {vehicleKeys} from './vehicles.keys';

export const useVehicles = (filters: {archived?: boolean} = {}) =>
  useQuery({
    queryKey: vehicleKeys.list(filters),
    queryFn: () => f.fetchVehicles(filters),
  });

export const useVehicle = (id: string | undefined) =>
  useQuery({
    queryKey: vehicleKeys.detail(id ?? '__never__'),
    queryFn: () => f.fetchVehicle(id as string),
    enabled: !!id,
  });

export const useCreateVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => f.createVehicle(input),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: vehicleKeys.all});
    },
  });
};

export const useUpdateVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: Record<string, unknown>}) =>
      f.updateVehicle(id, input),
    onSuccess: (_d, {id}) => {
      qc.invalidateQueries({queryKey: vehicleKeys.detail(id)});
      qc.invalidateQueries({queryKey: vehicleKeys.lists()});
    },
  });
};

export const useDeleteVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => f.deleteVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: vehicleKeys.all});
    },
  });
};

export const useRestoreVehicle = () => {
  const qc = useQueryClient();
  return useMutation<VMT.Vehicle, Error, string>({
    mutationFn: (id) => f.restoreVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: vehicleKeys.all});
    },
  });
};

export const useToggleVehicleStatus = () => {
  const qc = useQueryClient();
  return useMutation<
    VMT.Vehicle,
    Error,
    {id: string; status: VMT.VehicleStatus}
  >({
    mutationFn: ({id, status}) => f.updateVehicle(id, {status}),
    onSuccess: (_d, {id}) => {
      qc.invalidateQueries({queryKey: vehicleKeys.detail(id)});
      qc.invalidateQueries({queryKey: vehicleKeys.lists()});
    },
  });
};
