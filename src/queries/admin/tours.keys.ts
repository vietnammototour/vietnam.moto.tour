export const tourKeys = {
  all: ['admin', 'tours'] as const,
  lists: () => [...tourKeys.all, 'list'] as const,
  list: (filters: {archived?: boolean}) =>
    [...tourKeys.lists(), filters] as const,
  details: () => [...tourKeys.all, 'detail'] as const,
  detail: (id: string) => [...tourKeys.details(), id] as const,
};
