// @vitest-environment jsdom
//
// REG-DEF · Regresión de las correcciones de los defectos hallados por Cypress,
// Screenplay y Lighthouse (docs/pruebas/CYPRESS.md, e2e-screenplay/README.md).
// Cada caso afirma el comportamiento corregido; si vuelve a fallar, es una regresión.

import { screen, waitFor, within, fireEvent } from "@testing-library/react";
import { test, expect, vi } from "../harness.mjs";
import { backendFalso, conSesion, renderizar, es, ADMIN } from "../ui/soporte";
import { router } from "../ui/navegacion.mjs";
import PedidosAdminPage from "@/app/(admin)/admin/pedidos/page";
import InventarioPage from "@/app/(admin)/admin/inventario/page";
import CatalogoPage from "@/app/(shop)/catalogo/page";
import RegisterPage from "@/app/(shop)/register/page";
import CheckoutPage from "@/app/(shop)/checkout/page";
import LoginPage from "@/app/(shop)/login/page";
import NuevoProyectoPage from "@/app/(shop)/proyectos/nuevo/page";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const producto = {
  id: "prd_1", name: "Piso Ceramica Beige", description: "Interior", price: 38_900, image: "",
  category: "Pisos", categorySlug: "pisos-ceramicas", rating: 4, reviews: 2, inStock: true,
  stockQuantity: 10, unit: "m²", tags: [],
};

test("REG-DEF-01", "DEF-06: escribir en el buscador de pedidos del admin filtra sin romper la tabla", async () => {
  // Arrange — el listado real no trae `orderNumber`: su `id` es el número
  const backend = backendFalso({
    "GET /orders": [
      { id: "ORD-2026-0001", dbId: "p1", date: "2026-03-01", status: "pendiente", items: 1, total: 10_000, customer: "Ana Rojas", shippingCity: "Cali" },
      { id: "ORD-2026-0002", dbId: "p2", date: "2026-03-02", status: "enviado", items: 2, total: 20_000, customer: "Luis Gómez", shippingCity: "Bogotá" },
    ],
  });
  conSesion(backend, ADMIN);
  const { usuario } = renderizar(<PedidosAdminPage />, { ruta: "/admin/pedidos" });
  await screen.findByText("ORD-2026-0002");

  // Act
  await usuario.type(screen.getByRole("textbox", { name: es("catalog.search_placeholder") }), "cali");

  // Assert
  expect(screen.getByText("ORD-2026-0001")).toBeInTheDocument();
  expect(screen.queryByText("ORD-2026-0002")).not.toBeInTheDocument();
});

