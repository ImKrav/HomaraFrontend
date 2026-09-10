"use client";

import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import { useTheme } from "@/app/context/ThemeContext";

export default function Footer() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const footerLinks = {
    [t("footer.products_col")]: [
      { label: t("footer.floors"), href: "/catalogo?category=pisos-ceramicas" },
      { label: t("footer.tools"), href: "/catalogo?category=herramientas" },
      { label: t("footer.paints"), href: "/catalogo?category=pinturas" },
      { label: t("footer.furniture"), href: "/catalogo?category=muebles" },
    ],
    [t("footer.company_col")]: [
      { label: t("footer.about_us"), href: "#" },
      { label: "Blog", href: "#" },
      { label: t("footer.contact"), href: "#" },
    ],
    [t("footer.support_col")]: [
      { label: t("footer.help_center"), href: "#" },
      { label: t("footer.terms_cond"), href: "#" },
      { label: t("footer.privacy_policy"), href: "#" },
    ],
  };

  return (
    <footer className="bg-bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold gradient-text">Homara</span>
            </Link>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              {t("footer.tagline")}
            </p>
            <div className="flex gap-3 mt-5">
              {[
                { name: "instagram", url: "https://instagram.com" },
                { name: "facebook", url: "https://facebook.com" },
                { name: "twitter", url: "https://twitter.com" },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-none bg-bg-surface-light text-text-secondary hover:bg-primary hover:text-bg-base transition-all duration-200"
                  aria-label={social.name}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-xs text-text-muted">
            {t("footer.rights")}
          </p>
          
          <div className="flex flex-wrap items-center gap-6 text-xs text-text-muted">
            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 bg-bg-surface-light border border-border px-1.5 py-1 rounded-none">
              <span className="text-[10px] uppercase font-bold text-text-muted px-1.5">
                {t("footer.language")}
              </span>
              <button
                onClick={() => setLanguage("es")}
                className={`px-2 py-0.5 text-[10px] font-extrabold uppercase border tracking-wider transition-all duration-150 cursor-pointer ${
                  language === "es"
                    ? "bg-primary text-bg-base border-primary shadow-sm font-black"
                    : "bg-transparent text-text-muted border-transparent hover:text-text-primary"
                }`}
              >
                ES
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-2 py-0.5 text-[10px] font-extrabold uppercase border tracking-wider transition-all duration-150 cursor-pointer ${
                  language === "en"
                    ? "bg-primary text-bg-base border-primary shadow-sm font-black"
                    : "bg-transparent text-text-muted border-transparent hover:text-text-primary"
                }`}
              >
                EN
              </button>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center gap-1.5 bg-bg-surface-light border border-border px-1.5 py-1 rounded-none">
              <span className="text-[10px] uppercase font-bold text-text-muted px-1.5">
                {t("footer.theme")}
              </span>
              <button
                onClick={toggleTheme}
                className="px-2.5 py-1 bg-bg-surface border border-border text-text-primary hover:border-primary hover:text-primary transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-sm text-[10px] font-bold uppercase tracking-wider rounded-none"
                aria-label={t("footer.theme_toggle")}
              >
                {theme === "light" ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-warning fill-warning" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.46 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                    </svg>
                    <span>{t("footer.theme_light")}</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-primary-light" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                    <span>{t("footer.theme_dark")}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-4 border-l border-border pl-6 py-1">
              <span>Colombia</span>
              <span>COP $</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
