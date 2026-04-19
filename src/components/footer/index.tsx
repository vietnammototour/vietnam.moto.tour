import Link from "next/link";
import { useTranslations } from "next-intl";
import { getUrl, contactInfo } from "@/utils";

export const Footer = () => {
  const t = useTranslations("footer");

  return (
    <footer className="bg-neutral-900 text-neutral-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-10">
          {/* About */}
          <div className="xl:col-span-4">
            <Link href="/" className="inline-block mb-6">
              <img
                src={getUrl("assets/images/logo/logo-white.png")}
                alt="Logo"
                className="h-11 opacity-90"
              />
            </Link>
            <p className="text-sm leading-relaxed mb-6">{t("aboutText")}</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <i className="fas fa-phone-square-alt text-primary" />
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="hover:text-white transition-colors"
                >
                  {contactInfo.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-envelope text-primary" />
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="hover:text-white transition-colors"
                >
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-map-marker-alt text-primary" />
                <span>{contactInfo.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-map-marker-alt text-primary" />
                <span>{contactInfo.city}, Vietnam</span>
              </li>
            </ul>
          </div>

          {/* Company links */}
          <div className="xl:col-span-2">
            <h3 className="text-white font-bold text-lg mb-6">
              {t("company")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/about-us"
                  className="hover:text-white transition-colors"
                >
                  {t("aboutUs")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  {t("contactUs")}
                </Link>
              </li>
              <li>
                <Link
                  href="/rental"
                  className="hover:text-white transition-colors"
                >
                  {t("rental")}
                </Link>
              </li>
              <li>
                <Link
                  href="/tours"
                  className="hover:text-white transition-colors"
                >
                  {t("tours")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Explore links */}
          <div className="xl:col-span-2">
            <h3 className="text-white font-bold text-lg mb-6">
              {t("explore")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/tours"
                  className="hover:text-white transition-colors"
                >
                  {t("tours")}
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("legal")}
                </a>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  {t("contact")}
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("privacyPolicy")}
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="xl:col-span-4">
            <h3 className="text-white font-bold text-lg mb-6">
              {t("newsletter")}
            </h3>
            <form className="flex gap-0">
              <input
                type="email"
                placeholder={t("emailPlaceholder")}
                className="flex-1 bg-white/10 border border-white/10 rounded-l-lg px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-r-lg transition-colors"
              >
                {t("subscribe")}
              </button>
            </form>
            <label className="flex items-center gap-2 mt-4 text-xs">
              <i className="fa fa-check text-primary" />
              {t("agreeTerms")}
            </label>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a
              href={contactInfo.youtubeLink}
              className="hover:text-white transition-colors"
            >
              <i className="fab fa-youtube" />
            </a>
            <a
              href={contactInfo.tripadvisorLink}
              className="hover:text-white transition-colors"
            >
              <i className="fab fa-tripadvisor" />
            </a>
            <a
              href={`https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, "")}`}
              className="hover:text-white transition-colors"
            >
              <i className="fab fa-whatsapp" />
            </a>
          </div>
          <p className="text-sm">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
};
