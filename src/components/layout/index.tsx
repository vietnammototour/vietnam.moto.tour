import type { LayoutProps } from '@/types';
import { Header } from '../header/index';
import { Footer } from '../footer/index';
import { ScrollToTop } from '../scroll-to-top/index';

export function Layout({ children }: LayoutProps) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
