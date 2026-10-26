// API · Usuarios y autenticación (contrato que consume AuthContext/cuenta)
// ESC01 registro · ESC02 login · ESC04/05 perfil · ESC07 token

import { claveDePrueba, correoUnico } from "../../support/utilidades";

const JWT = /^[\w-]+\.[\w-]+\.[\w-]+$/;
const MENSAJE_LOGIN = "Credenciales incorrectas. Verifique correo y contraseña.";

describe("API · /users (ESC01, ESC02, ESC04, ESC05, ESC07)", () => {
  it("API-USR-01 [ESC02] POST /users/login válido → 200 con token JWT y usuario sin contraseña", () => {
    cy.api("POST", "/users/login", {
      body: { email: Cypress.env("clienteEmail"), password: Cypress.env("clientePassword") },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.success).to.eq(true);
      expect(body.data.token).to.match(JWT);
      expect(body.data.user).to.include({ email: Cypress.env("clienteEmail"), role: "CUSTOMER" });
      expect(body.data.user).to.have.all.keys(
        "id", "email", "firstName", "lastName", "phone", "address", "city", "state", "zipCode", "role",
      );
      expect(body.data.user).not.to.have.property("password");
    });
  });

  it("API-USR-02 [ESC02] login con clave errada y con correo inexistente → 401 con el mismo mensaje genérico", () => {
    cy.api("POST", "/users/login", { body: { email: Cypress.env("clienteEmail"), password: claveDePrueba() } }).then((r1) => {
      cy.api("POST", "/users/login", { body: { email: correoUnico("fantasma"), password: claveDePrueba() } }).then((r2) => {
        expect(r1.status).to.eq(401);
        expect(r2.status).to.eq(401);
        expect(r1.body).to.deep.equal({ success: false, error: MENSAJE_LOGIN });
        expect(r2.body).to.deep.equal(r1.body);
      });
    });
  });

  it("API-USR-03 [ESC01] POST /users/register válido → 201 con token y rol CUSTOMER", () => {
    const email = correoUnico("api-reg");
    cy.api("POST", "/users/register", {
      body: { email, password: claveDePrueba(), firstName: "Api", lastName: "Registro" },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      expect(body.data.token).to.match(JWT);
      expect(body.data.user).to.include({ email, role: "CUSTOMER", firstName: "Api" });
      expect(body.data.user).not.to.have.property("password");
    });
  });

  it("API-USR-04 [ESC01] registro duplicado → 400 'El correo electrónico ya está registrado.'", () => {
    cy.api("POST", "/users/register", {
      body: { email: Cypress.env("clienteEmail"), password: claveDePrueba(), firstName: "J", lastName: "P" },
    }).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(body).to.deep.equal({ success: false, error: "El correo electrónico ya está registrado." });
    });
  });

  const invalidos: [string, Record<string, unknown>, RegExp][] = [
    ["clave de 7 caracteres", { password: claveDePrueba(7) }, /al menos 8 caracteres/],
    ["correo mal formado", { email: "no-es-correo" }, /Email inválido/],
    ["sin nombre", { firstName: undefined }, /firstName/],
  ];
  invalidos.forEach(([caso, cambio, mensaje]) => {
    it(`API-USR-05 [ESC01] registro con ${caso} → 400 de validación`, () => {
      const body = { email: correoUnico("api-inv"), password: claveDePrueba(), firstName: "A", lastName: "B", ...cambio };
      cy.api("POST", "/users/register", { body }).then((r) => {
        expect(r.status).to.eq(400);
        expect(r.body.success).to.eq(false);
        expect(r.body.error).to.match(mensaje);
      });
    });
  });

  it("API-USR-06 [ESC07] GET /users/me sin token → 401 'Token no provisto.'; con token basura → 401", () => {
    cy.api("GET", "/users/me").then(({ status, body }) => {
      expect(status).to.eq(401);
      expect(body.error).to.eq("Token no provisto.");
    });
    cy.api("GET", "/users/me", { token: "a.b.c" }).its("status").should("eq", 401);
  });

  it("API-USR-07 [ESC04] GET /users/me con token → 200 con datos y contadores", () => {
    cy.crearUsuarioApi("api-me").then((u) => {
      cy.api("GET", "/users/me", { token: u.token }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.data).to.include({ id: u.id, email: u.email, projectCount: 0, orderCount: 0 });
        expect(body.data).not.to.have.property("password");
      });
    });
  });

  it("API-USR-08 [ESC05] PUT /users/me actualiza los campos enviados", () => {
    cy.crearUsuarioApi("api-put").then((u) => {
      cy.api("PUT", "/users/me", { token: u.token, body: { firstName: "Nuevo", lastName: "Nombre", city: "Tunja" } })
        .then(({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.data).to.include({ firstName: "Nuevo", lastName: "Nombre", city: "Tunja" });
        });
    });
  });

  it("API-USR-09 [ESC05] DEF-07 corregido: la respuesta de PUT /users/me NO expone el hash de la contraseña", () => {
    cy.crearUsuarioApi("api-hash").then((u) => {
      cy.api("PUT", "/users/me", { token: u.token, body: { firstName: "Hash", lastName: "Oculto" } }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.data).not.to.have.property("password");
        expect(body.data).to.include({ firstName: "Hash", lastName: "Oculto" });
      });
    });
  });

  it("API-USR-10 [ESC05] DEF-08 corregido: PUT /users/me rechaza firstName vacío (400)", () => {
    cy.crearUsuarioApi("api-vacio").then((u) => {
      cy.api("PUT", "/users/me", { token: u.token, body: { firstName: "", lastName: "X" } }).then(({ status, body }) => {
        expect(status).to.eq(400);
        expect(body.success).to.eq(false);
      });
      cy.api("GET", "/users/me", { token: u.token }).its("body.data.firstName").should("not.eq", "");
    });
  });
});
