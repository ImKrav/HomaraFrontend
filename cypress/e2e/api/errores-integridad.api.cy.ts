// API · Formato uniforme de errores, seguridad de credenciales e integridad del pedido
// ESC41 errores uniformes · ESC35 credenciales/token · ESC37 integridad transaccional

describe("API · Errores, credenciales e integridad (ESC35, ESC37, ESC41)", () => {
  it("API-ERR-01 [ESC41] todos los errores que consume el frontend usan { success:false, error:string } y el código correcto", () => {
    cy.crearUsuarioApi("api-err").then((u) => {
      const casos: [string, string, { token?: string; body?: unknown }, number][] = [
        ["POST", "/users/login", { body: { email: "x@x.co", password: "y" } }, 401],
        ["GET", "/users/me", {}, 401],
        ["POST", "/users/register", { body: { email: "malo" } }, 400],
        ["GET", "/products/no-existe-123", {}, 404],
        ["POST", "/cart/items", { token: u.token, body: { productId: "x", quantity: 1 } }, 400],
        ["POST", "/orders", { token: u.token, body: { paymentMethod: "card", shippingAddress: "a", shippingCity: "b", shippingState: "c" } }, 400],
        ["GET", "/admin/metrics", { token: u.token }, 403],
        ["POST", "/projects", { token: u.token, body: { name: "" } }, 400],
      ];
      casos.forEach(([metodo, ruta, opciones, codigo]) => {
        cy.api(metodo, ruta, opciones).then((r) => {
          expect(r.status, `${metodo} ${ruta}`).to.eq(codigo);
          expect(r.headers["content-type"]).to.include("application/json");
          expect(r.body).to.have.all.keys("success", "error");
          expect(r.body.success).to.eq(false);
          expect(r.body.error).to.be.a("string").and.have.length.greaterThan(0);
        });
      });
    });
  });

  it("API-ERR-02 [ESC41] un JSON mal formado responde 400 con el mismo formato de error", () => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("apiUrl")}/users/login`,
      body: '{"email": roto',
      headers: { "Content-Type": "application/json" },
      failOnStatusCode: false,
    }).then((r) => {
      expect(r.status).to.eq(400);
      expect(r.body.success).to.eq(false);
    });
  });

  it("API-SEG-01 [ESC35] la contraseña no viaja en login/registro/me y el token expira (exp en el JWT)", () => {
    cy.crearUsuarioApi("api-seg").then((u) => {
      const payload = JSON.parse(atob(u.token.split(".")[1]));
      expect(payload).to.include.all.keys("id", "email", "role", "iat", "exp");
      expect(payload).not.to.have.property("password");
      const dias = (payload.exp - payload.iat) / 86400;
      expect(dias, "vigencia del token en días").to.be.within(0.01, 30);
      cy.api("GET", "/users/me", { token: u.token }).its("body.data").should("not.have.property", "password");
    });
  });

  it("API-INT-01 [ESC37/ESC28] crear el pedido descuenta el inventario exactamente una vez", () => {
    cy.tokenApi(Cypress.env("adminEmail"), Cypress.env("adminPassword")).then((admin) => {
      cy.crearProductoApi(admin, { stockQuantity: 10 }).then((p) => {
        cy.crearUsuarioApi("api-int").then((u) => {
          cy.agregarAlCarritoApi(u.token, p.id, 3);
          cy.api("POST", "/orders", {
            token: u.token,
            body: { paymentMethod: "card", shippingAddress: "Calle 9", shippingCity: "Ibagué", shippingState: "Tolima" },
          }).its("status").should("eq", 201);
          cy.api("GET", `/products/${p.id}`).its("body.data.stockQuantity").should("eq", 7);
          // Reintentar el pedido con el carrito ya vacío no vuelve a descontar.
          cy.api("POST", "/orders", {
            token: u.token,
            body: { paymentMethod: "card", shippingAddress: "Calle 9", shippingCity: "Ibagué", shippingState: "Tolima" },
          }).its("status").should("eq", 400);
          cy.api("GET", `/products/${p.id}`).its("body.data.stockQuantity").should("eq", 7);
          cy.api("DELETE", `/products/${p.id}`, { token: admin });
        });
      });
    });
  });
});
