import type {ReactElement, ReactNode} from 'react';
import {
  render,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {retry: false, gcTime: 0, staleTime: 0},
      mutations: {retry: false},
    },
  });
}

type Options = Omit<RenderOptions, 'wrapper'> & {client?: QueryClient};

export function renderWithQuery(
  ui: ReactElement,
  options: Options = {},
): RenderResult & {client: QueryClient} {
  const client = options.client ?? makeTestQueryClient();
  function Wrapper({children}: {children: ReactNode}) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  const result = render(ui, {...options, wrapper: Wrapper});
  return {...result, client};
}
