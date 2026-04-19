import type { AppProps } from 'next/app';
import { DM_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import { Layout } from '../components/layout/index';
import "@/styles/globals.css";

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const outBrave = localFont({
  src: [
    { path: '../../public/assets/fonts/outbrave.ttf', weight: '400', style: 'normal' },
    { path: '../../public/assets/fonts/outbrave.otf', weight: '400', style: 'normal' },
  ],
  variable: '--font-outbrave',
  display: 'swap',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${dmSans.variable} ${outBrave.variable} font-sans`}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </div>
  );
}
