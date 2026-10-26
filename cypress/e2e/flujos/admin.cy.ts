// Flujos E2E entre el administrador y los clientes (catálogo, pedidos e inventario)
//
// El administrador entra con el usuario sembrado y el cliente con uno creado por
// API; cy.session alterna entre ambos dentro de la misma prueba. Los productos
// son propios de la prueba y se eliminan al final.

import type { UsuarioPrueba } from "../../support/commands";
import { aNumero, formatoCOP } from "../../support/utilidades";
import { buscarYAbrir, evidencia, llenarEnvio } from "./comun";

const comoAdmin = () => cy.iniciarSesion(Cypress.env("adminEmail"), Cypress.env("adminPassword"));

/** El cliente compra `cantidad` unidades del producto por la interfaz y devuelve el número de pedido. */
function comprar(cliente: UsuarioPrueba, nombre: string, cantidad = 1) {
  cy.iniciarSesionConToken(cliente);
  cy.visit("/");
  buscarYAbrir(nombre);
  cy.contains("button", "Agregar al Carrito").click();
  cy.get('nav a[aria-label="Carrito"]').should("contain.text", "1").click();
  Cypress._.times(cantidad - 1, (i) => {
    cy.get('button[aria-label="+"]').click();
    cy.get('button[aria-label="+"]').siblings("span").should("have.text", String(i + 2));
  });
  cy.contains("a", "Ir a Pagar").click();
  llenarEnvio();
  cy.intercept("POST", "**/api/v1/orders").as("crearPedido");
  cy.get('button[type="submit"]').click();
  return cy.wait("@crearPedido").then(({ response }) => {
    expect(response?.statusCode).to.eq(201);
    return response?.body.data.orderNumber as string;
  });
}

/** Como admin, abre el pedido en /admin/pedidos y le cambia el estado. */
function cambiarEstado(numero: string, desde: string, hacia: string, etiqueta: string) {
  comoAdmin();
  cy.intercept("GET", "**/api/v1/orders?admin=true").as("pedidos");
  cy.intercept("PUT", "**/api/v1/orders/*/status").as("cambiarEstado");
  cy.visit("/admin/pedidos");
  cy.wait("@pedidos");
  cy.get(`#btn-view-order-${numero}`).click();
  cy.get("#select-order-status").should("have.value", desde).select(hacia);
  cy.wait("@cambiarEstado").its("response.statusCode").should("eq", 200);
  cy.get('[role="alert"]').should("contain.text", `Pedido #${numero} actualizado a ${etiqueta}`);
}

/** Como cliente, la cuenta muestra el pedido con ese estado. */
function clienteVeEstado(cliente: UsuarioPrueba, numero: string, etiqueta: string) {
  cy.iniciarSesionConToken(cliente);
  cy.visit("/cuenta");
  cy.contains("p", numero).parent().should("contain.text", etiqueta);
}

type Metrica = { label: string; value: string };

/** Como admin, abre el dashboard y devuelve sus métricas (las del backend, verificadas en pantalla). */
function metricasDashboard(adminToken: string) {
  comoAdmin();
  cy.visit("/admin");
  return cy.api("GET", "/admin/metrics", { token: adminToken }).then(({ body }) => {
    const metricas = body.data as Metrica[];
    metricas.forEach((m) => cy.contains("p", new RegExp(`^${m.label}$`)).parent().should("contain.text", m.value));
    const valor = (label: string) => aNumero(metricas.find((m) => m.label === label)!.value);
    return cy.wrap({ activos: valor("Pedidos Activos"), ventas: valor("Ventas del Mes") }, { log: false });
  });
}

