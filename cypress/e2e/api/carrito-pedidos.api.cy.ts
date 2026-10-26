// API · Carrito y pedidos
// ESC13-16 carrito y totales · ESC28 crear pedido · ESC29 consultar pedidos · ESC34 estado

import type { ProductoApi, UsuarioPrueba } from "../../support/commands";

const ENVIO = 25000;
const UMBRAL = 500000;

describe("API · Carrito y pedidos (ESC13-ESC16, ESC28, ESC29, ESC34)", () => {
  let producto: ProductoApi;
  let usuario: UsuarioPrueba;

  before(() => {
    cy.productosApi().then((lista) => {
      producto = lista
        .filter((p) => p.inStock && p.stockQuantity >= 50 && p.price < 200000)
        .sort((a, b) => a.price - b.price)[0];
    });
  });

  beforeEach(() => {
    cy.crearUsuarioApi("api-carrito").then((u) => {
      usuario = u;
    });
  });

  it("API-CAR-01 [ESC13] GET /cart sin token → carrito invitado vacío; POST /cart/items sin token → 401", () => {
    cy.api("GET", "/cart").then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.data).to.include({ id: "guest", subtotal: 0, total: 0, itemCount: 0 });
    });
    cy.api("POST", "/cart/items", { body: { productId: producto.id, quantity: 1 } }).its("status").should("eq", 401);
  });

  it("API-CAR-02 [ESC13] POST /cart/items → 201 y el carrito refleja ítem, subtotal, envío y total", () => {
    cy.api("POST", "/cart/items", { token: usuario.token, body: { productId: producto.id, quantity: 2 } }).then((r) => {
      expect(r.status).to.eq(201);
      expect(r.body.data).to.include({ quantity: 2, productId: producto.id });
    });
    cy.api("GET", "/cart", { token: usuario.token }).then(({ body }) => {
      const c = body.data;
      expect(c.items).to.have.length(1);
      expect(c.items[0]).to.include.all.keys("id", "quantity", "product", "isBackorder", "availableStock");
      expect(c.subtotal).to.eq(producto.price * 2);
      expect(c.shipping).to.eq(ENVIO);
      expect(c.total).to.eq(c.subtotal + c.shipping);
    });
  });

  it("API-CAR-03 [ESC13] validaciones: productId inválido y cantidades 0 / negativas → 400", () => {
    const casos = [
      { productId: "no-existe", quantity: 1 },
      { productId: producto.id, quantity: 0 },
      { productId: producto.id, quantity: -3 },
    ];
    casos.forEach((body) => {
      cy.api("POST", "/cart/items", { token: usuario.token, body }).then((r) => {
        expect(r.status, JSON.stringify(body)).to.eq(400);
        expect(r.body.success).to.eq(false);
      });
    });
  });

  it("API-CAR-04 [ESC14/15] PUT cambia la cantidad (0 → 400) y DELETE elimina el ítem", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 1);
    cy.api("GET", "/cart", { token: usuario.token }).then(({ body }) => {
      const itemId = body.data.items[0].id;
      cy.api("PUT", `/cart/items/${itemId}`, { token: usuario.token, body: { quantity: 4 } })
        .its("body.data.quantity").should("eq", 4);
      cy.api("PUT", `/cart/items/${itemId}`, { token: usuario.token, body: { quantity: 0 } })
        .its("status").should("eq", 400);
      cy.api("DELETE", `/cart/items/${itemId}`, { token: usuario.token }).its("status").should("eq", 200);
      cy.api("GET", "/cart", { token: usuario.token }).its("body.data.items").should("have.length", 0);
    });
  });

  it("API-CAR-05 [ESC16] envío gratis cuando el subtotal alcanza $500.000 (regla de negocio)", () => {
    const cantidad = Math.ceil(UMBRAL / producto.price);
    cy.agregarAlCarritoApi(usuario.token, producto.id, cantidad);
    cy.api("GET", "/cart", { token: usuario.token }).then(({ body }) => {
      expect(body.data.subtotal).to.be.at.least(UMBRAL);
      expect(body.data.shipping).to.eq(0);
      expect(body.data.total).to.eq(body.data.subtotal);
    });
  });

  it("API-CAR-06 [ESC16] DEF-03 corregido: un carrito vacío no cobra envío", () => {
    cy.api("GET", "/cart", { token: usuario.token }).then(({ body }) => {
      expect(body.data.items).to.have.length(0);
      expect(body.data.subtotal).to.eq(0);
      expect(body.data.shipping).to.eq(0);
      expect(body.data.total).to.eq(0);
    });
  });

  it("API-CAR-07 [ESC13] DEF-09/DEF-21 corregidos: los ítems de GET /cart traen su categoría real y updatedAt", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 1);
    cy.api("GET", "/cart", { token: usuario.token }).then(({ body }) => {
      expect(body.data.items[0].product.categorySlug).to.eq(producto.categorySlug);
      expect(body.data.items[0].product.category).to.eq(producto.category);
      expect(Date.parse(body.data.items[0].updatedAt)).to.be.closeTo(Date.now(), 5 * 60 * 1000);
    });
  });

  it("API-PED-01 [ESC28] POST /orders con carrito vacío → 400 'El carrito está vacío'", () => {
    cy.api("POST", "/orders", {
      token: usuario.token,
      body: { paymentMethod: "card", shippingAddress: "Calle 1", shippingCity: "Bogotá", shippingState: "Cundinamarca" },
    }).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(body.error).to.eq("El carrito está vacío");
    });
  });

  it("API-PED-02 [ESC28/29] POST /orders → 201 ORD-YYYY-NNN, PENDIENTE, totales correctos y aparece en GET /orders", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 3);
    cy.api("POST", "/orders", {
      token: usuario.token,
      body: { paymentMethod: "pse", shippingAddress: "Calle 2", shippingCity: "Bogotá", shippingState: "Cundinamarca", shippingZip: "110111" },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      const o = body.data;
      expect(o.orderNumber).to.match(new RegExp(`^ORD-${new Date().getFullYear()}-\\d{3,}$`));
      expect(o.status).to.eq("PENDIENTE");
      expect(o.subtotal).to.eq(producto.price * 3);
      expect(o.shippingCost).to.eq(o.subtotal >= UMBRAL ? 0 : ENVIO);
      expect(o.total).to.eq(o.subtotal + o.shippingCost);
      expect(o.items).to.have.length(1);

      cy.api("GET", "/orders", { token: usuario.token }).then((lista) => {
        expect(lista.body.data).to.have.length(1);
        expect(lista.body.data[0]).to.include({ id: o.orderNumber, dbId: o.id, status: "pendiente", total: o.total });
      });
      cy.api("GET", `/orders/${o.orderNumber}`, { token: usuario.token }).its("status").should("eq", 200);
      cy.api("GET", "/cart", { token: usuario.token }).its("body.data.items").should("have.length", 0);
    });
  });

  it("API-PED-03 [ESC29/ESC36] DEF-10 corregido: GET /orders?admin=true con un CUSTOMER solo devuelve sus pedidos", () => {
    cy.api("GET", "/orders", { token: usuario.token }).its("body.data").should("have.length", 0);
    cy.api("GET", "/orders?admin=true", { token: usuario.token }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.data, "sin pedidos ajenos").to.have.length(0);
    });
  });

  it("API-PED-05 [ESC29/ESC36] DEF-10 corregido: GET /orders/:numero de un pedido AJENO responde 403", () => {
    cy.crearUsuarioApi("api-ped-dueno").then((dueno) => {
      cy.agregarAlCarritoApi(dueno.token, producto.id, 1);
      cy.api("POST", "/orders", {
        token: dueno.token,
        body: { paymentMethod: "card", shippingAddress: "Dirección privada 123", shippingCity: "Neiva", shippingState: "Huila" },
      }).then(({ body }) => {
        cy.api("GET", `/orders/${body.data.orderNumber}`, { token: usuario.token }).then((r) => {
          // Antes: 200 con la dirección de envío ajena.
          expect(r.status).to.eq(403);
          expect(r.body).not.to.have.property("data");
        });
      });
    });
  });

  it("API-PED-04 [ESC06/ESC34] PUT /orders/:id/status: CUSTOMER → 403; ADMIN → 200 (pedido propio de la prueba)", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 1);
    cy.api("POST", "/orders", {
      token: usuario.token,
      body: { paymentMethod: "cash", shippingAddress: "Calle 3", shippingCity: "Cali", shippingState: "Valle" },
    }).then(({ body }) => {
      const dbId = body.data.id;
      cy.api("PUT", `/orders/${dbId}/status`, { token: usuario.token, body: { status: "ENVIADO" } })
        .its("status").should("eq", 403);
      cy.tokenApi(Cypress.env("adminEmail"), Cypress.env("adminPassword")).then((admin) => {
        cy.api("PUT", `/orders/${dbId}/status`, { token: admin, body: { status: "ENVIADO" } }).then((r) => {
          expect(r.status).to.eq(200);
          expect(String(r.body.data.status).toUpperCase()).to.eq("ENVIADO");
        });
        cy.api("PUT", `/orders/${dbId}/status`, { token: admin, body: { status: "INVENTADO" } })
          .its("status").should("eq", 400);
      });
    });
  });
});
