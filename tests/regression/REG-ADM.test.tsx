// @vitest-environment jsdom
//
// REG-ADM · Regresión del panel de administración (frontend)
// Flujos protegidos: solo un ADMIN ve el panel, la oferta se guarda como
// precio de venta y el cambio de estado de un pedido usa su id interno.

import { screen, waitFor, within } from "@testing-library/react";
import { test, expect } from "../harness.mjs";
import { backendFalso, conSesion, renderizar, es, crudo, ADMIN, CLIENTE } from "../ui/soporte";
import { router } from "../ui/navegacion.mjs";
import RequireAdmin from "@/app/components/RequireAdmin";
import ProductosAdminPage from "@/app/(admin)/admin/productos/page";
import PedidosAdminPage from "@/app/(admin)/admin/pedidos/page";
import InventarioPage from "@/app/(admin)/admin/inventario/page";
import DashboardPage from "@/app/(admin)/admin/page";
import { translations } from "@/app/lib/translations";

test("REG-ADM-01", "Un cliente autenticado no ve el panel y vuelve a la tienda", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend, CLIENTE);

  // Act
  renderizar(<RequireAdmin><p>panel</p></RequireAdmin>, { ruta: "/admin" });

  // Assert
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  expect(screen.queryByText("panel")).not.toBeInTheDocument();
});

test("REG-ADM-02", "Una oferta se guarda como precio de venta y el normal como precio original", async () => {
  // Arrange
  const backend = backendFalso({ "GET /products": [], "GET /categories": [{ id: "cat_1", name: "Pinturas", slug: "pinturas" }], "POST /products": { id: "p" } });
  conSesion(backend, ADMIN);
  const { usuario } = renderizar(<ProductosAdminPage />, { ruta: "/admin/productos" });
  await usuario.click(await screen.findByRole("button", { name: new RegExp(es("admin.add_product_btn")) }));
  const campo = (clave: string) => screen.getByLabelText(es(clave), { exact: false });
  await usuario.type(campo("admin.product_name_label"), "Rodillo");
  await usuario.type(campo("admin.description_label"), "Antigoteo");
  await usuario.selectOptions(campo("admin.category_col"), "cat_1");
  await usuario.type(campo("admin.price_label"), "50000");
  await usuario.type(campo("admin.offer_price_label"), "40000");
  await usuario.type(campo("admin.stock_label"), "3");

  // Act
  await usuario.click(screen.getByRole("button", { name: es("admin.save_btn") }));

  // Assert
  await waitFor(() => expect(backend.de("POST /products")).toHaveLength(1));
  expect(backend.de("POST /products")[0].cuerpo).toMatchObject({ price: 40_000, originalPrice: 50_000, stockQuantity: 3 });
});

test("REG-ADM-03", "Cambiar el estado de un pedido usa su id interno y el estado en mayúsculas", async () => {
  // Arrange
  const backend = backendFalso({
    "GET /orders": [{ id: "ORD-2026-0009", dbId: "cped_9", date: "2026-03-01", status: "pendiente", items: 1, total: 10_000, customer: "Ana" }],
    "GET /orders/:id": { id: "ORD-2026-0009", dbId: "cped_9", status: "pendiente", subtotal: 0, shippingCost: 0, total: 10_000, paymentMethod: "pse", items: [] },
    "PUT /orders/:id/status": {},
  });
  conSesion(backend, ADMIN);
  const { usuario } = renderizar(<PedidosAdminPage />, { ruta: "/admin/pedidos" });
  await usuario.click(await screen.findByRole("button", { name: new RegExp(es("admin.view_detail_action")) }));
  const modal = await screen.findByRole("dialog");

  // Act
  await usuario.selectOptions(await within(modal).findByDisplayValue(es("status.pendiente")), "entregado");

  // Assert
  await waitFor(() => expect(backend.de("PUT /orders/:id/status")).toHaveLength(1));
  expect(backend.de("PUT /orders/:id/status")[0]).toMatchObject({ ruta: "/orders/cped_9/status", cuerpo: { status: "ENTREGADO" } });
});

test("REG-ADM-04", "El inventario clasifica el stock con los umbrales 0 / < 50 / ≥ 50", async () => {
  // Arrange
  const fila = (id: string, stockQuantity: number) => ({
    id, name: id, category: "Pisos", stockQuantity, unit: "m²", price: 1_000, stockValue: stockQuantity * 1_000, inStock: stockQuantity > 0,
  });
  const backend = backendFalso({
    "GET /admin/inventory": { stats: { totalUnits: 94 }, products: [fila("Agotado", 0), fila("Bajo", 45), fila("Justo", 50)] },
  });
  conSesion(backend, ADMIN);

  // Act
  renderizar(<InventarioPage />, { ruta: "/admin/inventario" });

  // Assert
  const estado = async (nombre: string) => (await screen.findByText(nombre)).closest("tr")!.textContent;
  expect(await estado("Agotado")).toContain(es("admin.metrics.out_of_stock"));
  expect(await estado("Bajo")).toContain(es("admin.metrics.low_stock"));
  expect(await estado("Justo")).toContain(es("admin.metrics.normal_stock"));
});

test("REG-ADM-05", "El tablero traduce al inglés las métricas que el backend envía en español", async () => {
  // Arrange
  const backend = backendFalso({
    "GET /orders": [],
    "GET /admin/metrics": crudo({
      success: true,
      data: [
        { label: "Ventas del Mes", value: "$ 1", change: 0, icon: "" },
        { label: "Pedidos Activos", value: "2", change: 0, icon: "" },
        { label: "Productos", value: "3", change: 0, icon: "" },
        { label: "Clientes Nuevos", value: "4", change: 0, icon: "" },
      ],
      charts: { salesByMonth: new Array(12).fill(0), topCategories: [] },
    }),
  });
  conSesion(backend, ADMIN);
  localStorage.setItem("homara_lang", "en");

  // Act
  renderizar(<DashboardPage />, { ruta: "/admin" });

  // Assert
  const ingles = translations.en.admin.metrics;
  for (const etiqueta of [ingles.monthly_sales, ingles.active_orders, ingles.products, ingles.new_customers]) {
    expect(await screen.findByText(etiqueta)).toBeInTheDocument();
  }
  expect(screen.queryByText("Ventas del Mes")).not.toBeInTheDocument();
  expect(screen.queryByText("Clientes Nuevos")).not.toBeInTheDocument();
});
