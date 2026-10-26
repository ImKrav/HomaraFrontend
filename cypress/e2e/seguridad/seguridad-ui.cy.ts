// Seguridad · Interfaz (ESC07, ESC35, ESC36)
//
// XSS almacenado y reflejado en los textos que escribe el usuario (reseñas,
// proyectos, nombre, búsqueda), redirecciones abiertas, sesión tras cerrar
// sesión, tokens manipulados y cabeceras HTTP del frontend. Los SEG-UI-* afirman
// el control seguro; los DEF-SEG-FE-* verifican el comportamiento observado de
// un defecto abierto (pasan mientras exista).

import type { ProductoApi, UsuarioPrueba } from "../../support/commands";

/** Carga que, si se interpretara como HTML, ejecutaría código y dejaría huella en window.__xss. */
const XSS = `<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>`;

/** Visita la página espiando window.alert y verifica después que ningún script inyectado corrió. */
function visitarVigilando(ruta: string) {
  cy.visit(ruta, {
    onBeforeLoad(win) {
      cy.stub(win, "alert").as("alerta");
    },
  });
}

function sinEjecucionDeScripts() {
  cy.window().its("__xss").should("be.undefined");
  cy.get("@alerta").should("not.have.been.called");
  cy.get('img[src="x"]').should("not.exist");
}

const b64url = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

