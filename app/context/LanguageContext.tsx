"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "@/app/lib/translations";

export type Language = "es" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
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

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("homara_lang", lang);
    }
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let current: unknown = translations[language];
    
    for (const k of keys) {
      if (current && typeof current === "object" && k in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[k];
      } else {
        // Fallback to Spanish dictionary first if not found in current language
        let fallback: unknown = translations["es"];
        for (const fbK of keys) {
          if (fallback && typeof fallback === "object" && fbK in (fallback as Record<string, unknown>)) {
            fallback = (fallback as Record<string, unknown>)[fbK];
          } else {
            fallback = null;
            break;
          }
        }
        return typeof fallback === "string" ? fallback : key;
      }
    }
    
    return typeof current === "string" ? current : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
