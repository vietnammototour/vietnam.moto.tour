import {render, type RenderOptions} from '@testing-library/react';
import type {ReactElement, ReactNode} from 'react';
import {ThemeProvider} from '@/components/theme-provider';

function AllProviders({children}: {children: ReactNode}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {wrapper: AllProviders, ...options});
}

export * from '@testing-library/react';
export {customRender as render};
