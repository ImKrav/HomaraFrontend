// API · Proyectos y administración
// ESC17 crear proyecto · ESC19 consultar · ESC31-34 administración (autorización por rol)

import type { UsuarioPrueba } from "../../support/commands";

const PROYECTO_BASE = {
  type: "PISO", length: 4, width: 3, height: null, area: 12, materialType: "ceramica", tileFormat: "60x60",
  wastePercent: 10, layingPattern: "directo", deductDoors: 0, deductWindows: 0, customSubtractions: 0,
  includeAdhesive: true, includeGrout: true, includeSpacers: true, includeTools: true, selectedProductId: null,
};

describe("API · Proyectos (ESC17, ESC19)", () => {
  let usuario: UsuarioPrueba;

  beforeEach(() => {
    cy.crearUsuarioApi("api-proy").then((u) => {
      usuario = u;
    });
  });

  it("API-PRY-01 [ESC17] POST /projects sin token → 401", () => {
    cy.api("POST", "/projects", { body: { name: "X", ...PROYECTO_BASE } }).its("status").should("eq", 401);
  });

  it("API-PRY-02 [ESC17/ESC18] POST /projects válido → 201 EN_PROGRESO con materiales y costo estimado", () => {
    cy.api("POST", "/projects", { token: usuario.token, body: { name: "Sala API", ...PROYECTO_BASE } }).then(({ status, body }) => {
      expect(status).to.eq(201);
      const p = body.data;
      expect(p).to.include({ name: "Sala API", type: "PISO", status: "EN_PROGRESO", area: 12 });
      expect(p.materials).to.be.an("array").and.have.length.greaterThan(0);
      p.materials.forEach((m: Record<string, unknown>) => {
        expect(m).to.include.all.keys("name", "quantity", "price", "productId");
        expect(m.price as number).to.be.at.least(0);
      });
      const suma = p.materials.reduce((s: number, m: { price: number }) => s + m.price, 0);
      expect(p.estimatedCost, "costo estimado = suma de materiales").to.eq(suma);
    });
  });

  it("API-PRY-03 [ESC17] validaciones: nombre vacío y longitud negativa → 400", () => {
    cy.api("POST", "/projects", { token: usuario.token, body: { ...PROYECTO_BASE, name: "" } }).then((r) => {
      expect(r.status).to.eq(400);
      expect(r.body.error).to.match(/Nombre del proyecto es requerido/);
    });
    cy.api("POST", "/projects", { token: usuario.token, body: { ...PROYECTO_BASE, name: "Neg", length: -4, area: -12 } })
      .then((r) => {
        expect(r.status).to.eq(400);
        expect(r.body.error).to.match(/positiv/);
      });
  });

  it("API-PRY-04 [ESC19/ESC36] GET /projects lista solo los propios; otro usuario no puede modificar ni borrar", () => {
    cy.api("POST", "/projects", { token: usuario.token, body: { name: "Propio", ...PROYECTO_BASE } }).then(({ body }) => {
      const id = body.data.id;
      cy.api("GET", "/projects", { token: usuario.token }).its("body.data").should("have.length", 1);
      cy.api("GET", `/projects/${id}`, { token: usuario.token }).its("body.data.name").should("eq", "Propio");
      cy.crearUsuarioApi("api-proy-ajeno").then((otro) => {
        cy.api("GET", "/projects", { token: otro.token }).its("body.data").should("have.length", 0);
        cy.api("PUT", `/projects/${id}`, { token: otro.token, body: { name: "Ajeno" } }).its("status").should("eq", 403);
        cy.api("DELETE", `/projects/${id}`, { token: otro.token }).its("status").should("eq", 403);
      });
    });
  });

  it("API-PRY-06 [ESC19/ESC36] DEF-11: GET /projects/:id de OTRO usuario responde 200 con sus datos (IDOR)", () => {
    cy.api("POST", "/projects", { token: usuario.token, body: { name: "Privado", ...PROYECTO_BASE } }).then(({ body }) => {
      cy.crearUsuarioApi("api-proy-idor").then((otro) => {
        cy.api("GET", `/projects/${body.data.id}`, { token: otro.token }).then((r) => {
          // Debería ser 403/404 como ya ocurre en PUT y DELETE.
          expect(r.status).to.eq(200);
          expect(r.body.data).to.include({ name: "Privado", userId: usuario.id });
        });
      });
    });
  });

  it("API-PRY-05 [ESC19] DELETE /projects/:id elimina el proyecto propio", () => {
    cy.api("POST", "/projects", { token: usuario.token, body: { name: "Borrar", ...PROYECTO_BASE } }).then(({ body }) => {
      cy.api("DELETE", `/projects/${body.data.id}`, { token: usuario.token }).its("status").should("eq", 200);
      cy.api("GET", "/projects", { token: usuario.token }).its("body.data").should("have.length", 0);
    });
  });
});