test("REG-DEF-02", "DEF-29: si el catálogo no carga, se avisa y 'Reintentar' lo recupera", async () => {
  // Arrange
  const backend = backendFalso({ "GET /categories": [] });
  backend.fallar("GET /products", 500, "Error interno del servidor");
  const { usuario } = renderizar(<CatalogoPage />, { ruta: "/catalogo" });
  const aviso = await screen.findByRole("alert");
  const textoDelAviso = aviso.textContent;

  // Act
  backend.responder("GET /products", [producto]);
  await usuario.click(within(aviso).getByRole("button", { name: es("catalog.retry") }));

  // Assert
  expect(textoDelAviso).toContain(es("catalog.load_error"));
  expect(await screen.findByText("Piso Ceramica Beige")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("REG-DEF-03", "DEF-01/DEF-17: el registro exige 8 caracteres como el backend, con mensaje traducido", async () => {
  // Arrange
  const backend = backendFalso();
  const { usuario } = renderizar(<RegisterPage />, { ruta: "/register" });
  (await screen.findByRole("button", { name: "Registrarme y Comenzar" })).closest("form")!.noValidate = true;
  await usuario.type(screen.getByLabelText(es("auth.first_name"), { exact: false }), "Ana");
  await usuario.type(screen.getByLabelText(es("auth.last_name"), { exact: false }), "Rojas");
  await usuario.type(screen.getByLabelText(es("auth.email"), { exact: false }), "ana@homara.com");
  const claveCorta = "a".repeat(7); // generada: un literal dispara falsos positivos de los escáneres de secretos
  await usuario.type(screen.getByPlaceholderText(es("auth.password_placeholder")), claveCorta);
  await usuario.type(screen.getByPlaceholderText(es("auth.repeat_password")), claveCorta);

  // Act
  await usuario.click(screen.getByRole("button", { name: "Registrarme y Comenzar" }));

  // Assert
  expect(await screen.findByText(es("auth.password_too_short"))).toBeInTheDocument();
  expect(es("auth.password_placeholder")).toContain("8");
  expect(backend.de("POST /users/register")).toHaveLength(0);
});

test("REG-DEF-04", "DEF-03 (ESC27): datos de envío con solo espacios cuentan como vacíos", async () => {
  // Arrange
  const backend = backendFalso({ "GET /cart": { id: "c", items: [{ id: "i", quantity: 1, product: producto }], subtotal: 38_900, shipping: 25_000, total: 63_900 } });
  conSesion(backend);
  const { usuario, container } = renderizar(<CheckoutPage />, { ruta: "/checkout" });
  const direccion = await screen.findByLabelText(new RegExp(es("checkout.address")));
  container.querySelector("form")!.noValidate = true;
  await usuario.clear(direccion);
  await usuario.type(direccion, "   ");

  // Act
  await usuario.click(screen.getByRole("button", { name: new RegExp(es("checkout.pay_btn")) }));

  // Assert
  expect(await screen.findByRole("alert")).toHaveTextContent(es("checkout.required_fields_error"));
  expect(backend.de("POST /orders")).toHaveLength(0);
});

test("REG-DEF-05", "DEF-30: el stock negativo se etiqueta aparte y entra en el filtro 'Sin stock'", async () => {
  // Arrange
  const backend = backendFalso({
    "GET /admin/inventory": {
      stats: { totalProducts: 2, totalUnits: 80, lowStockCount: 0, outOfStockCount: 0, negativeStockCount: 1 },
      products: [
        { id: "neg", name: "Arena Fina", category: "Construcción", stockQuantity: -1, unit: "bulto", price: 5_000, stockValue: -5_000, inStock: true, stockStatus: "stock_negativo" },
        { id: "ok", name: "Piso Beige", category: "Pisos", stockQuantity: 80, unit: "m²", price: 38_900, stockValue: 3_112_000, inStock: true, stockStatus: "normal" },
      ],
    },
  });
  conSesion(backend, ADMIN);
  const { usuario } = renderizar(<InventarioPage />, { ruta: "/admin/inventario" });
  const fila = (await screen.findByText("Arena Fina")).closest("tr")!;
  const etiqueta = within(fila).queryByText(es("admin.metrics.negative_stock"));

  // Act
  await usuario.selectOptions(screen.getByRole("combobox", { name: es("admin.filter_stock") }), "out_of_stock");

  // Assert
  expect(etiqueta).toBeInTheDocument();
  expect(screen.getByText("Arena Fina")).toBeInTheDocument();
  expect(screen.queryByText("Piso Beige")).not.toBeInTheDocument();
});

test("REG-DEF-06", "DEF-05: un error de red al validar la sesión no la cierra", async () => {
  // Arrange
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));

  // Act
  renderizar(<Navbar />);
  await waitFor(() => expect(fetch).toHaveBeenCalled());

  // Assert
  expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining("/users/logout"), expect.anything());
  expect(router.push).not.toHaveBeenCalledWith("/login");
});

test("REG-DEF-07", "DEF-15 y DEF-16: <html lang> sigue al idioma y el menú móvil expone su estado", async () => {
  // Arrange
  backendFalso();
  const { usuario } = renderizar(
    <>
      <Navbar />
      <Footer />
    </>,
  );
  const menu = screen.getByRole("button", { name: es("nav.menu") });

  // Act
  await usuario.click(screen.getByRole("button", { name: "EN" }));
  await usuario.click(menu);

  // Assert
  expect(document.documentElement.lang).toBe("en");
  expect(menu).toHaveAttribute("aria-expanded", "true");
  expect(document.getElementById(menu.getAttribute("aria-controls")!)).not.toBeNull();
});

