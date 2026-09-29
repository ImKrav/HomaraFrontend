// @vitest-environment jsdom
//
// UI · Catálogo: listado con búsqueda, orden y categorías; ficha de producto,
// agregar al carrito, reseñas y "usar en proyecto".

import { screen, waitFor, within } from "@testing-library/react";
import { test, expect } from "../harness.mjs";
import { backendFalso, conSesion, renderizar, es } from "./soporte";
import { router } from "./navegacion.mjs";
import CatalogoPage from "@/app/(shop)/catalogo/page";
import ProductDetailPage from "@/app/(shop)/catalogo/[id]/page";

const producto = (over: Record<string, unknown> = {}) => ({
  id: "prd_1",
  name: "Piso Ceramica Beige 60x60",
  description: "Piso para interiores",
  price: 38_900,
  image: "",
  category: "Pisos y Cerámicas",
  categorySlug: "pisos-ceramicas",
  rating: 4.5,
  reviews: 10,
  inStock: true,
  stockQuantity: 100,
  unit: "m²",
  tags: [],
  ...over,
});

const CATALOGO = [
  producto({ id: "prd_1", name: "Piso Ceramica Beige 60x60", price: 38_900, reviews: 10 }),
  producto({ id: "prd_2", name: "Pintura Blanca Galón", price: 89_000, reviews: 50, category: "Pinturas", categorySlug: "pinturas" }),
  producto({ id: "prd_3", name: "Cemento Gris 50kg", price: 32_000, reviews: 5, description: "Uso estructural" }),
];

const nombresEnPantalla = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

// --- Listado ---------------------------------------------------------------

test("ui-cat-01", "Lista los productos del backend con su conteo y las categorías como filtros", async () => {
  // Arrange
  backendFalso({
    "GET /products": CATALOGO,
    "GET /categories": [{ id: "c1", name: "Pinturas", slug: "pinturas" }],
  });

  // Act
  renderizar(<CatalogoPage />, { ruta: "/catalogo" });

  // Assert
  expect(await screen.findByText(`3 ${es("catalog.results_found")}`)).toBeInTheDocument();
  expect(screen.getByText("Piso Ceramica Beige 60x60")).toBeInTheDocument();
  expect(screen.getByText("Cemento Gris 50kg")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Pinturas/ })).toBeInTheDocument();
});

test("ui-cat-02", "Por defecto ordena por popularidad y el selector cambia a precio ascendente", async () => {
  // Arrange
  backendFalso({ "GET /products": CATALOGO, "GET /categories": [] });
  const { usuario } = renderizar(<CatalogoPage />, { ruta: "/catalogo" });
  await screen.findByText("Cemento Gris 50kg");
  const porPopularidad = nombresEnPantalla();

  // Act
  await usuario.selectOptions(screen.getByDisplayValue(es("catalog.sort_popular")), "precio-asc");

  // Assert
  expect(porPopularidad).toStrictEqual(["Pintura Blanca Galón", "Piso Ceramica Beige 60x60", "Cemento Gris 50kg"]);
  expect(nombresEnPantalla()).toStrictEqual(["Cemento Gris 50kg", "Piso Ceramica Beige 60x60", "Pintura Blanca Galón"]);
});

test("ui-cat-03", "La búsqueda filtra por nombre o descripción y se puede limpiar", async () => {
  // Arrange
  backendFalso({ "GET /products": CATALOGO, "GET /categories": [] });
  const { usuario } = renderizar(<CatalogoPage />, { ruta: "/catalogo" });
  await screen.findByText("Cemento Gris 50kg");

  // Act
  await usuario.type(screen.getByPlaceholderText(es("catalog.search_placeholder")), "estructural{Enter}");
  const filtrados = nombresEnPantalla();
  await usuario.click(screen.getByRole("button", { name: es("catalog.clean_search") }));

  // Assert
  expect(filtrados).toStrictEqual(["Cemento Gris 50kg"]);
  expect(nombresEnPantalla()).toHaveLength(3);
});

test("ui-cat-04", "Elegir una categoría pide al backend solo esa categoría", async () => {
  // Arrange
  const backend = backendFalso({
    "GET /products": CATALOGO,
    "GET /categories": [{ id: "c1", name: "Pinturas", slug: "pinturas" }],
  });
  const { usuario } = renderizar(<CatalogoPage />, { ruta: "/catalogo" });
  await screen.findByText("Cemento Gris 50kg");

  // Act
  await usuario.click(screen.getByRole("button", { name: /Pinturas/ }));

  // Assert
  await waitFor(() => expect(backend.de("GET /products").at(-1)!.query.get("category")).toBe("pinturas"));
});

