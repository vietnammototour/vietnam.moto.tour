import {render, type RenderOptions} from '@testing-library/react';
import type {ReactElement, ReactNode} from 'react';
import {SessionProvider} from 'next-auth/react';
import {ThemeProvider} from '@/components/theme-provider';

function AllProviders({children}: {children: ReactNode}) {
  return (
    <SessionProvider session={null}>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {wrapper: AllProviders, ...options});
}

export * from '@testing-library/react';
export {customRender as render};