describe("API · Administración (ESC31-ESC34)", () => {
  let cliente = "";
  let admin = "";

  before(() => {
    cy.tokenApi(Cypress.env("clienteEmail"), Cypress.env("clientePassword")).then((t) => {
      cliente = t;
    });
    cy.tokenApi(Cypress.env("adminEmail"), Cypress.env("adminPassword")).then((t) => {
      admin = t;
    });
  });

  ["/admin/metrics", "/admin/inventory"].forEach((ruta) => {
    it(`API-ADM-01 [ESC06/ESC31/ESC33] GET ${ruta}: sin token 401, CUSTOMER 403, ADMIN 200`, () => {
      cy.api("GET", ruta).its("status").should("eq", 401);
      cy.api("GET", ruta, { token: cliente }).then((r) => {
        expect(r.status).to.eq(403);
        expect(r.body.error).to.eq("Acceso denegado. Se requieren permisos de administrador.");
      });
      cy.api("GET", ruta, { token: admin }).then((r) => {
        expect(r.status).to.eq(200);
        expect(r.body.success).to.eq(true);
      });
    });
  });

  it("API-ADM-02 [ESC33] /admin/inventory: estadísticas coherentes con la lista de productos", () => {
    cy.api("GET", "/admin/inventory", { token: admin }).then(({ body }) => {
      const { stats, products } = body.data;
      expect(stats.totalProducts).to.eq(products.length);
      // Las compras en envío diferido (backorder) dejan stock negativo: el backend lo cuenta aparte.
      const contar = (cond: (q: number) => boolean) =>
        products.filter((p: { stockQuantity: number }) => cond(p.stockQuantity)).length;
      expect(stats.outOfStockCount).to.eq(contar((q) => q === 0));
      expect(stats.negativeStockCount).to.eq(contar((q) => q < 0));
      products.forEach((p: { stockValue: number; price: number; stockQuantity: number; stockStatus: string }) => {
        expect(p.stockValue).to.eq(p.price * p.stockQuantity);
        expect(p.stockStatus).to.be.oneOf(["sin_stock", "stock_bajo", "normal", "stock_negativo"]);
      });
    });
  });

  it("API-ADM-03 [ESC32] POST /products: CUSTOMER 403; ADMIN con datos incompletos 400; ADMIN válido 201 y DELETE 200", () => {
    const nombre = `Producto API ${Date.now()}`;
    cy.api("POST", "/products", { token: cliente, body: { name: nombre } }).its("status").should("eq", 403);
    cy.api("POST", "/products", { token: admin, body: { name: nombre } }).its("status").should("eq", 400);
    cy.api("GET", "/categories").then(({ body }) => {
      cy.api("POST", "/products", {
        token: admin,
        body: {
          name: nombre, description: "Creado por la suite API", price: 9900, originalPrice: null,
          stockQuantity: 3, unit: "unidad", categoryId: body.data[0].id, image: "/products/placeholder.jpg", tags: [],
        },
      }).then((r) => {
        expect(r.status).to.eq(201);
        expect(r.body.data).to.include({ name: nombre, price: 9900, stockQuantity: 3 });
        cy.api("DELETE", `/products/${r.body.data.id}`, { token: cliente }).its("status").should("eq", 403);
        cy.api("DELETE", `/products/${r.body.data.id}`, { token: admin }).its("status").should("eq", 200);
        cy.api("GET", `/products/${r.body.data.id}`).its("status").should("eq", 404);
      });
    });
  });
});