test("ui-cat-05", "Sin resultados muestra el estado vacío y 'Ver todo' restablece los filtros", async () => {
  // Arrange
  backendFalso({ "GET /products": CATALOGO, "GET /categories": [] });
  const { usuario } = renderizar(<CatalogoPage />, { ruta: "/catalogo?search=zzz" });

  // Act
  await screen.findByText(es("catalog.no_results"));
  await usuario.click(screen.getByRole("button", { name: es("catalog.view_all") }));

  // Assert
  expect(await screen.findByText(`3 ${es("catalog.results_found")}`)).toBeInTheDocument();
});

// --- Ficha de producto ------------------------------------------------------

const fichaBackend = (over: Record<string, unknown> = {}) =>
  backendFalso({
    "GET /products/:id": producto({ originalPrice: 50_000, ...over }),
    "GET /products/:id/reviews": [],
  });

test("ui-cat-06", "La ficha muestra nombre, precio, descuento y stock disponible", async () => {
  // Arrange
  fichaBackend();

  // Act
  renderizar(<ProductDetailPage />, { ruta: "/catalogo/prd_1", params: { id: "prd_1" } });

  // Assert
  expect(await screen.findByRole("heading", { level: 1, name: "Piso Ceramica Beige 60x60" })).toBeInTheDocument();
  expect(screen.getAllByText(/38\.900/).length).toBeGreaterThan(0);
  expect(screen.getAllByText("-22%").length).toBeGreaterThan(0);
  expect(screen.getByText(new RegExp(`\\(100 ${es("catalog.available_units")}\\)`))).toBeInTheDocument();
});

test("ui-cat-07", "Un producto sin stock se ofrece bajo pedido con su advertencia", async () => {
  // Arrange
  fichaBackend({ inStock: false, stockQuantity: 0 });

  // Act
  renderizar(<ProductDetailPage />, { ruta: "/catalogo/prd_1", params: { id: "prd_1" } });

  // Assert
  expect(await screen.findByText(es("catalog.backorder_warning"))).toBeInTheDocument();
  expect(screen.getByRole("button", { name: es("catalog.add_to_cart") })).toBeEnabled();
});

test("ui-cat-08", "Agregar al carrito envía el producto con cantidad 1 y confirma con un aviso", async () => {
  // Arrange
  const backend = fichaBackend();
  backend.responder("POST /cart/items", { id: "itm_1" });
  const { usuario } = renderizar(<ProductDetailPage />, { ruta: "/catalogo/prd_1", params: { id: "prd_1" } });
  const escuchaCarrito = new Promise((resolve) => window.addEventListener("cartUpdated", resolve, { once: true }));

  // Act
  await usuario.click(await screen.findByRole("button", { name: es("catalog.add_to_cart") }));

  // Assert
  expect(await screen.findByRole("alert")).toHaveTextContent(es("catalog.add_to_cart_success"));
  expect(backend.de("POST /cart/items")[0].cuerpo).toStrictEqual({ productId: "prd_1", quantity: 1 });
  await expect(escuchaCarrito).resolves.toBeInstanceOf(Event);
});

test("ui-cat-09", "Un producto inexistente muestra el mensaje de no encontrado", async () => {
  // Arrange
  backendFalso();

  // Act
  renderizar(<ProductDetailPage />, { ruta: "/catalogo/nada", params: { id: "nada" } });

  // Assert
  expect(await screen.findByText(es("catalog.no_results"))).toBeInTheDocument();
});

// --- Reseñas -----------------------------------------------------------------

test("ui-cat-10", "Sin sesión, las reseñas invitan a iniciar sesión en lugar del formulario", async () => {
  // Arrange
  fichaBackend();

  // Act
  renderizar(<ProductDetailPage />, { ruta: "/catalogo/prd_1", params: { id: "prd_1" } });

  // Assert
  expect(await screen.findByText(es("reviews.login_required"))).toBeInTheDocument();
  expect(screen.queryByLabelText(es("reviews.comment_label"))).not.toBeInTheDocument();
});

