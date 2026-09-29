// @vitest-environment jsdom
//
// UI · Panel de administración: tablero de métricas, gestión de productos
// (alta, edición, oferta, baja), pedidos con cambio de estado e inventario.

import { screen, waitFor, within } from "@testing-library/react";
import { test, expect } from "../harness.mjs";
import { backendFalso, conSesion, renderizar, es, crudo, ADMIN } from "./soporte";
import DashboardPage from "@/app/(admin)/admin/page";
import ProductosAdminPage from "@/app/(admin)/admin/productos/page";
import PedidosAdminPage from "@/app/(admin)/admin/pedidos/page";
import InventarioPage from "@/app/(admin)/admin/inventario/page";

const PEDIDOS = [
  { id: "ORD-2026-0001", dbId: "ped_1", date: "2026-03-01", status: "pendiente", items: 1, total: 60_000, customer: "Ana Rojas" },
  { id: "ORD-2026-0002", dbId: "ped_2", date: "2026-03-02", status: "enviado", items: 3, total: 450_000, customer: "Luis Pérez" },
];

const PRODUCTOS = [
  { id: "prd_1", name: "Pintura Blanca Galón", description: "Interior", price: 89_000, originalPrice: null, image: "", category: "Pinturas", categorySlug: "pinturas", categoryId: "cat_2", rating: 4, reviews: 3, inStock: true, stockQuantity: 20, unit: "galón", tags: [] },
  { id: "prd_2", name: "Cemento Gris 50kg", description: "Estructural", price: 32_000, originalPrice: null, image: "", category: "Construcción", categorySlug: "materiales-construccion", categoryId: "cat_3", rating: 5, reviews: 9, inStock: false, stockQuantity: 0, unit: "bulto", tags: [] },
];

const CATEGORIAS = [
  { id: "cat_2", name: "Pinturas", slug: "pinturas" },
  { id: "cat_3", name: "Construcción", slug: "materiales-construccion" },
];

function comoAdmin(rutas: Record<string, unknown>) {
  const backend = backendFalso(rutas);
  conSesion(backend, ADMIN);
  return backend;
}

// --- Tablero ------------------------------------------------------------------------

test("ui-adm-01", "El tablero muestra las métricas traducidas y las ventas por mes", async () => {
  // Arrange
  comoAdmin({
    "GET /orders": PEDIDOS,
    "GET /admin/metrics": crudo({
      success: true,
      data: [
        { label: "Ventas del Mes", value: "$ 500.000", change: 12.5, icon: "💰" },
        { label: "Pedidos Activos", value: "4", change: 0, icon: "📦" },
      ],
      charts: { salesByMonth: [0, 0, 500_000, 0, 0, 0, 0, 0, 0, 0, 0, 0], topCategories: [{ name: "Pinturas", pct: 60 }] },
    }),
  });

  // Act
  renderizar(<DashboardPage />, { ruta: "/admin" });

  // Assert
  expect(await screen.findByText(es("admin.metrics.monthly_sales"))).toBeInTheDocument();
  expect(screen.getByText(es("admin.metrics.active_orders"))).toBeInTheDocument();
  expect(screen.getByText(es("admin.metrics.monthly_sales")).parentElement).toHaveTextContent("$ 500.000");
  expect(screen.getByText("Pinturas")).toBeInTheDocument();
  expect(screen.getByLabelText(new RegExp(`${es("admin.mar")}: .*500\\.000`))).toBeInTheDocument();
});

test("ui-adm-02", "Si el backend falla, el tablero muestra el error", async () => {
  // Arrange
  const backend = comoAdmin({ "GET /orders": [] });
  backend.fallar("GET /admin/metrics", 500, "Base de datos caída");

  // Act
  renderizar(<DashboardPage />, { ruta: "/admin" });

  // Assert
  expect(await screen.findByText(es("admin.error_loading"))).toBeInTheDocument();
  expect(screen.getByText("Base de datos caída")).toBeInTheDocument();
});

// --- Productos ----------------------------------------------------------------------

