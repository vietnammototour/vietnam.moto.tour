import type {AppProps} from 'next/app';
import {NextIntlClientProvider} from 'next-intl';
import {useRouter} from 'next/router';
import {DM_Sans} from 'next/font/google';
import localFont from 'next/font/local';
import {ThemeProvider} from '@/components/theme-provider';
import {Layout} from '../components/layout/index';
import '@/styles/globals.css';
import viMessages from '@/messages/vi.json';
import enMessages from '@/messages/en.json';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700'],
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

const allMessages: Record<string, typeof viMessages> = {
  vi: viMessages,
  en: enMessages,
};

export default function App({Component, pageProps}: AppProps) {
  const router = useRouter();
  const locale = router.locale ?? 'vi';
  const messages = pageProps.messages ?? allMessages[locale];

  return (
    <ThemeProvider>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="Asia/Ho_Chi_Minh"
      >
        <div className={`${dmSans.variable} ${outBrave.variable} font-sans`}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </div>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
