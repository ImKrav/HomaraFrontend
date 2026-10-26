// Pasos compartidos por las specs de flujos E2E (no es una spec: no termina en .cy.ts).

export const ENVIO = 25000;

/** Captura con nombre: evidencia de cada etapa del viaje en el reporte HTML. */
export const evidencia = (nombre: string) => cy.screenshot(nombre, { capture: "viewport" });

/** Desde cualquier página: barra de navegación → catálogo → búsqueda → ficha del producto. */
export function buscarYAbrir(nombre: string, enlaceCatalogo: RegExp | string = "Catálogo") {
  cy.get("nav").contains("a", enlaceCatalogo).click();
  cy.location("pathname").should("eq", "/catalogo");
  cy.get("#search-bar").type(`${nombre}{enter}`);
  cy.contains("h3", nombre).click();
  cy.contains("h1", nombre).should("be.visible");
}

/** Completa los datos de envío del checkout. */
export function llenarEnvio(datos = { phone: "3001234567", address: "Carrera 43A # 1-50", city: "Medellín", state: "Antioquia", zip: "050021" }) {
  Object.entries(datos).forEach(([campo, valor]) => {
    cy.get(`#${campo}`).clear().type(valor);
  });
}

/** Fila del resumen del carrito (Subtotal / Envío / Total) → texto del valor. */
export function valorResumen(etiqueta: RegExp) {
  return cy
    .contains("h2", "Resumen del Pedido")
    .parent()
    .contains("span", etiqueta)
    .parent()
    .find("span")
    .last()
    .invoke("text")
    .then((t) => t.replace(/\s+/g, " ").trim());
}
