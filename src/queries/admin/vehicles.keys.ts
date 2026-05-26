export const vehicleKeys = {
  all: ['admin', 'vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (filters: {archived?: boolean}) =>
    [...vehicleKeys.lists(), filters] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
};
