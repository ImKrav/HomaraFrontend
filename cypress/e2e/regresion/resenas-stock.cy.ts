// Regresión E2E · Reseñas, reserva temporal de stock y pedido pendiente (backorder)
// ESC30 calificar producto · ESC25 reservar stock temporal · ESC26 marcar pedido pendiente
//
// Para no alterar el rating ni el stock de los productos sembrados, cada prueba
// crea su propio producto (como ADMIN, por API) y lo elimina al terminar.

import type { ProductoApi, UsuarioPrueba } from "../../support/commands";

describe("Regresión · Reseñas y stock (ESC25, ESC26, ESC30)", () => {
  let adminToken = "";
  let producto: ProductoApi;
  let usuario: UsuarioPrueba;

  before(() => {
    cy.tokenApi(Cypress.env("adminEmail"), Cypress.env("adminPassword")).then((t) => {
      adminToken = t;
    });
  });

  beforeEach(() => {
    cy.crearProductoApi(adminToken, { stockQuantity: 2 }).then((p) => {
      producto = p;
    });
    cy.crearUsuarioApi("resenas", { firstName: "Rita", lastName: "Reseña" }).then((u) => {
      usuario = u;
    });
  });

  afterEach(() => {
    cy.vaciarCarritoApi(usuario.token);
    cy.api("DELETE", `/products/${producto.id}`, { token: adminToken });
  });

  it("REG-RES-01 [ESC30] sin sesión, la sección de reseñas invita a iniciar sesión", () => {
    cy.visit(`/catalogo/${producto.id}`);
    cy.contains("h2, h3", "Valoraciones y Opiniones").should("exist");
    cy.contains("Debes iniciar sesión para compartir tu experiencia con este producto.").should("be.visible");
    cy.get("#comment").should("not.exist");
    cy.contains("Aún no hay opiniones sobre este producto.").should("be.visible");
  });

  it("REG-RES-02 [ESC30] calificar exige estrellas; con 4 estrellas publica la reseña y actualiza el promedio", () => {
    cy.iniciarSesionConToken(usuario);
    cy.intercept("POST", `**/api/v1/products/${producto.id}/reviews`).as("resena");
    cy.visit(`/catalogo/${producto.id}`);
    cy.get("#comment").should("be.visible");

    cy.contains("button", "Publicar Opinión").click();
    cy.contains("Por favor, selecciona una calificación.").should("be.visible");
    cy.get("@resena.all").should("have.length", 0);

    cy.contains("label", "Tu Calificación").parent().find("button").eq(3).click();
    cy.get("#comment").type("Muy buena herramienta para la obra.");
    cy.contains("button", "Publicar Opinión").click();
    cy.wait("@resena").then(({ request, response }) => {
      expect(request.body).to.include({ rating: 4, comment: "Muy buena herramienta para la obra." });
      expect(response?.statusCode).to.be.oneOf([200, 201]);
    });
    // "¡Reseña publicada con éxito!" solo vive hasta que fetchReviews() recarga la
    // lista (OBS-04): se verifica el estado final estable en su lugar.
    cy.contains("✓ Producto Calificado").should("be.visible");
    cy.contains("Ya has enviado tu valoración para este artículo técnico.").should("be.visible");
    cy.get("#comment").should("not.exist");
    cy.contains('"Muy buena herramienta para la obra."').should("be.visible");
    cy.api("GET", `/products/${producto.id}`).its("body.data").should("include", { rating: 4, reviews: 1 });
  });

  it("REG-RES-03 [ESC30] DEF-20 corregido: las estrellas forman un grupo de radio con nombre y estado", () => {
    cy.iniciarSesionConToken(usuario);
    cy.visit(`/catalogo/${producto.id}`);
    cy.get('[role="radiogroup"]').find('[role="radio"]').should("have.length", 5).each(($b, i) => {
      expect($b.attr("aria-label")).to.eq(i === 0 ? "1 estrella" : `${i + 1} estrellas`);
      expect($b.attr("aria-checked")).to.eq("false");
    });
    cy.get('[role="radio"][aria-label="4 estrellas"]').click().should("have.attr", "aria-checked", "true");
  });

  it("REG-STK-01 [ESC25/ESC28] la reserva descuenta el stock visible en el catálogo y el pedido lo consume", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 1);
    cy.api("GET", "/cart", { token: usuario.token }).its("body.data.items.0.isBackorder").should("eq", false);
    // Stock 2 → 1 visible para los demás mientras dura la reserva.
    cy.visit(`/catalogo/${producto.id}`);
    cy.contains("En stock (1 disponibles)").should("be.visible");
    cy.api("POST", "/orders", {
      token: usuario.token,
      body: { paymentMethod: "card", shippingAddress: "Calle Stock", shippingCity: "Tunja", shippingState: "Boyacá" },
    }).its("status").should("eq", 201);
    cy.api("GET", `/products/${producto.id}`).its("body.data.stockQuantity").should("eq", 1);
  });

  it("REG-STK-03 [ESC25] DEF-21 corregido: el carrito muestra la cuenta regresiva de la reserva (la API envía updatedAt)", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 1);
    cy.api("GET", "/cart", { token: usuario.token }).its("body.data.items.0").should("have.property", "updatedAt");
    cy.iniciarSesionConToken(usuario);
    cy.visit("/carrito");
    cy.contains("h3", producto.name).should("be.visible");
    // CartItem pinta "Stock reservado por: mm:ss" cuando recibe updatedAt (ver CMP-CIT-04).
    cy.contains(/Stock reservado por:\s*1[0-4]:\d{2}/).should("be.visible");
  });

  it("REG-STK-02 [ESC26] pedir más unidades que el stock marca el ítem como envío diferido (backorder)", () => {
    // Stock 2, se piden 5 → 3 unidades quedan como pedido pendiente.
    cy.agregarAlCarritoApi(usuario.token, producto.id, 5);
    cy.api("GET", "/cart", { token: usuario.token }).its("body.data.items.0").should("include", {
      isBackorder: true,
      backorderQuantity: 3,
    });
    cy.iniciarSesionConToken(usuario);
    cy.visit("/carrito");
    cy.contains("Algunos artículos no tienen stock inmediato").should("be.visible");
    cy.contains("span", "Envío diferido: 3 ud").should("be.visible");
  });
});