const productosAdmin = () => comoAdmin({ "GET /products": PRODUCTOS, "GET /categories": CATEGORIAS });

async function abrirFormularioNuevo() {
  const vista = renderizar(<ProductosAdminPage />, { ruta: "/admin/productos" });
  await vista.usuario.click(await screen.findByRole("button", { name: new RegExp(es("admin.add_product_btn")) }));
  const formulario = screen.getByRole("button", { name: es("admin.save_btn") }).closest("form")!;
  formulario.noValidate = true; // deja actuar la validación propia de la página
  return { ...vista, formulario };
}

test("ui-adm-03", "Lista el catálogo con sus contadores y la búsqueda filtra por nombre", async () => {
  // Arrange
  productosAdmin();
  const { usuario } = renderizar(<ProductosAdminPage />, { ruta: "/admin/productos" });
  await screen.findByText("Cemento Gris 50kg");
  const agotados = screen.getByText(es("admin.out_of_stock_alert")).parentElement?.textContent;

  // Act
  await usuario.type(screen.getByPlaceholderText(es("catalog.search_placeholder")), "pintura");

  // Assert
  expect(agotados).toContain("1");
  expect(screen.getByText("Pintura Blanca Galón")).toBeInTheDocument();
  expect(screen.queryByText("Cemento Gris 50kg")).not.toBeInTheDocument();
});

test("ui-adm-04", "Dar de alta un producto envía precios enteros, unidad, categoría e imagen por defecto", async () => {
  // Arrange
  const backend = productosAdmin();
  backend.responder("POST /products", { id: "prd_nuevo" });
  const { usuario, formulario } = await abrirFormularioNuevo();
  await usuario.type(within(formulario).getByLabelText(es("admin.product_name_label"), { exact: false }), "Rodillo Pro");
  await usuario.type(within(formulario).getByLabelText(es("admin.description_label")), "Rodillo antigoteo");
  await usuario.selectOptions(within(formulario).getByLabelText(es("admin.category_col")), "cat_2");
  await usuario.type(within(formulario).getByLabelText(es("admin.price_label"), { exact: false }), "52000");
  await usuario.type(within(formulario).getByLabelText(es("admin.stock_label"), { exact: false }), "10");

  // Act
  await usuario.click(within(formulario).getByRole("button", { name: es("admin.save_btn") }));

  // Assert
  expect(await screen.findByRole("alert")).toHaveTextContent(es("admin.save_success"));
  expect(backend.de("POST /products")[0].cuerpo).toStrictEqual({
    name: "Rodillo Pro",
    description: "Rodillo antigoteo",
    price: 52_000,
    originalPrice: null,
    stockQuantity: 10,
    unit: "unidad",
    categoryId: "cat_2",
    image: "/products/placeholder.jpg",
    tags: [],
  });
});

test("ui-adm-05", "Con precio de oferta se cobra la oferta y el precio normal queda como original", async () => {
  // Arrange
  const backend = productosAdmin();
  backend.responder("POST /products", { id: "prd_nuevo" });
  const { usuario, formulario } = await abrirFormularioNuevo();
  await usuario.type(within(formulario).getByLabelText(es("admin.product_name_label"), { exact: false }), "Rodillo Pro");
  await usuario.type(within(formulario).getByLabelText(es("admin.description_label")), "Rodillo");
  await usuario.selectOptions(within(formulario).getByLabelText(es("admin.category_col")), "cat_2");
  await usuario.type(within(formulario).getByLabelText(es("admin.price_label"), { exact: false }), "52000");
  await usuario.type(within(formulario).getByLabelText(es("admin.offer_price_label"), { exact: false }), "45900");
  await usuario.type(within(formulario).getByLabelText(es("admin.stock_label"), { exact: false }), "5");

  // Act
  await usuario.click(within(formulario).getByRole("button", { name: es("admin.save_btn") }));

  // Assert
  await waitFor(() => expect(backend.de("POST /products")).toHaveLength(1));
  expect(backend.de("POST /products")[0].cuerpo).toMatchObject({ price: 45_900, originalPrice: 52_000 });
});