describe("Flujos E2E · Administración ↔ clientes", () => {
  let adminToken = "";
  const creados: string[] = [];

  before(() => {
    cy.tokenApi(Cypress.env("adminEmail"), Cypress.env("adminPassword")).then((t) => {
      adminToken = t;
    });
  });

  after(() => {
    creados.forEach((id) => cy.api("DELETE", `/products/${id}`, { token: adminToken }));
  });

  it("FLU-13 [ESC06→ESC32→ESC09→ESC10] el admin publica, reprecia y retira un producto y el cliente ve cada cambio en el catálogo", () => {
    const nombre = `Taladro Flujo ${Date.now()}`;
    cy.intercept("POST", "**/api/v1/products").as("crear");
    cy.intercept("PUT", "**/api/v1/products/*").as("editar");
    cy.intercept("DELETE", "**/api/v1/products/*").as("eliminar");

    cy.crearUsuarioApi("flujo-catalogo", { firstName: "Tomás" }).then((cliente) => {
      // 1. Admin: menú de usuario → Panel Admin → Productos → nuevo producto
      comoAdmin();
      cy.visit("/");
      cy.get("nav").contains("button", "Admin").click();
      cy.contains("a", "Panel Admin").click();
      cy.location("pathname").should("eq", "/admin");
      cy.contains("a", "Productos").click();
      cy.get("#btn-add-product").click();
      cy.get("#input-name").type(nombre);
      cy.get("#input-description").type("Taladro percutor publicado desde el flujo E2E.");
      cy.get("#select-category option:not([disabled])").first().then(($o) => {
        cy.get("#select-category").select(String($o.val()));
      });
      cy.get("#select-unit").select("unidad");
      cy.get("#input-price").type("23000");
      cy.get("#input-stock").type("9");
      cy.get("#btn-submit-product").click();
      cy.wait("@crear").then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        const id = response?.body.data.id as string;
        creados.push(id);
        evidencia("FLU-13 1 producto publicado");

        // 2. Cliente: lo encuentra con su precio
        cy.iniciarSesionConToken(cliente);
        cy.visit("/");
        buscarYAbrir(nombre);
        cy.contains(formatoCOP(23000)).should("be.visible");

        // 3. Admin: le baja el precio
        comoAdmin();
        cy.visit("/admin/productos");
        cy.get('input[placeholder^="Buscar"]').type(nombre);
        cy.get(`#btn-edit-product-${id}`).click();
        cy.get("#input-price").clear().type("19900");
        cy.get("#btn-submit-product").click();
        cy.wait("@editar").its("response.statusCode").should("eq", 200);

        // 4. Cliente: ve el precio nuevo
        cy.iniciarSesionConToken(cliente);
        cy.visit("/");
        buscarYAbrir(nombre);
        cy.contains(formatoCOP(19900)).should("be.visible");
        cy.contains(formatoCOP(23000)).should("not.exist");
        evidencia("FLU-13 2 cliente ve el nuevo precio");

        // 5. Admin: lo retira
        comoAdmin();
        cy.visit("/admin/productos");
        cy.get('input[placeholder^="Buscar"]').type(nombre);
        cy.get(`#btn-delete-product-${id}`).click();
        cy.get("#btn-confirm-delete").click();
        cy.wait("@eliminar").its("response.statusCode").should("eq", 200);

        // 6. Cliente: ya no aparece ni por búsqueda ni por enlace directo
        cy.iniciarSesionConToken(cliente);
        cy.visit("/catalogo");
        cy.get("#search-bar").type(`${nombre}{enter}`);
        cy.contains("h3", nombre).should("not.exist");
        cy.visit(`/catalogo/${id}`);
        cy.contains("No se encontraron productos coincidentes").should("be.visible");
        evidencia("FLU-13 3 producto retirado");
      });
    });
  });

  it("FLU-14 [ESC28→ESC34→ESC29] un pedido recorre todos sus estados y el cliente sigue cada avance desde su cuenta", () => {
    cy.crearProductoApi(adminToken, { price: 33000 }).then((producto) => {
      creados.push(producto.id);
      cy.crearUsuarioApi("flujo-estados", { firstName: "Lía" }).then((cliente) => {
        comprar(cliente, producto.name).then((numero) => {
          clienteVeEstado(cliente, numero, "Pendiente");
          cambiarEstado(numero, "pendiente", "procesando", "Procesando");
          clienteVeEstado(cliente, numero, "Procesando");
          cambiarEstado(numero, "procesando", "enviado", "Enviado");
          clienteVeEstado(cliente, numero, "Enviado");
          cambiarEstado(numero, "enviado", "entregado", "Entregado");
          clienteVeEstado(cliente, numero, "Entregado");
          evidencia("FLU-14 1 pedido entregado");
        });
      });
    });
  });

  it("FLU-15 [ESC28→ESC33→ESC25→ESC26] DEF-30 corregido: el stock se agota, el admin lo ve en alertas, otro cliente compra en envío diferido y el stock negativo se marca como tal y sigue en 'Sin Stock'", () => {
    cy.crearProductoApi(adminToken, { price: 45000, stockQuantity: 2 }).then((producto) => {
      creados.push(producto.id);
      cy.crearUsuarioApi("flujo-agota-a", { firstName: "Ana" }).then((clienteA) => {
        cy.crearUsuarioApi("flujo-agota-b", { firstName: "Beto" }).then((clienteB) => {
          // 1. El cliente A compra todo el stock
          comprar(clienteA, producto.name, 2);
          cy.api("GET", `/products/${producto.id}`).its("body.data.stockQuantity").should("eq", 0);

          // 2. El admin lo ve como "Sin Stock" en el inventario
          comoAdmin();
          cy.visit("/admin/inventario");
          cy.get('select:has(option[value="out_of_stock"])').select("out_of_stock");
          cy.get('input[placeholder^="Buscar"]').type(producto.name);
          cy.contains("tr", producto.name).should("contain.text", "Sin Stock");
          evidencia("FLU-15 1 alerta sin stock");

          // 3. El cliente B lo compra igual, en envío diferido
          cy.iniciarSesionConToken(clienteB);
          cy.visit("/");
          buscarYAbrir(producto.name);
          cy.contains("Envío Diferido").should("be.visible");
          cy.contains("button", "Agregar al Carrito").click();
          cy.get('nav a[aria-label="Carrito"]').should("contain.text", "1").click();
          cy.contains("Envío Diferido (Backorder)").should("be.visible");
          evidencia("FLU-15 2 carrito en backorder");
          cy.contains("a", "Ir a Pagar").click();
          llenarEnvio();
          cy.intercept("POST", "**/api/v1/orders").as("pedidoB");
          cy.get('button[type="submit"]').click();
          cy.wait("@pedidoB").its("response.statusCode").should("eq", 201);
          cy.api("GET", `/products/${producto.id}`).its("body.data.stockQuantity").should("eq", 0);

          // 4. En el inventario queda en -1 (unidad comprometida sin stock): la interfaz lo
          // etiqueta "Stock negativo" (antes "Stock Bajo") y aparece en el filtro "Sin Stock".
          cy.api("GET", "/admin/inventory", { token: adminToken })
            .its("body.data.products")
            .then((lista: { id: string; stockQuantity: number; stockStatus: string }[]) => {
              expect(lista.find((x) => x.id === producto.id)).to.include({ stockQuantity: -1, stockStatus: "stock_negativo" });
            });
          comoAdmin();
          cy.visit("/admin/inventario");
          cy.get('select:has(option[value="out_of_stock"])').select("out_of_stock");
          cy.get('input[placeholder^="Buscar"]').type(producto.name);
          cy.contains("tr", producto.name).should("contain.text", "-1").and("contain.text", "Stock negativo").and("not.contain.text", "Stock Bajo");
          evidencia("FLU-15 3 stock negativo etiquetado");
        });
      });
    });
  });

  it("FLU-16 [ESC28→ESC34→ESC29] DEF-28 corregido: el admin cancela un pedido, el cliente lo ve cancelado y el stock vuelve al inventario", () => {
    cy.crearProductoApi(adminToken, { price: 28000, stockQuantity: 10 }).then((producto) => {
      creados.push(producto.id);
      cy.crearUsuarioApi("flujo-cancela", { firstName: "Ciro" }).then((cliente) => {
        comprar(cliente, producto.name, 3).then((numero) => {
          cy.api("GET", `/products/${producto.id}`).its("body.data.stockQuantity").should("eq", 7);
          cambiarEstado(numero, "pendiente", "cancelado", "Cancelado");
          clienteVeEstado(cliente, numero, "Cancelado");
          evidencia("FLU-16 1 pedido cancelado");
          // Las 3 unidades vuelven al inventario (antes se quedaba en 7).
          cy.api("GET", `/products/${producto.id}`).its("body.data.stockQuantity").should("eq", 10);
        });
      });
    });
  });

  it("FLU-21 [ESC31→ESC28→ESC34] el dashboard del admin suma el pedido nuevo como activo y, al entregarlo, como venta del mes", () => {
    cy.crearProductoApi(adminToken, { price: 47000 }).then((producto) => {
      creados.push(producto.id);
      cy.crearUsuarioApi("flujo-dashboard", { firstName: "Iris" }).then((cliente) => {
        metricasDashboard(adminToken).then((antes) => {
          evidencia("FLU-21 1 dashboard antes");
          comprar(cliente, producto.name).then((numero) => {
            metricasDashboard(adminToken).its("activos").should("eq", antes.activos + 1);
            cambiarEstado(numero, "pendiente", "entregado", "Entregado");
            metricasDashboard(adminToken).then((despues) => {
              expect(despues.activos, "pedidos activos").to.eq(antes.activos);
              expect(despues.ventas, "ventas del mes").to.eq(antes.ventas + 47000 + 25000);
            });
            evidencia("FLU-21 2 dashboard con la venta");
          });
        });
      });
    });
  });
});
