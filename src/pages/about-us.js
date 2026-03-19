import Script from "next/script";
import { HeaderMobile } from "@/components/header-mobile";
import { getUrl } from "@/utils";

export default function AboutUs() {
  return (
    <div>
      <div className="page-wrapper">

        <section className="page-header">
          <div className="page-header__top">
            <div className="page-header-bg" style={{ backgroundImage: 'url(https://vietnamamazingtours.com/uploads/Northern-Vietnam-Tours.jpeg)' }}>
            </div>
            <div className="page-header-bg-overly"></div>
            <div className="container">
              <div className="page-header__top-inner">
                <h2>About</h2>
              </div>
            </div>
          </div>
          <div className="page-header__bottom">
            <div className="container">
              <div className="page-header__bottom-inner">
                <ul className="thm-breadcrumb list-unstyled">
                  <li><a href="index.html">Home</a></li>
                  <li><span>.</span></li>
                  <li>Pages</li>
                  <li><span>.</span></li>
                  <li className="active">About</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="about-page">
          <div className="container">
            <div className="row">
              <div className="col-xl-6">
                <div className="about-page__left">
                  <div className="about-page__img">
                    <img src="assets/images/resources/about-page-img.jpg" alt=""/>
                  </div>
                </div>
              </div>
              <div className="col-xl-6">
                <div className="about-page__right">
                  <div className="section-title text-left">
                    <span className="section-title__tagline">Learn about us</span>
                    <h2 className="section-title__title">Dare to Explore with Tevily Agency</h2>
                  </div>
                  <p className="about-page__text-1">A Simply Perfect Place to Get Lost</p>
                  <p className="about-page__text-2">We are trusted by our clients and have a reputation for the
                    best services in the field. Lorem ipsum is simply free text dolor sit amett consectetur
                    adipiscing elit. It is a long established fact that a reader will be distracted by the
                    readable content of a page.</p>
                  <div className="about-page__progress">
                    <div className="about-page__progress-single">
                      <h4 className="about-page__progress-title">Best Services</h4>
                      <div className="bar">
                        <div className="bar-inner count-bar" data-percent="77%">
                          <div className="count-text">77%</div>
                        </div>
                      </div>
                    </div>
                    <div className="about-page__progress-single">
                      <h4 className="about-page__progress-title">Tour Agents</h4>
                      <div className="bar marb-0">
                        <div className="bar-inner count-bar" data-percent="38%">
                          <div className="count-text">38%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="book-now">
          <div className="book-now-shape" style={{ backgroundImage: 'url(assets/images/shapes/book-now-shape.png)' }}></div>
          <div className="container">
            <div className="row">
              <div className="col-xl-12">
                <div className="book-now__inner">
                  <div className="book-now__left">
                    <p>Plan your trip with us</p>
                    <h2>Ready for an unforgetable tour?</h2>
                  </div>
                  <div className="book-now__right">
                    <a href="#" className="thm-btn book-now__btn">Book tour now</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="testimonial-one about-page-testimonial">
          <div className="about-page-testimonial-map"
               style={{ backgroundImage: 'url(assets/images/shapes/about-page-testimonial-map.png)' }}></div>
          <div className="container">
            <div className="section-title text-center">
              <span className="section-title__tagline">Testimonials & reviews</span>
              <h2 className="section-title__title">What They’re Saying</h2>
            </div>
            <div className="row">
              <div className="col-xl-12">
                <div className="testimonial-one__carousel owl-theme owl-carousel">
                  <div className="testimonial-one__single">
                    <div className="testimonial-one__img">
                      <img src="assets/images/testimonial/testimonial-one-img-1.png" alt=""/>
                    </div>
                    <div className="testimonail-one__content">
                      <div className="testimonial-one__top-revivew-box">
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                      </div>
                      <p className="testimonial-one__text">This is due to their best service, pricing and
                        customer support. It’s throughly refresing to such a personal touch. Duis aute
                        irure lupsum reprehenderit.</p>
                      <div className="testimonial-one__client-info">
                        <h3 className="testimonial-one__client-name">Shirley Smith</h3>
                        <p className="testimonial-one__client-title">Customer</p>
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-one__single">
                    <div className="testimonial-one__img">
                      <img src="assets/images/testimonial/testimonial-one-img-2.png" alt=""/>
                    </div>
                    <div className="testimonail-one__content">
                      <div className="testimonial-one__top-revivew-box">
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                      </div>
                      <p className="testimonial-one__text">This is due to their best service, pricing and
                        customer support. It’s throughly refresing to such a personal touch. Duis aute
                        irure lupsum reprehenderit.</p>
                      <div className="testimonial-one__client-info">
                        <h3 className="testimonial-one__client-name">Kevin Martin</h3>
                        <p className="testimonial-one__client-title">Customer</p>
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-one__single">
                    <div className="testimonial-one__img">
                      <img src="assets/images/testimonial/testimonial-one-img-3.png" alt=""/>
                    </div>
                    <div className="testimonail-one__content">
                      <div className="testimonial-one__top-revivew-box">
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                      </div>
                      <p className="testimonial-one__text">This is due to their best service, pricing and
                        customer support. It’s throughly refresing to such a personal touch. Duis aute
                        irure lupsum reprehenderit.</p>
                      <div className="testimonial-one__client-info">
                        <h3 className="testimonial-one__client-name">Jessica Brown</h3>
                        <p className="testimonial-one__client-title">Customer</p>
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-one__single">
                    <div className="testimonial-one__img">
                      <img src="assets/images/testimonial/testimonial-one-img-1.png" alt=""/>
                    </div>
                    <div className="testimonail-one__content">
                      <div className="testimonial-one__top-revivew-box">
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                      </div>
                      <p className="testimonial-one__text">This is due to their best service, pricing and
                        customer support. It’s throughly refresing to such a personal touch. Duis aute
                        irure lupsum reprehenderit.</p>
                      <div className="testimonial-one__client-info">
                        <h3 className="testimonial-one__client-name">Shirley Smith</h3>
                        <p className="testimonial-one__client-title">Customer</p>
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-one__single">
                    <div className="testimonial-one__img">
                      <img src="assets/images/testimonial/testimonial-one-img-2.png" alt=""/>
                    </div>
                    <div className="testimonail-one__content">
                      <div className="testimonial-one__top-revivew-box">
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                      </div>
                      <p className="testimonial-one__text">This is due to their best service, pricing and
                        customer support. It’s throughly refresing to such a personal touch. Duis aute
                        irure lupsum reprehenderit.</p>
                      <div className="testimonial-one__client-info">
                        <h3 className="testimonial-one__client-name">Kevin Martin</h3>
                        <p className="testimonial-one__client-title">Customer</p>
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-one__single">
                    <div className="testimonial-one__img">
                      <img src="assets/images/testimonial/testimonial-one-img-3.png" alt=""/>
                    </div>
                    <div className="testimonail-one__content">
                      <div className="testimonial-one__top-revivew-box">
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                      </div>
                      <p className="testimonial-one__text">This is due to their best service, pricing and
                        customer support. It’s throughly refresing to such a personal touch. Duis aute
                        irure lupsum reprehenderit.</p>
                      <div className="testimonial-one__client-info">
                        <h3 className="testimonial-one__client-name">Jessica Brown</h3>
                        <p className="testimonial-one__client-title">Customer</p>
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-one__single">
                    <div className="testimonial-one__img">
                      <img src="assets/images/testimonial/testimonial-one-img-1.png" alt=""/>
                    </div>
                    <div className="testimonail-one__content">
                      <div className="testimonial-one__top-revivew-box">
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                      </div>
                      <p className="testimonial-one__text">This is due to their best service, pricing and
                        customer support. It’s throughly refresing to such a personal touch. Duis aute
                        irure lupsum reprehenderit.</p>
                      <div className="testimonial-one__client-info">
                        <h3 className="testimonial-one__client-name">Shirley Smith</h3>
                        <p className="testimonial-one__client-title">Customer</p>
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-one__single">
                    <div className="testimonial-one__img">
                      <img src="assets/images/testimonial/testimonial-one-img-2.png" alt=""/>
                    </div>
                    <div className="testimonail-one__content">
                      <div className="testimonial-one__top-revivew-box">
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                      </div>
                      <p className="testimonial-one__text">This is due to their best service, pricing and
                        customer support. It’s throughly refresing to such a personal touch. Duis aute
                        irure lupsum reprehenderit.</p>
                      <div className="testimonial-one__client-info">
                        <h3 className="testimonial-one__client-name">Kevin Martin</h3>
                        <p className="testimonial-one__client-title">Customer</p>
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-one__single">
                    <div className="testimonial-one__img">
                      <img src="assets/images/testimonial/testimonial-one-img-3.png" alt=""/>
                    </div>
                    <div className="testimonail-one__content">
                      <div className="testimonial-one__top-revivew-box">
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                      </div>
                      <p className="testimonial-one__text">This is due to their best service, pricing and
                        customer support. It’s throughly refresing to such a personal touch. Duis aute
                        irure lupsum reprehenderit.</p>
                      <div className="testimonial-one__client-info">
                        <h3 className="testimonial-one__client-name">Jessica Brown</h3>
                        <p className="testimonial-one__client-title">Customer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="video-two">
          <div className="video-two-bg jarallax" data-jarallax data-speed="0.2" data-imgPosition="50% 0%"
               style={{ backgroundImage: 'url(assets/images/backgrounds/video-one-two-bg.jpg)' }}></div>
          <div className="container">
            <div className="row">
              <div className="col-xl-12">
                <div className="video-two__inner">
                  <div className="video-one__video-link">
                    <a href="https://www.youtube.com/watch?v=Get7rqXYrbQ" className="video-popup">
                      <div className="video-one__video-icon">
                        <span className="icon-play-button"></span>
                        <i className="ripple"></i>
                      </div>
                    </a>
                  </div>
                  <p className="video-one__tagline">Are you ready to travel?</p>
                  <h2 className="video-one__title">Tevily is a World Leading <br/> Online Tour Booking Platform
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="counter-one">
          <div className="counter-one__container">
            <ul className="list-unstyled counters-one__box">
              <li className="counter-one__single wow fadeInUp" data-wow-delay="100ms">
                <h3 className="odometer" data-count="870">00</h3>
                <p className="counter-one__text">Total Donations</p>
              </li>
              <li className="counter-one__single wow fadeInUp" data-wow-delay="200ms">
                <h3 className="odometer" data-count="480">00</h3>
                <p className="counter-one__text">Campaigns Closed</p>
              </li>
              <li className="counter-one__single wow fadeInUp" data-wow-delay="300ms">
                <h3 className="odometer" data-count="930">00</h3>
                <p className="counter-one__text">Happy People</p>
              </li>
              <li className="counter-one__single wow fadeInUp" data-wow-delay="400ms">
                <h3 className="odometer" data-count="63">00</h3>
                <p className="counter-one__text">Our Volunteers</p>
              </li>
            </ul>
          </div>
        </div>

        <section className="team-one">
          <div className="team-one-map" style={{ backgroundImage: 'url(assets/images/shapes/team-one-map.png)' }}></div>
          <div className="container">
            <div className="section-title text-center">
              <span className="section-title__tagline">Professional people</span>
              <h2 className="section-title__title">Meet the Team</h2>
            </div>
            <div className="row">
              <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInLeft" data-wow-delay="0ms"
                   data-wow-duration="1000ms">
                <div className="team-one__single">
                  <div className="team-one__img">
                    <img src="assets/images/team/team-1-1.jpg" alt=""/>
                  </div>
                  <div className="team-one__content">
                    <h4 className="team-one__name">Jessica Brown</h4>
                    <p className="team-one__title">consultant</p>
                    <div className="team-one__social">
                      <a href="#"><i className="fab fa-facebook"></i></a>
                      <a href="#"><i className="fab fa-twitter"></i></a>
                      <a href="#"><i className="fab fa-instagram"></i></a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInLeft" data-wow-delay="100ms"
                   data-wow-duration="1000ms">
                <div className="team-one__single">
                  <div className="team-one__img">
                    <img src="assets/images/team/team-1-2.jpg" alt=""/>
                  </div>
                  <div className="team-one__content">
                    <h4 className="team-one__name">Mike Hardson</h4>
                    <p className="team-one__title">consultant</p>
                    <div className="team-one__social">
                      <a href="#"><i className="fab fa-facebook"></i></a>
                      <a href="#"><i className="fab fa-twitter"></i></a>
                      <a href="#"><i className="fab fa-instagram"></i></a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInRight" data-wow-delay="0ms"
                   data-wow-duration="1000ms">
                <div className="team-one__single">
                  <div className="team-one__img">
                    <img src="assets/images/team/team-1-3.jpg" alt=""/>
                  </div>
                  <div className="team-one__content">
                    <h4 className="team-one__name">Sarah Albert</h4>
                    <p className="team-one__title">consultant</p>
                    <div className="team-one__social">
                      <a href="#"><i className="fab fa-facebook"></i></a>
                      <a href="#"><i className="fab fa-twitter"></i></a>
                      <a href="#"><i className="fab fa-instagram"></i></a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInRight" data-wow-delay="100ms"
                   data-wow-duration="1000ms">
                <div className="team-one__single">
                  <div className="team-one__img">
                    <img src="assets/images/team/team-1-4.jpg" alt=""/>
                  </div>
                  <div className="team-one__content">
                    <h4 className="team-one__name">Kevin Smith</h4>
                    <p className="team-one__title">consultant</p>
                    <div className="team-one__social">
                      <a href="#"><i className="fab fa-facebook"></i></a>
                      <a href="#"><i className="fab fa-twitter"></i></a>
                      <a href="#"><i className="fab fa-instagram"></i></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="brand-two brand-three">
          <div className="container">
            <div className="thm-swiper__slider swiper-container" data-swiper-options='{"spaceBetween": 100, "slidesPerView": 5, "autoplay": { "delay": 5000 }, "breakpoints": {
                    "0": {
                        "spaceBetween": 30,
                        "slidesPerView": 2
                    },
                    "375": {
                        "spaceBetween": 30,
                        "slidesPerView": 2
                    },
                    "575": {
                        "spaceBetween": 30,
                        "slidesPerView": 3
                    },
                    "767": {
                        "spaceBetween": 50,
                        "slidesPerView": 4
                    },
                    "991": {
                        "spaceBetween": 50,
                        "slidesPerView": 5
                    },
                    "1199": {
                        "spaceBetween": 100,
                        "slidesPerView": 5
                    }
                }}'>
              <div className="swiper-wrapper">
                <div className="swiper-slide">
                  <img src="assets/images/brand/brand-2-1.png" alt=""/>
                </div>
                <div className="swiper-slide">
                  <img src="assets/images/brand/brand-2-2.png" alt=""/>
                </div>
                <div className="swiper-slide">
                  <img src="assets/images/brand/brand-2-3.png" alt=""/>
                </div>
                <div className="swiper-slide">
                  <img src="assets/images/brand/brand-2-4.png" alt=""/>
                </div>
                <div className="swiper-slide">
                  <img src="assets/images/brand/brand-2-5.png" alt=""/>
                </div>
                <div className="swiper-slide">
                  <img src="assets/images/brand/brand-2-1.png" alt=""/>
                </div>
                <div className="swiper-slide">
                  <img src="assets/images/brand/brand-2-2.png" alt=""/>
                </div>
                <div className="swiper-slide">
                  <img src="assets/images/brand/brand-2-3.png" alt=""/>
                </div>
                <div className="swiper-slide">
                  <img src="assets/images/brand/brand-2-4.png" alt=""/>
                </div>
                <div className="swiper-slide">
                  <img src="assets/images/brand/brand-2-5.png" alt=""/>
                </div>
              </div>
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
