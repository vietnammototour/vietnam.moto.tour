import { Header } from '../header/index';
import { Footer } from '../footer/index';

export function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
