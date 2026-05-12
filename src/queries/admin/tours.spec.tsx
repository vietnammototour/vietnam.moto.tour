import {act, waitFor, renderHook} from '@testing-library/react';
import type {ReactNode} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import * as fetchers from '@/queries/fetchers/admin/tours';
import {
  useTours,
  useTour,
  useCreateTour,
  useUpdateTour,
  useToggleTourStatus,
  useDeleteTourHard,
} from './tours';
import {tourKeys} from './tours.keys';

jest.mock('@/queries/fetchers/admin/tours');

function makeWrapper(client: QueryClient) {
  return function Wrapper({children}: {children: ReactNode}) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {retry: false, gcTime: Infinity, staleTime: 0},
      mutations: {retry: false},
    },
  });
}

const mockedFetchers = fetchers as jest.Mocked<typeof fetchers>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useTours', () => {
  it('calls fetchTours with filters', async () => {
    mockedFetchers.fetchTours.mockResolvedValue([{id: 't1'} as never]);
    const client = makeClient();
    const {result} = renderHook(() => useTours({archived: false}), {
      wrapper: makeWrapper(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedFetchers.fetchTours).toHaveBeenCalledWith({archived: false});
    expect(result.current.data).toEqual([{id: 't1'}]);
  });
});

describe('useTour', () => {
  it('does not fetch when id is undefined', () => {
    mockedFetchers.fetchTour.mockResolvedValue({id: 't1'} as never);
    const client = makeClient();
    renderHook(() => useTour(undefined), {wrapper: makeWrapper(client)});
    expect(mockedFetchers.fetchTour).not.toHaveBeenCalled();
  });

  it('fetches when id is given', async () => {
    mockedFetchers.fetchTour.mockResolvedValue({id: 't1'} as never);
    const client = makeClient();
    const {result} = renderHook(() => useTour('t1'), {
      wrapper: makeWrapper(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedFetchers.fetchTour).toHaveBeenCalledWith('t1');
  });
});

describe('useCreateTour', () => {
  it('invalidates all tour queries on success', async () => {
    mockedFetchers.createTour.mockResolvedValue({id: 'new'} as never);
    const client = makeClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const {result} = renderHook(() => useCreateTour(), {
      wrapper: makeWrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync({title: 'X'} as never);
    });
    expect(invalidate).toHaveBeenCalledWith({queryKey: tourKeys.all});
  });
});

describe('useUpdateTour', () => {
  it('invalidates detail and lists on success', async () => {
    mockedFetchers.updateTour.mockResolvedValue({id: 't1'} as never);
    const client = makeClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const {result} = renderHook(() => useUpdateTour(), {
      wrapper: makeWrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync({id: 't1', input: {title: 'Y'}});
    });
    expect(invalidate).toHaveBeenCalledWith({queryKey: tourKeys.detail('t1')});
    expect(invalidate).toHaveBeenCalledWith({queryKey: tourKeys.lists()});
  });
});

describe('useToggleTourStatus', () => {
  it('optimistically updates cached list, then settles', async () => {
    const client = makeClient();
    client.setQueryData(tourKeys.list({archived: false}), [
      {id: 't1', status: 'DRAFT'},
      {id: 't2', status: 'DRAFT'},
    ] as never);
    mockedFetchers.updateTour.mockResolvedValue({
      id: 't1',
      status: 'PUBLISHED',
    } as never);
    const {result} = renderHook(() => useToggleTourStatus(), {
      wrapper: makeWrapper(client),
    });
    await act(async () => {
      const promise = result.current.mutateAsync({
        id: 't1',
        status: 'PUBLISHED',
      });
      // mid-flight cache should already reflect the new status
      const optimistic = client.getQueryData<
        Array<{id: string; status: string}>
      >(tourKeys.list({archived: false}));
      expect(optimistic?.find((t) => t.id === 't1')?.status).toBe('PUBLISHED');
      await promise;
    });
    expect(mockedFetchers.updateTour).toHaveBeenCalledWith('t1', {
      status: 'PUBLISHED',
    });
  });

  it('rolls back cached list when mutation throws', async () => {
    const client = makeClient();
    const initial = [
      {id: 't1', status: 'DRAFT'},
      {id: 't2', status: 'DRAFT'},
    ];
    client.setQueryData(tourKeys.list({archived: false}), initial as never);
    mockedFetchers.updateTour.mockRejectedValue(new Error('boom'));
    const {result} = renderHook(() => useToggleTourStatus(), {
      wrapper: makeWrapper(client),
    });
    await act(async () => {
      await result.current
        .mutateAsync({id: 't1', status: 'PUBLISHED'})
        .catch(() => undefined);
    });
    const restored = client.getQueryData(tourKeys.list({archived: false}));
    expect(restored).toEqual(initial);
  });
});

describe('useDeleteTourHard', () => {
  it('invalidates all tour queries on success', async () => {
    mockedFetchers.deleteTour.mockResolvedValue(undefined);
    const client = makeClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const {result} = renderHook(() => useDeleteTourHard(), {
      wrapper: makeWrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync({id: 't1'});
    });
    expect(mockedFetchers.deleteTour).toHaveBeenCalledWith('t1', {hard: true});
    expect(invalidate).toHaveBeenCalledWith({queryKey: tourKeys.all});
  });
});
