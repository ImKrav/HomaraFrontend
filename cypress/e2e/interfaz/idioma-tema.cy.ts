// Interfaz · Idioma (ES/EN) y tema (claro/oscuro) con persistencia (ESC40)

const html = () => cy.get("html");

describe("Interfaz · Idioma y tema (ESC40)", () => {
  context("Tema claro / oscuro", () => {
    it("INT-TEM-01 [ESC40] sin preferencia guardada, el tema sigue a prefers-color-scheme del sistema", () => {
      cy.visit("/");
      cy.window().then((win) => {
        const sistemaOscuro = win.matchMedia("(prefers-color-scheme: dark)").matches;
        html().should(sistemaOscuro ? "have.class" : "not.have.class", "dark");
      });
    });

    it("INT-TEM-02 [ESC40] 'Alternar tema' pasa de claro a oscuro, lo guarda y persiste al recargar y navegar", () => {
      cy.visit("/", { onBeforeLoad: (win) => win.localStorage.setItem("homara_theme", "light") });
      html().should("not.have.class", "dark");
      cy.get('button[aria-label$="Alternar tema"]').should("contain.text", "Claro").click();

      html().should("have.class", "dark");
      cy.window().its("localStorage").invoke("getItem", "homara_theme").should("eq", "dark");
      cy.get('button[aria-label$="Alternar tema"]').should("contain.text", "Oscuro");
      cy.screenshot("tema-oscuro", { capture: "viewport", overwrite: true });

      cy.reload();
      html().should("have.class", "dark");
      cy.visit("/catalogo");
      html().should("have.class", "dark");
    });

    it("INT-TEM-04 [ESC40] 'Alternar tema' pasa de oscuro a claro y también persiste", () => {
      cy.visit("/", { onBeforeLoad: (win) => win.localStorage.setItem("homara_theme", "dark") });
      html().should("have.class", "dark");
      cy.get('button[aria-label$="Alternar tema"]').should("contain.text", "Oscuro").click();

      html().should("not.have.class", "dark");
      cy.window().its("localStorage").invoke("getItem", "homara_theme").should("eq", "light");
      cy.screenshot("tema-claro", { capture: "viewport", overwrite: true });
      cy.reload();
      html().should("not.have.class", "dark");
    });

    it("INT-TEM-03 [ESC40] el tema guardado se aplica al cargar y el fondo cambia de color", () => {
      cy.visit("/", { onBeforeLoad: (win) => win.localStorage.setItem("homara_theme", "light") });
      html().should("not.have.class", "dark");
      cy.get("body").then(($b) => {
        const fondoClaro = getComputedStyle($b[0]).backgroundColor;
        cy.get('button[aria-label$="Alternar tema"]').click();
        html().should("have.class", "dark");
        cy.get("body").should(($b2) => {
          expect(getComputedStyle($b2[0]).backgroundColor).not.to.eq(fondoClaro);
        });
      });
    });
  });

  context("Idioma español / inglés", () => {
    it("INT-IDI-01 [ESC40] cambiar a EN traduce la navegación y la página, y se guarda en localStorage", () => {
      cy.visit("/catalogo");
      cy.get("nav").contains("a", "Catálogo").should("exist");
      cy.get("footer").contains("button", /^EN$/).click();

      cy.get("nav").contains("a", "Catalog").should("exist");
      cy.contains("h1", "Product Specifications").should("be.visible");
      cy.get("footer").contains("button", /^EN$/).should("have.class", "bg-primary");
      cy.window().its("localStorage").invoke("getItem", "homara_lang").should("eq", "en");
      cy.screenshot("idioma-en-catalogo", { capture: "viewport", overwrite: true });
    });

    it("INT-IDI-02 [ESC40] el idioma inglés persiste al recargar y al navegar", () => {
      cy.visit("/", { onBeforeLoad: (win) => win.localStorage.setItem("homara_lang", "en") });
      cy.get("nav").contains("a", "Home").should("exist");
      cy.reload();
      cy.get("nav").contains("a", "Home").should("exist");
      cy.visit("/login");
      cy.get('label[for="email"]').should("contain.text", "Email");
    });

    it("INT-IDI-03 [ESC40] volver a ES restaura los textos en español", () => {
      cy.visit("/", { onBeforeLoad: (win) => win.localStorage.setItem("homara_lang", "en") });
      cy.get("nav").contains("a", "Catalog").should("exist");
      cy.get("footer").contains("button", /^ES$/).click();
      cy.get("nav").contains("a", "Catálogo").should("exist");
      cy.window().its("localStorage").invoke("getItem", "homara_lang").should("eq", "es");
    });

    it("INT-IDI-04 [ESC40] DEF-15 corregido: en inglés el atributo <html lang> pasa a 'en'", () => {
      cy.visit("/", { onBeforeLoad: (win) => win.localStorage.setItem("homara_lang", "en") });
      cy.get("nav").contains("a", "Home").should("exist");
      html().should("have.attr", "lang", "en");
    });

    it("INT-IDI-05 [ESC40] DEF-17 corregido: el error de contraseñas no coincidentes del registro se traduce", () => {
      cy.visit("/register", { onBeforeLoad: (win) => win.localStorage.setItem("homara_lang", "en") });
      cy.contains("button", /Register|Sign up|Create/i).should("exist");
      cy.get('input[placeholder="Juan"]').type("Ann");
      cy.get('input[placeholder="Pérez"]').type("Lee");
      cy.get('input[placeholder="juan@email.com"]').type("ann.lee@example.com");
      cy.get('input[type="password"]').eq(0).type("Password1");
      cy.get('input[type="password"]').eq(1).type("Password2");
      cy.get("form").find('button[type="submit"]').click();
      cy.contains("Passwords do not match.").should("be.visible");
      cy.contains("Las contraseñas no coinciden.").should("not.exist");
    });
  });
});
