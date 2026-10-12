// Regresión E2E · Catálogo
// ESC08 listar · ESC09 buscar/filtrar/ordenar · ESC10 detalle · ESC11 categorías · ESC12 vitrina

import type { ProductoApi } from "../../support/commands";
import { aNumero, formatoCOP, normalizar } from "../../support/utilidades";

/** Tarjetas de producto de la grilla (cada ProductCard es un enlace a /catalogo/:id). */
const tarjetas = () => cy.get('main a[href^="/catalogo/"]');

describe("Regresión · Catálogo (ESC08-ESC12)", () => {
  let productos: ProductoApi[] = [];

  before(() => {
    cy.productosApi().then((lista) => {
      productos = lista;
    });
  });

  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/products*").as("productos");
    cy.intercept("GET", "**/api/v1/categories").as("categorias");
  });

  it("REG-CAT-01 [ESC08] lista los productos del backend con el conteo correcto (máx. 25 por página)", () => {
    cy.visit("/catalogo");
    cy.wait("@productos").then(({ response }) => {
      const total = response?.body.data.length as number;
      expect(total, "productos devueltos por la API").to.be.greaterThan(0);
      cy.contains(`${total} productos técnicos encontrados`).should("be.visible");
      tarjetas().should("have.length", Math.min(25, total));
      if (total > 25) {
        cy.contains("button", "2").should("have.attr", "aria-label", "Ir a página 2");
      }
    });
  });

  it("REG-CAT-02 [ESC08] la paginación avanza a la página 2 y muestra el rango correcto", function () {
    if (productos.length <= 25) this.skip();
    cy.visit("/catalogo");
    cy.wait("@productos");
    cy.get('button[aria-label="Ir a página 2"]').click();
    cy.get('button[aria-current="page"]').should("have.text", "2");
    cy.contains(`26–${Math.min(50, productos.length)}`).should("be.visible");
  });

  it("REG-CAT-03 [ESC09] la búsqueda por nombre encuentra el producto y actualiza la URL", () => {
    const objetivo = productos[0];
    cy.visit("/catalogo");
    cy.wait("@productos");
    cy.get("#search-bar").type(`${objetivo.name}{enter}`);

    cy.contains(`Resultados para:`).should("contain.text", objetivo.name);
    tarjetas().should("have.length.at.least", 1);
    tarjetas().first().should("contain.text", objetivo.name);
    cy.location("search").should("include", "search=");
  });

  it("REG-CAT-04 [ESC09] una búsqueda sin coincidencias muestra el estado vacío y permite volver al catálogo", () => {
    cy.visit("/catalogo");
    cy.wait("@productos");
    cy.get("#search-bar").type("zzz-producto-inexistente-xyz{enter}");

    cy.contains("No se encontraron productos coincidentes").should("be.visible");
    cy.contains("0 productos técnicos encontrados").should("be.visible");
    tarjetas().should("have.length", 0);
    cy.contains("button", "Ver Todo el Catálogo").click();
    tarjetas().should("have.length.greaterThan", 0);
  });

  it("REG-CAT-05 [ESC09] el filtro de calificación 4.5+ muestra solo los productos que lo cumplen", () => {
    const esperados = productos.filter((p) => p.rating >= 4.5).length;
    cy.visit("/catalogo");
    cy.wait("@productos");
    cy.get("#min-rating").select("4.5");
    cy.contains(`${esperados} productos técnicos encontrados`).should("be.visible");
  });

  it("REG-CAT-06 [ESC09] ordenar por precio ascendente deja los precios en orden no decreciente", () => {
    cy.visit("/catalogo");
    cy.wait("@productos");
    cy.get("#sort-by").select("precio-asc");
    tarjetas()
      .find("span.text-base.font-bold")
      .then(($precios) => {
        const valores = [...$precios].map((el) => aNumero(el.innerText));
        const ordenados = [...valores].sort((a, b) => a - b);
        expect(valores, "precios en pantalla").to.deep.equal(ordenados);
        const minimo = Math.min(...productos.map((p) => p.price));
        expect(valores[0], "el primero es el más barato del catálogo").to.eq(minimo);
      });
  });

  it("REG-CAT-07 [ESC09] ordenar por precio descendente pone primero el más caro", () => {
    const maximo = Math.max(...productos.map((p) => p.price));
    cy.visit("/catalogo");
    cy.wait("@productos");
    cy.get("#sort-by").select("precio-desc");
    tarjetas().first().find("span.text-base.font-bold").invoke("text").then((txt) => {
      expect(normalizar(txt)).to.eq(formatoCOP(maximo));
    });
  });

  it("REG-CAT-08 [ESC11] filtrar por categoría consulta al backend con ?category y solo muestra esa categoría", () => {
    cy.api("GET", "/categories").then(({ body }) => {
      const categoria = body.data.find((c: { slug: string }) => c.slug === "pinturas") ?? body.data[0];
      const esperados = productos.filter((p) => p.categorySlug === categoria.slug).length;
      cy.visit("/catalogo");
      cy.wait(["@categorias", "@productos"]);
      cy.contains("button", categoria.name).click();
      cy.wait("@productos").its("request.url").should("include", `category=${categoria.slug}`);
      cy.location("search").should("include", `category=${categoria.slug}`);
      cy.contains(`${esperados} productos técnicos encontrados`).should("be.visible");
      tarjetas().should("have.length", Math.min(25, esperados));
      tarjetas().each(($t) => {
        cy.wrap($t).find("p").first().should("have.text", categoria.name);
      });
    });
  });

  it("REG-CAT-09 [ESC11] la URL /catalogo?category=herramientas llega filtrada (enlace del footer)", () => {
    const esperados = productos.filter((p) => p.categorySlug === "herramientas").length;
    cy.visit("/catalogo?category=herramientas");
    cy.wait("@productos").its("request.url").should("include", "category=herramientas");
    cy.contains(`${esperados} productos técnicos encontrados`).should("be.visible");
  });

  it("REG-CAT-10 [ESC10] el detalle muestra nombre, precio, descripción y stock del producto", () => {
    const p = productos.find((x) => x.inStock) as ProductoApi;
    cy.intercept("GET", `**/api/v1/products/${p.id}`).as("detalle");
    cy.visit(`/catalogo/${p.id}`);
    cy.wait("@detalle").its("response.statusCode").should("eq", 200);

    cy.contains("h1", p.name).should("be.visible");
    cy.get("span.text-3xl").invoke("text").then((t) => expect(normalizar(t)).to.eq(formatoCOP(p.price)));
    cy.contains(p.description).should("be.visible");
    cy.contains(`En stock`).should("be.visible");
    cy.contains("button", "Agregar al Carrito").should("be.enabled");
  });

  it("REG-CAT-11 [ESC10] navega del catálogo al detalle al hacer clic en una tarjeta", () => {
    cy.visit("/catalogo");
    cy.wait("@productos");
    tarjetas().first().find("h3").invoke("text").then((nombre) => {
      tarjetas().first().click();
      cy.location("pathname").should("match", /^\/catalogo\/[a-z0-9]+$/);
      cy.contains("h1", nombre).should("be.visible");
    });
  });

  it("REG-CAT-12 [ESC10] un id inexistente muestra el mensaje de producto no encontrado", () => {
    cy.intercept("GET", "**/api/v1/products/no-existe-123").as("detalle");
    cy.visit("/catalogo/no-existe-123");
    cy.wait("@detalle").its("response.statusCode").should("eq", 404);
    cy.contains("No se encontraron productos coincidentes").should("be.visible");
  });

  it("REG-CAT-13 [ESC10] DEF-02: el breadcrumb de categoría usa ?cat= y el catálogo lo ignora (muestra todo)", () => {
    const p = productos.find((x) => x.categorySlug === "pinturas") ?? productos[0];
    cy.visit(`/catalogo/${p.id}`);
    cy.get("main nav a").eq(1).should("have.attr", "href", `/catalogo?cat=${p.categorySlug}`).click();
    cy.wait("@productos").its("request.url").should("not.include", "category=");
    cy.contains(`${productos.length} productos técnicos encontrados`).should("be.visible");
  });

  it("REG-CAT-14 [ESC12] la vitrina del inicio carga recomendados, ofertas y más vendidos", () => {
    cy.intercept("GET", "**/api/v1/products/storefront").as("vitrina");
    cy.visit("/");
    cy.wait("@vitrina").then(({ response }) => {
      const datos = response?.body.data;
      const secciones: [string, unknown[]][] = [
        ["Novedades & Recomendaciones", datos.recommended],
        ["Ofertas de la Semana", datos.offers],
        ["Productos más Vendidos", datos.bestSellers],
      ];
      secciones.forEach(([titulo, lista]) => {
        cy.contains("h2", titulo)
          .closest("section")
          .find('a[href^="/catalogo/"]')
          .should("have.length", lista.length);
      });
    });
  });
});
