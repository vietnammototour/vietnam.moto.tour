import { getUrl } from "@/utils";

export function HeaderMobile() {
  return (
    <div className="mobile-nav__wrapper">
      <div className="mobile-nav__overlay mobile-nav__toggler"></div>
      <div className="mobile-nav__content">
        <span className="mobile-nav__close mobile-nav__toggler"><i className="fa fa-times"></i></span>

        <div className="logo-box">
          <a href="index.html" aria-label="logo image">
            <img src={getUrl("assets/images/logo/logo-white.png")} width="155" alt=""/></a>
        </div>
        <div className="mobile-nav__container"></div>

        <ul className="mobile-nav__contact list-unstyled">
          <li>
            <i className="fa fa-envelope"></i>
            <a href="mailto:easyridermotorbiketour@gmail.com">easyridermotorbiketour@gmail.com</a>
          </li>
          <li>
            <i className="fa fa-phone-alt"></i>
            <a href="tel:+84-935-797-550">+84 935 797 550</a>
          </li>
        </ul>
        <div className="mobile-nav__top">
          <div className="mobile-nav__social">
            <a href="https://youtube.com/@vietnammotorcycletour6674?si=kOduPDV6PDhNygvJ" className="fab fa-youtube"></a>
            <a href="#" className="fab fa-tripadvisor"></a>
            <a href="#" className="fab fa-whatsapp"></a>
          </div>
        </div>
      </div>
    </div>
  );
}
