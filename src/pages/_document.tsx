import { Html, Head, Main, NextScript } from "next/document";
import { getUrl } from "@/utils";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <link rel="apple-touch-icon" sizes="180x180" href={getUrl("assets/images/favicons/apple-touch-icon.png")} />
        <link rel="icon" type="image/png" sizes="32x32" href={getUrl("assets/images/favicons/favicon-32x32.png")} />
        <link rel="icon" type="image/png" sizes="16x16" href={getUrl("assets/images/favicons/favicon-16x16.png")} />
        <link rel="manifest" href={getUrl("assets/images/favicons/site.webmanifest")} />
        <meta name="description" content="Vietnam Motorcycle Tour — Adventure tours in Nha Trang and beyond" />

        <link rel="stylesheet" href={getUrl("assets/vendors/fontawesome/css/all.min.css")} />
        <link rel="stylesheet" href={getUrl("assets/vendors/tevily-icons/style.css")} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
