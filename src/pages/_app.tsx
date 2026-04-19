import type { AppProps } from 'next/app';
import { NextIntlClientProvider } from 'next-intl';
import { useRouter } from 'next/router';
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
  const router = useRouter();

  return (
    <NextIntlClientProvider
      locale={router.locale}
      messages={pageProps.messages}
      timeZone="Asia/Ho_Chi_Minh"
    >
      <div className={`${dmSans.variable} ${outBrave.variable} font-sans`}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </div>
    </NextIntlClientProvider>
  );
}
