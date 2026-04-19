import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

import { HeaderMobile } from '../components/header-mobile/index';
import { DestinationCard } from '../components/destination-card/index';
import { TourCarousel } from '../components/tour-carousel/index';
import { GalleryItem } from '../components/gallery-item/index';

import { destinationsData, toursData } from '../data/index';
import { getUrl } from "../utils/index";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outBrave = localFont({
  src: [
    {
      path: "../../public/assets/fonts/outbrave.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/assets/fonts/outbrave.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-outbrave",
  display: "swap",
});

export default function Home() {
  const bannerVideoRef = useRef<HTMLVideoElement>(null);

  // Gallery images data
  const galleryImages = [
    getUrl('assets/images/gallery/gallery-one-img-1.jpeg'),
    getUrl('assets/images/gallery/gallery-one-img-2.jpeg'),
    getUrl('assets/images/gallery/gallery-one-img-3.jpeg'),
    getUrl('assets/images/gallery/gallery-one-img-4.jpeg'),
    getUrl('assets/images/gallery/gallery-one-img-5.jpeg'),
  ];

  useEffect(() => {
    if (bannerVideoRef.current) {
      bannerVideoRef.current.playbackRate = 0.8;
    }
  }, []);

  return (
    <>
      <div
        className={`${geistSans.variable} ${geistMono.variable} ${outBrave.variable}`}
      >
      <div className="page-wrapper">

        <div className="stricky-header stricked-menu main-menu">
          <div className="sticky-header__content" />
        </div>

        <section className="main-slider">
          <div className="swiper-container thm-swiper__slider" data-swiper-options='{"slidesPerView": 1, "loop": true,
        "effect": "fade",
        "pagination": {
            "el": "#main-slider-pagination",
            "type": "bullets",
            "clickable": true
          },
        "navigation": {
            "nextEl": ".main-slider-button-next",
            "prevEl": ".main-slider-button-prev",
            "clickable": true
        },
        "autoplay": {
            "delay": 5000
        }}'>

            <div className="swiper-wrapper">
              <div className="swiper-slide">
                <div className="video-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: '1', overflow: 'hidden' }}>
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    ref={bannerVideoRef}
                  >
                    <source src={getUrl('assets/videos/banner-0.MOV')} type="video/mp4" />
                  </video>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1 }}></div>
                </div>
                <div className="image-layer-overlay"></div>
                <div className="container">
                  <div className="swiper-slide-inner">
                    <div className="row">
                      <div className="col-xl-12">
                        <h2>Travel & Adventures</h2>
                        <p>Your Next Adventure Starts Here</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/*<div className="swiper-slide">*/}
              {/*  <div className="image-layer"*/}
              {/*       style={{ backgroundImage: `url('${getUrl('assets/images/banner/banner.jpg')}');`, zIndex: '1' }}></div>*/}
              {/*  <div className="image-layer-overlay"></div>*/}
              {/*  <div className="container">*/}
              {/*    <div className="swiper-slide-inner">*/}
              {/*      <div className="row">*/}
              {/*        <div className="col-xl-12">*/}
              {/*          <h2> Travel & Adventures</h2>*/}
              {/*          <p>Where Would You Like To Go?</p>*/}
              {/*        </div>*/}
              {/*      </div>*/}
              {/*    </div>*/}
              {/*  </div>*/}
              {/*</div>*/}
            </div>

            {/*<div className="main-slider-nav">*/}
            {/*  <div className="main-slider-button-prev"><span className="icon-right-arrow"></span></div>*/}
            {/*  <div className="main-slider-button-next"><span className="icon-right-arrow"></span></div>*/}
            {/*</div>*/}
          </div>
        </section>

        <section className="destinations-one">
          <div className="container">
            <div className="section-title text-center">
              <span className="section-title__tagline">Destination lists</span>
              <h2 className="section-title__title">Go Exotic Places</h2>
            </div>
            <div className="row masonary-layout">
              {destinationsData.map((destination) => (
                <DestinationCard key={destination.id} destination={destination} />
              ))}
            </div>
          </div>
        </section>

        <section className="about-one">
          <div className="about-one-shape-1 wow slideInLeft" data-wow-delay="100ms" data-wow-duration="2500ms">
            <img src={getUrl("assets/images/shapes/about-one-shape-1.png")} alt=""/>
          </div>
          <div className="about-one-shape-2 float-bob-y"><img src={getUrl("assets/images/shapes/about-one-shape-2.png")} alt=""/>
          </div>
          <div className="container">
            <div className="row">
              <div className="col-xl-6 wow fadeInLeft" data-wow-duration="1500ms">
                <div className="about-one__left">
                  <div className="about-one__img-box">
                    <div className="about-one__img destinations-one__img">
                      <picture style={{ display: 'block', width: '624px', height: '579px', overflow: 'hidden' }}>
                        <source srcSet="https://i0.wp.com/jolandblog.com/wp-content/uploads/2015/11/ninh-binh-vietname.jpg?fit=1000%2C667&ssl=1" type="image/webp" />
                        <img
                          src="https://i0.wp.com/jolandblog.com/wp-content/uploads/2015/11/ninh-binh-vietname.jpg?fit=1000%2C667&ssl=1"
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute' }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.2)' }} />
                      </picture>
                    </div>
                    <div className="about-one__call">
                      <div className="about-one__call-icon">
                        <span className="icon-phone-call"></span>
                      </div>
                      <div className="about-one__call-number">
                        <p>Book Tour Now</p>
                        <h4><a href="tel:+84-935-797-550">+84 935 797 550</a></h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-6">
                <div className="about-one__right">
                  <div className="section-title text-left">
                    <span className="section-title__tagline">Get to know us</span>
                    <h2 className="section-title__title">Plan Your Trip with Us</h2>
                  </div>
                  <p className="about-one__right-text">We are leading day tour and multi-day tour on organizer in Nha Trang, Vietnam</p>
                  <ul className="list-unstyled about-one__points">
                    <li>
                      <div className="icon">
                        <i className="fa fa-check"></i>
                      </div>
                      <div className="text">
                        <p>Motorbike and car tour</p>
                      </div>
                    </li>
                    <li>
                      <div className="icon">
                        <i className="fa fa-check"></i>
                      </div>
                      <div className="text">
                        <p>Friendly team and expert local guide</p>
                      </div>
                    </li>
                    <li>
                      <div className="icon">
                        <i className="fa fa-check"></i>
                      </div>
                      <div className="text">
                        <p>Experience in truly remarkable land</p>
                      </div>
                    </li>
                  </ul>
                  <a href="#" className="about-one__btn thm-btn">Book with us now</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="popular-tours">
          <div className="popular-tours__container">
            <div className="section-title text-center">
              <span className="section-title__tagline">Featured tours</span>
              <h2 className="section-title__title">Most Popular Tours</h2>
            </div>
            <div className="row">
              <div className="col-xl-12">
                <TourCarousel tours={toursData} />
              </div>
            </div>
          </div>
        </section>

        <section className="video-one">
          <div className="video-one-bg jarallax" data-jarallax data-speed="0.2" data-imgposition="50% 0%"
               style={{ backgroundImage: `url(${getUrl('assets/images/backgrounds/video-one-bg-0.jpeg')})` }}></div>
          <div className="container">
            <div className="row">
              <div className="col-xl-6 col-lg-6">
                <div className="video-one__left">
                  <div className="video-one__video-link">
                    <a href="https://www.youtube.com/watch?v=fXvp76BQ2Fk" target="_blank" className="video-popup">
                      <div className="video-one__video-icon">
                        <span className="icon-play-button"></span>
                        <i className="ripple"></i>
                      </div>
                    </a>
                  </div>
                  <p className="video-one__tagline">Are you ready to travel?</p>
                  <h2 className="video-one__title">
                    We are leading day tour and multi-day tour on organizer in Nha Trang
                  </h2>
                </div>
              </div>
              <div className="col-xl-6 col-lg-6">
                <div className="video-one__right">
                  <ul className="list-unstyled video-one__four-icon-boxes">
                    <li>
                      <div className="video-one__icon-box">
                        <span className="icon-travel-map"></span>
                      </div>
                      <h4 className="video-one__icon-box-title"><a href="#">Wildlife <br/> Tours</a></h4>
                    </li>
                    <li>
                      <div className="video-one__icon-box">
                        <span className="icon-place"></span>
                      </div>
                      <h4 className="video-one__icon-box-title"><a href="#">Bike <br/> Tours</a></h4>
                    </li>
                    <li>
                      <div className="video-one__icon-box">
                        <span className="icon-flag"></span>
                      </div>
                      <h4 className="video-one__icon-box-title"><a href="#">Adventure <br/> Tours</a></h4>
                    </li>
                    <li>
                      <div className="video-one__icon-box">
                        <span className="icon-clock"></span>
                      </div>
                      <h4 className="video-one__icon-box-title"><a href="#">Full day <br/> Tours</a></h4>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*<section className="brand-one">*/}
        {/*  <div className="brand-one-shape"*/}
        {/*       style={{ backgroundImage: "url(assets/images/shapes/brand-one-shape.png)" }}></div>*/}
        {/*  <div className="container">*/}
        {/*    <div className="row">*/}
        {/*      <div className="col-xl-3">*/}
        {/*        <div className="brand-one__title">*/}
        {/*          <h2>Our partners</h2>*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*      <div className="col-xl-9">*/}
        {/*        <div className="brand-one__main-content">*/}
        {/*          <div className="thm-swiper__slider swiper-container" data-swiper-options='{"spaceBetween": 100, "slidesPerView": 5, "autoplay": { "delay": 5000 }, "breakpoints": {*/}
        {/*                    "0": {*/}
        {/*                        "spaceBetween": 30,*/}
        {/*                        "slidesPerView": 2*/}
        {/*                    },*/}
        {/*                    "375": {*/}
        {/*                        "spaceBetween": 30,*/}
        {/*                        "slidesPerView": 2*/}
        {/*                    },*/}
        {/*                    "575": {*/}
        {/*                        "spaceBetween": 30,*/}
        {/*                        "slidesPerView": 3*/}
        {/*                    },*/}
        {/*                    "767": {*/}
        {/*                        "spaceBetween": 50,*/}
        {/*                        "slidesPerView": 4*/}
        {/*                    },*/}
        {/*                    "991": {*/}
        {/*                        "spaceBetween": 50,*/}
        {/*                        "slidesPerView": 5*/}
        {/*                    },*/}
        {/*                    "1199": {*/}
        {/*                        "spaceBetween": 50,*/}
        {/*                        "slidesPerView": 5*/}
        {/*                    }*/}
        {/*                }}'>*/}
        {/*            <div className="swiper-wrapper">*/}
        {/*              <div className="swiper-slide">*/}
        {/*                <img src={getUrl("assets/images/brand/brand-one-1.png")} alt=""/>*/}
        {/*              </div>*/}
        {/*              <div className="swiper-slide">*/}
        {/*                <img src={getUrl("assets/images/brand/brand-one-2.png")} alt=""/>*/}
        {/*              </div>*/}
        {/*              <div className="swiper-slide">*/}
        {/*                <img src={getUrl("assets/images/brand/brand-one-3.png")} alt=""/>*/}
        {/*              </div>*/}
        {/*              <div className="swiper-slide">*/}
        {/*                <img src={getUrl("assets/images/brand/brand-one-4.png")} alt=""/>*/}
        {/*              </div>*/}
        {/*              <div className="swiper-slide">*/}
        {/*                <img src={getUrl("assets/images/brand/brand-one-5.png")} alt=""/>*/}
        {/*              </div>*/}
        {/*              <div className="swiper-slide">*/}
        {/*                <img src={getUrl("assets/images/brand/brand-one-1.png")} alt=""/>*/}
        {/*              </div>*/}
        {/*              <div className="swiper-slide">*/}
        {/*                <img src={getUrl("assets/images/brand/brand-one-2.png")} alt=""/>*/}
        {/*              </div>*/}
        {/*              <div className="swiper-slide">*/}
        {/*                <img src={getUrl("assets/images/brand/brand-one-3.png")} alt=""/>*/}
        {/*              </div>*/}
        {/*              <div className="swiper-slide">*/}
        {/*                <img src={getUrl("assets/images/brand/brand-one-4.png")} alt=""/>*/}
        {/*              </div>*/}
        {/*              <div className="swiper-slide">*/}
        {/*                <img src={getUrl("assets/images/brand/brand-one-5.png")} alt=""/>*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</section>*/}

        {/*<section className="testimonial-one">*/}
        {/*  <div className="testimonial-one-shape-2 float-bob-y">*/}
        {/*    <img src={getUrl("assets/images/shapes/testimonial-one-shape-2.png")} alt=""/>*/}
        {/*  </div>*/}
        {/*  <div className="testimonial-one-shape-3 wow slideInRight" data-wow-delay="100ms" data-wow-duration="2500ms">*/}
        {/*    <img src={getUrl("assets/images/shapes/testimonial-one-shape-3.png")} alt=""/>*/}
        {/*  </div>*/}
        {/*  <div className="container">*/}
        {/*    <div className="section-title text-center">*/}
        {/*      <span className="section-title__tagline">Testimonials & reviews</span>*/}
        {/*      <h2 className="section-title__title">What They’re Saying</h2>*/}
        {/*    </div>*/}
        {/*    <div className="row">*/}
        {/*      <div className="col-xl-12">*/}
        {/*        <div className="testimonial-one__carousel owl-theme owl-carousel">*/}
        {/*          <div className="testimonial-one__single">*/}
        {/*            <div className="testimonial-one__img">*/}
        {/*              <img src={getUrl("assets/images/testimonial/testimonial-one-img-1.png")} alt=""/>*/}
        {/*            </div>*/}
        {/*            <div className="testimonail-one__content">*/}
        {/*              <div className="testimonial-one__top-revivew-box">*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*              </div>*/}
        {/*              <p className="testimonial-one__text">This is due to their best service, pricing and*/}
        {/*                customer support. It’s throughly refresing to such a personal touch. Duis aute*/}
        {/*                irure lupsum reprehenderit.</p>*/}
        {/*              <div className="testimonial-one__client-info">*/}
        {/*                <h3 className="testimonial-one__client-name">Shirley Smith</h3>*/}
        {/*                <p className="testimonial-one__client-title">Customer</p>*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*          <div className="testimonial-one__single">*/}
        {/*            <div className="testimonial-one__img">*/}
        {/*              <img src={getUrl("assets/images/testimonial/testimonial-one-img-2.png")} alt=""/>*/}
        {/*            </div>*/}
        {/*            <div className="testimonail-one__content">*/}
        {/*              <div className="testimonial-one__top-revivew-box">*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*              </div>*/}
        {/*              <p className="testimonial-one__text">This is due to their best service, pricing and*/}
        {/*                customer support. It’s throughly refresing to such a personal touch. Duis aute*/}
        {/*                irure lupsum reprehenderit.</p>*/}
        {/*              <div className="testimonial-one__client-info">*/}
        {/*                <h3 className="testimonial-one__client-name">Kevin Martin</h3>*/}
        {/*                <p className="testimonial-one__client-title">Customer</p>*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*          <div className="testimonial-one__single">*/}
        {/*            <div className="testimonial-one__img">*/}
        {/*              <img src={getUrl("assets/images/testimonial/testimonial-one-img-3.png")} alt=""/>*/}
        {/*            </div>*/}
        {/*            <div className="testimonail-one__content">*/}
        {/*              <div className="testimonial-one__top-revivew-box">*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*              </div>*/}
        {/*              <p className="testimonial-one__text">This is due to their best service, pricing and*/}
        {/*                customer support. It’s throughly refresing to such a personal touch. Duis aute*/}
        {/*                irure lupsum reprehenderit.</p>*/}
        {/*              <div className="testimonial-one__client-info">*/}
        {/*                <h3 className="testimonial-one__client-name">Jessica Brown</h3>*/}
        {/*                <p className="testimonial-one__client-title">Customer</p>*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*          <div className="testimonial-one__single">*/}
        {/*            <div className="testimonial-one__img">*/}
        {/*              <img src={getUrl("assets/images/testimonial/testimonial-one-img-1.png")} alt=""/>*/}
        {/*            </div>*/}
        {/*            <div className="testimonail-one__content">*/}
        {/*              <div className="testimonial-one__top-revivew-box">*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*              </div>*/}
        {/*              <p className="testimonial-one__text">This is due to their best service, pricing and*/}
        {/*                customer support. It’s throughly refresing to such a personal touch. Duis aute*/}
        {/*                irure lupsum reprehenderit.</p>*/}
        {/*              <div className="testimonial-one__client-info">*/}
        {/*                <h3 className="testimonial-one__client-name">Shirley Smith</h3>*/}
        {/*                <p className="testimonial-one__client-title">Customer</p>*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*          <div className="testimonial-one__single">*/}
        {/*            <div className="testimonial-one__img">*/}
        {/*              <img src={getUrl("assets/images/testimonial/testimonial-one-img-2.png")} alt=""/>*/}
        {/*            </div>*/}
        {/*            <div className="testimonail-one__content">*/}
        {/*              <div className="testimonial-one__top-revivew-box">*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*              </div>*/}
        {/*              <p className="testimonial-one__text">This is due to their best service, pricing and*/}
        {/*                customer support. It’s throughly refresing to such a personal touch. Duis aute*/}
        {/*                irure lupsum reprehenderit.</p>*/}
        {/*              <div className="testimonial-one__client-info">*/}
        {/*                <h3 className="testimonial-one__client-name">Kevin Martin</h3>*/}
        {/*                <p className="testimonial-one__client-title">Customer</p>*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*          <div className="testimonial-one__single">*/}
        {/*            <div className="testimonial-one__img">*/}
        {/*              <img src={getUrl("assets/images/testimonial/testimonial-one-img-3.png")} alt=""/>*/}
        {/*            </div>*/}
        {/*            <div className="testimonail-one__content">*/}
        {/*              <div className="testimonial-one__top-revivew-box">*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*              </div>*/}
        {/*              <p className="testimonial-one__text">This is due to their best service, pricing and*/}
        {/*                customer support. It’s throughly refresing to such a personal touch. Duis aute*/}
        {/*                irure lupsum reprehenderit.</p>*/}
        {/*              <div className="testimonial-one__client-info">*/}
        {/*                <h3 className="testimonial-one__client-name">Jessica Brown</h3>*/}
        {/*                <p className="testimonial-one__client-title">Customer</p>*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*          <div className="testimonial-one__single">*/}
        {/*            <div className="testimonial-one__img">*/}
        {/*              <img src={getUrl("assets/images/testimonial/testimonial-one-img-1.png")} alt=""/>*/}
        {/*            </div>*/}
        {/*            <div className="testimonail-one__content">*/}
        {/*              <div className="testimonial-one__top-revivew-box">*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*              </div>*/}
        {/*              <p className="testimonial-one__text">This is due to their best service, pricing and*/}
        {/*                customer support. It’s throughly refresing to such a personal touch. Duis aute*/}
        {/*                irure lupsum reprehenderit.</p>*/}
        {/*              <div className="testimonial-one__client-info">*/}
        {/*                <h3 className="testimonial-one__client-name">Shirley Smith</h3>*/}
        {/*                <p className="testimonial-one__client-title">Customer</p>*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*          <div className="testimonial-one__single">*/}
        {/*            <div className="testimonial-one__img">*/}
        {/*              <img src={getUrl("assets/images/testimonial/testimonial-one-img-2.png")} alt=""/>*/}
        {/*            </div>*/}
        {/*            <div className="testimonail-one__content">*/}
        {/*              <div className="testimonial-one__top-revivew-box">*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*              </div>*/}
        {/*              <p className="testimonial-one__text">This is due to their best service, pricing and*/}
        {/*                customer support. It’s throughly refresing to such a personal touch. Duis aute*/}
        {/*                irure lupsum reprehenderit.</p>*/}
        {/*              <div className="testimonial-one__client-info">*/}
        {/*                <h3 className="testimonial-one__client-name">Kevin Martin</h3>*/}
        {/*                <p className="testimonial-one__client-title">Customer</p>*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*          <div className="testimonial-one__single">*/}
        {/*            <div className="testimonial-one__img">*/}
        {/*              <img src={getUrl("assets/images/testimonial/testimonial-one-img-3.png")} alt=""/>*/}
        {/*            </div>*/}
        {/*            <div className="testimonail-one__content">*/}
        {/*              <div className="testimonial-one__top-revivew-box">*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*                <i className="fa fa-star"></i>*/}
        {/*              </div>*/}
        {/*              <p className="testimonial-one__text">This is due to their best service, pricing and*/}
        {/*                customer support. It’s throughly refresing to such a personal touch. Duis aute*/}
        {/*                irure lupsum reprehenderit.</p>*/}
        {/*              <div className="testimonial-one__client-info">*/}
        {/*                <h3 className="testimonial-one__client-name">Jessica Brown</h3>*/}
        {/*                <p className="testimonial-one__client-title">Customer</p>*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*          </div>*/}


        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</section>*/}

        <section className="gallery-one">
          <div className="gallery-one-bg" style={{ backgroundImage: `url(${getUrl('assets/images/shapes/gallery-map.png')})` }}></div>
          <div className="gallery-one__container-box clearfix">
            <ul className="list-unstyled gallery-one__content clearfix">
              {galleryImages.map((imageSrc, index) => (
                <GalleryItem
                  key={index}
                  imageSrc={imageSrc}
                  delay={(index + 1) * 100}
                />
              ))}
            </ul>
          </div>
        </section>

        {/*<section className="why-choose">*/}
        {/*  <div className="why-choose__container">*/}
        {/*    <div className="why-choose__left">*/}
        {/*      <div className="why-choose__left-bg"*/}
        {/*           style={{ backgroundImage: "url(https://static.vinwonders.com/production/vietnam-nature-2.jpeg)" }}></div>*/}
        {/*      <div className="why-choose__toggle">*/}
        {/*        <p>Trips <br/> & tours</p>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*    <div className="why-choose__right">*/}
        {/*      <div className="why-choose__right-map"*/}
        {/*           style={{ backgroundImage: `url(${getUrl('assets/images/shapes/why-choose-right-map.png')})` }}></div>*/}
        {/*      <div className="why-choose__right-content">*/}
        {/*        <div className="section-title text-left">*/}
        {/*          <span className="section-title__tagline">Our benefit lists</span>*/}
        {/*          <h2 className="section-title__title">Why Choose Us</h2>*/}
        {/*        </div>*/}
        {/*        <p className="why-choose__right-text">*/}
        {/*          Our team is highly skilled in crafting and leading motorcycle tours. With over 10 years of varied riding experience, we know these roads inside and out*/}
        {/*        </p>*/}
        {/*        <ul className="list-unstyled why-choose__list">*/}
        {/*          <li>*/}
        {/*            <div className="icon">*/}
        {/*              <span className="icon-travel-map"></span>*/}
        {/*            </div>*/}
        {/*            <div className="text">*/}
        {/*              <h4>Professional and Certified</h4>*/}
        {/*              <p>*/}
        {/*                We are specialized Motorcycle Tour Company, dedicated to delivering a unique adventure motorcycle experiences*/}
        {/*              </p>*/}
        {/*            </div>*/}
        {/*          </li>*/}
        {/*          <li>*/}
        {/*            <div className="icon">*/}
        {/*              <span className="icon-phone-call"></span>*/}
        {/*            </div>*/}
        {/*            <div className="text">*/}
        {/*              <h4>Get Instant Tour Bookings</h4>*/}
        {/*              <p>Our journey starts and ends in anywhere Vietnam.</p>*/}
        {/*            </div>*/}
        {/*          </li>*/}
        {/*        </ul>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</section>*/}

        {/*<section className="news-one">*/}
        {/*  <div className="container">*/}
        {/*    <div className="news-one__top">*/}
        {/*      <div className="row">*/}
        {/*        <div className="col-xl-9 col-lg-9">*/}
        {/*          <div className="news-one__top-left">*/}
        {/*            <div className="section-title text-left">*/}
        {/*              <span className="section-title__tagline">From the blog post</span>*/}
        {/*              <h2 className="section-title__title">News & Articles</h2>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*        <div className="col-xl-3 col-lg-3">*/}
        {/*          <div className="news-one__top-right">*/}
        {/*            <a href="news-details.html" className="news-one__btn thm-btn">View All posts</a>*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*    <div className="news-one__bottom">*/}
        {/*      <div className="row">*/}
        {/*        <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="100ms">*/}
        {/*          <div className="news-one__single">*/}
        {/*            <div className="news-one__img">*/}
        {/*              <img src={getUrl("assets/images/blog/news-one-img-1.jpg")} alt=""/>*/}
        {/*              <a href="news-details.html">*/}
        {/*                <span className="news-one__plus"></span>*/}
        {/*              </a>*/}
        {/*              <div className="news-one__date">*/}
        {/*                <p>28 <br/> <span>Aug</span></p>*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*            <div className="news-one__content">*/}
        {/*              <ul className="list-unstyled news-one__meta">*/}
        {/*                <li><a href="news-details.html"><i className="far fa-user-circle"></i>Admin</a></li>*/}
        {/*                <li><a href="news-details.html"><i className="far fa-comments"></i>2 Comments</a>*/}
        {/*                </li>*/}
        {/*              </ul>*/}
        {/*              <h3 className="news-one__title">*/}
        {/*                <a href="news-details.html">Things to See and Do When Visiting Japan</a>*/}
        {/*              </h3>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*        <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="200ms">*/}
        {/*          <div className="news-one__single">*/}
        {/*            <div className="news-one__img">*/}
        {/*              <img src={getUrl("assets/images/blog/news-one-img-2.jpg")} alt=""/>*/}
        {/*              <a href="news-details.html">*/}
        {/*                <span className="news-one__plus"></span>*/}
        {/*              </a>*/}
        {/*              <div className="news-one__date">*/}
        {/*                <p>28 <br/> <span>Aug</span></p>*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*            <div className="news-one__content">*/}
        {/*              <ul className="list-unstyled news-one__meta">*/}
        {/*                <li><a href="news-details.html"><i className="far fa-user-circle"></i>Admin</a></li>*/}
        {/*                <li><a href="news-details.html"><i className="far fa-comments"></i>2 Comments</a>*/}
        {/*                </li>*/}
        {/*              </ul>*/}
        {/*              <h3 className="news-one__title">*/}
        {/*                <a href="news-details.html">Journeys are Best Measured in New Friends</a>*/}
        {/*              </h3>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*        <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="300ms">*/}
        {/*          <div className="news-one__single">*/}
        {/*            <div className="news-one__img">*/}
        {/*              <img src={getUrl("assets/images/blog/news-one-img-3.jpg")} alt=""/>*/}
        {/*              <a href="news-details.html">*/}
        {/*                <span className="news-one__plus"></span>*/}
        {/*              </a>*/}
        {/*              <div className="news-one__date">*/}
        {/*                <p>28 <br/> <span>Aug</span></p>*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*            <div className="news-one__content">*/}
        {/*              <ul className="list-unstyled news-one__meta">*/}
        {/*                <li><a href="news-details.html"><i className="far fa-user-circle"></i>Admin</a></li>*/}
        {/*                <li><a href="news-details.html"><i className="far fa-comments"></i>2 Comments</a>*/}
        {/*                </li>*/}
        {/*              </ul>*/}
        {/*              <h3 className="news-one__title">*/}
        {/*                <a href="news-details.html">Travel the Most Beautiful Places in the World</a>*/}
        {/*              </h3>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</section>*/}

      </div>

      <HeaderMobile />

      <div className="search-popup">
        <div className="search-popup__overlay search-toggler"></div>
        <div className="search-popup__content">
          <form action="#">
            <label htmlFor="search" className="sr-only">search here</label>
            <input type="text" id="search" placeholder="Search Here..."/>
            <button type="submit" aria-label="search submit" className="thm-btn">
              <i className="icon-magnifying-glass"></i>
            </button>
          </form>
        </div>
      </div>

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
      {/*<Script src={getUrl("assets/vendors/swiper/swiper.min.js")} strategy="afterInteractive"></Script>*/}
      <Script src={getUrl("assets/vendors/tiny-slider/tiny-slider.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/wnumb/wNumb.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/wow/wow.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/isotope/isotope.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/countdown/countdown.min.js")} strategy="afterInteractive"></Script>
      {/*<Script src={getUrl("assets/vendors/owl-carousel/owl.carousel.min.js")} strategy="afterInteractive"></Script>*/}
      <Script src={getUrl("assets/vendors/twentytwenty/twentytwenty.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/twentytwenty/jquery.event.move.js")} strategy="beforeInteractive"></Script>
      <Script src={getUrl("assets/vendors/bxslider/jquery.bxslider.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/bootstrap-select/js/bootstrap-select.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/vegas/vegas.min.js")} strategy="afterInteractive"></Script>
      <Script src={getUrl("assets/vendors/jquery-ui/jquery-ui.js")} strategy="beforeInteractive"></Script>
      <Script src={getUrl("assets/vendors/timepicker/timePicker.js")} strategy="beforeInteractive"></Script>
      <Script src={getUrl("assets/js/tevily.js")} strategy="afterInteractive"></Script>
      </div>
    </>
  );
}
