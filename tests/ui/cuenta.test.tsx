// @vitest-environment jsdom
//
// UI · Mi cuenta: perfil con contadores, proyectos y pedidos recientes,
// detalle de un pedido, edición del perfil y cierre de sesión.

import { screen, waitFor, within } from "@testing-library/react";
import { test, expect } from "../harness.mjs";
import { backendFalso, conSesion, renderizar, es, type BackendFalso } from "./soporte";
import { router } from "./navegacion.mjs";
import CuentaPage from "@/app/(shop)/cuenta/page";

const PEDIDO = { id: "ORD-2026-0007", dbId: "ped_1", date: "2026-03-04", status: "enviado", items: 2, total: 90_000, customer: "Ana Rojas" };
const DETALLE = {
  id: "ORD-2026-0007",
  status: "enviado",
  subtotal: 65_000,
  shippingCost: 25_000,
  total: 90_000,
  paymentMethod: "pse",
  shippingAddress: "Calle 1 #2-3",
  shippingCity: "Bogotá",
  createdAt: "2026-03-04T10:00:00.000Z",
  items: [{ id: "oi_1", productName: "Piso Beige", quantity: 2, unitPrice: 32_500, total: 65_000, category: "Pisos" }],
};

function cuentaConDatos(): BackendFalso {
  const backend = backendFalso({
    "GET /orders": [PEDIDO],
    "GET /projects": [{ id: "proy_1", name: "Cocina", area: 20, estimatedCost: 1_250_000, thumbnail: "Home" }],
    "GET /orders/:id": DETALLE,
  });
  conSesion(backend);
  return backend;
}

test("ui-acc-01", "Sin sesión la cuenta redirige al login", async () => {
  // Arrange
  backendFalso();

  // Act
  renderizar(<CuentaPage />, { ruta: "/cuenta" });

  // Assert
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/login"));
});

test("ui-acc-02", "Muestra el perfil, los contadores, los proyectos y el historial de pedidos", async () => {
  // Arrange
  cuentaConDatos();

  // Act
  renderizar(<CuentaPage />, { ruta: "/cuenta" });

  // Assert
  expect(await screen.findByText("ana@homara.com")).toBeInTheDocument();
  expect(screen.getByText("Bogotá, Cundinamarca")).toBeInTheDocument();
  expect(screen.getByText("Cocina")).toBeInTheDocument();
  expect(screen.getByText(/1\.250\.000/)).toBeInTheDocument();
  expect(screen.getByText("ORD-2026-0007")).toBeInTheDocument();
  expect(screen.getByText(es("status.enviado"))).toBeInTheDocument();
  expect(screen.getByText(/90\.000/)).toBeInTheDocument();
});

test("ui-acc-03", "Sin pedidos ni proyectos ofrece crear un proyecto e ir al catálogo", async () => {
  // Arrange
  const backend = backendFalso({ "GET /orders": [], "GET /projects": [] });
  conSesion(backend);

  // Act
  renderizar(<CuentaPage />, { ruta: "/cuenta" });

  // Assert
  expect(await screen.findByText(es("account.no_orders"))).toBeInTheDocument();
  expect(screen.getByRole("link", { name: es("account.create_project_btn") })).toHaveAttribute("href", "/proyectos/nuevo");
  expect(screen.getByRole("link", { name: es("account.go_catalog_btn") })).toHaveAttribute("href", "/catalogo");
});

test("ui-acc-04", "Ver un pedido abre su detalle con dirección e ítems; Escape lo cierra", async () => {
  // Arrange
  const backend = cuentaConDatos();
  const { usuario } = renderizar(<CuentaPage />, { ruta: "/cuenta" });
  await usuario.click(await screen.findByRole("button", { name: es("account.view_delivery") }));
  const modal = await screen.findByRole("dialog");
  const titulo = (await within(modal).findByText(`${es("account.order_title_prefix")}ORD-2026-0007`)).textContent;
  const conDireccion = within(modal).getByText(/Calle 1 #2-3/).textContent;

  // Act
  await usuario.keyboard("{Escape}");

  // Assert
  expect(backend.de("GET /orders/:id")[0].ruta).toBe("/orders/ORD-2026-0007");
  expect(titulo).toContain("ORD-2026-0007");
  expect(conDireccion).toContain("Calle 1 #2-3");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("ui-acc-05", "Editar el perfil guarda los cambios y recarga el usuario", async () => {
  // Arrange
  const backend = cuentaConDatos();
  backend.responder("PUT /users/me", { firstName: "Ana" });
  const { usuario } = renderizar(<CuentaPage />, { ruta: "/cuenta" });
  await usuario.click(await screen.findByRole("button", { name: es("account.edit_profile_btn") }));
  const ciudad = screen.getByPlaceholderText("Ej: Bogotá");
  await usuario.clear(ciudad);
  await usuario.type(ciudad, "Medellín");
  const lecturasDePerfil = backend.de("GET /users/me").length;

  // Act
  await usuario.click(screen.getByRole("button", { name: es("account.save_btn") }));

  // Assert
  expect(await screen.findByRole("alert")).toHaveTextContent(es("account.save_success"));
  expect(backend.de("PUT /users/me")[0].cuerpo).toMatchObject({ firstName: "Ana", lastName: "Rojas", city: "Medellín" });
  expect(backend.de("GET /users/me").length).toBeGreaterThan(lecturasDePerfil);
});

test("ui-acc-06", "El perfil no se guarda sin nombre", async () => {
  // Arrange
  const backend = cuentaConDatos();
  const { usuario } = renderizar(<CuentaPage />, { ruta: "/cuenta" });
  await usuario.click(await screen.findByRole("button", { name: es("account.edit_profile_btn") }));
  const formulario = screen.getByRole("button", { name: es("account.save_btn") }).closest("form")!;
  formulario.noValidate = true;
  await usuario.clear(within(formulario).getByDisplayValue("Ana"));

  // Act
  await usuario.click(within(formulario).getByRole("button", { name: es("account.save_btn") }));

  // Assert
  expect(await screen.findByText(es("account.required_error"))).toBeInTheDocument();
  expect(backend.de("PUT /users/me")).toHaveLength(0);
});

test("ui-acc-07", "Cerrar sesión borra el token y vuelve al login", async () => {
  // Arrange
  cuentaConDatos();
  const { usuario } = renderizar(<CuentaPage />, { ruta: "/cuenta" });

  // Act
  await usuario.click(await screen.findByRole("button", { name: es("account.logout_btn") }));

  // Assert
  expect(localStorage.getItem("homara_token")).toBeNull();
  expect(router.push).toHaveBeenCalledWith("/login");
});

// Defecto abierto F-3 (ver la tabla en tests/README.md): se espera que falle.
test.fails("ui-acc-08", "El detalle de un pedido pagado con tarjeta muestra el medio de pago legible", async () => {
  // Arrange — "card" es exactamente lo que envía el checkout (ui-chk-03).
  const backend = cuentaConDatos();
  backend.responder("GET /orders/:id", { ...DETALLE, paymentMethod: "card" });
  const { usuario } = renderizar(<CuentaPage />, { ruta: "/cuenta" });

  // Act
  await usuario.click(await screen.findByRole("button", { name: es("account.view_delivery") }));

  // Assert — DEFECTO: el modal solo reconoce "tarjeta_credito", "pse" y "contra_entrega",
  // y además las claves account.card_payment/pse_payment/cod_payment no existen.
  const modal = await screen.findByRole("dialog");
  await within(modal).findByText(/Calle 1 #2-3/);
  expect(within(modal).queryByText("card")).not.toBeInTheDocument();
});
