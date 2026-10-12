// Regresión E2E · Checkout y pedidos
// ESC27 checkout · ESC28 creación del pedido · ESC29 consulta de pedidos

import type { ProductoApi, UsuarioPrueba } from "../../support/commands";
import { formatoCOP, normalizar } from "../../support/utilidades";

const ENVIO = 25000;
const ENVIO_DATOS = {
  "#phone": "3001234567",
  "#address": "Carrera 43A # 1-50",
  "#city": "Medellín",
  "#state": "Antioquia",
  "#zip": "050021",
};

function llenarEnvio() {
  Object.entries(ENVIO_DATOS).forEach(([selector, valor]) => {
    cy.get(selector).clear().type(valor);
  });
}

describe("Regresión · Checkout y pedidos (ESC27-ESC29)", () => {
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
    cy.crearUsuarioApi("checkout", { firstName: "Carla", lastName: "Checkout" }).then((u) => {
      usuario = u;
      cy.iniciarSesionConToken(u);
    });
    cy.intercept("GET", "**/api/v1/cart").as("carrito");
    cy.intercept("POST", "**/api/v1/orders").as("crearPedido");
  });

  it("REG-CHK-01 [ESC27] precarga los datos del usuario y resume el carrito con su total", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 2);
    cy.visit("/checkout");
    cy.wait("@carrito");

    cy.contains("h1", "Checkout").should("be.visible");
    cy.get("#first-name").should("have.value", "Carla");
    cy.get("#last-name").should("have.value", "Checkout");
    cy.get("#email").should("have.value", usuario.email);
    cy.get('input[name="payment"][value="card"]').should("be.checked");

    cy.contains("h2", "Resumen del Pedido").parent().within(() => {
      cy.contains(producto.name).should("be.visible");
      cy.contains("x2").should("be.visible");
    });
    const total = producto.price * 2 + ENVIO;
    cy.get('button[type="submit"]').invoke("text").then((t) => {
      expect(normalizar(t)).to.eq(`Pagar ${formatoCOP(total)}`);
    });
  });

  it("REG-CHK-02 [ESC27] con campos obligatorios vacíos el navegador bloquea el envío (required)", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 1);
    cy.visit("/checkout");
    cy.wait("@carrito");

    cy.get('button[type="submit"]').click();
    cy.get("#phone:invalid").should("exist");
    cy.get("#address:invalid").should("exist");
    cy.get("@crearPedido.all").should("have.length", 0);
  });

  it("REG-CHK-03 [ESC27] si se omite la validación nativa, la app advierte con un toast y no crea el pedido", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 1);
    cy.visit("/checkout");
    cy.wait("@carrito");

    // .submit() dispara el evento submit sin la validación de constraint del navegador.
    cy.get("form").submit();
    cy.get('[role="alert"]').should("contain.text", "Por favor completa todos los campos requeridos.");
    cy.get("@crearPedido.all").should("have.length", 0);
    cy.location("pathname").should("eq", "/checkout");
  });

  it("REG-CHK-04 [ESC28] con datos válidos crea el pedido ORD-YYYY-NNN, vacía el carrito y confirma", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 2);
    cy.visit("/checkout");
    cy.wait("@carrito");
    llenarEnvio();
    cy.get('input[name="payment"][value="pse"]').check();
    cy.get('button[type="submit"]').click();

    cy.wait("@crearPedido").then(({ request, response }) => {
      expect(request.body).to.include({
        paymentMethod: "pse",
        shippingAddress: ENVIO_DATOS["#address"],
        shippingCity: ENVIO_DATOS["#city"],
        shippingState: ENVIO_DATOS["#state"],
        shippingZip: ENVIO_DATOS["#zip"],
      });
      expect(response?.statusCode).to.eq(201);
      const pedido = response?.body.data;
      expect(pedido.orderNumber).to.match(new RegExp(`^ORD-${new Date().getFullYear()}-\\d{3,}$`));
      expect(pedido.status).to.eq("PENDIENTE");
      expect(pedido.subtotal).to.eq(producto.price * 2);
      expect(pedido.shippingCost).to.eq(ENVIO);
      expect(pedido.total).to.eq(pedido.subtotal + pedido.shippingCost);
    });
    cy.get('[role="alert"]').should("contain.text", "¡Pedido realizado con éxito!");
    // Observación OBS-01: tras pagar, la app redirige a /proyectos (no a la cuenta/pedidos).
    cy.location("pathname").should("eq", "/proyectos");
    cy.get('nav a[aria-label="Carrito"] span').should("not.exist");
    cy.api("GET", "/cart", { token: usuario.token }).its("body.data.items").should("have.length", 0);
  });

  it("REG-CHK-05 [ESC29] el pedido creado aparece en el historial de /cuenta y su detalle se puede abrir", () => {
    cy.agregarAlCarritoApi(usuario.token, producto.id, 1);
    cy.api("POST", "/orders", {
      token: usuario.token,
      body: { paymentMethod: "cash", shippingAddress: "Calle 10", shippingCity: "Cali", shippingState: "Valle", shippingZip: "760001" },
    }).then(({ body }) => {
      const numero = body.data.orderNumber as string;
      cy.intercept("GET", "**/api/v1/orders").as("pedidos");
      cy.intercept("GET", `**/api/v1/orders/${numero}`).as("detallePedido");
      cy.visit("/cuenta");
      cy.wait("@pedidos");

      cy.contains("h2", "Historial de Pedidos").should("be.visible");
      cy.contains("p", numero)
        .should("be.visible")
        .parent()
        .should("contain.text", "Pendiente");
      cy.contains("p", numero).closest("button").contains("Ver detalles de entrega").click();
      cy.wait("@detallePedido").its("response.statusCode").should("eq", 200);
      cy.get('[aria-modal="true"]').should("be.visible").and("contain.text", numero).and("contain.text", "Cali");
      cy.get('[aria-modal="true"]').find('button[aria-label="Cerrar modal"]').click();
      cy.get('[aria-modal="true"]').should("not.exist");
    });
  });

  it("REG-CHK-06 [ESC28] con el carrito vacío el backend rechaza el pedido y la app muestra el error", () => {
    cy.visit("/checkout");
    cy.wait("@carrito");
    // DEF-03: con el carrito vacío ya se cobra envío ($25.000) en el resumen y el botón.
    cy.get('button[type="submit"]').invoke("text").then((t) => {
      expect(normalizar(t)).to.eq(`Pagar ${formatoCOP(ENVIO)}`);
    });
    llenarEnvio();
    cy.get('button[type="submit"]').click();
    cy.wait("@crearPedido").its("response.statusCode").should("eq", 400);
    cy.get('[role="alert"]').should("contain.text", "El carrito está vacío");
    cy.location("pathname").should("eq", "/checkout");
  });
});