test("ui-adm-06", "Rechaza una oferta igual o mayor al precio normal sin llamar al backend", async () => {
  // Arrange
  const backend = productosAdmin();
  const { usuario, formulario } = await abrirFormularioNuevo();
  await usuario.type(within(formulario).getByLabelText(es("admin.product_name_label"), { exact: false }), "Rodillo Pro");
  await usuario.type(within(formulario).getByLabelText(es("admin.description_label")), "Rodillo");
  await usuario.selectOptions(within(formulario).getByLabelText(es("admin.category_col")), "cat_2");
  await usuario.type(within(formulario).getByLabelText(es("admin.price_label"), { exact: false }), "45000");
  await usuario.type(within(formulario).getByLabelText(es("admin.offer_price_label"), { exact: false }), "52000");
  await usuario.type(within(formulario).getByLabelText(es("admin.stock_label"), { exact: false }), "5");

  // Act
  await usuario.click(within(formulario).getByRole("button", { name: es("admin.save_btn") }));

  // Assert
  expect(await screen.findByText(es("admin.offer_price_error"))).toBeInTheDocument();
  expect(backend.de("POST /products")).toHaveLength(0);
});

test("ui-adm-07", "Un formulario incompleto muestra el error de campos obligatorios", async () => {
  // Arrange
  const backend = productosAdmin();
  const { usuario, formulario } = await abrirFormularioNuevo();

  // Act
  await usuario.click(within(formulario).getByRole("button", { name: es("admin.save_btn") }));

  // Assert
  expect(await screen.findByText(es("admin.required_fields_error"))).toBeInTheDocument(); // el error se pinta sobre el formulario
  expect(backend.de("POST /products")).toHaveLength(0);
});

test("ui-adm-08", "Editar un producto precarga sus datos y guarda con PUT", async () => {
  // Arrange
  const backend = productosAdmin();
  backend.responder("PUT /products/:id", { id: "prd_1" });
  const { usuario } = renderizar(<ProductosAdminPage />, { ruta: "/admin/productos" });
  await usuario.click((await screen.findAllByTitle("Editar Producto"))[0]);
  const stock = screen.getByLabelText(es("admin.stock_label"), { exact: false });
  await usuario.clear(stock);
  await usuario.type(stock, "35");

  // Act
  await usuario.click(screen.getByRole("button", { name: es("admin.save_btn") }));

  // Assert
  await waitFor(() => expect(backend.de("PUT /products/:id")).toHaveLength(1));
  const [edicion] = backend.de("PUT /products/:id");
  expect(edicion.ruta).toBe("/products/prd_1");
  expect(edicion.cuerpo).toMatchObject({ name: "Pintura Blanca Galón", price: 89_000, stockQuantity: 35, categoryId: "cat_2" });
});

test("ui-adm-09", "Eliminar un producto pide confirmación y lo borra", async () => {
  // Arrange
  const backend = productosAdmin();
  backend.responder("DELETE /products/:id", {});
  const { usuario } = renderizar(<ProductosAdminPage />, { ruta: "/admin/productos" });
  await usuario.click((await screen.findAllByTitle("Eliminar Producto"))[1]);

  // Act
  await usuario.click(screen.getByRole("button", { name: es("admin.delete_permanently") }));

  // Assert
  expect(await screen.findByRole("alert")).toHaveTextContent(es("admin.delete_success"));
  expect(backend.de("DELETE /products/:id")[0].ruta).toBe("/products/prd_2");
});

// --- Pedidos --------------------------------------------------------------------------

test("ui-adm-10", "Los pedidos se listan con contadores y se filtran por estado", async () => {
  // Arrange
  comoAdmin({ "GET /orders": PEDIDOS });
  const { usuario } = renderizar(<PedidosAdminPage />, { ruta: "/admin/pedidos" });
  await screen.findByText("ORD-2026-0002");

  // Act
  await usuario.selectOptions(screen.getByDisplayValue(new RegExp(es("admin.status_col"))), "enviado");

  // Assert
  expect(screen.getByText("ORD-2026-0002")).toBeInTheDocument();
  expect(screen.queryByText("ORD-2026-0001")).not.toBeInTheDocument();
});

