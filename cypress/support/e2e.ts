// Soporte global de las pruebas E2E (regresión, API, interfaz y accesibilidad).
//
// testIsolation está activo (valor por defecto de Cypress 12+): antes de cada
// prueba se limpian cookies, localStorage (token, idioma y tema) y la página.
// cy.session restaura solo el token de la sesión que la prueba pida.
import "./commands";
import "cypress-axe";
import "cypress-mochawesome-reporter/register";

beforeEach(() => {
  // El backend responde con ETag: sin esto, una segunda carga puede volver como
  // 304 sin cuerpo y las pruebas que leen `response.body` de un intercept fallan
  // de forma intermitente. Se fuerza siempre una respuesta 200 completa.
  cy.intercept({ url: "**/api/v1/**", middleware: true }, (req) => {
    delete req.headers["if-none-match"];
    delete req.headers["if-modified-since"];
  });
});

// Evidencia: captura del estado final de cada prueba con interfaz. Las specs
// *.api.cy.ts no abren página; su evidencia es la petición/respuesta (cy.api).
afterEach(() => {
  if (Cypress.env("evidencias") && !Cypress.spec.name.endsWith(".api.cy.ts")) {
    cy.screenshot({ capture: "viewport" });
  }
});
