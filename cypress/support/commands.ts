// Comandos personalizados de Cypress para Homara.
//
// - Las sesiones se crean con cy.session (se reutilizan entre pruebas y specs).
// - Los datos de prueba (usuarios, carritos) se preparan por API para que cada
//   prueba sea independiente y no toque los datos sembrados.

import { claveDePrueba, correoUnico } from "./utilidades";

export interface UsuarioPrueba {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  token: string;
}

export interface ProductoApi {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviews: number;
  inStock: boolean;
  stockQuantity: number;
  unit: string;
  category: string;
  categorySlug: string;
  tags: string[];
}

/** Cuerpo de respuesta del backend ({ success, data } o { success, error }); se deja abierto a propósito. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RespuestaApi = any;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Inicia sesión por la interfaz (/login) y cachea la sesión con cy.session. */
      iniciarSesion(email: string, password: string): Chainable<void>;
      /** Inicia sesión con un token ya emitido (usuario creado por API) y la cachea. */
      iniciarSesionConToken(usuario: UsuarioPrueba): Chainable<void>;
      /** Crea un usuario CUSTOMER nuevo, con correo único, directamente en el backend. */
      crearUsuarioApi(prefijo: string, extra?: Record<string, string>): Chainable<UsuarioPrueba>;
      /** Obtiene un token del backend para un usuario existente. */
      tokenApi(email: string, password: string): Chainable<string>;
      /** Lista de productos del backend. */
      productosApi(): Chainable<ProductoApi[]>;
      /** Agrega un producto al carrito del usuario (por API). */
      agregarAlCarritoApi(token: string, productId: string, quantity?: number): Chainable<void>;
      /** Elimina todos los ítems del carrito del usuario (por API). */
      vaciarCarritoApi(token: string): Chainable<void>;
      /** Crea un producto PROPIO de la prueba (requiere token ADMIN); devuelve el producto creado. */
      crearProductoApi(adminToken: string, datos?: Record<string, unknown>): Chainable<ProductoApi>;
      /** Petición autenticada al backend (no falla en códigos 4xx/5xx). */
      api(
        metodo: string,
        ruta: string,
        opciones?: { token?: string; body?: unknown },
      ): Chainable<Cypress.Response<RespuestaApi>>;
    }
  }
}

const apiUrl = () => Cypress.env("apiUrl") as string;

Cypress.Commands.add("api", (metodo, ruta, opciones = {}) => {
  return cy.request({
    method: metodo,
    url: `${apiUrl()}${ruta}`,
    body: opciones.body as Cypress.RequestBody,
    headers: opciones.token ? { Authorization: `Bearer ${opciones.token}` } : {},
    failOnStatusCode: false,
  });
});

Cypress.Commands.add("iniciarSesion", (email: string, password: string) => {
  cy.session(
    ["ui", email],
    () => {
      cy.intercept("POST", "**/api/v1/users/login").as("loginSesion");
      cy.visit("/login");
      cy.get("#email").should("be.visible").type(email);
      cy.get("#password").type(password, { log: false });
      cy.get("form").find('button[type="submit"]').click();
      cy.wait("@loginSesion").its("response.statusCode").should("eq", 200);
      cy.location("pathname").should("eq", "/cuenta");
      // Se espera a que /cuenta termine de cargar para no abandonar peticiones en vuelo.
      cy.contains("h1", /Mi Cuenta|My Account/).should("be.visible");
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        // La sesión es válida si el token guardado sigue siendo aceptado por el backend.
        cy.window().then((win) => {
          const token = win.localStorage.getItem("homara_token");
          expect(token, "token en localStorage").to.be.a("string");
          cy.api("GET", "/users/me", { token: token as string })
            .its("status")
            .should("eq", 200);
        });
      },
    },
  );
});

Cypress.Commands.add("iniciarSesionConToken", (usuario: UsuarioPrueba) => {
  cy.session(
    ["token", usuario.email],
    () => {
      // Se espera a que la app termine de validar el token (/users/me): si la
      // página se abandona con esa petición en vuelo, AuthContext trata el
      // abort como error y llama a logout(), borrando el token (ver DEF-05).
      cy.intercept("GET", "**/api/v1/users/me").as("validarSesion");
      cy.visit("/", {
        onBeforeLoad(win) {
          win.localStorage.setItem("homara_token", usuario.token);
        },
      });
      cy.wait("@validarSesion").its("response.statusCode").should("eq", 200);
      cy.get("nav").contains("button", usuario.firstName).should("be.visible");
    },
    {
      validate() {
        cy.window().its("localStorage").invoke("getItem", "homara_token").should("eq", usuario.token);
      },
    },
  );
});

Cypress.Commands.add("crearUsuarioApi", (prefijo: string, extra: Record<string, string> = {}) => {
  const datos = {
    email: correoUnico(prefijo),
    password: claveDePrueba(),
    firstName: "Prueba",
    lastName: "Cypress",
    ...extra,
  };
  return cy.api("POST", "/users/register", { body: datos }).then((res) => {
    expect(res.status, "registro por API").to.eq(201);
    const usuario: UsuarioPrueba = {
      id: res.body.data.user.id,
      email: datos.email,
      password: datos.password,
      firstName: datos.firstName,
      lastName: datos.lastName,
      token: res.body.data.token,
    };
    return usuario;
  });
});

Cypress.Commands.add("tokenApi", (email: string, password: string) => {
  return cy
    .api("POST", "/users/login", { body: { email, password } })
    .then((res) => {
      expect(res.status, `login por API de ${email}`).to.eq(200);
      return res.body.data.token as string;
    });
});

Cypress.Commands.add("productosApi", () => {
  return cy.api("GET", "/products").then((res) => {
    expect(res.status).to.eq(200);
    return res.body.data as ProductoApi[];
  });
});

Cypress.Commands.add("agregarAlCarritoApi", (token: string, productId: string, quantity = 1) => {
  cy.api("POST", "/cart/items", { token, body: { productId, quantity } })
    .its("status")
    .should("eq", 201);
});

Cypress.Commands.add("vaciarCarritoApi", (token: string) => {
  cy.api("GET", "/cart", { token }).then((res) => {
    const items: { id: string }[] = res.body.data?.items ?? [];
    items.forEach((item) => {
      cy.api("DELETE", `/cart/items/${item.id}`, { token });
    });
  });
});

Cypress.Commands.add("crearProductoApi", (adminToken: string, datos: Record<string, unknown> = {}) => {
  return cy.api("GET", "/categories").then(({ body }) => {
    const categoria = body.data.find((c: { slug: string }) => c.slug === "herramientas") ?? body.data[0];
    return cy
      .api("POST", "/products", {
        token: adminToken,
        body: {
          name: `Producto Cypress ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: "Producto temporal creado por la suite Cypress (se elimina al terminar).",
          price: 15000,
          originalPrice: null,
          stockQuantity: 10,
          unit: "unidad",
          categoryId: categoria.id,
          image: "/products/placeholder.jpg",
          tags: [],
          ...datos,
        },
      })
      .then((r) => {
        expect(r.status, "creación de producto propio").to.eq(201);
        return { ...r.body.data, categorySlug: categoria.slug } as ProductoApi;
      });
  });
});

export {};
