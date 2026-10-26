// Seguridad · API (ESC06, ESC35, ESC36, ESC41)
//
// Pruebas de caja negra sobre el backend con cy.request: autenticación con JWT,
// autorización por rol y por propietario (IDOR), asignación masiva, inyección,
// límites de tamaño y CORS. Los casos SEG-API-* afirman el control SEGURO y
// deben pasar. Los casos DEF-SEG-* verifican el comportamiento OBSERVADO de
// defectos abiertos (misma convención DEF-xx de toda la suite): pasan mientras
// el defecto exista y fallan cuando se corrija. Los ids DEF-SEG-xx coinciden con
// los de HomaraBackend/docs/pruebas/SEGURIDAD.md.

import type { UsuarioPrueba } from "../../support/commands";
import { claveDePrueba } from "../../support/utilidades";

const ADMIN_SEMILLA = { id: "admin-001", email: "admin@homara.co", role: "ADMIN" };

/** Codifica en base64url (sin relleno) para armar tokens a mano en el navegador. */
const b64url = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

describe("Seguridad · API (ESC06, ESC35, ESC36, ESC41)", () => {
  let victima: UsuarioPrueba;
  let atacante: UsuarioPrueba;
  let productoId = "";

  before(() => {
    cy.productosApi().then((lista) => {
      productoId = lista.find((p) => p.inStock && p.stockQuantity >= 50)!.id;
    });
    cy.crearUsuarioApi("seg-victima", { firstName: "Victor", lastName: "Victima", phone: "300 111 2222" }).then((u) => {
      victima = u;
    });
    cy.crearUsuarioApi("seg-atacante", { firstName: "Ana", lastName: "Atacante" }).then((u) => {
      atacante = u;
    });
  });

  context("Autenticación con JWT (ESC35)", () => {
    it("SEG-API-01 [ESC35] un token con la firma alterada se rechaza con 401", () => {
      const [cabecera, cuerpo] = victima.token.split(".");
      cy.api("GET", "/users/me", { token: `${cabecera}.${cuerpo}.firmaFalsa123` }).then((res) => {
        expect(res.status).to.eq(401);
        expect(res.body).to.deep.include({ success: false });
        expect(res.body).not.to.have.property("data");
      });
    });

    it("SEG-API-02 [ESC35] un token con alg \"none\" que se declara ADMIN se rechaza con 401", () => {
      const sinFirma = `${b64url({ alg: "none", typ: "JWT" })}.${b64url(ADMIN_SEMILLA)}.`;
      cy.api("GET", "/admin/metrics", { token: sinFirma }).its("status").should("eq", 401);
    });

    it("SEG-API-03 [ESC35] un token vencido se rechaza con 401", () => {
      const hace2h = Math.floor(Date.now() / 1000) - 7200;
      cy.task("firmarJwt", {
        payload: { id: victima.id, email: victima.email, role: "CUSTOMER", iat: hace2h, exp: hace2h + 60 },
        secreto: Cypress.env("jwtSecretoPorDefecto"),
      }).then((vencido) => {
        cy.api("GET", "/users/me", { token: vencido as string }).its("status").should("eq", 401);
      });
    });

    it("SEG-API-04 [ESC35] un esquema distinto de Bearer (Basic, token pelado) no autentica", () => {
      ["Basic", "Token", ""].forEach((esquema) => {
        cy.request({
          url: `${Cypress.env("apiUrl")}/users/me`,
          headers: { Authorization: `${esquema} ${victima.token}`.trim() },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status, `esquema "${esquema}"`).to.eq(401);
          expect(res.body.error).to.eq("Token no provisto.");
        });
      });
    });

    it("SEG-API-05 [ESC35] el JWT emitido no transporta la contraseña y expira en 7 días o menos", () => {
      const payload = JSON.parse(atob(victima.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      expect(payload).to.include.keys("id", "email", "role", "exp");
      expect(payload).not.to.have.any.keys("password", "hash");
      expect(payload.exp - payload.iat, "vigencia en segundos").to.be.at.most(7 * 24 * 3600);
    });
  });

  context("Autorización y asignación masiva (ESC06, ESC36)", () => {
    it("SEG-API-06 [ESC06] un \"role\": \"ADMIN\" enviado en el registro se ignora (queda CUSTOMER)", () => {
      cy.crearUsuarioApi("seg-rol", { role: "ADMIN" }).then((u) => {
        cy.api("GET", "/users/me", { token: u.token }).its("body.data.role").should("eq", "CUSTOMER");
        cy.api("GET", "/admin/metrics", { token: u.token }).its("status").should("eq", 403);
      });
    });

    it("SEG-API-07 [ESC06] PUT /users/:id con \"role\": \"ADMIN\" no escala privilegios", () => {
      cy.api("PUT", `/users/${atacante.id}`, { token: atacante.token, body: { role: "ADMIN", city: "Cali" } })
        .its("status")
        .should("eq", 200);
      cy.api("GET", "/users/me", { token: atacante.token }).its("body.data").should("include", { role: "CUSTOMER", city: "Cali" });
      cy.api("GET", "/admin/inventory", { token: atacante.token }).its("status").should("eq", 403);
    });

    it("SEG-API-08 [ESC36] un usuario no puede editar el perfil de otro (403) y el perfil queda intacto", () => {
      cy.api("PUT", `/users/${victima.id}`, { token: atacante.token, body: { firstName: "Hackeado" } }).its("status").should("eq", 403);
      cy.api("GET", "/users/me", { token: victima.token }).its("body.data.firstName").should("eq", "Victor");
    });

    it("SEG-API-09 [ESC36] un usuario no puede cambiar ni borrar ítems del carrito de otro", () => {
      cy.vaciarCarritoApi(victima.token);
      cy.agregarAlCarritoApi(victima.token, productoId, 1);
      cy.api("GET", "/cart", { token: victima.token }).then(({ body }) => {
        const itemId = body.data.items[0].id as string;
        cy.api("PUT", `/cart/items/${itemId}`, { token: atacante.token, body: { quantity: 9 } }).then((res) => {
          expect(res.status).to.eq(403);
          expect(res.body.error).to.eq("No tienes permiso para modificar este item del carrito.");
        });
        cy.api("DELETE", `/cart/items/${itemId}`, { token: atacante.token }).then((res) => {
          expect(res.status).to.eq(403);
          expect(res.body.error).to.eq("No tienes permiso para eliminar este item del carrito.");
        });
      });
      cy.api("GET", "/cart", { token: victima.token }).its("body.data.items").should("have.length", 1).its("0.quantity").should("eq", 1);
      cy.vaciarCarritoApi(victima.token);
    });

    it("SEG-API-10 [ESC06] crear, editar y borrar productos exige rol ADMIN (sin token 401, CUSTOMER 403)", () => {
      const cuerpo = { name: "Intruso", description: "x", price: 1, stockQuantity: 1, unit: "unidad", categoryId: "x" };
      [
        ["POST", "/products"],
        ["PUT", `/products/${productoId}`],
        ["DELETE", `/products/${productoId}`],
      ].forEach(([metodo, ruta]) => {
        cy.api(metodo, ruta, { body: cuerpo }).its("status").should("eq", 401);
        cy.api(metodo, ruta, { token: atacante.token, body: cuerpo }).its("status").should("eq", 403);
      });
      cy.api("GET", `/products/${productoId}`).its("status").should("eq", 200);
    });
  });

  context("Validación de entradas e inyección (ESC41)", () => {
    it("SEG-API-11 [ESC41] operadores NoSQL y SQL en el login se rechazan por validación (400), sin sesión", () => {
      [
        { email: { $ne: null }, password: { $ne: null } },
        { email: "' OR '1'='1", password: "' OR '1'='1" },
        { email: "admin@homara.co' --", password: "x" },
      ].forEach((body) => {
        cy.api("POST", "/users/login", { body }).then((res) => {
          expect(res.status, JSON.stringify(body)).to.eq(400);
          expect(res.body.success).to.eq(false);
          expect(res.body.error).to.match(/^Validación fallida/);
          expect(res.body).not.to.have.property("data");
        });
      });
    });

    it("SEG-API-12 [ESC41] cadenas de inyección en filtros e ids no provocan errores 500 ni fugas de datos", () => {
      cy.api("GET", `/products?category=${encodeURIComponent("' OR 1=1--")}`).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.data).to.have.length(0);
      });
      cy.api("GET", `/products/${encodeURIComponent("1' OR '1'='1")}`).then((res) => {
        expect(res.status).to.eq(404);
        expect(JSON.stringify(res.body)).not.to.match(/prisma|stack|SELECT|at \w+ \(/i);
      });
    });

    it("SEG-API-13 [ESC41] un cuerpo de más de 100 KB se corta con 413", () => {
      cy.api("POST", "/users/login", { body: { email: `${"a".repeat(200_000)}@x.co`, password: claveDePrueba() } })
        .its("status")
        .should("eq", 413);
    });
  });

  context("Configuración HTTP y CORS (ESC35, ESC36)", () => {
    it("SEG-API-14 [ESC36] CORS refleja solo el origen del frontend y nunca el comodín *", () => {
      cy.request({ url: `${Cypress.env("apiUrl")}/categories`, headers: { Origin: "http://localhost:3000" } }).then((res) => {
        expect(res.headers["access-control-allow-origin"]).to.eq("http://localhost:3000");
      });
      cy.request({ url: `${Cypress.env("apiUrl")}/categories`, headers: { Origin: "https://evil.example" } }).then((res) => {
        expect(res.headers).not.to.have.property("access-control-allow-origin");
      });
    });

    it("SEG-API-15 [ESC35] el backend no anuncia su tecnología (sin X-Powered-By)", () => {
      cy.api("GET", "/categories").its("headers").should("not.have.property", "x-powered-by");
    });
  });

  context("Defectos corregidos (antes: comportamiento observado)", () => {
    it("DEF-SEG-01 corregido [ESC35] un token de ADMIN forjado con el secreto por defecto se rechaza (401)", () => {
      cy.task("firmarJwt", {
        payload: { ...ADMIN_SEMILLA, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 600 },
        secreto: Cypress.env("jwtSecretoPorDefecto"),
      }).then((forjado) => {
        // Antes 200: el backend arrancaba con el secreto embebido/público. Ahora JWT_SECRET es obligatorio.
        cy.api("GET", "/admin/metrics", { token: forjado as string }).its("status").should("eq", 401);
      });
    });

    it("DEF-SEG-03/04/05 corregido [ESC36] sin token, ?userId=<ajeno> no expone pedidos, proyectos ni carrito", () => {
      cy.agregarAlCarritoApi(victima.token, productoId, 2);
      cy.api("POST", "/projects", { token: victima.token, body: { name: "Privado", type: "PISO", area: 15 } });
      cy.api("GET", `/cart?userId=${victima.id}`).its("body.data.items").should("have.length", 0);
      cy.api("POST", "/orders", {
        token: victima.token,
        body: { paymentMethod: "cash", shippingAddress: "Calle 1", shippingCity: "Cali", shippingState: "Valle" },
      });
      cy.api("GET", `/orders?userId=${victima.id}`).its("body.data").should("have.length", 0);
      cy.api("GET", `/projects?userId=${victima.id}`).its("body.data").should("have.length", 0);
    });

    it("DEF-SEG-06 corregido [ESC36] GET /orders/:numero sin token responde 401 sin datos del cliente", () => {
      cy.agregarAlCarritoApi(victima.token, productoId, 1);
      cy.api("POST", "/orders", {
        token: victima.token,
        body: { paymentMethod: "card", shippingAddress: "Dirección privada 123", shippingCity: "Neiva", shippingState: "Huila" },
      }).then(({ body }) => {
        cy.api("GET", `/orders/${body.data.orderNumber}`).then((res) => {
          expect(res.status).to.eq(401);
          expect(JSON.stringify(res.body)).not.to.include("Dirección privada 123");
        });
      });
    });

    it("DEF-SEG-08 corregido [ESC36] GET /users/:id de otro usuario responde 403 sin su teléfono", () => {
      cy.api("GET", `/users/${victima.id}`, { token: atacante.token }).then((res) => {
        expect(res.status).to.eq(403);
        expect(JSON.stringify(res.body)).not.to.include("300 111 2222");
      });
    });

    it("DEF-SEG-09 corregido [ESC35] PUT /users/:id no devuelve el hash de la contraseña", () => {
      cy.api("PUT", `/users/${atacante.id}`, { token: atacante.token, body: { city: "Tunja" } }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.data).not.to.have.property("password");
      });
    });

    it("DEF-SEG-10 corregido [ESC35] la API envía cabeceras de seguridad (helmet)", () => {
      cy.api("GET", "/categories").its("headers").then((h) => {
        expect(h["x-content-type-options"]).to.eq("nosniff");
        expect(h["x-frame-options"]).to.eq("SAMEORIGIN");
        expect(h["content-security-policy"]).to.include("frame-ancestors");
      });
    });

    it("DEF-SEG-11 corregido [ESC35] el login bloquea con 429 tras 10 intentos fallidos", () => {
      const estados: number[] = [];
      Cypress._.times(12, () => {
        cy.api("POST", "/users/login", { body: { email: atacante.email, password: claveDePrueba() } }).then((r) => {
          estados.push(r.status);
        });
      });
      cy.wrap(estados).should("have.length", 12).then(() => {
        expect(estados.slice(0, 10)).to.deep.equal(Array(10).fill(401));
        expect(estados.slice(10)).to.deep.equal([429, 429]);
      });
    });
  });
});
