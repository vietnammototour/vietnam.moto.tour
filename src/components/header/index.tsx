import Link from "next/link";
import { useRouter } from "next/router";
import { getUrl } from "../../utils/index";

export const Header = () => {
  const router = useRouter();

  return (
    <header className="main-header clearfix">
      <div className="main-header__top">
        <div className="container">
          <div className="main-header__top-inner clearfix">
            <div className="main-header__top-left">
              <ul className="list-unstyled main-header__top-address">
                <li>
                  <div className="icon">
                    <span className="icon-phone-call"></span>
                  </div>
                  <div className="text">
                    <a href="tel:+84-935-797-550">+84 935 797 550</a>
                  </div>
                </li>
                <li>
                  <div className="icon">
                    <span className="icon-at"></span>
                  </div>
                  <div className="text">
                    <a href="mailto:easyridermotorbiketour@gmail.com">easyridermotorbiketour@gmail.com</a>
                  </div>
                </li>
              </ul>
            </div>
            <div className="main-header__top-right">
              <div className="main-header__top-right-inner">
                <div className="main-header__top-right-social">
                  <a href="https://youtube.com/@vietnammotorcycletour6674?si=kOduPDV6PDhNygvJ"><i className="fab fa-youtube"></i></a>
                  <a href="#"><i className="fab fa-tripadvisor"></i></a>
                  <a href="#"><i className="fab fa-whatsapp"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <nav className="main-menu clearfix">
        <div className="main-menu-wrapper clearfix">
          <div className="container clearfix">
            <div className="main-menu-wrapper-inner clearfix">
              <div className="main-menu-wrapper__left clearfix">
                <div className="main-menu-wrapper__logo">
                  <Link href="/">
                    <img
                      style={{ height: '54px' }}
                      src={getUrl("assets/images/logo/logo.jpeg")} alt="Logo"
                    />
                  </Link>
                </div>
                <div className="main-menu-wrapper__main-menu">
                  <a href="#" className="mobile-nav__toggler"><i className="fa fa-bars"></i></a>
                  <ul className="main-menu__list">
                    <li className={`dropdown ${router.pathname === '/' ? 'current' : ''}`}>
                      <Link href="/">Home</Link>
                    </li>
                    <li className={`dropdown ${router.pathname.startsWith('/tours') ? 'current' : ''}`}>
                      <Link href="/tours">Tours</Link>
                      <ul>
                        <li><Link href="/tours">Nha Trang</Link></li>
                        <li><Link href="/tours">Dalat</Link></li>
                        <li><Link href="/tours">Mui Ne</Link></li>
                        <li><Link href="/tours">Sai Gon</Link></li>
                        <li><Link href="/tours">Hoi An</Link></li>
                        <li><Link href="/tours">Ha No</Link></li>
                      </ul>
                    </li>
                    <li className={`dropdown ${router.pathname.startsWith('/rental') ? 'current' : ''}`}>
                      <Link href="/rental">Rental</Link>
                      <ul>
                        <li><Link href="/rental">Motorbike</Link></li>
                        <li><Link href="/rental">Car</Link></li>
                      </ul>
                    </li>
                    <li className={router.pathname === '/about-us' ? 'current' : ''}>
                      <Link href="/about-us">About Us</Link>
                    </li>
                    <li className={router.pathname === '/contact' ? 'current' : ''}>
                      <Link href="/contact">Contact</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="main-menu-wrapper__right">
                {/*<a href="#" className="main-menu__search search-toggler icon-magnifying-glass"></a>*/}
                {/*<a href="#" className="main-menu__user icon-avatar"></a>*/}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
