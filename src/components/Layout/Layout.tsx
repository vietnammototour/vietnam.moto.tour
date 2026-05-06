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
    <>
      <HrefLang />
      <Header />
      <main>{children}</main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
