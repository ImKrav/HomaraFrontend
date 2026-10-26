// Regresión E2E · Carrito de compras
// ESC13 agregar · ESC14 modificar cantidad · ESC15 eliminar · ESC16 totales y envío

import type { ProductoApi, UsuarioPrueba } from "../../support/commands";
import { formatoCOP, normalizar } from "../../support/utilidades";

const ENVIO = 25000;
const UMBRAL_ENVIO_GRATIS = 500000;

/** Fila del resumen del carrito (Subtotal / Envío / Total) → texto del valor. */
function valorResumen(etiqueta: RegExp) {
  return cy
    .contains("h2", "Resumen del Pedido")
    .parent()
    .contains("span", etiqueta)
    .parent()
    .find("span")
    .last()
    .invoke("text")
    .then(normalizar);
}

describe("Regresión · Carrito (ESC13-ESC16)", () => {
  let producto: ProductoApi;
  let usuario: UsuarioPrueba;

  before(() => {
    cy.productosApi().then((lista) => {
      // Producto con stock holgado y precio < umbral, para que aplique el costo de envío.
      producto = lista
        .filter((p) => p.inStock && p.stockQuantity >= 50 && p.price < 200000)
        .sort((a, b) => a.price - b.price)[0];
      expect(producto, "producto apto para la prueba").to.have.property("id");
    });
  });

  beforeEach(() => {
    cy.crearUsuarioApi("carrito").then((u) => {
      usuario = u;
      cy.iniciarSesionConToken(u);
    });
    cy.intercept("GET", "**/api/v1/cart").as("carrito");
    cy.intercept("POST", "**/api/v1/cart/items").as("agregar");
    cy.intercept("PUT", "**/api/v1/cart/items/*").as("actualizar");
    cy.intercept("DELETE", "**/api/v1/cart/items/*").as("eliminar");
  });

  it("REG-CAR-01 [ESC13] agrega un producto desde el detalle: toast de éxito y contador del navbar en 1", () => {
    cy.visit(`/catalogo/${producto.id}`);
    cy.contains("h1", producto.name).should("be.visible");
    cy.contains("button", "Agregar al Carrito").click();

    cy.wait("@agregar").then(({ request, response }) => {
      expect(request.body).to.deep.equal({ productId: producto.id, quantity: 1 });
      expect(response?.statusCode).to.eq(201);
    });
    cy.get('[role="alert"]').should("contain.text", "Producto agregado al carrito exitosamente");
    cy.get('nav a[aria-label="Carrito"]').should("contain.text", "1");
  });

  it("REG-CAR-02 [ESC13] el carrito muestra el producto agregado con su precio unitario", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 1);
    cy.visit("/carrito");
    cy.wait("@carrito");

    cy.contains("h1", "Carrito de Compras").should("be.visible");
    cy.contains("h3", producto.name)
      .parent()
      .within(() => {
        cy.contains(`/ ${producto.unit}`)
          .invoke("text")
          .then((t) => expect(normalizar(t)).to.contain(formatoCOP(producto.price)));
        cy.get('button[aria-label="+"]').siblings("span").should("have.text", "1");
      });
  });

  it("REG-CAR-03 [ESC14] los botones + y − modifican la cantidad y recalculan el subtotal", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 1);
    cy.visit("/carrito");
    cy.wait("@carrito");

    cy.get('button[aria-label="+"]').click();
    cy.wait("@actualizar").its("request.body").should("deep.equal", { quantity: 2 });
    cy.wait("@carrito");
    cy.get('button[aria-label="+"]').siblings("span").should("have.text", "2");
    valorResumen(/^Subtotal/).should("eq", formatoCOP(producto.price * 2));

    cy.get('button[aria-label="-"]').click();
    cy.wait("@actualizar").its("request.body").should("deep.equal", { quantity: 1 });
    cy.get('button[aria-label="+"]').siblings("span").should("have.text", "1");
    valorResumen(/^Subtotal/).should("eq", formatoCOP(producto.price));
  });

  it("REG-CAR-04 [ESC14] el botón − no baja la cantidad de 1 (límite inferior)", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 1);
    cy.visit("/carrito");
    cy.wait("@carrito");

    cy.get('button[aria-label="-"]').click();
    cy.wait("@actualizar").its("request.body").should("deep.equal", { quantity: 1 });
    cy.get('button[aria-label="+"]').siblings("span").should("have.text", "1");
  });

  it("REG-CAR-05 [ESC15] eliminar el único ítem deja el carrito vacío y el contador en 0", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 2);
    cy.visit("/carrito");
    cy.wait("@carrito");
    cy.get('nav a[aria-label="Carrito"]').should("contain.text", "2");

    cy.get('button[aria-label="Eliminar"]').click();
    cy.wait("@eliminar").its("response.statusCode").should("eq", 200);
    cy.contains("h3", "Tu carrito está vacío").should("be.visible");
    cy.contains("a", "Ir al Catálogo").should("have.attr", "href", "/catalogo");
    cy.get('nav a[aria-label="Carrito"] span').should("not.exist");
  });

  it("REG-CAR-06 [ESC16] por debajo de $500.000 cobra envío de $25.000 y total = subtotal + envío", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 1);
    cy.visit("/carrito");
    cy.wait("@carrito").then(({ response }) => {
      const datos = response?.body.data;
      expect(datos.subtotal).to.eq(producto.price);
      expect(datos.shipping).to.eq(ENVIO);
      expect(datos.total).to.eq(datos.subtotal + datos.shipping);
    });
    valorResumen(/^Subtotal/).should("eq", formatoCOP(producto.price));
    valorResumen(/^Envío$/).should("eq", formatoCOP(ENVIO));
    valorResumen(/^Total$/).should("eq", formatoCOP(producto.price + ENVIO));
    cy.contains(`Envío gratis en compras mayores a`)
      .invoke("text")
      .then((t) => expect(normalizar(t)).to.contain(formatoCOP(UMBRAL_ENVIO_GRATIS)));
  });

  it("REG-CAR-07 [ESC16] desde $500.000 el envío es gratis y el total es igual al subtotal", () => {
    const cantidad = Math.ceil(UMBRAL_ENVIO_GRATIS / producto.price);
    cy.agregarAlCarritoApi(usuario.token, producto.id, cantidad);
    cy.visit("/carrito");
    cy.wait("@carrito").its("response.body.data.shipping").should("eq", 0);

    const subtotal = producto.price * cantidad;
    valorResumen(/^Subtotal/).should("eq", formatoCOP(subtotal));
    valorResumen(/^Envío$/).should("eq", "Gratis");
    valorResumen(/^Total$/).should("eq", formatoCOP(subtotal));
    cy.contains("Envío gratis en compras mayores a").should("not.exist");
  });

  it("REG-CAR-08 [ESC13] sin sesión, agregar al carrito responde 401 y redirige a /login", () => {
    // Esta prueba no usa la sesión: se descarta el token restaurado en el beforeEach.
    cy.clearAllLocalStorage();
    cy.visit(`/catalogo/${producto.id}`);
    cy.contains("button", "Agregar al Carrito").click();
    cy.wait("@agregar").its("response.statusCode").should("eq", 401);
    cy.location("pathname").should("eq", "/login");
  });
});
