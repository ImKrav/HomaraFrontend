// Flujos E2E de proyectos (estimador de materiales → catálogo → compra)

import type { ProductoApi } from "../../support/commands";
import { buscarYAbrir, evidencia, llenarEnvio } from "./comun";

const BOTON_GUARDAR = "Guardar y Calcular Insumos";

/** Cerámicas que el asistente ofrece para el material "ceramica" (mismo filtro que la app), en el orden de la API. */
const ceramicas = (lista: ProductoApi[]) =>
  lista.filter((p) => {
    const n = p.name.toLowerCase();
    return (n.includes("cerámica") || n.includes("ceramica") || n.includes("baldosa")) && !n.includes("porcelanato");
  });

/** Valor de una estadística de /proyectos (Total, En progreso, Completados, Pausados). */
const estadistica = (etiqueta: string) => cy.contains("p", new RegExp(`^${etiqueta}$`)).siblings("p").first();

/** Botones "Comprar" de los materiales vinculados en el detalle del proyecto. */
const botonesComprar = () => cy.get("main button").filter((_, b) => b.textContent?.trim() === "Comprar");

describe("Flujos E2E · Proyectos", () => {
  beforeEach(() => {
    cy.intercept("POST", "**/api/v1/projects").as("crearProyecto");
    cy.intercept("PUT", "**/api/v1/projects/*").as("actualizar");
    cy.intercept("DELETE", "**/api/v1/projects/*").as("eliminar");
    cy.intercept("POST", "**/api/v1/cart/items").as("agregar");
    cy.intercept("POST", "**/api/v1/orders").as("crearPedido");
  });

  it("FLU-09 [ESC17→ESC18→ESC24→ESC27→ESC28→ESC23→ESC19] el cliente planifica un piso, compra todos sus materiales y cierra el proyecto", () => {
    cy.crearUsuarioApi("flujo-planifica", { firstName: "Iván" }).then((usuario) => {
      cy.iniciarSesionConToken(usuario);
      cy.visit("/");

      // 1. Lista vacía → nuevo proyecto 4 x 3 m
      cy.get("nav").contains("a", "Mis Proyectos").click();
      estadistica("Total").should("have.text", "0");
      cy.contains("Crear nuevo proyecto").click();
      cy.get("#project-name").type("Cocina nueva");
      cy.get("#length").type("4");
      cy.get("#width").type("3");
      cy.contains("button", BOTON_GUARDAR).click();
      cy.wait("@crearProyecto").then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        const proyecto = response?.body.data;
        const vinculados = new Set((proyecto.materials as { productId: string | null }[]).map((m) => m.productId).filter(Boolean));
        expect(vinculados.size, "materiales con producto del catálogo").to.be.greaterThan(0);
        cy.location("pathname", { timeout: 15000 }).should("eq", `/proyectos/${proyecto.id}`);
        cy.contains("12.00 m²").should("be.visible");
        evidencia("FLU-09 1 proyecto calculado");

        // 2. Compra cada material vinculado
        botonesComprar().should("have.length.at.least", 1).then(($b) => {
          Cypress._.times($b.length, (i) => {
            botonesComprar().eq(i).click();
            cy.wait("@agregar").its("response.statusCode").should("eq", 201);
          });
        });
        cy.api("GET", "/cart", { token: usuario.token }).its("body.data.items").then((items: { product: { id: string } }[]) => {
          expect([...new Set(items.map((x) => x.product.id))].sort()).to.deep.equal([...vinculados].sort());
        });

        // 3. Checkout
        cy.get('nav a[aria-label="Carrito"]').click();
        cy.contains("a", "Ir a Pagar").click();
        llenarEnvio();
        cy.get('button[type="submit"]').click();
        cy.wait("@crearPedido").its("response.statusCode").should("eq", 201);
        // OBS-01: tras pagar se va al historial de pedidos; desde ahí vuelve a sus proyectos
        cy.location("pathname").should("eq", "/cuenta");
        cy.visit("/proyectos");

        // 4. Marca el proyecto como completado y las estadísticas lo reflejan
        cy.contains("Cocina nueva").click();
        cy.get('select:has(option[value="COMPLETADO"])').select("COMPLETADO");
        cy.wait("@actualizar").its("request.body").should("deep.equal", { status: "COMPLETADO" });
        cy.get('[role="alert"]').should("contain.text", "Estado del proyecto actualizado.");
        cy.get("nav").contains("a", "Mis Proyectos").click();
        estadistica("Completados").should("have.text", "1");
        estadistica("En progreso").should("have.text", "0");
        evidencia("FLU-09 2 proyecto completado");
      });
    });
  });

  it("FLU-10 [ESC17→ESC20→ESC19→ESC23] ciclo de vida: crea paredes personalizadas, las pausa, las edita y las elimina", () => {
    cy.crearUsuarioApi("flujo-ciclo", { firstName: "Carla" }).then((usuario) => {
      cy.iniciarSesionConToken(usuario);
      cy.visit("/proyectos/nuevo");

      // 1. Paredes 4 x 3 x 2,5 m con una puerta → 33 m² netos
      cy.get("#project-name").type("Habitación principal");
      cy.contains("label", "Solo Paredes").click();
      cy.get("#length").type("4");
      cy.get("#width").type("3");
      cy.get("#height").type("2.5");
      cy.contains("button", "2. Precisión").click();
      cy.contains("h4", "Puertas").closest("div.p-4").find('input[type="number"]').clear().type("1");
      cy.contains("button", BOTON_GUARDAR).click();
      cy.wait("@crearProyecto").then(({ response }) => {
        expect(response?.body.data).to.include({ type: "PARED", area: 33 });
        const id = response?.body.data.id as string;
        cy.location("pathname", { timeout: 15000 }).should("eq", `/proyectos/${id}`);
        cy.contains("33.00 m²").should("be.visible");

        // 2. Lo pausa y la lista lo cuenta como pausado
        cy.get('select:has(option[value="PAUSADO"])').select("PAUSADO");
        cy.wait("@actualizar").its("response.statusCode").should("eq", 200);
        cy.get("nav").contains("a", "Mis Proyectos").click();
        estadistica("Total").should("have.text", "1");
        estadistica("Pausados").should("have.text", "1");
        evidencia("FLU-10 1 pausado");

        // 3. Lo edita: nuevo nombre y largo 5 m → (5+3)·2·2,5 − 2 = 38 m²
        cy.contains("Habitación principal").click();
        cy.contains("button", /^Editar$/).click();
        cy.get("#project-name").clear().type("Habitación ampliada");
        cy.get("#length").clear().type("5");
        cy.contains("button", "Guardar Cambios").click();
        cy.wait("@actualizar").its("request.body").should("include", { name: "Habitación ampliada", length: 5, area: 38 });
        cy.location("pathname", { timeout: 15000 }).should("eq", `/proyectos/${id}`);
        cy.contains("h1", "Habitación ampliada").should("be.visible");
        cy.contains("38.00 m²").should("be.visible");
        evidencia("FLU-10 2 editado");

        // 4. Lo elimina y la lista queda vacía
        cy.contains("button", /^Eliminar$/).click();
        cy.get(".fixed").contains("button", /^Eliminar$/).click();
        cy.wait("@eliminar").its("response.statusCode").should("eq", 200);
        cy.location("pathname").should("eq", "/proyectos");
        estadistica("Total").should("have.text", "0");
        cy.contains("Habitación ampliada").should("not.exist");
      });
    });
  });

  it("FLU-11 [ESC17→ESC10→ESC22→ESC24→ESC13] desde la ficha de un producto lo asigna a su proyecto y lo compra desde el proyecto", () => {
    cy.productosApi().then((lista) => {
      const ceramica = ceramicas(lista).filter((p) => p.inStock).slice(-1)[0];
      cy.crearUsuarioApi("flujo-asigna", { firstName: "Saúl" }).then((usuario) => {
        cy.iniciarSesionConToken(usuario);

        // 1. Crea el proyecto destino
        cy.visit("/proyectos/nuevo");
        cy.get("#project-name").type("Baño social");
        cy.get("#length").type("2");
        cy.get("#width").type("2");
        cy.contains("button", BOTON_GUARDAR).click();
        cy.wait("@crearProyecto").then(({ response }) => {
          const id = response?.body.data.id as string;

          // 2. Desde la ficha del producto: "Usar en Proyecto"
          buscarYAbrir(ceramica.name);
          cy.contains("button", "Usar en Proyecto").click();
          cy.contains("Baño social").click();
          evidencia("FLU-11 1 asignar a proyecto");
          cy.contains("button", "Confirmar Asignación").click();
          cy.wait("@actualizar").its("request.body.selectedProductId").should("eq", ceramica.id);
          cy.location("pathname").should("eq", `/proyectos/${id}`);

          // 3. Compra ese material desde el proyecto
          cy.contains(ceramica.name).parents().filter((_, el) => Cypress.$(el).find("button").filter((__, b) => b.textContent?.trim() === "Comprar").length === 1)
            .first()
            .find("button")
            .filter((_, b) => b.textContent?.trim() === "Comprar")
            .click();
          cy.wait("@agregar").its("request.body.productId").should("eq", ceramica.id);
          cy.get('nav a[aria-label="Carrito"]').click();
          cy.contains("h3", ceramica.name).should("be.visible");
          evidencia("FLU-11 2 material en el carrito");
        });
      });
    });
  });

  it("FLU-12 [ESC10→ESC22→ESC02→ESC17] DEF-27 y OBS-05 corregidos: el visitante inicia sesión, vuelve a la ficha y el asistente guarda el producto elegido", () => {
    cy.productosApi().then((lista) => {
      const opciones = ceramicas(lista);
      const elegida = opciones.slice(-1)[0];
      expect(elegida.id, "la elegida no es la que el asistente toma por defecto").not.to.eq(opciones[0].id);
      cy.crearUsuarioApi("flujo-primer-proyecto", { firstName: "Noa" }).then((usuario) => {
        // 1. Sin sesión, "Usar en Proyecto" pide iniciar sesión
        cy.visit(`/catalogo/${elegida.id}`);
        cy.contains("button", "Usar en Proyecto").click();
        cy.get(".fixed").contains("button", "Iniciar Sesión").click();
        cy.location("pathname").should("eq", "/login");
        cy.get("#email").type(usuario.email);
        cy.get("#password").type(usuario.password, { log: false });
        cy.get("form").find('button[type="submit"]').click();
        // OBS-05: vuelve a la ficha desde la que pidió el login (antes iba siempre a /cuenta)
        cy.location("pathname").should("eq", `/catalogo/${elegida.id}`);

        // 2. Sin proyectos, ofrece crear el primero con el producto
        cy.contains("button", "Usar en Proyecto").click();
        cy.contains("No tienes proyectos activos").should("be.visible");
        cy.contains("button", "Crear Primer Proyecto").click();
        cy.location("search").should("eq", `?selectedProductId=${elegida.id}`);

        // 3. El asistente respeta ?selectedProductId (antes guardaba el primero de la lista)
        cy.get("#project-name").type("Primer proyecto");
        cy.get("#length").type("3");
        cy.get("#width").type("2");
        evidencia("FLU-12 1 asistente desde la ficha");
        cy.contains("button", BOTON_GUARDAR).click();
        cy.wait("@crearProyecto").then(({ request, response }) => {
          expect(response?.statusCode).to.eq(201);
          expect(request.body.selectedProductId).to.eq(elegida.id);
        });
      });
    });
  });
});
