import Script from 'next/script';
import { getUrl } from "@/utils";
import { HeaderMobile } from "@/components/header-mobile";
import {toursData} from "@/data";
import {TourCard} from "@/components/tour-card";
import React from "react";

export default function Tours() {
  return (
    <div>
      <div className="page-wrapper">
        <div className="stricky-header stricked-menu main-menu">
          <div className="sticky-header__content"></div>
        </div>


        <section className="page-header">
          <div className="page-header__top">
            <div className="page-header-bg" style={{ backgroundImage: 'url(https://data.agatetravel.com/images/photogallery/2025/halong-bay-hanoi-vietnam.jpg)' }}>
            </div>
            <div className="page-header-bg-overly"></div>
            <div className="container">
              <div className="page-header__top-inner">
                <h2>Popular Tours</h2>
              </div>
            </div>
          </div>
          <div className="page-header__bottom">
            <div className="container">
              <div className="page-header__bottom-inner">
                <ul className="thm-breadcrumb list-unstyled">
                  <li><a href="index.html">Home</a></li>
                  <li><span>.</span></li>
                  <li className="active">Tours</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="popular-tours-two">
          <div className="container">
            <div className="row">
              {toursData.map((tour) => (
                <div
                  key={tour.id}
                  className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp"
                  data-wow-delay={`${tour.id}00ms`}
                >
                  <TourCard tour={tour} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <HeaderMobile />

      <Script src={getUrl("assets/vendors/jquery/jquery-3.6.0.min.js")} strategy="beforeInteractive" defer></Script>
      <Script src={getUrl("assets/vendors/bootstrap/js/bootstrap.bundle.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/jarallax/jarallax.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/jquery-ajaxchimp/jquery.ajaxchimp.min.js")} strategy="beforeInteractive"></Script>
      <Script src={getUrl("assets/vendors/jquery-appear/jquery.appear.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/jquery-circle-progress/jquery.circle-progress.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/jquery-magnific-popup/jquery.magnific-popup.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/jquery-validate/jquery.validate.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/nouislider/nouislider.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/odometer/odometer.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/swiper/swiper.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/tiny-slider/tiny-slider.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/wnumb/wNumb.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/wow/wow.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/isotope/isotope.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/countdown/countdown.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/owl-carousel/owl.carousel.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/twentytwenty/twentytwenty.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/twentytwenty/jquery.event.move.js")} strategy="beforeInteractive"></Script>
      <Script src={getUrl("assets/vendors/bxslider/jquery.bxslider.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/bootstrap-select/js/bootstrap-select.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/vegas/vegas.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/jquery-ui/jquery-ui.js")} strategy="beforeInteractive"></Script>
      <Script src={getUrl("assets/vendors/timepicker/timePicker.js")} strategy="beforeInteractive"></Script>
      <Script src={getUrl("assets/js/tevily.js")} strategy="afterInteractive"></Script>
    </div>
  );
}
