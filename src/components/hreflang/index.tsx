import Head from "next/head";
import { useRouter } from "next/router";

const SITE_URL = "https://vietnammototour.com";

export const HrefLang = () => {
  const { asPath } = useRouter();
  const pathWithoutLocale = asPath;

  const viUrl = `${SITE_URL}${pathWithoutLocale}`;
  const enUrl = `${SITE_URL}/en${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;

  return (
    <Head>
      <link rel="alternate" hrefLang="vi" href={viUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={viUrl} />
    </Head>
  );
};
