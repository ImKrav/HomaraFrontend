// Regresión E2E · Proyectos (estimador de materiales)
// ESC17 crear proyecto · ESC19 consultar proyectos · ESC24 materiales al carrito

import type { UsuarioPrueba } from "../../support/commands";

type ProductoApiMin = { id: string };

const BOTON_GUARDAR = "Guardar y Calcular Insumos";

describe("Regresión · Proyectos (ESC17, ESC19, ESC24)", () => {
  let usuario: UsuarioPrueba;

  beforeEach(() => {
    cy.crearUsuarioApi("proyectos", { firstName: "Pedro" }).then((u) => {
      usuario = u;
      cy.iniciarSesionConToken(u);
    });
    cy.intercept("POST", "**/api/v1/projects").as("crearProyecto");
    cy.intercept("GET", "**/api/v1/projects").as("proyectos");
  });

  it("REG-PRY-01 [ESC17] sin nombre muestra la advertencia del campo obligatorio y no envía nada", () => {
    cy.visit("/proyectos/nuevo");
    cy.contains("h1", "Nuevo Proyecto Inteligente").should("be.visible");
    cy.contains("button", BOTON_GUARDAR).click();

    cy.get('[role="alert"]').should("contain.text", "Por favor, ingresa el campo obligatorio: Nombre descriptivo.");
    cy.get("@crearProyecto.all").should("have.length", 0);
  });

  it("REG-PRY-02 [ESC17] con nombre pero sin largo advierte por el campo Largo", () => {
    cy.visit("/proyectos/nuevo");
    cy.get("#project-name").type("Sala sin medidas");
    cy.contains("button", BOTON_GUARDAR).click();

    cy.get('[role="alert"]').should("contain.text", "Por favor, ingresa el campo obligatorio: Largo.");
    cy.get("@crearProyecto.all").should("have.length", 0);
  });

  it("REG-PRY-03 [ESC17] crea un proyecto de piso 4 x 3 m, calcula 12 m² y abre su detalle", () => {
    const nombre = `Sala Cypress ${Date.now()}`;
    cy.visit("/proyectos/nuevo");
    cy.get("#project-name").type(nombre);
    cy.get("#length").type("4");
    cy.get("#width").type("3");
    cy.contains("button", BOTON_GUARDAR).click();

    cy.wait("@crearProyecto").then(({ request, response }) => {
      expect(request.body).to.include({ name: nombre, type: "PISO", length: 4, width: 3, area: 12 });
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.data.materials).to.have.length.greaterThan(0);
      cy.location("pathname", { timeout: 15000 }).should("eq", `/proyectos/${response?.body.data.id}`);
    });
    cy.contains("h1", nombre).should("be.visible");
    cy.contains("12.00 m²").should("be.visible");
    cy.contains("Solo Piso").should("be.visible");
  });

  it("REG-PRY-04 [ESC17] con dimensiones negativas el frontend no valida y el backend responde 400", () => {
    cy.visit("/proyectos/nuevo");
    cy.get("#project-name").type("Proyecto negativo");
    cy.get("#length").type("-4");
    cy.get("#width").type("3");
    cy.contains("button", BOTON_GUARDAR).click();

    // DEF-04: no hay validación de valores positivos en el cliente; el error llega del backend.
    cy.wait("@crearProyecto").its("response.statusCode").should("eq", 400);
    cy.get('[role="alert"]').should("contain.text", "Longitud debe ser positiva");
    cy.location("pathname").should("eq", "/proyectos/nuevo");
  });

  it("REG-PRY-05 [ESC19] la lista de proyectos muestra el proyecto creado y el total en las estadísticas", () => {
    const nombre = `Baño Cypress ${Date.now()}`;
    cy.api("POST", "/projects", {
      token: usuario.token,
      body: {
        name: nombre, type: "PISO", length: 2, width: 2, height: null, area: 4, materialType: "ceramica",
        tileFormat: "60x60", wastePercent: 10, layingPattern: "directo", deductDoors: 0, deductWindows: 0,
        customSubtractions: 0, includeAdhesive: true, includeGrout: true, includeSpacers: true, includeTools: false,
        selectedProductId: null,
      },
    }).its("status").should("eq", 201);

    cy.visit("/proyectos");
    cy.wait("@proyectos").its("response.body.data").should("have.length", 1);
    cy.contains("h1", "Mis Proyectos").should("be.visible");
    cy.contains("p", /^Total$/).siblings("p").first().should("have.text", "1");
    cy.contains(nombre).should("be.visible").click();
    cy.location("pathname").should("match", /^\/proyectos\/[a-z0-9]+$/);
    cy.contains("h1", nombre).should("be.visible");
  });

  it("REG-PRY-06 [ESC24] el botón Comprar de un material vinculado lo agrega al carrito", () => {
    cy.productosApi().then((productos) => {
      const ceramica = productos.find((p) => p.categorySlug === "pisos-ceramicas" && p.inStock) as { id: string };
      cy.api("POST", "/projects", {
        token: usuario.token,
        body: {
          name: `Cocina Cypress ${Date.now()}`, type: "PISO", length: 3, width: 3, height: null, area: 9,
          materialType: "ceramica", tileFormat: "60x60", wastePercent: 10, layingPattern: "directo",
          deductDoors: 0, deductWindows: 0, customSubtractions: 0, includeAdhesive: true, includeGrout: true,
          includeSpacers: true, includeTools: false, selectedProductId: ceramica.id,
        },
      }).then(({ body }) => {
        const vinculados = (body.data.materials as { productId: string | null }[]).filter((m) => m.productId);
        expect(vinculados, "materiales vinculados a productos reales").to.have.length.greaterThan(0);
        cy.intercept("POST", "**/api/v1/cart/items").as("agregar");
        cy.visit(`/proyectos/${body.data.id}`);
        cy.contains("button", /^Comprar$/).first().click();
        cy.wait("@agregar").then(({ request, response }) => {
          expect(response?.statusCode).to.eq(201);
          expect(vinculados.map((m) => m.productId)).to.include(request.body.productId);
        });
        cy.get('[role="alert"]').should("contain.text", "Producto agregado al carrito exitosamente");
        cy.api("GET", "/cart", { token: usuario.token }).its("body.data.items").should("have.length", 1);
      });
    });
  });
  it("REG-PRY-07 [ESC17] un proyecto de paredes exige la altura", () => {
    cy.visit("/proyectos/nuevo");
    cy.get("#project-name").type("Paredes sin altura");
    cy.contains("label", "Solo Paredes").click();
    cy.get("#length").type("4");
    cy.contains("button", BOTON_GUARDAR).click();
    cy.get('[role="alert"]').should("contain.text", "Por favor, ingresa el campo obligatorio: Alto");
    cy.get("@crearProyecto.all").should("have.length", 0);
  });

  it("REG-PRY-08 [ESC20] personaliza el cálculo: paredes 4x3x2.5 m, 1 puerta, 1 ventana y patrón diagonal (15%)", () => {
    cy.visit("/proyectos/nuevo");
    cy.get("#project-name").type("Paredes personalizadas");
    cy.contains("label", "Solo Paredes").click();
    cy.get("#length").type("4");
    cy.get("#width").type("3");
    cy.get("#height").type("2.5");
    cy.contains("button", "2. Precisión").click();
    cy.contains("h4", "Puertas").closest("div.p-4").find('input[type="number"]').clear().type("1");
    cy.contains("h4", "Ventanas").closest("div.p-4").find('input[type="number"]').clear().type("1");
    cy.contains("button", "Diagonal (45°)").click();
    cy.contains("15%").should("be.visible");
    cy.contains("button", BOTON_GUARDAR).click();

    // Bruto (4+3)*2*2.5 = 35 m²; deducciones 2.0 (puerta) + 1.5 (ventana) → neto 31.5 m².
    cy.wait("@crearProyecto").then(({ request, response }) => {
      expect(request.body).to.include({
        type: "PARED", area: 31.5, deductDoors: 1, deductWindows: 1, layingPattern: "diagonal", wastePercent: 15,
      });
      expect(response?.statusCode).to.eq(201);
    });
    cy.contains("31.50 m²").should("be.visible");
  });

  it("REG-PRY-09 [ESC21] excluir insumos opcionales (crucetas y herramientas) los quita del cálculo", () => {
    cy.visit("/proyectos/nuevo");
    cy.get("#project-name").type("Piso sin accesorios");
    cy.get("#length").type("3");
    cy.get("#width").type("3");
    cy.contains("button", "4. Accesorios").click();
    cy.get("#include-spacers-checkbox").uncheck({ force: true });
    cy.get("#include-tools-checkbox").uncheck({ force: true });
    cy.contains("button", BOTON_GUARDAR).click();

    cy.wait("@crearProyecto").then(({ request, response }) => {
      expect(request.body).to.include({ includeSpacers: false, includeTools: false, includeAdhesive: true, includeGrout: true });
      const nombres = (response?.body.data.materials as { name: string }[]).map((m) => m.name).join(" | ");
      expect(nombres).not.to.match(/Crucetas|Nivel de burbuja|Llana|Mazo/);
      expect(nombres).to.match(/Pegante/);
      // ESC18: el costo estimado es la suma de los materiales calculados.
      const suma = (response?.body.data.materials as { price: number }[]).reduce((a, m) => a + m.price, 0);
      expect(response?.body.data.estimatedCost).to.eq(suma);
    });
  });

  it("REG-PRY-10 [ESC22] 'Usar en Proyecto' desde la ficha vincula el producto a un proyecto existente", () => {
    cy.api("POST", "/projects", {
      token: usuario.token,
      body: {
        name: "Destino vínculo", type: "PISO", length: 2, width: 2, height: null, area: 4, materialType: "ceramica",
        tileFormat: "60x60", wastePercent: 10, layingPattern: "directo", deductDoors: 0, deductWindows: 0,
        customSubtractions: 0, includeAdhesive: true, includeGrout: true, includeSpacers: true, includeTools: false,
        selectedProductId: null,
      },
    }).then(({ body }) => {
      const proyectoId = body.data.id;
      cy.productosApi().then((productos) => {
        const ceramica = productos.find((p) => p.categorySlug === "pisos-ceramicas" && p.inStock) as ProductoApiMin;
        cy.intercept("PUT", `**/api/v1/projects/${proyectoId}`).as("vincular");
        cy.visit(`/catalogo/${ceramica.id}`);
        cy.contains("button", "Usar en Proyecto").click();
        cy.contains("Destino vínculo").click();
        cy.contains("button", "Confirmar Asignación").click();
        cy.wait("@vincular").then(({ request, response }) => {
          expect(request.body.selectedProductId).to.eq(ceramica.id);
          expect(response?.statusCode).to.eq(200);
        });
        // Tras asignar, la app abre el detalle del proyecto con el material ya vinculado.
        cy.location("pathname").should("eq", `/proyectos/${proyectoId}`);
        cy.contains("button", /^Comprar$/).should("be.visible");
        cy.api("GET", `/projects/${proyectoId}`, { token: usuario.token })
          .its("body.data.materials")
          .then((mats: { productId: string | null }[]) => {
            expect(mats.map((m) => m.productId)).to.include(ceramica.id);
          });
      });
    });
  });

  it("REG-PRY-11 [ESC23] cambia el estado, edita el nombre y elimina un proyecto propio", () => {
    cy.api("POST", "/projects", {
      token: usuario.token,
      body: {
        name: "Proyecto a editar", type: "PISO", length: 2, width: 3, height: null, area: 6, materialType: "ceramica",
        tileFormat: "60x60", wastePercent: 10, layingPattern: "directo", deductDoors: 0, deductWindows: 0,
        customSubtractions: 0, includeAdhesive: true, includeGrout: true, includeSpacers: true, includeTools: false,
        selectedProductId: null,
      },
    }).then(({ body }) => {
      const id = body.data.id;
      cy.intercept("PUT", `**/api/v1/projects/${id}`).as("actualizar");
      cy.intercept("DELETE", `**/api/v1/projects/${id}`).as("eliminar");
      cy.visit(`/proyectos/${id}`);

      // Estado
      cy.contains("h1", "Proyecto a editar").should("be.visible");
      cy.get('select:has(option[value="PAUSADO"])').select("PAUSADO");
      cy.wait("@actualizar").its("request.body").should("deep.equal", { status: "PAUSADO" });
      cy.get('[role="alert"]').should("contain.text", "Estado del proyecto actualizado.");

      // Edición (modo edición del asistente, guarda con PUT)
      cy.contains("button", /^Editar$/).click();
      cy.location("search").should("eq", `?edit=${id}`);
      cy.get("#project-name").should("have.value", "Proyecto a editar").clear().type("Proyecto editado");
      cy.contains("button", "Guardar Cambios").click();
      cy.wait("@actualizar").its("request.body.name").should("eq", "Proyecto editado");
      cy.location("pathname", { timeout: 15000 }).should("eq", `/proyectos/${id}`);
      cy.contains("h1", "Proyecto editado").should("be.visible");

      // Eliminación con modal de confirmación
      cy.contains("button", /^Eliminar$/).click();
      cy.get(".fixed").contains("button", /^Eliminar$/).click();
      cy.wait("@eliminar").its("response.statusCode").should("eq", 200);
      cy.location("pathname").should("eq", "/proyectos");
      cy.api("GET", "/projects", { token: usuario.token }).its("body.data").should("have.length", 0);
    });
  });
});
