import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";
import { getUrl } from "@/utils";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Vietnam Motorcycle Tour </title>
        <link rel="apple-touch-icon" sizes="180x180" href={getUrl("assets/images/favicons/apple-touch-icon.png")}/>
        <link rel="icon" type="image/png" sizes="32x32" href={getUrl("assets/images/favicons/favicon-32x32.png")}/>
        <link rel="icon" type="image/png" sizes="16x16" href={getUrl("assets/images/favicons/favicon-16x16.png")}/>
        <link rel="manifest" href={getUrl("assets/images/favicons/site.webmanifest")}/>
        <meta name="description" content="Tevily HTML Template For Tour"/>

        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin/>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap"
          rel="stylesheet"/>

        <link rel="stylesheet" href={getUrl("assets/vendors/bootstrap/css/bootstrap.min.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/animate/animate.min.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/animate/custom-animate.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/fontawesome/css/all.min.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/jarallax/jarallax.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/jquery-magnific-popup/jquery.magnific-popup.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/nouislider/nouislider.min.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/nouislider/nouislider.pips.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/odometer/odometer.min.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/swiper/swiper.min.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/tevily-icons/style.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/tiny-slider/tiny-slider.min.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/reey-font/stylesheet.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/owl-carousel/owl.carousel.min.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/owl-carousel/owl.theme.default.min.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/twentytwenty/twentytwenty.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/bxslider/jquery.bxslider.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/bootstrap-select/css/bootstrap-select.min.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/vegas/vegas.min.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/jquery-ui/jquery-ui.css")}/>
        <link rel="stylesheet" href={getUrl("assets/vendors/timepicker/timePicker.css")}/>

        <link rel="stylesheet" href={getUrl("assets/css/tevily.css")} />
        <link rel="stylesheet" href={getUrl("assets/css/tevily-responsive.css")} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
