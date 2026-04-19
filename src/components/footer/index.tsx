import Link from "next/link";
import { getUrl } from "../../utils/index";

export const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer__top">
      <div className="container">
        <div className="site-footer__top-inner">
          <div className="row">
            <div className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="100ms">
              <div className="footer-widget__column footer-widget__about">
                <div className="footer-widget__about-logo">
                  <Link href='/'>
                    <img
                      style={{ height: '45px', opacity: '.9' }}
                      src={getUrl("assets/images/logo/logo-white.png")} alt="Logo"
                    />
                  </Link>
                </div>
                <p className="footer-widget__about-text">
                  Our Guides have many years of experience motorcycling and was established in 2008
                </p>
                <ul className="footer-widget__about-contact list-unstyled">
                  <li>
                    <div className="icon">
                      <i className="fas fa-phone-square-alt"></i>
                    </div>
                    <div className="text">
                      <a href="tel:+84-935-797-550">+84 935 797 550</a>
                    </div>
                  </li>
                  <li>
                    <div className="icon">
                      <i className="fas fa-envelope"></i>
                    </div>
                    <div className="text">
                      <a href="mailto:easyridermotorbiketour@gmail.com">easyridermotorbiketour@gmail.com</a>
                    </div>
                  </li>
                  <li>
                    <div className="icon">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div className="text">
                      <p>Alley 05-07 Nguyen Trung Truc st.</p>
                    </div>
                  </li>
                  <li>
                    <div className="icon">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div className="text">
                      <p>Nha Trang City, Vietnam</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-xl-2 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="200ms">
              <div className="footer-widget__column footer-widget__company clearfix">
                <h3 className="footer-widget__title">Company</h3>
                <ul className="footer-widget__company-list list-unstyled">
                  <li><a href="about.html">About Us</a></li>
                  <li><a href="#">Contact Us</a></li>
                  <li><a href="#">Rental</a></li>
                  <li><a href="#">Tours</a></li>
                </ul>
              </div>
            </div>
            <div className="col-xl-2 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="300ms">
              <div className="footer-widget__column footer-widget__explore">
                <h3 className="footer-widget__title">Explore</h3>
                <ul className="list-unstyled footer-widget__explore-list">
                  <li><a href="#">Tours</a></li>
                  <li><a href="#">Legal</a></li>
                  <li><a href="#">Contact</a></li>
                  <li><a href="#">Affilitate Program</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            <div className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="400ms">
              <div className="footer-widget__column footer-widget__newsletter">
                <h3 className="footer-widget__title">Newsletter</h3>
                <form className="footer-widget__newsletter-form mc-form"
                      data-url="https://xyz.us18.list-manage.com/subscribe/post?u=20e91746ef818cd941998c598&id=cc0ee8140e">
                  <div className="footer-widget__newsletter-input-box">
                    <input type="email" placeholder="Email address" name="EMAIL"/>
                    <button type="submit"
                            className="footer-widget__newsletter-btn">Subscribe
                    </button>
                  </div>
                </form>
                <div className="mc-form__response text-center"></div>
                <div className="footer-widget__newsletter-bottom">
                  <div className="footer-widget__newsletter-bottom-icon">
                    <i className="fa fa-check"></i>
                  </div>
                  <div className="footer-widget__newsletter-bottom-text">
                    <p>I agree to all terms and policies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="site-footer__bottom">
      <div className="container">
        <div className="row">
          <div className="col-xl-12">
            <div className="site-footer__bottom-inner">
              <div className="site-footer__bottom-left">
                <div className="footer-widget__social">
                  <a href="https://youtube.com/@vietnammotorcycletour6674?si=kOduPDV6PDhNygvJ"><i className="fab fa-youtube"></i></a>
                  <a href="#"><i className="fab fa-tripadvisor"></i></a>
                  <a href="#"><i className="fab fa-whatsapp"></i></a>
                </div>
              </div>
              <div className="site-footer__bottom-right">
                <p>@ All Copyright {new Date().getFullYear()}</p>
              </div>
              <div className="site-footer__bottom-left-arrow">
                <a href="#" data-target="html" className="scroll-to-target scroll-to-top"><span
                  className="icon-right-arrow"></span></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
);
