// Accesibilidad · Análisis automático con axe-core (WCAG 2.1 A/AA)
//
// - Se usa cypress-axe (cy.injectAxe + cy.checkA11y) con skipFailures=true: las
//   violaciones existentes NO hacen fallar la suite; se registran con un callback
//   en consola y en cypress/results/a11y-violaciones.json (cy.task).
// - La única aserción es de regresión: las violaciones de impacto "critical" de
//   cada página deben estar contenidas en la línea base documentada
//   (cypress/fixtures/a11y-linea-base.json). Una violación crítica NUEVA falla.

import type { Result } from "axe-core";
import { ETIQUETAS_WCAG } from "../../support/utilidades";

interface Pagina {
  id: string;
  ruta: string;
  sesion?: "cliente" | "admin";
  tema?: "light" | "dark";
  listo: () => void;
}

const ARCHIVO = Cypress.env("a11yResultados") as string;

const PAGINAS: Pagina[] = [
  { id: "inicio", ruta: "/", listo: () => cy.contains("h2", "Productos más Vendidos").should("be.visible") },
  { id: "inicio-oscuro", ruta: "/", tema: "dark", listo: () => cy.contains("h2", "Productos más Vendidos").should("be.visible") },
  { id: "catalogo", ruta: "/catalogo", listo: () => cy.contains("productos técnicos encontrados").should("be.visible") },
  { id: "detalle-producto", ruta: "/catalogo/:primero", listo: () => cy.contains("button", "Agregar al Carrito").should("be.visible") },
  { id: "login", ruta: "/login", listo: () => cy.get("#email").should("be.visible") },
  { id: "login-oscuro", ruta: "/login", tema: "dark", listo: () => cy.get("#email").should("be.visible") },
  { id: "registro", ruta: "/register", listo: () => cy.get('input[placeholder="Juan"]').should("be.visible") },
  { id: "carrito-invitado", ruta: "/carrito", listo: () => cy.contains("h3", "Inicia sesión").should("be.visible") },
  { id: "cuenta", ruta: "/cuenta", sesion: "cliente", listo: () => cy.contains("h2", "Historial de Pedidos").should("be.visible") },
  { id: "proyectos", ruta: "/proyectos", sesion: "cliente", listo: () => cy.contains("h1", "Mis Proyectos").should("be.visible") },
  { id: "proyecto-nuevo", ruta: "/proyectos/nuevo", sesion: "cliente", listo: () => cy.get("#project-name").should("be.visible") },
  { id: "checkout", ruta: "/checkout", sesion: "cliente", listo: () => cy.get("#first-name").should("be.visible") },
  { id: "admin-dashboard", ruta: "/admin", sesion: "admin", listo: () => cy.contains("h1", "Dashboard").should("be.visible") },
  { id: "admin-productos", ruta: "/admin/productos", sesion: "admin", listo: () => cy.get("tbody tr").should("have.length.greaterThan", 0) },
];

/** Resumen compacto de una violación para el JSON de evidencia. */
function resumir(v: Result) {
  return {
    regla: v.id,
    impacto: v.impact,
    descripcion: v.help,
    wcag: v.tags.filter((t) => t.startsWith("wcag")),
    ayuda: v.helpUrl,
    nodos: v.nodes.length,
    ejemplos: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
  };
}

describe("Accesibilidad · axe-core WCAG 2.1 A/AA", () => {
  let lineaBase: Record<string, string[]> = {};
  let primerProducto = "";

  before(() => {
    cy.task("reiniciarArchivo", ARCHIVO);
    cy.fixture("a11y-linea-base.json").then((datos) => {
      lineaBase = datos.criticas;
    });
    cy.productosApi().then((p) => {
      primerProducto = p[0].id;
    });
  });

  PAGINAS.forEach((pagina) => {
    it(`A11Y-AXE [ESC39/ESC40] ${pagina.id} (${pagina.ruta}) no agrega violaciones críticas nuevas`, () => {
      if (pagina.sesion === "cliente") cy.iniciarSesion(Cypress.env("clienteEmail"), Cypress.env("clientePassword"));
      if (pagina.sesion === "admin") cy.iniciarSesion(Cypress.env("adminEmail"), Cypress.env("adminPassword"));

      const ruta = pagina.ruta.replace(":primero", primerProducto);
      cy.visit(ruta, {
        onBeforeLoad: (win) => win.localStorage.setItem("homara_theme", pagina.tema ?? "light"),
      });
      pagina.listo();
      cy.get("html").should(pagina.tema === "dark" ? "have.class" : "not.have.class", "dark");
      cy.injectAxe();

      const violaciones: Result[] = [];
      cy.checkA11y(
        undefined,
        { runOnly: { type: "tag", values: ETIQUETAS_WCAG } },
        (encontradas) => {
          violaciones.push(...encontradas);
        },
        true, // skipFailures: registrar sin fallar por violaciones existentes
      );

      cy.then(() => {
        const porImpacto = violaciones.reduce<Record<string, number>>((acc, v) => {
          acc[v.impact ?? "sin-impacto"] = (acc[v.impact ?? "sin-impacto"] ?? 0) + 1;
          return acc;
        }, {});
        const registro = {
          pagina: pagina.id,
          ruta,
          tema: pagina.tema ?? "light",
          navegador: Cypress.browser.name,
          fecha: new Date().toISOString(),
          total: violaciones.length,
          porImpacto,
          violaciones: violaciones.map(resumir),
        };
        cy.task("registrarA11y", { archivo: ARCHIVO, registro });
        cy.task(
          "log",
          `[axe] ${pagina.id}: ${violaciones.length} reglas violadas -> ` +
            violaciones.map((v) => `${v.id}(${v.impact}, ${v.nodes.length} nodos)`).join(", "),
        );

        const criticas = violaciones.filter((v) => v.impact === "critical").map((v) => v.id);
        const permitidas = lineaBase[pagina.id] ?? [];
        const nuevas = criticas.filter((id) => !permitidas.includes(id));
        expect(nuevas, `violaciones críticas fuera de la línea base en ${pagina.id}`).to.have.length(0);
      });
    });
  });
});