test("ui-cat-11", "Calificar exige estrellas y luego envía calificación y comentario", async () => {
  // Arrange
  const backend = fichaBackend();
  conSesion(backend);
  backend.responder("POST /products/:id/reviews", { id: "rev_1" });
  const { usuario } = renderizar(<ProductDetailPage />, { ruta: "/catalogo/prd_1", params: { id: "prd_1" } });
  const comentario = await screen.findByLabelText(es("reviews.comment_label"));
  const formulario = comentario.closest("form")!;
  const [, , , cuartaEstrella] = within(formulario).getAllByRole("button");
  await usuario.type(comentario, "Muy buen acabado");

  // Act
  await usuario.click(within(formulario).getByRole("button", { name: es("reviews.submit_btn") }));
  const errorSinEstrellas = (await screen.findByText(es("reviews.rating_required_error"))).textContent;
  await usuario.click(cuartaEstrella);
  await usuario.click(within(formulario).getByRole("button", { name: es("reviews.submit_btn") }));

  // Assert
  expect(errorSinEstrellas).toBe(es("reviews.rating_required_error"));
  expect(await screen.findByText(es("reviews.success_title"))).toBeInTheDocument();
  expect(backend.de("POST /products/:id/reviews")).toHaveLength(1);
  expect(backend.de("POST /products/:id/reviews")[0].cuerpo).toStrictEqual({ rating: 4, comment: "Muy buen acabado" });
});

test("ui-cat-12", "Quien ya reseñó ve la insignia en lugar del formulario", async () => {
  // Arrange
  const backend = fichaBackend();
  conSesion(backend);
  backend.responder("GET /products/:id/reviews", [
    { id: "rev_1", rating: 5, comment: "Excelente", createdAt: "2026-02-01", userId: "usr_001", productId: "prd_1", userFirstName: "Ana" },
  ]);

  // Act
  renderizar(<ProductDetailPage />, { ruta: "/catalogo/prd_1", params: { id: "prd_1" } });

  // Assert
  expect(await screen.findByText(es("reviews.already_reviewed_badge"))).toBeInTheDocument();
  expect(screen.getByText('"Excelente"')).toBeInTheDocument();
});

// --- Usar en proyecto ---------------------------------------------------------

test("ui-cat-13", "Asignar el producto a un proyecto lo vincula con el tipo de material detectado", async () => {
  // Arrange
  const backend = fichaBackend();
  conSesion(backend);
  backend.responder("GET /projects", [{ id: "proy_1", name: "Cocina", type: "PISO", area: 20, status: "EN_PROGRESO" }]);
  backend.responder("PUT /projects/:id", { id: "proy_1" });
  const { usuario } = renderizar(<ProductDetailPage />, { ruta: "/catalogo/prd_1", params: { id: "prd_1" } });
  await usuario.click(await screen.findByRole("button", { name: es("projects.assign_btn") }));
  await usuario.click(await screen.findByRole("button", { name: /Cocina/ }));

  // Act
  await usuario.click(screen.getByRole("button", { name: es("projects.assign_confirm_btn") }));

  // Assert
  await waitFor(() => expect(backend.de("PUT /projects/:id")).toHaveLength(1));
  const [asignacion] = backend.de("PUT /projects/:id");
  expect(asignacion.ruta).toBe("/projects/proy_1");
  expect(asignacion.cuerpo).toStrictEqual({ selectedProductId: "prd_1", materialType: "ceramica" });
});

test("ui-cat-14", "Sin sesión, 'usar en proyecto' ofrece iniciar sesión volviendo a la ficha", async () => {
  // Arrange
  fichaBackend();
  const { usuario } = renderizar(<ProductDetailPage />, { ruta: "/catalogo/prd_1", params: { id: "prd_1" } });
  await usuario.click(await screen.findByRole("button", { name: es("projects.assign_btn") }));

  // Act
  await usuario.click(screen.getByRole("button", { name: es("projects.assign_login_btn") }));

  // Assert
  expect(router.push).toHaveBeenCalledWith("/login?redirect=/catalogo/prd_1");
});

// Defecto abierto F-2 (ver la tabla en tests/README.md): se espera que falle.
test.fails("ui-cat-15", "El enlace de categoría de la ficha filtra el catálogo por esa categoría", async () => {
  // Arrange
  fichaBackend();

  // Act
  renderizar(<ProductDetailPage />, { ruta: "/catalogo/prd_1", params: { id: "prd_1" } });

  // Assert — DEFECTO: el enlace usa ?cat= y el catálogo solo lee ?category=
  const migas = (await screen.findByRole("navigation")).querySelectorAll("a");
  expect(migas[1].getAttribute("href")).toBe("/catalogo?category=pisos-ceramicas");
});
