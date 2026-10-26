"use client";

import { useLanguage } from "@/app/context/LanguageContext";

// DEF-18 (WCAG 2.4.1): primer elemento enfocable; lleva al <main id="contenido"> de cada layout.
export default function SkipLink() {
  const { t } = useLanguage();
  return (
    <a
      href="#contenido"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-bg-base focus:text-sm focus:font-bold"
    >
      {t("nav.skip_to_content")}
    </a>
  );
}
