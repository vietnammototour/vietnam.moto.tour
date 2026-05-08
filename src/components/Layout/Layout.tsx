import type {ReactNode} from 'react';
import {Header} from './components/Header';
import {Footer} from './components/Footer';
import {ScrollToTop} from './components/ScrollToTop';
import {HrefLang} from './components/HrefLang';

type Props = {
  children: ReactNode;
};

export function Layout({children}: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <HrefLang />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
