// Regresión E2E · Panel de administración
// ESC31 dashboard · ESC32 CRUD de productos · ESC33 inventario · ESC34 gestión de pedidos
//
// Reglas de datos: solo se crean/eliminan productos propios (nombre con marca de
// tiempo) y solo se cambia el estado de pedidos creados por la propia prueba.

const ADMIN = { email: Cypress.env("adminEmail"), password: Cypress.env("adminPassword") };
const PRODUCTO_NOMBRE = `Producto Cypress ${Date.now()}`;

describe("Regresión · Administración (ESC31-ESC34)", () => {
  let adminToken = "";

  before(() => {
    cy.tokenApi(ADMIN.email, ADMIN.password).then((t) => {
      adminToken = t;
    });
  });

  beforeEach(() => {
    cy.iniciarSesion(ADMIN.email, ADMIN.password);
  });

  after(() => {
    // Limpieza defensiva: si alguna prueba falló a mitad, se borra el producto propio.
    cy.api("GET", "/products").then(({ body }) => {
      (body.data as { id: string; name: string }[])
        .filter((p) => p.name === PRODUCTO_NOMBRE)
        .forEach((p) => cy.api("DELETE", `/products/${p.id}`, { token: adminToken }));
    });
  });

  it("REG-ADM-01 [ESC31] el dashboard carga las métricas del backend", () => {
    cy.intercept("GET", "**/api/v1/admin/metrics").as("metricas");
    cy.visit("/admin");
    cy.wait("@metricas").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      const metricas = response?.body.data as { label: string; value: string }[];
      expect(metricas).to.have.length(4);
      cy.contains("h1", "Dashboard").should("be.visible");
      ["Ventas del Mes", "Pedidos Activos", "Productos", "Clientes Nuevos"].forEach((etiqueta) => {
        cy.contains("p", etiqueta).should("be.visible");
      });
      const productos = metricas.find((m) => m.label === "Productos");
      cy.contains("p", /^Productos$/).parent().should("contain.text", productos?.value);
    });
  });

  it("REG-ADM-02 [ESC32] el formulario de producto exige los campos obligatorios", () => {
    cy.intercept("POST", "**/api/v1/products").as("crear");
    cy.visit("/admin/productos");
    cy.get("#btn-add-product").click();
    cy.contains("h3", "Agregar Nuevo Producto").should("be.visible");
    // Se omite la validación nativa para comprobar la de la aplicación.
    cy.get("#btn-submit-product").closest("form").submit();
    cy.contains("Por favor completa todos los campos requeridos (*).").should("be.visible");
    cy.get("@crear.all").should("have.length", 0);
  });

  it("REG-ADM-03 [ESC32] rechaza un precio en 0 con el mensaje de validación", () => {
    cy.intercept("POST", "**/api/v1/products").as("crear");
    cy.visit("/admin/productos");
    cy.get("#btn-add-product").click();
    cy.get("#input-name").type("Precio inválido");
    cy.get("#input-description").type("Descripción");
    cy.get("#select-category option:not([disabled])").first().then(($o) => {
      cy.get("#select-category").select(String($o.val()));
    });
    cy.get("#input-price").type("0");
    cy.get("#input-stock").type("5");
    cy.get("#btn-submit-product").click();
    cy.contains("El precio normal debe ser un número positivo válido.").should("be.visible");
    cy.get("@crear.all").should("have.length", 0);
  });

  it("REG-ADM-04 [ESC32] crea un producto propio y luego lo elimina (CRUD)", () => {
    cy.intercept("POST", "**/api/v1/products").as("crear");
    cy.intercept("DELETE", "**/api/v1/products/*").as("eliminar");
    cy.intercept("GET", "**/api/v1/products?limit=100").as("listar");
    cy.visit("/admin/productos");
    cy.wait("@listar");

    // --- Crear ---
    cy.get("#btn-add-product").click();
    cy.get("#input-name").type(PRODUCTO_NOMBRE);
    cy.get("#input-description").type("Producto temporal creado por la suite de regresión Cypress.");
    cy.get("#select-category option:not([disabled])").first().then(($o) => {
      cy.get("#select-category").select(String($o.val()));
    });
    cy.get("#select-unit").select("unidad");
    cy.get("#input-price").type("12345");
    cy.get("#input-stock").type("7");
    cy.get("#btn-submit-product").click();

    cy.wait("@crear").then(({ request, response }) => {
      expect(request.body).to.include({ name: PRODUCTO_NOMBRE, price: 12345, stockQuantity: 7, unit: "unidad" });
      expect(response?.statusCode).to.eq(201);
      const id = response?.body.data.id as string;

      cy.get('[role="alert"]').should("contain.text", "Producto guardado correctamente");
      cy.get('input[placeholder^="Buscar"]').type(PRODUCTO_NOMBRE);
      cy.get("tbody tr").should("have.length", 1).and("contain.text", PRODUCTO_NOMBRE).and("contain.text", "Activo");

      // --- Eliminar ---
      cy.get(`#btn-delete-product-${id}`).click();
      cy.contains("h3", "¿Eliminar Producto?").should("be.visible");
      cy.get("#btn-confirm-delete").click();
      cy.wait("@eliminar").its("response.statusCode").should("eq", 200);
      cy.get('[role="alert"]').should("contain.text", "Producto eliminado correctamente");
      cy.get("tbody").should("not.contain.text", PRODUCTO_NOMBRE);
      cy.api("GET", `/products/${id}`).its("status").should("eq", 404);
    });
  });

  it("REG-ADM-05 [ESC33] el inventario muestra las estadísticas y la tabla de stock", () => {
    cy.intercept("GET", "**/api/v1/admin/inventory").as("inventario");
    cy.visit("/admin/inventario");
    cy.wait("@inventario").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      const { stats, products } = response?.body.data;
      cy.contains("h1", "Inventario").should("be.visible");
      cy.contains("Total Productos").parent().should("contain.text", String(stats.totalProducts));
      cy.get("tbody tr").should("have.length", Math.min(25, products.length));
    });
  });

  it("REG-ADM-06 [ESC34] el administrador cambia el estado de un pedido propio de la prueba", () => {
    // Pedido creado por un cliente nuevo (no se toca ningún pedido sembrado).
    cy.crearUsuarioApi("pedido-admin", { firstName: "Cliente", lastName: "Admin" }).then((cliente) => {
      cy.productosApi().then((productos) => {
        const p = productos.find((x) => x.inStock && x.stockQuantity > 20) as { id: string };
        cy.agregarAlCarritoApi(cliente.token, p.id, 1);
      });
      cy.api("POST", "/orders", {
        token: cliente.token,
        body: { paymentMethod: "card", shippingAddress: "Calle Admin 1", shippingCity: "Pasto", shippingState: "Nariño" },
      }).then(({ body }) => {
        const numero = body.data.orderNumber as string;
        const dbId = body.data.id as string;
        cy.intercept("GET", "**/api/v1/orders?admin=true").as("pedidos");
        cy.intercept("PUT", `**/api/v1/orders/${dbId}/status`).as("cambiarEstado");
        cy.visit("/admin/pedidos");
        cy.wait("@pedidos");

        cy.get(`#btn-view-order-${numero}`).click();
        cy.get("#select-order-status").should("have.value", "pendiente").select("procesando");
        cy.wait("@cambiarEstado").then(({ request, response }) => {
          expect(request.body).to.deep.equal({ status: "PROCESANDO" });
          expect(response?.statusCode).to.eq(200);
        });
        cy.get('[role="alert"]').should("contain.text", `Pedido #${numero} actualizado a Procesando`);
        cy.api("GET", `/orders/${numero}`, { token: cliente.token })
          .its("body.data.status")
          .should("match", /procesando/i);
      });
    });
  });

  it("REG-ADM-07 [ESC34] DEF-06 corregido: el buscador de pedidos filtra por ciudad sin errores", () => {
    const errores: string[] = [];
    cy.on("uncaught:exception", (err) => {
      errores.push(err.message);
      return false; // se registra el error para la aserción sin abortar la prueba
    });
    cy.intercept("GET", "**/api/v1/orders?admin=true").as("pedidos");
    cy.visit("/admin/pedidos");
    cy.wait("@pedidos");
    cy.get('input[placeholder^="Buscar"]').type("Pasto");

    // Antes: order.orderNumber.toLowerCase() sobre un campo inexistente → TypeError y sin tabla.
    cy.get("table").should("be.visible");
    cy.wrap(errores).should("have.length", 0);
  });
  it("REG-ADM-08 [ESC32] edita el precio de un producto propio y el cambio persiste", () => {
    cy.crearProductoApi(adminToken, { price: 20000 }).then((p) => {
      cy.intercept("PUT", `**/api/v1/products/${p.id}`).as("editar");
      cy.visit("/admin/productos");
      cy.get('input[placeholder^="Buscar"]').type(p.name);
      cy.get(`#btn-edit-product-${p.id}`).click();
      cy.get("#input-name").should("have.value", p.name);
      cy.get("#input-price").should("have.value", "20000").clear().type("25500");
      cy.get("#btn-submit-product").click();
      cy.wait("@editar").then(({ request, response }) => {
        expect(request.body).to.include({ name: p.name, price: 25500 });
        expect(response?.statusCode).to.eq(200);
      });
      cy.get('[role="alert"]').should("contain.text", "Producto guardado correctamente");
      cy.api("GET", `/products/${p.id}`).its("body.data.price").should("eq", 25500);
      cy.api("DELETE", `/products/${p.id}`, { token: adminToken });
    });
  });

  it("REG-ADM-09 [ESC33] el filtro de alertas del inventario deja solo los productos con stock bajo", () => {
    cy.intercept("GET", "**/api/v1/admin/inventory").as("inventario");
    cy.visit("/admin/inventario");
    cy.wait("@inventario").then(({ response }) => {
      const bajos = (response?.body.data.products as { stockStatus: string }[]).filter((x) => x.stockStatus === "stock_bajo").length;
      cy.get('select:has(option[value="low_stock"])').select("low_stock");
      cy.get("tbody tr").should("have.length", Math.min(25, bajos));
      cy.get("tbody tr").each(($tr) => cy.wrap($tr).should("contain.text", "Stock Bajo"));
    });
  });

  it("REG-ADM-10 [ESC34] el filtro por estado deja solo los pedidos con ese estado", () => {
    cy.intercept("GET", "**/api/v1/orders?admin=true").as("pedidos");
    cy.visit("/admin/pedidos");
    cy.wait("@pedidos").then(({ response }) => {
      const entregados = (response?.body.data as { status: string }[]).filter((o) => o.status === "entregado").length;
      cy.get('select:has(option[value="entregado"])').first().select("entregado");
      cy.get("tbody tr").should("have.length", Math.min(25, entregados));
      cy.get("tbody tr").each(($tr) => cy.wrap($tr).should("contain.text", "Entregado"));
    });
  });

  it("REG-ADM-11 [ESC06] el menú de usuario del ADMIN muestra 'Panel Admin' y lleva al dashboard", () => {
    cy.visit("/catalogo");
    cy.get("nav").contains("button", "Admin").click();
    cy.contains("a", "Panel Admin").should("have.attr", "href", "/admin").click();
    cy.location("pathname").should("eq", "/admin");
    cy.contains("h1", "Dashboard").should("be.visible");
  });
});
