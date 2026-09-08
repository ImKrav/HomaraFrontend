// tests/translations.test.mts · comprobación del diccionario de traducciones e i18n

import { test, is, ok } from "./harness.mjs";
import { translations } from "../app/lib/translations.js";

test("i18n-01", "translations exporta idiomas es y en", () => {
  ok("es" in translations);
  ok("en" in translations);
});

test("i18n-02", "códigos de locale válidos para es y en", () => {
  is(translations.es.locale, "es-CO");
  is(translations.en.locale, "en-US");
});

test("i18n-03", "secciones principales presentes en ambos diccionarios", () => {
  const secciones = ["nav", "categories", "status", "pagination", "footer", "hero"];
  for (const s of secciones) {
    ok(s in translations.es, `Falta sección ${s} en es`);
    ok(s in translations.en, `Falta sección ${s} en en`);
  }
});
