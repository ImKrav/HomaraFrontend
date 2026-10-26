// API · Catálogo (productos, categorías, vitrina, reseñas)
// ESC08 listar · ESC09 filtrar · ESC10 detalle · ESC11 categorías · ESC12 vitrina

const CAMPOS_PRODUCTO = [
  "id", "name", "description", "price", "originalPrice", "image", "rating", "inStock",
  "stockQuantity", "unit", "category", "categorySlug", "tags", "reviews",
];

describe("API · Catálogo (ESC08-ESC12)", () => {
  it("API-CAT-01 [ESC08] GET /products → 200 { success, data[] } con el contrato que usa ProductCard", () => {
    cy.api("GET", "/products").then(({ status, body, headers }) => {
      expect(status).to.eq(200);
      expect(headers["content-type"]).to.include("application/json");
      expect(body.success).to.eq(true);
      expect(body.data).to.be.an("array").and.have.length.greaterThan(0);
      body.data.forEach((p: Record<string, unknown>) => {
        expect(p).to.include.all.keys(...CAMPOS_PRODUCTO);
        expect(p.price, `precio de ${p.name}`).to.be.a("number").and.greaterThan(0);
        expect(p.stockQuantity).to.be.a("number").and.at.least(0);
        expect(p.rating).to.be.within(0, 5);
        expect(p.tags).to.be.an("array");
        if (p.originalPrice !== null) expect(p.originalPrice as number).to.be.greaterThan(p.price as number);
      });
    });
  });

  it("API-CAT-02 [ESC11] GET /products?category=pinturas → solo productos de esa categoría", () => {
    cy.api("GET", "/products?category=pinturas").then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.data).to.have.length.greaterThan(0);
      body.data.forEach((p: { categorySlug: string }) => expect(p.categorySlug).to.eq("pinturas"));
    });
  });

  it("API-CAT-03 [ESC09] OBS-02: GET /products ignora ?search y ?limit (el filtrado lo hace el cliente)", () => {
    cy.api("GET", "/products").then(({ body: todos }) => {
      cy.api("GET", "/products?search=zzz-no-existe&limit=2").then(({ body }) => {
        expect(body.data).to.have.length(todos.data.length);
      });
    });
  });

  it("API-CAT-04 [ESC10] GET /products/:id → 200 con el producto; id inexistente → 404", () => {
    cy.api("GET", "/products").then(({ body }) => {
      const p = body.data[0];
      cy.api("GET", `/products/${p.id}`).then((r) => {
        expect(r.status).to.eq(200);
        expect(r.body.data).to.include({ id: p.id, name: p.name, price: p.price });
      });
    });
    cy.api("GET", "/products/no-existe-123").then(({ status, body }) => {
      expect(status).to.eq(404);
      expect(body).to.deep.equal({ success: false, error: "Producto no encontrado" });
    });
  });

  it("API-CAT-05 [ESC11] GET /categories → 200 con slug, nombre e ícono únicos", () => {
    cy.api("GET", "/categories").then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.data).to.have.length.greaterThan(0);
      body.data.forEach((c: Record<string, unknown>) => expect(c).to.include.all.keys("id", "name", "slug", "icon"));
      const slugs = body.data.map((c: { slug: string }) => c.slug);
      expect(new Set(slugs).size, "slugs únicos").to.eq(slugs.length);
    });
  });

  it("API-CAT-06 [ESC12] GET /products/storefront → recommended, offers y bestSellers (las ofertas tienen descuento)", () => {
    cy.api("GET", "/products/storefront").then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.data).to.have.all.keys("recommended", "offers", "bestSellers");
      body.data.offers.forEach((p: { price: number; originalPrice: number | null }) => {
        expect(p.originalPrice, "oferta con precio original").to.be.a("number");
        expect(p.originalPrice as number).to.be.greaterThan(p.price);
      });
    });
  });

  it("API-CAT-07 [ESC10] GET /products/:id/reviews → 200 con reseñas de 1 a 5 estrellas", () => {
    cy.api("GET", "/products").then(({ body }) => {
      const conResenas = body.data.find((p: { reviews: number }) => p.reviews > 0);
      cy.api("GET", `/products/${conResenas.id}/reviews`).then((r) => {
        expect(r.status).to.eq(200);
        expect(r.body.data).to.have.length(conResenas.reviews);
        r.body.data.forEach((rv: { rating: number; productId: string }) => {
          expect(rv.rating).to.be.within(1, 5);
          expect(rv.productId).to.eq(conResenas.id);
        });
      });
    });
  });
});
