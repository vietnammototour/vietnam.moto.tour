import {useEffect, useState} from 'react';
import type {AppProps} from 'next/app';
import {SessionProvider} from 'next-auth/react';
import {NextIntlClientProvider, type IntlError} from 'next-intl';
import {useRouter} from 'next/router';
import {DM_Sans} from 'next/font/google';
import localFont from 'next/font/local';
import {routes} from '@/routes';
import {ThemeProvider} from '@/components/ThemeProvider';
import {Layout} from '@/components/Layout';
import {AdminLayout} from '@/components/Admin/AdminLayout';
import {QueryClientProvider, HydrationBoundary} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {getQueryClient} from '@/lib/queryClient';
import '@fortawesome/fontawesome-free/css/all.min.css';
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
  const queryClient = getQueryClient();
  const router = useRouter();
  const isAdmin = routes.isAdmin(router.pathname);
  const locale = router.locale ?? 'vi';
  const messages = pageProps.messages ?? {};
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setRouteLoading(true);
    const handleDone = () => setRouteLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleDone);
    router.events.on('routeChangeError', handleDone);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleDone);
      router.events.off('routeChangeError', handleDone);
    };
  }, [router]);

  function handleIntlError(error: IntlError) {
    if (error.code === 'MISSING_MESSAGE') return;
    console.error(error);
  }

  const content = (
    <div className={`${dmSans.variable} ${outBrave.variable} font-sans`}>
      {routeLoading && !isAdmin && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[9999] overflow-hidden bg-primary/20">
          <div className="h-full bg-primary animate-progress-bar" />
        </div>
      )}
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
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={pageProps.dehydratedState}>
        <SessionProvider session={session}>
          <ThemeProvider>
            <NextIntlClientProvider
              locale={locale}
              messages={messages}
              timeZone="Asia/Ho_Chi_Minh"
              onError={handleIntlError}
            >
              {content}
            </NextIntlClientProvider>
          </ThemeProvider>
        </SessionProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
