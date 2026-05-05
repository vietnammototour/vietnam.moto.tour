import type {AppProps} from 'next/app';
import {SessionProvider} from 'next-auth/react';
import {NextIntlClientProvider} from 'next-intl';
import {useRouter} from 'next/router';
import {DM_Sans} from 'next/font/google';
import localFont from 'next/font/local';
import {ThemeProvider} from '@/components/theme-provider';
import {Layout} from '../components/layout/index';
import {AdminLayout} from '@/components/admin/AdminLayout';
import '@/styles/globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '600', '700'],
  display: 'swap',
});

const outBrave = localFont({
  src: [
    {
      path: '../../public/assets/fonts/outbrave.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/assets/fonts/outbrave.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-outbrave',
  display: 'swap',
});

export default function App({
  Component,
  pageProps: {session, ...pageProps},
}: AppProps) {
  const router = useRouter();
  const isAdmin = router.pathname.startsWith('/admin');
  const locale = router.locale ?? 'vi';
  const messages = pageProps.messages ?? {};

  const content = (
    <div className={`${dmSans.variable} ${outBrave.variable} font-sans`}>
      {isAdmin ? (
        <AdminLayout>
          <Component {...pageProps} />
        </AdminLayout>
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </div>
  );

  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="Asia/Ho_Chi_Minh"
        >
          {content}
        </NextIntlClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
