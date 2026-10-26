// Interfaz · Diseño responsive (ESC39) y compatibilidad de navegadores (ESC44)
//
// Se recorre cada página principal en 3 viewports, se verifica que no exista
// desbordamiento horizontal y se toma una captura como evidencia. La misma spec
// se ejecuta en Electron, Chrome y Edge (scripts test:interfaz:*).

import { VIEWPORTS } from "../../support/utilidades";

type NombreViewport = keyof typeof VIEWPORTS;

const PAGINAS_PUBLICAS: { ruta: string; nombre: string; listo: () => void }[] = [
  { ruta: "/", nombre: "inicio", listo: () => cy.contains("h2", "Productos más Vendidos").should("be.visible") },
  { ruta: "/catalogo", nombre: "catalogo", listo: () => cy.contains("productos técnicos encontrados").should("be.visible") },
  { ruta: "/login", nombre: "login", listo: () => cy.get("#email").should("be.visible") },
  { ruta: "/register", nombre: "registro", listo: () => cy.get('input[placeholder="Juan"]').should("be.visible") },
  { ruta: "/carrito", nombre: "carrito-sin-sesion", listo: () => cy.contains("h3", "Inicia sesión").should("be.visible") },
];

/** Comprueba que el documento no sea más ancho que la ventana (sin scroll horizontal). */
function sinDesbordeHorizontal() {
  cy.window().then((win) => {
    const doc = win.document.documentElement;
    const anchoContenido = doc.scrollWidth;
    const anchoVentana = doc.clientWidth;
    // Elementos que sobresalen del viewport (para diagnosticar si falla).
    const culpables = [...win.document.body.querySelectorAll<HTMLElement>("*")]
      .filter((el) => el.getBoundingClientRect().right > anchoVentana + 1)
      .filter((el) => getComputedStyle(el).position !== "fixed")
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
    expect(anchoContenido, `scrollWidth <= clientWidth (sobresalen: ${culpables.join(" | ") || "ninguno"})`).to.be.at.most(anchoVentana);
  });
}

describe("Interfaz · Responsive (ESC39) en " + Cypress.browser.displayName, () => {
  (Object.keys(VIEWPORTS) as NombreViewport[]).forEach((vp) => {
    const { ancho, alto } = VIEWPORTS[vp];

    context(`Viewport ${vp} (${ancho}x${alto})`, () => {
      beforeEach(() => cy.viewport(ancho, alto));

      PAGINAS_PUBLICAS.forEach(({ ruta, nombre, listo }) => {
        it(`INT-RSP [ESC39/ESC44] ${ruta} se adapta a ${vp} sin scroll horizontal`, () => {
          cy.visit(ruta);
          listo();
          sinDesbordeHorizontal();
          cy.screenshot(`${Cypress.browser.name}/${vp}-${nombre}`, { capture: "viewport", overwrite: true });
        });
      });

      it(`INT-RSP [ESC39] detalle de producto se adapta a ${vp}`, () => {
        cy.productosApi().then((productos) => {
          cy.visit(`/catalogo/${productos[0].id}`);
          cy.contains("h1", productos[0].name).should("be.visible");
          sinDesbordeHorizontal();
          cy.contains("button", "Agregar al Carrito").should("be.visible");
          cy.screenshot(`${Cypress.browser.name}/${vp}-detalle-producto`, { capture: "viewport", overwrite: true });
        });
      });
    });
  });

  it("INT-RSP-GRID [ESC39] la grilla del catálogo pasa de 1 a 2 y 4 columnas según el ancho", () => {
    const columnasEsperadas: [NombreViewport, number][] = [["movil", 1], ["tablet", 2], ["escritorio", 4]];
    columnasEsperadas.forEach(([vp, columnas]) => {
      cy.viewport(VIEWPORTS[vp].ancho, VIEWPORTS[vp].alto);
      cy.visit("/catalogo");
      cy.contains("productos técnicos encontrados").should("be.visible");
      cy.get('main a[href^="/catalogo/"]').first().parent().then(($grid) => {
        const plantilla = getComputedStyle($grid[0]).gridTemplateColumns.split(" ").length;
        expect(plantilla, `columnas en ${vp}`).to.eq(columnas);
      });
    });
  });
});

describe("Interfaz · Navegación móvil (ESC39)", () => {
  beforeEach(() => cy.viewport(VIEWPORTS.movil.ancho, VIEWPORTS.movil.alto));

  it("INT-MOV-01 [ESC39] en móvil se oculta la navegación de escritorio y aparece el botón Menú", () => {
    cy.visit("/");
    cy.get("nav").contains("a", "Catálogo").should("not.be.visible");
    cy.get('button[aria-label="Menú"]').should("be.visible");
  });

  it("INT-MOV-02 [ESC39] el menú móvil se abre, navega al catálogo y se cierra", () => {
    cy.visit("/");
    cy.get('button[aria-label="Menú"]').click();
    cy.get("nav .animate-slide-down").should("be.visible").within(() => {
      cy.contains("a", "Inicio").should("be.visible");
      cy.contains("a", "Mis Proyectos").should("be.visible");
      cy.contains("a", "Iniciar Sesión").should("be.visible");
    });
    cy.screenshot("movil-menu-abierto", { capture: "viewport", overwrite: true });
    cy.get("nav .animate-slide-down").contains("a", "Catálogo").click();
    cy.location("pathname").should("eq", "/catalogo");
    cy.get("nav .animate-slide-down").should("not.exist");
  });

  it("INT-MOV-03 [ESC39] DEF-16: el botón Menú no expone aria-expanded ni aria-controls", () => {
    cy.visit("/");
    cy.get('button[aria-label="Menú"]').click();
    cy.get('button[aria-label="Menú"]').should("not.have.attr", "aria-expanded");
    cy.get('button[aria-label="Menú"]').should("not.have.attr", "aria-controls");
  });

  it("INT-MOV-04 [ESC39] en escritorio el botón Menú no se muestra", () => {
    cy.viewport(VIEWPORTS.escritorio.ancho, VIEWPORTS.escritorio.alto);
    cy.visit("/");
    cy.get('button[aria-label="Menú"]').should("not.be.visible");
    cy.get("nav").contains("a", "Catálogo").should("be.visible");
  });
});
