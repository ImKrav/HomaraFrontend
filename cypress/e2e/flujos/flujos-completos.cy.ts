// Flujos E2E completos (de punta a punta, solo por la interfaz)
//
// A diferencia de las specs de regresión, que aíslan cada funcionalidad y
// preparan datos por API, estas recorren el viaje entero del usuario como lo
// haría una persona, encadenando las funcionalidades. Los datos que la prueba
// necesita de antemano (el producto del flujo 2) se crean por API y se borran.

import type { ProductoApi } from "../../support/commands";
import { claveDePrueba, correoUnico, formatoCOP, normalizar } from "../../support/utilidades";

const ENVIO = 25000;

/** Captura con nombre: evidencia de cada etapa del viaje en el reporte HTML. */
const evidencia = (nombre: string) => cy.screenshot(nombre, { capture: "viewport" });

describe("Flujos E2E completos", () => {
  it("FLU-01 [ESC01→ESC09→ESC13→ESC14→ESC27→ESC28→ESC29→ESC03] un visitante se registra, compra y consulta su pedido", () => {
    const email = correoUnico("flujo-compra");
    const clave = claveDePrueba();
    cy.intercept("GET", "**/api/v1/products*").as("productos");
    cy.intercept("POST", "**/api/v1/cart/items").as("agregar");
    cy.intercept("PUT", "**/api/v1/cart/items/*").as("actualizar");
    cy.intercept("POST", "**/api/v1/orders").as("crearPedido");

    cy.productosApi().then((lista) => {
      const producto = lista.filter((p) => p.inStock && p.stockQuantity >= 50 && p.price < 200000)[0];

      // 1. Registro
      cy.visit("/");
      cy.get("nav").contains("a", "Iniciar Sesión").click();
      cy.location("pathname").should("eq", "/login");
      cy.contains("a", /Regístrate|Crear cuenta/).click();
      cy.location("pathname").should("eq", "/register");
      cy.get('input[placeholder="Juan"]').type("Flor");
      cy.get('input[placeholder="Pérez"]').type("Flujo");
      cy.get('input[placeholder="juan@email.com"]').type(email);
      cy.get('input[placeholder="Mínimo 8 caracteres"]').type(clave, { log: false });
      cy.get('input[placeholder="Repite la contraseña"]').type(clave, { log: false });
      cy.contains("button", "Registrarme y Comenzar").click();
      cy.location("pathname").should("eq", "/cuenta");
      cy.contains("h2", "Flor Flujo").should("be.visible");
      evidencia("FLU-01 1 registro");

      // 2. Búsqueda y detalle
      cy.get("nav").contains("a", "Catálogo").click();
      cy.wait("@productos");
      cy.get("#search-bar").type(`${producto.name}{enter}`);
      cy.contains("Resultados para:").should("contain.text", producto.name);
      cy.contains("h3", producto.name).click();
      cy.location("pathname").should("eq", `/catalogo/${producto.id}`);
      cy.contains("h1", producto.name).should("be.visible");
      evidencia("FLU-01 2 detalle");

      // 3. Carrito: agregar y subir la cantidad a 2
      cy.contains("button", "Agregar al Carrito").click();
      cy.wait("@agregar").its("response.statusCode").should("eq", 201);
      cy.get('nav a[aria-label="Carrito"]').should("contain.text", "1").click();
      cy.location("pathname").should("eq", "/carrito");
      cy.get('button[aria-label="+"]').click();
      cy.wait("@actualizar").its("request.body").should("deep.equal", { quantity: 2 });
      cy.get('button[aria-label="+"]').siblings("span").should("have.text", "2");
      evidencia("FLU-01 3 carrito");

      // 4. Checkout y pedido
      cy.contains("a", "Ir a Pagar").click();
      cy.location("pathname").should("eq", "/checkout");
      cy.get("#email").should("have.value", email);
      cy.get('button[type="submit"]').invoke("text").then((t) => {
        expect(normalizar(t)).to.eq(`Pagar ${formatoCOP(producto.price * 2 + ENVIO)}`);
      });
      cy.get("#phone").type("3105550000");
      cy.get("#address").type("Calle 26 # 13-19");
      cy.get("#city").type("Bogotá");
      cy.get("#state").type("Cundinamarca");
      cy.get("#zip").type("110311");
      evidencia("FLU-01 4 checkout");
      cy.get('button[type="submit"]').click();
      cy.wait("@crearPedido").then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        expect(response?.body.data.total).to.eq(producto.price * 2 + ENVIO);
        cy.wrap(response?.body.data.orderNumber as string).as("numero");
      });
      cy.get('[role="alert"]').should("contain.text", "¡Pedido realizado con éxito!");
      cy.get('nav a[aria-label="Carrito"] span').should("not.exist");

      // 5. Historial en la cuenta
      cy.get("nav").contains("button", "Flor").click();
      cy.contains("a", "Mi Cuenta").click();
      cy.location("pathname").should("eq", "/cuenta");
      cy.get<string>("@numero").then((numero) => {
        cy.contains("p", numero).should("be.visible").parent().should("contain.text", "Pendiente");
      });
      cy.contains("p", /^Pedidos$/).parent().should("contain.text", "1");
      evidencia("FLU-01 5 historial");

      // 6. Cierre de sesión
      cy.get("main").contains("button", "Cerrar Sesión").click();
      cy.location("pathname").should("eq", "/login");
      cy.getCookie("homara_session").should("be.null");
    });
  });

  context("FLU-02 · Ciclo cliente ↔ administrador", () => {
    let adminToken = "";
    let producto: ProductoApi;

    before(() => {
      cy.tokenApi(Cypress.env("adminEmail"), Cypress.env("adminPassword")).then((t) => {
        adminToken = t;
        cy.crearProductoApi(t, { stockQuantity: 5, price: 42000 }).then((p) => {
          producto = p;
        });
      });
    });

    after(() => {
      cy.api("DELETE", `/products/${producto.id}`, { token: adminToken });
    });

    it("FLU-02 [ESC33→ESC13→ESC28→ESC34→ESC29] el admin ve el stock, el cliente compra y el admin despacha el pedido", () => {
      cy.intercept("POST", "**/api/v1/orders").as("crearPedido");
      cy.intercept("PUT", "**/api/v1/orders/*/status").as("cambiarEstado");

      // 1. El admin revisa el inventario del producto nuevo
      cy.iniciarSesion(Cypress.env("adminEmail"), Cypress.env("adminPassword"));
      cy.visit("/admin/inventario");
      // La tabla pagina de a 25: se filtra por nombre para no depender de la posición.
      cy.get('input[placeholder^="Buscar"]').type(producto.name);
      cy.contains("tr", producto.name).should("be.visible").and("contain.text", "5");
      evidencia("FLU-02 1 inventario admin");

      // 2. Un cliente nuevo lo compra por la interfaz
      cy.crearUsuarioApi("flujo-admin", { firstName: "Cleo", lastName: "Cliente" }).then((cliente) => {
        cy.iniciarSesionConToken(cliente);
        cy.visit(`/catalogo/${producto.id}`);
        cy.contains("En stock (5 disponibles)").should("be.visible");
        cy.contains("button", "Agregar al Carrito").click();
        cy.get('[role="alert"]').should("contain.text", "Producto agregado al carrito exitosamente");
        cy.visit("/checkout");
        cy.get("#phone").type("3201112233");
        cy.get("#address").type("Carrera 7 # 40-62");
        cy.get("#city").type("Bogotá");
        cy.get("#state").type("Cundinamarca");
        cy.get("#zip").type("110231");
        cy.get('button[type="submit"]').click();
        cy.wait("@crearPedido").then(({ response }) => {
          expect(response?.statusCode).to.eq(201);
          const numero = response?.body.data.orderNumber as string;

          // 3. El admin lo encuentra y lo marca como Enviado
          cy.iniciarSesion(Cypress.env("adminEmail"), Cypress.env("adminPassword"));
          cy.visit("/admin/pedidos");
          cy.get(`#btn-view-order-${numero}`).click();
          cy.get("#select-order-status").should("have.value", "pendiente").select("enviado");
          cy.wait("@cambiarEstado").its("response.statusCode").should("eq", 200);
          cy.get('[role="alert"]').should("contain.text", `Pedido #${numero} actualizado a Enviado`);
          evidencia("FLU-02 2 pedido enviado");

          // 4. El stock bajó y el cliente ve el nuevo estado en su cuenta
          cy.api("GET", `/products/${producto.id}`).its("body.data.stockQuantity").should("eq", 4);
          cy.iniciarSesionConToken(cliente);
          cy.visit("/cuenta");
          cy.contains("p", numero).parent().should("contain.text", "Enviado");
          evidencia("FLU-02 3 cliente ve enviado");
        });
      });
    });
  });
});
