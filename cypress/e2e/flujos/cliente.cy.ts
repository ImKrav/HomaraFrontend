// Flujos E2E del cliente (de punta a punta, por la interfaz)
//
// Cada prueba encadena varias funcionalidades como lo haría un comprador. Los
// productos propios se crean como ADMIN por API y se borran al final, para no
// depender del stock ni del precio de los datos sembrados.

import { formatoCOP, normalizar } from "../../support/utilidades";
import { ENVIO, buscarYAbrir, evidencia, llenarEnvio, valorResumen } from "./comun";

describe("Flujos E2E · Cliente", () => {
  let adminToken = "";
  const creados: string[] = [];

  /** Producto propio de la prueba (se elimina en el after). */
  const productoPropio = (datos: Record<string, unknown>) =>
    cy.crearProductoApi(adminToken, datos).then((p) => {
      creados.push(p.id);
      return p;
    });

  before(() => {
    cy.tokenApi(Cypress.env("adminEmail"), Cypress.env("adminPassword")).then((t) => {
      adminToken = t;
    });
  });

  after(() => {
    creados.forEach((id) => cy.api("DELETE", `/products/${id}`, { token: adminToken }));
  });

  it("FLU-03 [ESC12→ESC11→ESC09→ESC10→ESC13→ESC02] un visitante explora desde el inicio, intenta comprar sin sesión, inicia sesión y agrega al carrito", () => {
    cy.intercept("GET", "**/api/v1/products*").as("productos");
    cy.intercept("POST", "**/api/v1/cart/items").as("agregar");
    cy.crearUsuarioApi("flujo-visitante", { firstName: "Vera" }).then((usuario) => {
      cy.productosApi().then((lista) => {
        const masBarato = lista.filter((p) => p.categorySlug === "pisos-ceramicas").sort((a, b) => a.price - b.price)[0];

        // 1. Inicio → acceso directo a la categoría de pisos
        cy.visit("/");
        cy.get('a[href="/catalogo?category=pisos-ceramicas"]').first().click();
        cy.location("search").should("include", "category=pisos-ceramicas");
        cy.wait("@productos").its("request.url").should("include", "category=pisos-ceramicas");

        // 2. Orden por precio ascendente → el primero es el más barato de la categoría
        cy.get("#sort-by").select("precio-asc");
        cy.get('main a[href^="/catalogo/"]').first().should("contain.text", masBarato.name).click();
        cy.contains("h1", masBarato.name).should("be.visible");
        evidencia("FLU-03 1 ficha sin sesión");

        // 3. Sin sesión, agregar lleva al login
        cy.contains("button", "Agregar al Carrito").click();
        cy.wait("@agregar").its("response.statusCode").should("eq", 401);
        cy.location("pathname").should("eq", "/login");

        // 4. Inicia sesión: la app lo lleva a su cuenta (no vuelve a la ficha, OBS-05)
        cy.get("#email").type(usuario.email);
        cy.get("#password").type(usuario.password, { log: false });
        cy.get("form").find('button[type="submit"]').click();
        cy.location("pathname").should("eq", "/cuenta");
        cy.contains("h1", "Mi Cuenta").should("be.visible");

        // 5. Vuelve a buscar el producto y ahora sí lo agrega
        buscarYAbrir(masBarato.name);
        cy.contains("button", "Agregar al Carrito").click();
        cy.wait("@agregar").its("response.statusCode").should("eq", 201);
        cy.get('[role="alert"]').should("contain.text", "Producto agregado al carrito exitosamente");
        cy.get('nav a[aria-label="Carrito"]').should("contain.text", "1");
        evidencia("FLU-03 2 agregado tras login");
      });
    });
  });

  it("FLU-04 [ESC05→ESC09→ESC13→ESC27→ESC28→ESC29] el cliente completa su perfil y el checkout usa esos datos de envío", () => {
    const perfil = { phone: "3157778899", address: "Avenida 30 de Agosto # 20-15", city: "Pereira", state: "Risaralda", zip: "660001" };
    cy.intercept("PUT", "**/api/v1/users/me").as("guardarPerfil");
    cy.intercept("POST", "**/api/v1/orders").as("crearPedido");
    productoPropio({ price: 64000 }).then((producto) => {
      cy.crearUsuarioApi("flujo-perfil", { firstName: "Paula", lastName: "Perfil" }).then((usuario) => {
        cy.iniciarSesionConToken(usuario);

        // 1. Completa el perfil
        cy.visit("/cuenta");
        cy.contains("button", "Editar Perfil").click();
        cy.contains("h3", "Editar Perfil").parent().within(() => {
          cy.get('input[placeholder="Ej: 300 123 4567"]').clear().type(perfil.phone);
          cy.get('input[placeholder="Ej: Calle 123 # 45-67"]').clear().type(perfil.address);
          cy.get('input[placeholder="Ej: Bogotá"]').clear().type(perfil.city);
          cy.get('input[placeholder="Ej: Cundinamarca"]').clear().type(perfil.state);
          cy.get('input[placeholder="Ej: 110111"]').clear().type(perfil.zip);
          cy.contains("button", "Guardar Cambios").click();
        });
        cy.wait("@guardarPerfil").its("response.statusCode").should("eq", 200);
        cy.contains(`${perfil.city}, ${perfil.state}`).should("be.visible");
        evidencia("FLU-04 1 perfil completo");

        // 2. Compra: el checkout llega precargado con el perfil
        buscarYAbrir(producto.name);
        cy.contains("button", "Agregar al Carrito").click();
        cy.get('nav a[aria-label="Carrito"]').should("contain.text", "1").click();
        cy.contains("a", "Ir a Pagar").click();
        Object.entries(perfil).forEach(([campo, valor]) => cy.get(`#${campo}`).should("have.value", valor));
        cy.get('input[name="payment"][value="cash"]').check();
        evidencia("FLU-04 2 checkout precargado");
        cy.get('button[type="submit"]').click();
        cy.wait("@crearPedido").then(({ request, response }) => {
          expect(request.body).to.include({
            paymentMethod: "cash",
            shippingAddress: perfil.address,
            shippingCity: perfil.city,
            shippingState: perfil.state,
            shippingZip: perfil.zip,
          });
          expect(response?.statusCode).to.eq(201);
          const numero = response?.body.data.orderNumber as string;

          // 3. El detalle del pedido en la cuenta muestra esa dirección
          cy.get("nav").contains("button", "Paula").click();
          cy.contains("a", "Mi Cuenta").click();
          cy.contains("p", numero).closest("button").contains("Ver detalles de entrega").click();
          cy.get('[aria-modal="true"]').should("contain.text", perfil.address).and("contain.text", perfil.city);
          evidencia("FLU-04 3 detalle con dirección del perfil");
        });
      });
    });
  });

  it("FLU-05 [ESC13→ESC16→ESC15→ESC14→ESC27→ESC28] el carrito con varios productos gana y pierde el envío gratis según el subtotal", () => {
    cy.intercept("POST", "**/api/v1/orders").as("crearPedido");
    productoPropio({ price: 30000, stockQuantity: 20 }).then((barato) => {
      productoPropio({ price: 480000, stockQuantity: 5 }).then((caro) => {
        cy.crearUsuarioApi("flujo-envio", { firstName: "Elsa" }).then((usuario) => {
          cy.iniciarSesionConToken(usuario);
          cy.visit("/");

          // 1. Dos productos: 30.000 + 480.000 = 510.000 ≥ 500.000 → envío gratis
          [barato, caro].forEach((p) => {
            buscarYAbrir(p.name);
            cy.contains("button", "Agregar al Carrito").click();
            cy.get('[role="alert"]').should("contain.text", "Producto agregado al carrito exitosamente");
          });
          cy.get('nav a[aria-label="Carrito"]').should("contain.text", "2").click();
          valorResumen(/^Envío$/).should("eq", "Gratis");
          valorResumen(/^Total$/).should("eq", formatoCOP(510000));
          evidencia("FLU-05 1 envío gratis");

          // 2. Quita el caro: vuelve a cobrar envío
          cy.contains("h3", caro.name).parents().filter(':has(button[aria-label="Eliminar"])').first()
            .find('button[aria-label="Eliminar"]').click();
          cy.contains("h3", caro.name).should("not.exist");
          valorResumen(/^Envío$/).should("eq", formatoCOP(ENVIO));
          valorResumen(/^Total$/).should("eq", formatoCOP(30000 + ENVIO));

          // 3. Sube la cantidad del barato a 3 y paga
          cy.get('button[aria-label="+"]').click();
          cy.get('button[aria-label="+"]').siblings("span").should("have.text", "2");
          cy.get('button[aria-label="+"]').click();
          cy.get('button[aria-label="+"]').siblings("span").should("have.text", "3");
          valorResumen(/^Total$/).should("eq", formatoCOP(90000 + ENVIO));
          evidencia("FLU-05 2 envío cobrado");
          cy.contains("a", "Ir a Pagar").click();
          llenarEnvio();
          cy.get('button[type="submit"]').invoke("text").then((t) => {
            expect(normalizar(t)).to.eq(`Pagar ${formatoCOP(90000 + ENVIO)}`);
          });
          cy.get('button[type="submit"]').click();
          cy.wait("@crearPedido").then(({ response }) => {
            expect(response?.statusCode).to.eq(201);
            expect(response?.body.data).to.include({ subtotal: 90000, shippingCost: ENVIO, total: 90000 + ENVIO });
          });
          cy.api("GET", `/products/${caro.id}`).its("body.data.stockQuantity").should("eq", 5);
        });
      });
    });
  });

  it("FLU-06 [ESC40→ESC02→ESC09→ESC13→ESC27→ESC28] una compra completa en inglés y con tema oscuro mantiene las preferencias", () => {
    cy.intercept("POST", "**/api/v1/orders").as("crearPedido");
    productoPropio({ price: 52000 }).then((producto) => {
      cy.crearUsuarioApi("flujo-ingles", { firstName: "Emma" }).then((usuario) => {
        // 1. Preferencias desde la interfaz: EN + oscuro
        cy.visit("/", { onBeforeLoad: (win) => win.localStorage.setItem("homara_theme", "light") });
        cy.get('button[aria-label="Alternar tema"]').click();
        cy.get("footer").contains("button", /^EN$/).click();
        cy.get("html").should("have.class", "dark");

        // 2. Login en inglés
        cy.get("nav").contains("a", "Sign In").click();
        cy.get("#email").type(usuario.email);
        cy.get("#password").type(usuario.password, { log: false });
        cy.get("form").find('button[type="submit"]').click();
        cy.contains("h1", "My Account").should("be.visible");
        evidencia("FLU-06 1 cuenta en inglés y oscuro");

        // 3. Compra en inglés
        buscarYAbrir(producto.name, "Catalog");
        cy.contains("button", "Add to Cart").click();
        cy.get('[role="alert"]').should("contain.text", "Product added to cart successfully");
        cy.get('nav a[aria-label="Cart"]').should("contain.text", "1").click();
        cy.contains("a", "Proceed to Checkout").click();
        llenarEnvio();
        cy.get('button[type="submit"]').invoke("text").then((t) => {
          expect(normalizar(t)).to.eq(`Pay ${formatoCOP(producto.price + ENVIO)}`);
        });
        cy.get('button[type="submit"]').click();
        cy.wait("@crearPedido").its("response.statusCode").should("eq", 201);
        cy.get('[role="alert"]').should("contain.text", "Order placed successfully!");
        evidencia("FLU-06 2 pedido en inglés");

        // 4. Las preferencias siguen tras todo el recorrido
        cy.get("html").should("have.class", "dark");
        cy.window().its("localStorage").then((ls) => {
          expect(ls.getItem("homara_lang")).to.eq("en");
          expect(ls.getItem("homara_theme")).to.eq("dark");
        });
      });
    });
  });

  it("FLU-07 [ESC39→ESC02→ESC09→ESC13→ESC27→ESC28] un cliente compra desde el celular con el menú móvil", () => {
    cy.viewport(375, 667);
    cy.intercept("POST", "**/api/v1/orders").as("crearPedido");
    productoPropio({ price: 41000 }).then((producto) => {
      cy.crearUsuarioApi("flujo-movil", { firstName: "Mía" }).then((usuario) => {
        cy.visit("/");
        cy.get('button[aria-label="Menú"]').click();
        cy.get("nav .animate-slide-down").contains("a", "Iniciar Sesión").click();
        cy.get("#email").type(usuario.email);
        cy.get("#password").type(usuario.password, { log: false });
        cy.get("form").find('button[type="submit"]').click();
        cy.contains("h1", "Mi Cuenta").should("be.visible");

        cy.get('button[aria-label="Menú"]').click();
        cy.get("nav .animate-slide-down").contains("a", "Catálogo").click();
        cy.get("#search-bar").type(`${producto.name}{enter}`);
        cy.contains("h3", producto.name).click();
        cy.contains("button", "Agregar al Carrito").click();
        cy.get('[role="alert"]').should("contain.text", "Producto agregado al carrito exitosamente");
        evidencia("FLU-07 1 ficha en móvil");

        // En móvil el ícono del carrito se oculta: se llega por el menú.
        cy.get('nav a[aria-label="Carrito"]').should("not.be.visible");
        cy.get('button[aria-label="Menú"]').click();
        cy.get("nav .animate-slide-down").contains("a", "Carrito").click();
        cy.contains("a", "Ir a Pagar").click();
        llenarEnvio();
        evidencia("FLU-07 2 checkout en móvil");
        cy.get('button[type="submit"]').click();
        cy.wait("@crearPedido").its("response.statusCode").should("eq", 201);
        cy.document().then((doc) => {
          expect(doc.documentElement.scrollWidth, "sin scroll horizontal").to.be.at.most(375);
        });
      });
    });
  });

  it("FLU-08 [ESC28→ESC30→ESC03→ESC10] tras comprar, el cliente califica el producto y otro visitante ve la reseña", () => {
    const comentario = "Llegó a tiempo y funciona perfecto.";
    cy.intercept("POST", "**/api/v1/orders").as("crearPedido");
    productoPropio({ price: 37000 }).then((producto) => {
      cy.crearUsuarioApi("flujo-resena", { firstName: "Rosa", lastName: "Reseña" }).then((usuario) => {
        cy.iniciarSesionConToken(usuario);
        cy.visit("/");

        // 1. Compra
        buscarYAbrir(producto.name);
        cy.contains("button", "Agregar al Carrito").click();
        cy.get('nav a[aria-label="Carrito"]').should("contain.text", "1").click();
        cy.contains("a", "Ir a Pagar").click();
        llenarEnvio();
        cy.get('button[type="submit"]').click();
        cy.wait("@crearPedido").its("response.statusCode").should("eq", 201);

        // 2. Vuelve a la ficha y la califica con 5 estrellas
        buscarYAbrir(producto.name);
        cy.contains("label", "Tu Calificación").parent().find("button").eq(4).click();
        cy.get("#comment").type(comentario);
        cy.contains("button", "Publicar Opinión").click();
        cy.contains("✓ Producto Calificado").should("be.visible");
        evidencia("FLU-08 1 reseña publicada");

        // 3. Cierra sesión; un visitante ve la reseña y el promedio
        cy.get("nav").contains("button", "Rosa").click();
        cy.contains("button", "Cerrar Sesión").click();
        cy.location("pathname").should("eq", "/login");
        buscarYAbrir(producto.name);
        cy.contains(`"${comentario}"`).should("be.visible");
        cy.contains("Rosa Reseña").should("be.visible");
        cy.contains("Debes iniciar sesión para compartir tu experiencia con este producto.").should("be.visible");
        cy.api("GET", `/products/${producto.id}`).its("body.data").should("include", { rating: 5, reviews: 1 });
        evidencia("FLU-08 2 visitante ve la reseña");
      });
    });
  });
});

