// Regresión E2E · Autenticación y control de acceso
// ESC01 registro · ESC02 login · ESC03 logout · ESC07 rutas privadas

import { claveDePrueba, correoUnico } from "../../support/utilidades";

const CLIENTE = { email: Cypress.env("clienteEmail"), password: Cypress.env("clientePassword") };

/** Llena el formulario de registro (no tiene ids: se ubican los campos por placeholder). */
function llenarRegistro(datos: { nombre: string; apellido: string; email: string; clave: string; confirmacion: string }) {
  cy.get('input[placeholder="Juan"]').type(datos.nombre);
  cy.get('input[placeholder="Pérez"]').type(datos.apellido);
  cy.get('input[placeholder="juan@email.com"]').type(datos.email);
  cy.get('input[placeholder="Mínimo 8 caracteres"]').type(datos.clave, { log: false });
  cy.get('input[placeholder="Repite la contraseña"]').type(datos.confirmacion, { log: false });
}

/** Contraseña válida (>= 8) generada para esta ejecución; los casos de longitud usan prefijos de ella. */
const CLAVE = claveDePrueba();

describe("Regresión · Autenticación (ESC01, ESC02, ESC03, ESC07)", () => {
  context("ESC01 · Registro de usuario", () => {
    beforeEach(() => {
      cy.intercept("POST", "**/api/v1/users/register").as("registro");
      cy.visit("/register");
    });

    it("REG-AUT-01 [ESC01] registra un usuario con datos válidos y lo lleva a /cuenta", () => {
      const email = correoUnico("registro");
      llenarRegistro({ nombre: "Laura", apellido: "Gómez", email, clave: CLAVE, confirmacion: CLAVE });
      cy.contains("button", "Registrarme y Comenzar").click();

      cy.wait("@registro").then(({ request, response }) => {
        expect(request.body).to.include({ email, firstName: "Laura", lastName: "Gómez" });
        expect(response?.statusCode).to.eq(201);
      });
      cy.location("pathname").should("eq", "/cuenta");
      cy.contains("h1", "Mi Cuenta").should("be.visible");
      cy.contains("h2", "Laura Gómez").should("be.visible");
      cy.contains(email).should("be.visible");
      cy.getCookie("homara_session").should("have.property", "httpOnly", true);
    });

    it("REG-AUT-02 [ESC01] rechaza un correo ya registrado y muestra el error del backend", () => {
      llenarRegistro({ nombre: "Juan", apellido: "Duplicado", email: CLIENTE.email, clave: CLAVE, confirmacion: CLAVE });
      cy.contains("button", "Registrarme y Comenzar").click();

      cy.wait("@registro").its("response.statusCode").should("eq", 400);
      cy.contains("El correo electrónico ya está registrado.").should("be.visible");
      cy.location("pathname").should("eq", "/register");
      cy.getCookie("homara_session").should("be.null");
    });

    it("REG-AUT-03 [ESC01] no envía la petición si las contraseñas no coinciden", () => {
      llenarRegistro({ nombre: "Ana", apellido: "Ruiz", email: correoUnico("nocoincide"), clave: CLAVE, confirmacion: claveDePrueba() });
      cy.contains("button", "Registrarme y Comenzar").click();

      cy.contains("Las contraseñas no coinciden.").should("be.visible");
      cy.get("@registro.all").should("have.length", 0);
      cy.location("pathname").should("eq", "/register");
    });

    it("REG-AUT-04 [ESC01] DEF-01 corregido: el cliente rechaza claves de 7 caracteres con la regla del backend (mín. 8)", () => {
      cy.get('input[type="password"]').first().should("have.attr", "placeholder", "Mínimo 8 caracteres");
      llenarRegistro({ nombre: "Pablo", apellido: "Mora", email: correoUnico("clave7"), clave: CLAVE.slice(0, 7), confirmacion: CLAVE.slice(0, 7) });
      cy.contains("button", "Registrarme y Comenzar").click();

      // Antes la clave pasaba al backend y volvía un 400 técnico.
      cy.contains("La contraseña debe tener al menos 8 caracteres.").should("be.visible");
      cy.get("@registro.all").should("have.length", 0);
      cy.location("pathname").should("eq", "/register");
    });

    it("REG-AUT-05 [ESC01] rechaza en el cliente una clave de menos de 8 caracteres", () => {
      llenarRegistro({ nombre: "Pablo", apellido: "Mora", email: correoUnico("clave5"), clave: CLAVE.slice(0, 5), confirmacion: CLAVE.slice(0, 5) });
      cy.contains("button", "Registrarme y Comenzar").click();

      cy.contains("La contraseña debe tener al menos 8 caracteres.").should("be.visible");
      cy.get("@registro.all").should("have.length", 0);
    });
  });

  context("ESC02 · Inicio de sesión", () => {
    beforeEach(() => {
      cy.intercept("POST", "**/api/v1/users/login").as("login");
      cy.visit("/login");
    });

    it("REG-AUT-06 [ESC02] inicia sesión con credenciales válidas y la sesión queda en una cookie HttpOnly", () => {
      cy.get("#email").type(CLIENTE.email);
      cy.get("#password").type(CLIENTE.password, { log: false });
      cy.contains("button", "Iniciar Sesión").click();

      cy.wait("@login").its("response.statusCode").should("eq", 200);
      cy.location("pathname").should("eq", "/cuenta");
      cy.getCookie("homara_session").should("have.property", "httpOnly", true);
      cy.get("nav").contains("button", "Juan").should("be.visible");
    });

    it("REG-AUT-07 [ESC02] con clave incorrecta muestra un mensaje genérico y no crea sesión", () => {
      cy.get("#email").type(CLIENTE.email);
      cy.get("#password").type("claveIncorrecta");
      cy.contains("button", "Iniciar Sesión").click();

      cy.wait("@login").its("response.statusCode").should("eq", 401);
      cy.contains("Credenciales incorrectas. Verifique correo y contraseña.").should("be.visible");
      cy.location("pathname").should("eq", "/login");
      cy.getCookie("homara_session").should("be.null");
    });

    it("REG-AUT-08 [ESC02] con un correo inexistente muestra el MISMO mensaje genérico (no revela cuentas)", () => {
      cy.get("#email").type(correoUnico("noexiste"));
      cy.get("#password").type("cualquiera123");
      cy.contains("button", "Iniciar Sesión").click();

      cy.wait("@login").its("response.statusCode").should("eq", 401);
      cy.contains("Credenciales incorrectas. Verifique correo y contraseña.").should("be.visible");
    });

    it("REG-AUT-09 [ESC02] no envía el formulario con campos vacíos (validación nativa required)", () => {
      cy.contains("button", "Iniciar Sesión").click();
      cy.get("#email:invalid").should("exist");
      cy.get("@login.all").should("have.length", 0);
    });
  });

  context("ESC03 · Cierre de sesión", () => {
    it("REG-AUT-10 [ESC03] cierra sesión desde el menú de usuario, borra la cookie y redirige a /login", () => {
      cy.iniciarSesion(CLIENTE.email, CLIENTE.password);
      cy.visit("/catalogo");
      cy.get("nav").contains("button", "Juan").click();
      cy.contains("button", "Cerrar Sesión").click();

      cy.location("pathname").should("eq", "/login");
      cy.getCookie("homara_session").should("be.null");
      cy.get("nav").contains("a", "Iniciar Sesión").should("be.visible");
    });
  });

  context("ESC07 · Rutas privadas y rol de administrador", () => {
    ["/cuenta", "/proyectos/nuevo", "/checkout"].forEach((ruta) => {
      it(`REG-AUT-11 [ESC07] sin sesión, ${ruta} redirige a /login`, () => {
        cy.visit(ruta);
        cy.location("pathname").should("eq", "/login");
        cy.get("#email").should("be.visible");
      });
    });

    it("REG-AUT-12 [ESC07] sin sesión, /carrito muestra el aviso de inicio de sesión requerido", () => {
      cy.visit("/carrito");
      cy.contains("h3", "Inicia sesión para gestionar tu carrito").should("be.visible");
      cy.contains("a", "Iniciar Sesión").should("have.attr", "href", "/login");
      cy.contains("a", "Crear Cuenta").should("have.attr", "href", "/register");
    });

    it("REG-AUT-13 [ESC07] sin sesión, /admin redirige a /login", () => {
      cy.visit("/admin");
      cy.location("pathname").should("eq", "/login");
    });

    it("REG-AUT-14 [ESC07] un CUSTOMER que entra a /admin es devuelto al inicio", () => {
      cy.iniciarSesion(CLIENTE.email, CLIENTE.password);
      cy.visit("/admin/productos");
      cy.location("pathname").should("eq", "/");
      cy.get("#btn-add-product").should("not.exist");
    });

    it("REG-AUT-15 [ESC07] un token inválido se descarta (401) y la ruta privada termina en /login", () => {
      cy.setCookie("homara_session", "token.invalido.manipulado", { httpOnly: true, sameSite: "strict" });
      cy.intercept("GET", "**/api/v1/users/session").as("sesion");
      cy.visit("/cuenta");
      cy.wait("@sesion").its("response.body.data").should("be.null");
      cy.location("pathname").should("eq", "/login");
      cy.getCookie("homara_session").should("be.null");
    });

    it("REG-AUT-16 [ESC07] DEF-05 corregido: un fallo de red al validar la sesión (no un 401) no la cierra", () => {
      // Token válido, pero /users/me sufre un error de red transitorio.
      cy.tokenApi(CLIENTE.email, CLIENTE.password).then((token) => {
        cy.setCookie("homara_session", token, { httpOnly: true, sameSite: "strict" });
        cy.intercept("POST", "**/api/v1/users/logout").as("logout");
        cy.intercept("GET", "**/api/v1/users/session", { forceNetworkError: true }).as("sesionCaida");
        cy.visit("/cuenta");
        cy.wait("@sesionCaida");
        // Antes AuthContext llamaba a logout() ante cualquier error; ahora solo un 401 cierra la sesión.
        cy.get("@logout.all").should("have.length", 0);
        cy.getCookie("homara_session").its("value").should("eq", token);
      });
    });
  });
});
