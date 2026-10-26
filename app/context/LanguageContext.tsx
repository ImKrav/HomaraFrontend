"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { translations } from "@/app/lib/translations";

export type Language = "es" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function lookupKey(dict: unknown, keys: readonly string[]): string | null {
  let current: unknown = dict;
  for (const k of keys) {
    if (current && typeof current === "object" && k in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return null;
    }
  }
  return typeof current === "string" ? current : null;
}

export function LanguageProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [language, setLanguage] = useState<Language>("es");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("homara_lang") as Language;
      if (savedLang === "es" || savedLang === "en") {
        setTimeout(() => {
          setLanguage(savedLang);
        }, 0);
      }
    }
  }, []);

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("homara_lang", lang);
    }
  }, []);

  // DEF-15: el idioma de la interfaz se refleja en <html lang> (lectores de pantalla, WCAG 3.1.1).
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // OBS-03: `t(clave) || respaldo` nunca usaba el respaldo porque t() devuelve la clave si falta;
  // ahora el respaldo es un argumento explícito.
  const t = useCallback((key: string, fallback?: string): string => {
    const keys = key.split(".");
    const currentDict = translations[language] || translations.es;
    const fallbackDict = translations.es;

    return lookupKey(currentDict, keys) ?? lookupKey(fallbackDict, keys) ?? fallback ?? key;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage: handleSetLanguage, t }), [language, handleSetLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage debe usarse dentro de un LanguageProvider");
  }
  return context;
}
