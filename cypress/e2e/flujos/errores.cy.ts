// Flujos E2E alternativos y de error: el usuario se equivoca, el servidor falla
// o la sesión vence a mitad del camino, y el flujo debe poder recuperarse.

import { claveDePrueba, correoUnico } from "../../support/utilidades";
import { buscarYAbrir, evidencia, llenarEnvio } from "./comun";

describe("Flujos E2E · Errores y recuperación", () => {
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

  it("FLU-17 [ESC27→ESC28→ESC41] el pago falla por un error del servidor, el carrito se conserva y el reintento crea el pedido", () => {
    cy.crearProductoApi(adminToken, { price: 26000 }).then((producto) => {
      creados.push(producto.id);
      cy.crearUsuarioApi("flujo-reintento", { firstName: "Raúl" }).then((usuario) => {
        cy.iniciarSesionConToken(usuario);
        cy.visit("/");
        buscarYAbrir(producto.name);
        cy.contains("button", "Agregar al Carrito").click();
        cy.get('nav a[aria-label="Carrito"]').should("contain.text", "1").click();
        cy.contains("a", "Ir a Pagar").click();
        llenarEnvio();

        // 1. El primer intento recibe un 503 del servidor; los siguientes llegan al backend real
        let intentos = 0;
        cy.intercept("POST", "**/api/v1/orders", (req) => {
          intentos += 1;
          if (intentos === 1) req.reply({ statusCode: 503, body: { success: false, error: "Servicio de pagos no disponible" } });
        }).as("pedido");
        cy.get('button[type="submit"]').click();
        cy.wait("@pedido").its("response.statusCode").should("eq", 503);
        cy.get('[role="alert"]').should("contain.text", "Servicio de pagos no disponible");
        cy.location("pathname").should("eq", "/checkout");
        cy.get("#address").should("have.value", "Carrera 43A # 1-50");
        cy.api("GET", "/cart", { token: usuario.token }).its("body.data.items").should("have.length", 1);
        evidencia("FLU-17 1 pago fallido");

        // 2. El reintento crea el pedido
        cy.get('button[type="submit"]').click();
        cy.wait("@pedido").its("response.statusCode").should("eq", 201);
        cy.get('[role="alert"]').should("contain.text", "¡Pedido realizado con éxito!");
        cy.api("GET", "/cart", { token: usuario.token }).its("body.data.items").should("have.length", 0);
        cy.api("GET", "/orders", { token: usuario.token }).its("body.data").should("have.length", 1);
      });
    });
  });

  it("FLU-18 [ESC07→ESC02→ESC13→ESC28] la sesión vence con productos en el carrito; tras volver a entrar el carrito sigue ahí y la compra termina", () => {
    cy.crearProductoApi(adminToken, { price: 31000 }).then((producto) => {
      creados.push(producto.id);
      cy.crearUsuarioApi("flujo-vence", { firstName: "Vicente" }).then((usuario) => {
        cy.iniciarSesionConToken(usuario);
        cy.visit("/");
        buscarYAbrir(producto.name);
        cy.contains("button", "Agregar al Carrito").click();
        cy.get('nav a[aria-label="Carrito"]').should("contain.text", "1");

        // 1. La cookie de sesión vence (se reemplaza por uno vencido) y el usuario vuelve otro día
        const hace2h = Math.floor(Date.now() / 1000) - 7200;
        cy.task("firmarJwt", {
          payload: { id: usuario.id, email: usuario.email, role: "CUSTOMER", iat: hace2h, exp: hace2h + 60 },
          secreto: Cypress.env("jwtSecretoPorDefecto"),
        }).then((vencido) => {
          cy.setCookie("homara_session", vencido as string, { httpOnly: true, sameSite: "strict" });
        });
        cy.intercept("GET", "**/api/v1/users/session").as("sesion");
        cy.visit("/carrito");
        cy.wait("@sesion").its("response.body.data").should("be.null");
        cy.getCookie("homara_session").should("be.null");
        cy.get("nav").contains("a", "Iniciar Sesión").should("be.visible");
        evidencia("FLU-18 1 sesión vencida");

        // 2. Vuelve a entrar y el carrito guardado en el servidor sigue con su producto
        cy.get("nav").contains("a", "Iniciar Sesión").click();
        cy.get("#email").type(usuario.email);
        cy.get("#password").type(usuario.password, { log: false });
        cy.get("form").find('button[type="submit"]').click();
        cy.contains("h1", "Mi Cuenta").should("be.visible");
        cy.get('nav a[aria-label="Carrito"]').should("contain.text", "1").click();
        cy.contains("h3", producto.name).should("be.visible");

        // 3. Termina la compra
        cy.contains("a", "Ir a Pagar").click();
        llenarEnvio();
        cy.intercept("POST", "**/api/v1/orders").as("pedido");
        cy.get('button[type="submit"]').click();
        cy.wait("@pedido").its("response.statusCode").should("eq", 201);
        evidencia("FLU-18 2 compra tras volver a entrar");
      });
    });
  });

  it("FLU-19 [ESC01→ESC17→ESC04] el registro falla tres veces por datos inválidos, el usuario corrige y crea su primer proyecto", () => {
    const clave = claveDePrueba();
    const email = correoUnico("flujo-registro");
    const campo = (placeholder: string) => cy.get(`input[placeholder="${placeholder}"]`);
    cy.intercept("POST", "**/api/v1/users/register").as("registro");
    cy.intercept("POST", "**/api/v1/projects").as("crearProyecto");

    cy.visit("/register");
    campo("Juan").type("Gael");
    campo("Pérez").type("Gómez");
    campo("juan@email.com").type(Cypress.env("clienteEmail"));

    // 1. Clave demasiado corta (validación del cliente)
    campo("Mínimo 8 caracteres").type(clave.slice(0, 5), { log: false });
    campo("Repite la contraseña").type(clave.slice(0, 5), { log: false });
    cy.contains("button", "Registrarme y Comenzar").click();
    cy.contains("La contraseña debe tener al menos 8 caracteres.").should("be.visible");

    // 2. Las contraseñas no coinciden
    campo("Mínimo 8 caracteres").clear().type(clave, { log: false });
    campo("Repite la contraseña").clear().type(`${clave}x`, { log: false });
    cy.contains("button", "Registrarme y Comenzar").click();
    cy.contains("Las contraseñas no coinciden.").should("be.visible");
    cy.get("@registro.all").should("have.length", 0);

    // 3. Correo ya registrado (lo rechaza el backend)
    campo("Repite la contraseña").clear().type(clave, { log: false });
    cy.contains("button", "Registrarme y Comenzar").click();
    cy.wait("@registro").its("response.statusCode").should("eq", 400);
    cy.contains("El correo electrónico ya está registrado.").should("be.visible");
    evidencia("FLU-19 1 correo duplicado");

    // 4. Corrige el correo y se registra
    campo("juan@email.com").clear().type(email);
    cy.contains("button", "Registrarme y Comenzar").click();
    cy.wait("@registro").its("response.statusCode").should("eq", 201);
    cy.location("pathname").should("eq", "/cuenta");
    cy.contains("h2", "Gael Gómez").should("be.visible");

    // 5. Crea su primer proyecto y la cuenta lo cuenta
    cy.get("nav").contains("a", "Mis Proyectos").click();
    cy.contains("Crear nuevo proyecto").click();
    cy.get("#project-name").type("Terraza");
    cy.get("#length").type("5");
    cy.get("#width").type("4");
    cy.contains("button", "Guardar y Calcular Insumos").click();
    cy.wait("@crearProyecto").its("response.statusCode").should("eq", 201);
    cy.contains("20.00 m²").should("be.visible");
    cy.get("nav").contains("button", "Gael").click();
    cy.contains("a", "Mi Cuenta").click();
    cy.contains("p", /^Proyectos$/).siblings("p").should("have.text", "1");
    evidencia("FLU-19 2 cuenta con su primer proyecto");
  });

  it("FLU-20 [ESC08→ESC41→ESC09→ESC13] DEF-29 corregido: con el catálogo caído la app avisa del error; 'Reintentar' lo recupera y el cliente compra", () => {
    cy.crearProductoApi(adminToken, { price: 22000 }).then((producto) => {
      creados.push(producto.id);
      cy.crearUsuarioApi("flujo-caida", { firstName: "Dora" }).then((usuario) => {
        cy.iniciarSesionConToken(usuario);

        // 1. El backend de productos responde 500
        cy.intercept("GET", "**/api/v1/products", { statusCode: 500, body: { success: false, error: "Error interno" } }).as("caido");
        cy.visit("/catalogo");
        cy.wait("@caido");
        // Antes: "0 productos" sin explicación. Ahora: aviso de error con "Reintentar".
        cy.get('main [role="alert"]').should("contain.text", "No pudimos cargar el catálogo");
        cy.get('main a[href^="/catalogo/"]').should("have.length", 0);
        evidencia("FLU-20 1 catálogo caído");

        // 2. El servicio vuelve: "Reintentar" recarga los productos y el flujo de compra continúa
        cy.intercept("GET", "**/api/v1/products", (req) => req.continue()).as("productos");
        cy.get('main [role="alert"]').contains("button", "Reintentar").click();
        cy.wait("@productos").its("response.statusCode").should("eq", 200);
        cy.get('main a[href^="/catalogo/"]').should("have.length.at.least", 1);
        cy.get("#search-bar").type(`${producto.name}{enter}`);
        cy.contains("h3", producto.name).click();
        cy.contains("button", "Agregar al Carrito").click();
        cy.get('[role="alert"]').should("contain.text", "Producto agregado al carrito exitosamente");
        cy.get('nav a[aria-label="Carrito"]').should("contain.text", "1");
      });
    });
  });
});
