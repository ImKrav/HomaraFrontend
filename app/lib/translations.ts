import es from "./locales/es.json";
import en from "./locales/en.json";

export const translations = {
  es,
  en,
};

export type Translations = typeof translations;
export type Locale = keyof typeof translations;
