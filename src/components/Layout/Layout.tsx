import type {LayoutProps} from '@/types';
import {Header} from './components/Header';
import {Footer} from './components/Footer';
import {ScrollToTop} from './components/ScrollToTop';
import {HrefLang} from './components/HrefLang';

export function Layout({children}: LayoutProps) {
  return (
    <>
      <HrefLang />
      <Header />
      <main>{children}</main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