test("ui-adm-11", "Cambiar el estado desde el detalle actualiza el pedido con su id interno", async () => {
  // Arrange
  const backend = comoAdmin({
    "GET /orders": PEDIDOS,
    "GET /orders/:id": { id: "ORD-2026-0001", dbId: "ped_1", status: "pendiente", subtotal: 35_000, shippingCost: 25_000, total: 60_000, paymentMethod: "pse", items: [] },
    "PUT /orders/:id/status": { id: "ped_1", status: "ENVIADO" },
  });
  const { usuario } = renderizar(<PedidosAdminPage />, { ruta: "/admin/pedidos" });
  await usuario.click((await screen.findAllByRole("button", { name: new RegExp(es("admin.view_detail_action")) }))[0]);
  const modal = await screen.findByRole("dialog");

  // Act
  await usuario.selectOptions(await within(modal).findByDisplayValue(es("status.pendiente")), "enviado");

  // Assert
  expect(await screen.findByRole("alert")).toHaveTextContent("ORD-2026-0001");
  const [cambio] = backend.de("PUT /orders/:id/status");
  expect(cambio.ruta).toBe("/orders/ped_1/status");
  expect(cambio.cuerpo).toStrictEqual({ status: "ENVIADO" });
});

// --- Inventario ------------------------------------------------------------------------

const INVENTARIO = {
  stats: { totalProducts: 3, totalUnits: 90, lowStockCount: 1, outOfStockCount: 1, negativeStockCount: 0 },
  products: [
    { id: "agotado", name: "Cemento Gris", category: "Construcción", stockQuantity: 0, unit: "bulto", price: 32_000, stockValue: 0, inStock: false, stockStatus: "sin_stock" },
    { id: "bajo", name: "Pintura Blanca", category: "Pinturas", stockQuantity: 10, unit: "galón", price: 89_000, stockValue: 890_000, inStock: true, stockStatus: "stock_bajo" },
    { id: "normal", name: "Piso Beige", category: "Pisos", stockQuantity: 80, unit: "m²", price: 38_900, stockValue: 3_112_000, inStock: true, stockStatus: "normal" },
  ],
};

test("ui-adm-12", "El inventario marca cada producto como sin stock, bajo o normal", async () => {
  // Arrange
  comoAdmin({ "GET /admin/inventory": INVENTARIO });

  // Act
  renderizar(<InventarioPage />, { ruta: "/admin/inventario" });

  // Assert
  const fila = async (nombre: string) => (await screen.findByText(nombre)).closest("tr")!;
  expect(within(await fila("Cemento Gris")).getByText(es("admin.metrics.out_of_stock"))).toBeInTheDocument();
  expect(within(await fila("Pintura Blanca")).getByText(es("admin.metrics.low_stock"))).toBeInTheDocument();
  expect(within(await fila("Piso Beige")).getByText(es("admin.metrics.normal_stock"))).toBeInTheDocument();
  expect(screen.getByText(es("admin.alerts_desc"), { exact: false })).toHaveTextContent("1");
});

test("ui-adm-13", "El filtro de alertas deja solo los productos con stock bajo", async () => {
  // Arrange
  comoAdmin({ "GET /admin/inventory": INVENTARIO });
  const { usuario } = renderizar(<InventarioPage />, { ruta: "/admin/inventario" });
  await screen.findByText("Piso Beige");

  // Act
  await usuario.selectOptions(screen.getByDisplayValue(new RegExp(es("admin.stock_col"))), "low_stock");

  // Assert
  expect(screen.getByText("Pintura Blanca")).toBeInTheDocument();
  expect(screen.queryByText("Piso Beige")).not.toBeInTheDocument();
  expect(screen.queryByText("Cemento Gris")).not.toBeInTheDocument();
});
