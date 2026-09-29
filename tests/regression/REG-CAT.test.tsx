// @vitest-environment jsdom
//
// REG-CAT · Regresión del catálogo (frontend)
// Flujos protegidos: filtrar por categoría en el backend, y agregar desde la
// ficha con el contador de la barra actualizado al instante.

import { screen, waitFor } from "@testing-library/react";
import { test, expect } from "../harness.mjs";
import { backendFalso, conSesion, renderizar, es, esperarA } from "../ui/soporte";
import Navbar from "@/app/components/Navbar";
import CatalogoPage from "@/app/(shop)/catalogo/page";
import ProductDetailPage from "@/app/(shop)/catalogo/[id]/page";
import HomePage from "@/app/page";

const producto = {
  id: "prd_1", name: "Piso Ceramica Beige", description: "Interior", price: 38_900, image: "",
  category: "Pisos", categorySlug: "pisos-ceramicas", rating: 4, reviews: 2, inStock: true,
  stockQuantity: 10, unit: "m²", tags: [],
};

test("REG-CAT-01", "Agregar desde la ficha envía el producto y el contador de la barra sube", async () => {
  // Arrange
  const backend = backendFalso({
    "GET /products/:id": producto,
    "GET /products/:id/reviews": [],
    "GET /cart": { id: "c", items: [] },
    "POST /cart/items": { id: "itm_1" },
  });
  conSesion(backend);
  const { usuario } = renderizar(
    <>
      <Navbar />
      <ProductDetailPage />
    </>,
    { ruta: "/catalogo/prd_1", params: { id: "prd_1" } },
  );
  const carrito = await screen.findByRole("link", { name: es("nav.cart") });
  // La barra recarga el carrito al montar y otra vez cuando la sesión resuelve;
  // se espera a ambas para que el "1" solo pueda llegar por el evento cartUpdated.
  await esperarA(() => screen.queryByRole("link", { name: es("nav.login") }) === null);
  await esperarA(() => backend.de("GET /cart").length >= 2);
  backend.responder("GET /cart", { id: "c", items: [{ id: "itm_1", quantity: 1, product: producto }] });

  // Act
  await usuario.click(await screen.findByRole("button", { name: es("catalog.add_to_cart") }));

  // Assert
  await waitFor(() => expect(carrito).toHaveTextContent("1"));
  expect(backend.de("POST /cart/items")[0].cuerpo).toStrictEqual({ productId: "prd_1", quantity: 1 });
});

test("REG-CAT-02", "Una categoría en la URL filtra el catálogo en el backend con ?category=", async () => {
  // Arrange
  const backend = backendFalso({ "GET /products": [producto], "GET /categories": [] });

  // Act
  renderizar(<CatalogoPage />, { ruta: "/catalogo?category=pinturas" });

  // Assert
  await screen.findByText(`1 ${es("catalog.results_found")}`);
  expect(backend.de("GET /products")[0].query.get("category")).toBe("pinturas");
});

test("REG-CAT-03", "La búsqueda y el orden por precio funcionan juntos en el cliente", async () => {
  // Arrange
  backendFalso({
    "GET /categories": [],
    "GET /products": [
      { ...producto, id: "a", name: "Piso Caro", price: 90_000 },
      { ...producto, id: "b", name: "Piso Barato", price: 20_000 },
      { ...producto, id: "c", name: "Pintura", price: 10_000, description: "", category: "Pinturas" },
    ],
  });
  const { usuario } = renderizar(<CatalogoPage />, { ruta: "/catalogo?search=piso" });
  await screen.findByText("Piso Caro");

  // Act
  await usuario.selectOptions(screen.getByDisplayValue(es("catalog.sort_popular")), "precio-asc");

  // Assert
  expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toStrictEqual(["Piso Barato", "Piso Caro"]);
});

test("REG-CAT-04", "La portada muestra las tres secciones de la vitrina", async () => {
  // Arrange
  backendFalso({
    "GET /products/storefront": {
      recommended: [{ ...producto, id: "r", name: "Recomendado" }],
      offers: [{ ...producto, id: "o", name: "En oferta" }],
      bestSellers: [{ ...producto, id: "b", name: "Más vendido" }],
    },
  });

  // Act
  renderizar(<HomePage />);

  // Assert
  expect(await screen.findByText("Recomendado")).toBeInTheDocument();
  expect(screen.getByText("En oferta")).toBeInTheDocument();
  expect(screen.getByText("Más vendido")).toBeInTheDocument();
});
