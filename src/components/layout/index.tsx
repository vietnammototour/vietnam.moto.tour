import type { LayoutProps } from "@/types";
import { Header } from "../header/index";
import { Footer } from "../footer/index";
import { ScrollToTop } from "../scroll-to-top/index";
import { HrefLang } from "@/components/hreflang";

export function Layout({ children }: LayoutProps) {
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
