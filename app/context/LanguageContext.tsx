"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { translations } from "@/app/lib/translations";

export type Language = "es" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
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
  const [language, setLanguageState] = useState<Language>("es");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("homara_lang") as Language;
      if (savedLang === "es" || savedLang === "en") {
        setTimeout(() => {
          setLanguageState(savedLang);
        }, 0);
      }
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("homara_lang", lang);
    }
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split(".");
    return (
      lookupKey(translations[language], keys) ??
      lookupKey(translations["es"], keys) ??
      key
    );
  }, [language]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
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
