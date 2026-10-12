// Soporte de Cypress Component Testing (React + Vite).
//
// - Carga los estilos reales de la app (Tailwind 4 vía app/globals.css).
// - `cy.mount` monta el componente; `cy.montar` lo envuelve además en los
//   proveedores de Tema e Idioma que exigen varios componentes (useLanguage).
import React from "react";
import { mount } from "cypress/react";
import "../../app/globals.css";
import { ThemeProvider } from "@/app/context/ThemeContext";
import { LanguageProvider } from "@/app/context/LanguageContext";

type Idioma = "es" | "en";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
      /** Monta el componente dentro de ThemeProvider + LanguageProvider (idioma opcional). */
      montar(ui: React.ReactNode, opciones?: { idioma?: Idioma }): ReturnType<typeof mount>;
    }
  }
}

Cypress.Commands.add("mount", mount);

Cypress.Commands.add("montar", (ui: React.ReactNode, opciones: { idioma?: Idioma } = {}) => {
  window.localStorage.removeItem("homara_lang");
  if (opciones.idioma) window.localStorage.setItem("homara_lang", opciones.idioma);
  return cy.mount(
    <ThemeProvider>
      <LanguageProvider>
        <div className="p-6 bg-bg-base text-text-primary">{ui}</div>
      </LanguageProvider>
    </ThemeProvider>,
  );
});
