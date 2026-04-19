import { HeaderMobile } from "@/components/header-mobile";
import Script from "next/script";
import { getUrl } from "@/utils";

export default function Contact() {
  return (
    <div>
      <div className="page-wrapper">
        <section className="page-header">
          <div className="page-header__top">
            <div className="page-header-bg" style={{ backgroundImage: 'url(https://media.gadventures.com/media-server/cache/59/d0/59d0b4d7c98928e2b9bf2e208409d5d6.jpg)' }}>
            </div>
            <div className="page-header-bg-overly"></div>
            <div className="container">
              <div className="page-header__top-inner">
                <h2>Contact</h2>
              </div>
            </div>
          </div>
          <div className="page-header__bottom">
            <div className="container">
              <div className="page-header__bottom-inner">
                <ul className="thm-breadcrumb list-unstyled">
                  <li><a href="index.html">Home</a></li>
                  <li><span>.</span></li>
                  <li className="active">Contact</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-page">
          <div className="container">
            <div className="row">
              <div className="col-xl-4 col-lg-5">
                <div className="contact-page__left">
                  <div className="section-title text-left">
                    <span className="section-title__tagline">Talk with our team</span>
                    <h2 className="section-title__title">Any Question? Feel Free to Contact</h2>
                  </div>
                  <div className="contact-page__social">
                    <a href="#"><i className="fab fa-facebook"></i></a>
                    <a href="#"><i className="fab fa-twitter"></i></a>
                    <a href="#"><i className="fab fa-instagram"></i></a>
                    <a href="#"><i className="fab fa-dribbble"></i></a>
                  </div>
                </div>
              </div>
              <div className="col-xl-8 col-lg-7">
                <div className="contact-page__right">
                  <div className="comment-form">
                    <form action="inc/sendemail.php" className="comment-one__form contact-form-validated">
                      <div className="row">
                        <div className="col-xl-6">
                          <div className="comment-form__input-box">
                            <input type="text" placeholder="Your name" name="name"/>
                          </div>
                        </div>
                        <div className="col-xl-6">
                          <div className="comment-form__input-box">
                            <input type="email" placeholder="Email address" name="email"/>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-xl-12">
                          <div className="comment-form__input-box">
                            <textarea name="message" placeholder="Write Comment"></textarea>
                          </div>
                          <button type="submit" className="thm-btn comment-form__btn">Send a
                            message
                          </button>
                        </div>
                      </div>
                    </form>
                    <div className="result"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="information">
          <div className="container">
            <div className="row">
              <div className="col-xl-4 col-lg-4">
                <div className="information__single">
                  <div className="information__icon">
                    <span className="icon-place"></span>
                  </div>
                  <div className="information__text">
                    <p>88 Broklyn Street <br/> Road New York. USA</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-4 col-lg-4">
                <div className="information__single">
                  <div className="information__icon">
                    <span className="icon-phone-call"></span>
                  </div>
                  <div className="information__text">
                    <h4>
                      <a href="tel:+92-666-888-0000" className="information__number-1">+92 666 888 0000</a>
                      <br/>
                      <a href="tel:666-888-0000" className="information__number-2">666 888 0000</a>
                    </h4>
                  </div>
                </div>
              </div>
              <div className="col-xl-4 col-lg-4">
                <div className="information__single">
                  <div className="information__icon">
                    <span className="icon-at"></span>
                  </div>
                  <div className="information__text">
                    <h4>
                      <a href="mailto:needhelp@tevily.com"
                         className="information__mail-1">needhelp@tevily.com</a> <br/>
                      <a href="mailto:info@tevily.com" className="information__mail-2">info@tevily.com</a>
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-page-google-map">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4562.753041141002!2d-118.80123790098536!3d34.152323469614075!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80e82469c2162619%3A0xba03efb7998eef6d!2sCostco+Wholesale!5e0!3m2!1sbn!2sbd!4v1562518641290!5m2!1sbn!2sbd"
            className="contact-page-google-map__one" allowFullScreen></iframe>
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