test("REG-DEF-08", "DEF-27: 'Usar en Proyecto' deja preseleccionado el producto elegido", async () => {
  // Arrange — el producto elegido es un porcelanato; el asistente arranca en cerámica
  const porcelanato = { id: "prd_p1", name: "Porcelanato Gris 60x60", price: 71_000, unit: "m²", stockQuantity: 5, categorySlug: "pisos-ceramicas" };
  const backend = backendFalso({
    "GET /products/:id": porcelanato,
    "GET /products": [
      { id: "prd_c1", name: "Piso Ceramica Beige 60x60", price: 38_900, unit: "m²", stockQuantity: 9, categorySlug: "pisos-ceramicas" },
      porcelanato,
    ],
  });
  conSesion(backend);
  const { usuario } = renderizar(<NuevoProyectoPage />, { ruta: "/proyectos/nuevo?selectedProductId=prd_p1" });

  // Act
  await usuario.click(await screen.findByRole("button", { name: es("projects.tab_covering") }));

  // Assert
  await waitFor(() => expect(screen.getByRole("radio", { name: /Porcelanato Gris/ })).toBeChecked());
});

test("REG-DEF-09", "OBS-05: tras el login se vuelve a la ruta interna pedida; una externa se ignora", async () => {
  // Arrange
  backendFalso({ "POST /users/login": { token: "jwt", user: ADMIN } });
  const entrar = async (query: string) => {
    window.history.replaceState(null, "", `/login${query}`);
    const { usuario, unmount } = renderizar(<LoginPage />, { ruta: "/login" });
    await usuario.type(await screen.findByLabelText(/Correo Electrónico/), "admin@homara.co");
    await usuario.type(screen.getByLabelText(/Contraseña/), "ClaveSegura8");
    await usuario.click(screen.getByRole("button", { name: "Iniciar Sesión" }));
    await waitFor(() => expect(router.push).toHaveBeenCalled());
    const destino = router.push.mock.calls.at(-1)![0];
    unmount();
    localStorage.clear();
    router.push.mockClear();
    return destino;
  };

  // Act
  const interna = await entrar("?redirect=/checkout");
  const externa = await entrar("?redirect=//evil.example");
  window.history.replaceState(null, "", "/");

  // Assert
  expect(interna).toBe("/checkout");
  expect(externa).toBe("/cuenta");
});

test("REG-DEF-10", "DEF-04: el asistente rechaza dimensiones no positivas antes de llamar al backend", async () => {
  // Arrange
  const backend = backendFalso({ "GET /products": [] });
  conSesion(backend);
  const { usuario } = renderizar(<NuevoProyectoPage />, { ruta: "/proyectos/nuevo" });
  await usuario.type(await screen.findByLabelText(es("projects.descriptive_name_label"), { exact: false }), "Baño");
  fireEvent.change(screen.getByLabelText(es("projects.length_meters"), { exact: false }), { target: { value: "-3" } });
  await usuario.type(screen.getByLabelText(es("projects.width_meters"), { exact: false }), "2");

  // Act
  await usuario.click(screen.getAllByRole("button", { name: es("projects.save_and_calculate") })[0]);

  // Assert
  const aviso = es("projects.positive_field_alert").replace("{field}", es("projects.length"));
  expect(await screen.findByRole("alert")).toHaveTextContent(aviso);
  expect(backend.de("POST /projects")).toHaveLength(0);
});

test("REG-DEF-11", "DEF-SEG-FE-02: la sesión viaja en la cookie HttpOnly; el JWT nunca llega a localStorage", async () => {
  // Arrange
  const backend = backendFalso({ "POST /users/login": { token: "jwt-secreto", user: ADMIN } });
  const { usuario } = renderizar(<LoginPage />, { ruta: "/login" });
  await usuario.type(await screen.findByLabelText(/Correo Electrónico/), "admin@homara.co");
  await usuario.type(screen.getByLabelText(/Contraseña/), "ClaveSegura8");

  // Act
  await usuario.click(screen.getByRole("button", { name: "Iniciar Sesión" }));
  await waitFor(() => expect(router.push).toHaveBeenCalled());

  // Assert
  const opciones = vi.mocked(fetch).mock.calls.map(([, o]) => o as RequestInit);
  expect(backend.de("POST /users/login")).toHaveLength(1);
  expect(opciones.every((o) => o.credentials === "include")).toBe(true);
  expect(opciones.some((o) => new Headers(o.headers).has("Authorization"))).toBe(false);
  expect(Object.values(localStorage)).not.toContain("jwt-secreto");
});
