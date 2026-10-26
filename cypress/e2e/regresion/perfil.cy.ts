// Regresión E2E · Perfil del usuario
// ESC04 consultar perfil · ESC05 editar perfil

import type { UsuarioPrueba } from "../../support/commands";

/** El modal de edición no asigna id a sus campos: se ubican por placeholder o por orden. */
const modal = () => cy.contains("h3", "Editar Perfil").parent();

describe("Regresión · Perfil (ESC04, ESC05)", () => {
  let usuario: UsuarioPrueba;

  beforeEach(() => {
    cy.crearUsuarioApi("perfil", { firstName: "Sofía", lastName: "Perfil" }).then((u) => {
      usuario = u;
      cy.iniciarSesionConToken(u);
    });
    cy.intercept("PUT", "**/api/v1/users/me").as("guardarPerfil");
    cy.intercept("GET", "**/api/v1/projects").as("proyectos");
  });

  it("REG-PER-01 [ESC04] /cuenta muestra nombre, correo, ubicación sin especificar y contadores en 0", () => {
    cy.visit("/cuenta");
    cy.wait("@proyectos");
    cy.contains("h1", "Mi Cuenta").should("be.visible");
    cy.contains("h2", "Sofía Perfil").should("be.visible");
    cy.contains(usuario.email).should("be.visible");
    cy.contains("p", /^Proyectos$/).siblings("p").should("have.text", "0");
    cy.contains("p", /^Pedidos$/).siblings("p").should("have.text", "0");
    cy.contains("Aún no has realizado ninguna compra en Homara.").should("be.visible");
  });

  it("REG-PER-02 [ESC05] edita teléfono, ciudad y departamento; persiste y se refleja en la tarjeta", () => {
    cy.visit("/cuenta");
    cy.wait("@proyectos");
    cy.contains("button", "Editar Perfil").click();
    modal().within(() => {
      cy.get('input[placeholder="Ej: 300 123 4567"]').clear().type("3104567890");
      cy.get('input[placeholder="Ej: Bogotá"]').clear().type("Medellín");
      cy.get('input[placeholder="Ej: Cundinamarca"]').clear().type("Antioquia");
      cy.contains("button", "Guardar Cambios").click();
    });

    cy.wait("@guardarPerfil").then(({ request, response }) => {
      expect(request.body).to.include({ firstName: "Sofía", phone: "3104567890", city: "Medellín", state: "Antioquia" });
      expect(response?.statusCode).to.eq(200);
    });
    cy.get('[role="alert"]').should("contain.text", "Perfil actualizado exitosamente");
    cy.contains("h3", "Editar Perfil").should("not.exist");
    cy.contains("Medellín, Antioquia").should("be.visible");
    cy.contains("3104567890").should("be.visible");
    cy.api("GET", "/users/me", { token: usuario.token }).its("body.data.city").should("eq", "Medellín");
  });

  it("REG-PER-03 [ESC05] con nombre vacío muestra el error de campos requeridos y no guarda", () => {
    cy.visit("/cuenta");
    cy.wait("@proyectos");
    cy.contains("button", "Editar Perfil").click();
    modal().find("input").first().clear();
    // Se omite la validación nativa (required) para verificar la validación de la app.
    modal().find("form").submit();

    modal().should("contain.text", "Nombre y Apellido son requeridos.");
    cy.get("@guardarPerfil.all").should("have.length", 0);
  });

  it("REG-PER-04 [ESC05] cancelar la edición cierra el modal sin enviar cambios", () => {
    cy.visit("/cuenta");
    cy.wait("@proyectos");
    cy.contains("button", "Editar Perfil").click();
    modal().find("input").first().clear().type("Otro");
    modal().contains("button", "Cancelar").click();

    cy.contains("h3", "Editar Perfil").should("not.exist");
    cy.contains("h2", "Sofía Perfil").should("be.visible");
    cy.get("@guardarPerfil.all").should("have.length", 0);
  });

  it("REG-PER-05 [ESC03] el botón Cerrar Sesión de la cuenta termina la sesión", () => {
    cy.visit("/cuenta");
    cy.wait("@proyectos");
    cy.contains("main button", "Cerrar Sesión").click();
    cy.location("pathname").should("eq", "/login");
    cy.getCookie("homara_session").should("be.null");
  });
});