describe("Seguridad · Interfaz (ESC07, ESC35, ESC36)", () => {
  context("XSS almacenado y reflejado (ESC35)", () => {
    let adminToken = "";
    let producto: ProductoApi;
    let usuario: UsuarioPrueba;

    before(() => {
      cy.tokenApi(Cypress.env("adminEmail"), Cypress.env("adminPassword")).then((t) => {
        adminToken = t;
        cy.crearProductoApi(t).then((p) => {
          producto = p;
        });
      });
      cy.crearUsuarioApi("seg-xss", { firstName: XSS, lastName: "Inyeccion" }).then((u) => {
        usuario = u;
      });
    });

    after(() => {
      cy.api("DELETE", `/products/${producto.id}`, { token: adminToken });
    });

    it("SEG-UI-01 [ESC35] una reseña con HTML/JS se muestra como texto y no se ejecuta", () => {
      cy.api("POST", `/products/${producto.id}/reviews`, { token: usuario.token, body: { rating: 3, comment: XSS } })
        .its("status")
        .should("be.oneOf", [200, 201]);
      visitarVigilando(`/catalogo/${producto.id}`);
      cy.contains("h1", producto.name).should("be.visible");
      cy.contains(`"${XSS}"`).should("be.visible");
      sinEjecucionDeScripts();
    });

    it("SEG-UI-02 [ESC35] el nombre de un proyecto con HTML/JS se muestra como texto en el detalle", () => {
      cy.api("POST", "/projects", { token: usuario.token, body: { name: XSS, type: "PISO", area: 9 } }).then(({ body }) => {
        cy.iniciarSesionConToken(usuario);
        visitarVigilando(`/proyectos/${body.data.id}`);
        cy.contains("h1", XSS).should("be.visible");
        sinEjecucionDeScripts();
      });
    });

    it("SEG-UI-03 [ESC35] un nombre de usuario con HTML/JS se muestra como texto en la barra y en /cuenta", () => {
      cy.iniciarSesionConToken(usuario);
      visitarVigilando("/cuenta");
      cy.get("nav").contains("button", XSS).should("be.visible");
      cy.contains("h2", `${XSS} Inyeccion`).should("be.visible");
      sinEjecucionDeScripts();
    });

    it("SEG-UI-04 [ESC35] una búsqueda con HTML/JS en la URL se refleja como texto (XSS reflejado)", () => {
      visitarVigilando(`/catalogo?search=${encodeURIComponent(XSS)}`);
      cy.contains("Resultados para:").should("contain.text", XSS);
      sinEjecucionDeScripts();
    });
  });

  context("Sesión y navegación (ESC07, ESC35)", () => {
    let usuario: UsuarioPrueba;

    beforeEach(() => {
      cy.crearUsuarioApi("seg-sesion", { firstName: "Sara", lastName: "Sesion" }).then((u) => {
        usuario = u;
      });
    });

    it("SEG-UI-05 [ESC35] ?redirect= a un dominio externo se ignora: tras el login se queda en la app", () => {
      cy.intercept("POST", "**/api/v1/users/login").as("login");
      cy.visit(`/login?redirect=${encodeURIComponent("https://evil.example/robar")}`);
      cy.get("#email").type(usuario.email);
      cy.get("#password").type(usuario.password, { log: false });
      cy.get("form").find('button[type="submit"]').click();
      cy.wait("@login").its("response.statusCode").should("eq", 200);
      cy.location().should((loc) => {
        expect(loc.origin).to.eq(Cypress.config("baseUrl"));
        expect(loc.pathname).to.eq("/cuenta");
      });
    });

    it("SEG-UI-06 [ESC35] el token no aparece en la URL, en el DOM ni en una cookie legible", () => {
      cy.iniciarSesionConToken(usuario);
      cy.visit("/cuenta");
      cy.contains("h1", "Mi Cuenta").should("be.visible");
      cy.location("href").should("not.include", usuario.token);
      cy.document().then((doc) => {
        expect(doc.documentElement.outerHTML).not.to.include(usuario.token);
        expect(doc.cookie).not.to.include(usuario.token);
      });
    });

    it("SEG-UI-07 [ESC35] las contraseñas se escriben en campos enmascarados (type=password)", () => {
      cy.visit("/login");
      cy.get("#password").should("have.attr", "type", "password");
      cy.visit("/register");
      cy.get('input[placeholder="Mínimo 6 caracteres"]').should("have.attr", "type", "password");
      cy.get('input[placeholder="Repite la contraseña"]').should("have.attr", "type", "password");
    });

    it("SEG-UI-08 [ESC07] tras cerrar sesión, volver atrás hasta /cuenta no muestra los datos de la cuenta", () => {
      cy.iniciarSesionConToken(usuario);
      cy.intercept("GET", "**/api/v1/users/me").as("me");
      cy.visit("/cuenta");
      cy.wait("@me");
      cy.contains(usuario.email).should("be.visible");
      // Navegación del lado del cliente: /cuenta queda en el historial sin recargar la
      // página (un cy.visit con /users/me en vuelo dispararía DEF-05 y cerraría la sesión).
      cy.get("nav").contains("a", "Catálogo").click();
      cy.location("pathname").should("eq", "/catalogo");
      cy.get("nav").contains("button", "Sara").click();
      cy.contains("button", "Cerrar Sesión").click();
      cy.location("pathname").should("eq", "/login");

      cy.go("back");
      cy.location("pathname").should("eq", "/catalogo");
      cy.go("back");
      // De vuelta en /cuenta, la ruta privada vuelve a exigir sesión.
      cy.location("pathname").should("eq", "/login");
      cy.contains(usuario.email).should("not.exist");
      cy.window().its("localStorage").invoke("getItem", "homara_token").should("be.null");
    });

    it("SEG-UI-09 [ESC07] un token falso con rol ADMIN (alg none) en localStorage no abre /admin", () => {
      const falso = `${b64url({ alg: "none", typ: "JWT" })}.${b64url({ id: "admin-001", role: "ADMIN" })}.`;
      cy.intercept("GET", "**/api/v1/users/me").as("me");
      cy.visit("/admin", {
        onBeforeLoad(win) {
          win.localStorage.setItem("homara_token", falso);
        },
      });
      cy.wait("@me").its("response.statusCode").should("eq", 401);
      cy.location("pathname").should("eq", "/login");
      cy.contains("h1", /Dashboard|Panel/i).should("not.exist");
      cy.window().its("localStorage").invoke("getItem", "homara_token").should("be.null");
    });
  });

  context("Cabeceras HTTP del frontend (ESC35)", () => {
    it("DEF-SEG-FE-01 [ESC35] el frontend anuncia Next.js y no envía X-Frame-Options ni CSP (clickjacking)", () => {
      cy.request("/").then(({ headers }) => {
        // Seguro: sin X-Powered-By (poweredByHeader: false) y con frame-ancestors / X-Frame-Options.
        expect(headers["x-powered-by"]).to.eq("Next.js");
        expect(headers).not.to.have.property("x-frame-options");
        expect(headers).not.to.have.property("content-security-policy");
      });
    });

    it("DEF-SEG-FE-02 [ESC35] la sesión vive en localStorage (legible por cualquier script) y no en una cookie HttpOnly", () => {
      cy.crearUsuarioApi("seg-storage").then((u) => {
        cy.iniciarSesionConToken(u);
        cy.visit("/");
        cy.window().then((win) => {
          expect(win.localStorage.getItem("homara_token")).to.eq(u.token);
        });
        cy.getCookies().should("have.length", 0);
      });
    });
  });
});
