import { HeaderMobile } from "@/components/header-mobile";
import Script from "next/script";
import {getUrl} from "@/utils";

export default function Rental() {
  return (
    <div>
      <div className="page-wrapper">
        <div className="stricky-header stricked-menu main-menu">
          <div className="sticky-header__content"></div>
        </div>


        <section className="page-header">
          <div className="page-header__top">
            <div className="page-header-bg" style={{ backgroundImage: 'url(https://vietnammotorcycletours.com/storage/2022/04/AR500963-1920x1280.jpg)' }}>
            </div>
            <div className="page-header-bg-overly"></div>
            <div className="container">
              <div className="page-header__top-inner">
                <h2>Rental</h2>
              </div>
            </div>
          </div>
          <div className="page-header__bottom">
            <div className="container">
              <div className="page-header__bottom-inner">
                <ul className="thm-breadcrumb list-unstyled">
                  <li><a href="index.html">Home</a></li>
                  <li><span>.</span></li>
                  <li className="active">Rental</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="popular-tours-two">
          <div className="container">
            <div className="row">
              <div className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="100ms">
                <div className="popular-tours__single">
                  <div className="popular-tours__img">
                    <img src="assets/images/resources/popular-tours-two__img-1.jpg" alt=""/>
                    <div className="popular-tours__icon">
                      <a href="tour-details.html">
                        <i className="fa fa-heart"></i>
                      </a>
                    </div>
                  </div>
                  <div className="popular-tours__content">
                    <div className="popular-tours__stars">
                      <i className="fa fa-star"></i> 8.0 Superb
                    </div>
                    <h3 className="popular-tours__title"><a href="tour-details.html">National Park 2 Days
                      Tour</a></h3>
                    <p className="popular-tours__rate"><span>$1870</span> / Per Person</p>
                    <ul className="popular-tours__meta list-unstyled">
                      <li><a href="tour-details.html">3 Days</a></li>
                      <li><a href="tour-details.html">12+</a></li>
                      <li><a href="tour-details.html">Los Angeles</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="200ms">
                <div className="popular-tours__single">
                  <div className="popular-tours__img">
                    <img src="assets/images/resources/popular-tours-two__img-2.jpg" alt=""/>
                    <div className="popular-tours__icon">
                      <a href="tour-details.html">
                        <i className="fa fa-heart"></i>
                      </a>
                    </div>
                  </div>
                  <div className="popular-tours__content">
                    <div className="popular-tours__stars">
                      <i className="fa fa-star"></i> 8.0 Superb
                    </div>
                    <h3 className="popular-tours__title"><a href="tour-details.html">The Dark Forest</a></h3>
                    <p className="popular-tours__rate"><span>$1870</span> / Per Person</p>
                    <ul className="popular-tours__meta list-unstyled">
                      <li><a href="tour-details.html">3 Days</a></li>
                      <li><a href="tour-details.html">12+</a></li>
                      <li><a href="tour-details.html">Los Angeles</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="300ms">
                <div className="popular-tours__single">
                  <div className="popular-tours__img">
                    <img src="assets/images/resources/popular-tours-two__img-3.jpg" alt=""/>
                    <div className="popular-tours__icon">
                      <a href="tour-details.html">
                        <i className="fa fa-heart"></i>
                      </a>
                    </div>
                  </div>
                  <div className="popular-tours__content">
                    <div className="popular-tours__stars">
                      <i className="fa fa-star"></i> 8.0 Superb
                    </div>
                    <h3 className="popular-tours__title"><a href="tour-details.html">Discover Depth of Beach</a>
                    </h3>
                    <p className="popular-tours__rate"><span>$1870</span> / Per Person</p>
                    <ul className="popular-tours__meta list-unstyled">
                      <li><a href="tour-details.html">3 Days</a></li>
                      <li><a href="tour-details.html">12+</a></li>
                      <li><a href="tour-details.html">Los Angeles</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="400ms">
                <div className="popular-tours__single">
                  <div className="popular-tours__img">
                    <img src="assets/images/resources/popular-tours-two__img-4.jpg" alt=""/>
                    <div className="popular-tours__icon">
                      <a href="tour-details.html">
                        <i className="fa fa-heart"></i>
                      </a>
                    </div>
                  </div>
                  <div className="popular-tours__content">
                    <div className="popular-tours__stars">
                      <i className="fa fa-star"></i> 8.0 Superb
                    </div>
                    <h3 className="popular-tours__title"><a href="tour-details.html">Moscow Red City Land</a>
                    </h3>
                    <p className="popular-tours__rate"><span>$1870</span> / Per Person</p>
                    <ul className="popular-tours__meta list-unstyled">
                      <li><a href="tour-details.html">3 Days</a></li>
                      <li><a href="tour-details.html">12+</a></li>
                      <li><a href="tour-details.html">Los Angeles</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="500ms">
                <div className="popular-tours__single">
                  <div className="popular-tours__img">
                    <img src="assets/images/resources/popular-tours-two__img-5.jpg" alt=""/>
                    <div className="popular-tours__icon">
                      <a href="tour-details.html">
                        <i className="fa fa-heart"></i>
                      </a>
                    </div>
                  </div>
                  <div className="popular-tours__content">
                    <div className="popular-tours__stars">
                      <i className="fa fa-star"></i> 8.0 Superb
                    </div>
                    <h3 className="popular-tours__title"><a href="tour-details.html">Magic of Italy Tours</a>
                    </h3>
                    <p className="popular-tours__rate"><span>$1870</span> / Per Person</p>
                    <ul className="popular-tours__meta list-unstyled">
                      <li><a href="tour-details.html">3 Days</a></li>
                      <li><a href="tour-details.html">12+</a></li>
                      <li><a href="tour-details.html">Los Angeles</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="600ms">
                <div className="popular-tours__single">
                  <div className="popular-tours__img">
                    <img src="assets/images/resources/popular-tours-two__img-6.jpg" alt=""/>
                    <div className="popular-tours__icon">
                      <a href="tour-details.html">
                        <i className="fa fa-heart"></i>
                      </a>
                    </div>
                  </div>
                  <div className="popular-tours__content">
                    <div className="popular-tours__stars">
                      <i className="fa fa-star"></i> 8.0 Superb
                    </div>
                    <h3 className="popular-tours__title"><a href="tour-details.html">Discover Depth of Beach</a>
                    </h3>
                    <p className="popular-tours__rate"><span>$1870</span> / Per Person</p>
                    <ul className="popular-tours__meta list-unstyled">
                      <li><a href="tour-details.html">3 Days</a></li>
                      <li><a href="tour-details.html">12+</a></li>
                      <li><a href="tour-details.html">Los Angeles</a></li>
                    </ul>
                  </div>
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
  )
}
