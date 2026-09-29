// @vitest-environment jsdom
//
// UI · Carrito y checkout: ver el carrito, cambiar cantidades, quitar ítems,
// resumen con envío, y pagar el pedido.

import { screen, waitFor } from "@testing-library/react";
import { test, expect } from "../harness.mjs";
import { backendFalso, conSesion, renderizar, es } from "./soporte";
import { router } from "./navegacion.mjs";
import CarritoPage from "@/app/(shop)/carrito/page";
import CheckoutPage from "@/app/(shop)/checkout/page";

const item = (id: string, nombre: string, precio: number, cantidad: number, over: Record<string, unknown> = {}) => ({
  id,
  quantity: cantidad,
  isBackorder: false,
  backorderQuantity: 0,
  product: { id: `prd_${id}`, name: nombre, price: precio, unit: "m²", categorySlug: "pisos-ceramicas", tags: [] },
  ...over,
});

const carrito = (items: ReturnType<typeof item>[], envio = 25_000) => {
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  return { id: "cart_1", items, subtotal, shipping: envio, total: subtotal + envio, itemCount: items.length };
};

// --- Carrito -------------------------------------------------------------------

test("ui-cart-01", "Sin sesión, el carrito pide iniciar sesión o registrarse", async () => {
  // Arrange
  backendFalso();

  // Act
  renderizar(<CarritoPage />, { ruta: "/carrito" });

  // Assert
  expect(await screen.findByText(es("cart.login_required_title"))).toBeInTheDocument();
  expect(screen.getByRole("link", { name: es("cart.login_btn") })).toHaveAttribute("href", "/login");
  expect(screen.getByRole("link", { name: es("cart.register_btn") })).toHaveAttribute("href", "/register");
});

test("ui-cart-02", "Muestra ítems, subtotal, envío, total y el umbral de envío gratis", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend);
  backend.responder("GET /cart", carrito([item("1", "Piso Beige", 38_900, 2), item("2", "Pegante", 21_500, 1)]));

  // Act
  renderizar(<CarritoPage />, { ruta: "/carrito" });

  // Assert
  expect(await screen.findByText("Piso Beige")).toBeInTheDocument();
  expect(screen.getByText("Pegante")).toBeInTheDocument();
  expect(screen.getByText(/99\.300/)).toBeInTheDocument(); // subtotal 77.800 + 21.500
  expect(screen.getByText(/124\.300/)).toBeInTheDocument(); // total con 25.000 de envío
  expect(screen.getByText(new RegExp(es("cart.free_shipping_threshold")))).toHaveTextContent("500.000");
  expect(screen.getByRole("link", { name: es("cart.checkout_btn") })).toHaveAttribute("href", "/checkout");
});

test("ui-cart-03", "Con envío gratis muestra 'Gratis' y oculta el aviso del umbral", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend);
  backend.responder("GET /cart", carrito([item("1", "Porcelanato", 300_000, 2)], 0));

  // Act
  renderizar(<CarritoPage />, { ruta: "/carrito" });

  // Assert
  expect(await screen.findByText(es("cart.free"))).toBeInTheDocument();
  expect(screen.queryByText(new RegExp(es("cart.free_shipping_threshold")))).not.toBeInTheDocument();
});

test("ui-cart-04", "Un ítem bajo pedido muestra la advertencia y cuántas unidades faltan", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend);
  backend.responder("GET /cart", carrito([item("1", "Piso Beige", 38_900, 5, { isBackorder: true, backorderQuantity: 2 })]));

  // Act
  renderizar(<CarritoPage />, { ruta: "/carrito" });

  // Assert
  expect(await screen.findByText(es("cart.backorder_warning"))).toBeInTheDocument();
  expect(screen.getByText(es("cart.backorder_qty").replace("{qty}", "2"))).toBeInTheDocument();
});

test("ui-cart-05", "Un carrito vacío invita a ir al catálogo", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend);
  backend.responder("GET /cart", carrito([]));

  // Act
  renderizar(<CarritoPage />, { ruta: "/carrito" });

  // Assert
  expect(await screen.findByText(es("cart.empty_title"))).toBeInTheDocument();
  expect(screen.getByRole("link", { name: es("cart.go_catalog") })).toHaveAttribute("href", "/catalogo");
});

test("ui-cart-06", "Los botones + y − actualizan la cantidad del ítem sin bajar de 1", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend);
  backend.responder("GET /cart", carrito([item("itm_a", "Piso Beige", 38_900, 1)]));
  backend.responder("PUT /cart/items/:id", {});
  const { usuario } = renderizar(<CarritoPage />, { ruta: "/carrito" });
  await screen.findByText("Piso Beige");

  // Act
  await usuario.click(screen.getByRole("button", { name: "+" }));
  await usuario.click(screen.getByRole("button", { name: "-" }));

  // Assert
  await waitFor(() => expect(backend.de("PUT /cart/items/:id")).toHaveLength(2));
  const [suma, resta] = backend.de("PUT /cart/items/:id");
  expect(suma.ruta).toBe("/cart/items/itm_a");
  expect(suma.cuerpo).toStrictEqual({ quantity: 2 });
  expect(resta.cuerpo).toStrictEqual({ quantity: 1 });
});

test("ui-cart-07", "Quitar un ítem lo elimina del backend y recarga el carrito", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend);
  backend.responder("GET /cart", carrito([item("itm_a", "Piso Beige", 38_900, 1)]));
  backend.responder("DELETE /cart/items/:id", {});
  const { usuario } = renderizar(<CarritoPage />, { ruta: "/carrito" });
  await screen.findByText("Piso Beige");
  backend.responder("GET /cart", carrito([]));

  // Act
  await usuario.click(screen.getByRole("button", { name: es("catalog.remove_item") }));

  // Assert
  expect(await screen.findByText(es("cart.empty_title"))).toBeInTheDocument();
  expect(backend.de("DELETE /cart/items/:id")[0].ruta).toBe("/cart/items/itm_a");
});

// --- Checkout ---------------------------------------------------------------------

test("ui-chk-01", "Sin sesión, el checkout redirige al login y vuelve después", async () => {
  // Arrange
  backendFalso();

  // Act
  renderizar(<CheckoutPage />, { ruta: "/checkout" });

  // Assert
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/login?redirect=/checkout"));
});

test("ui-chk-02", "Precarga los datos del usuario y el resumen del carrito", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend);
  backend.responder("GET /cart", carrito([item("1", "Piso Beige", 38_900, 2)]));

  // Act
  renderizar(<CheckoutPage />, { ruta: "/checkout" });

  // Assert
  expect(await screen.findByLabelText(new RegExp(es("checkout.first_name")))).toHaveValue("Ana");
  expect(screen.getByLabelText(new RegExp(es("checkout.address")))).toHaveValue("Calle 1 #2-3");
  expect(screen.getByText("x2")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: new RegExp(es("checkout.pay_btn")) })).toHaveTextContent("102.800");
});

test("ui-chk-03", "Pagar envía el pedido con el método elegido y lleva a proyectos", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend);
  backend.responder("GET /cart", carrito([item("1", "Piso Beige", 38_900, 2)]));
  backend.responder("POST /orders", { id: "ORD-2026-0001" });
  const { usuario } = renderizar(<CheckoutPage />, { ruta: "/checkout" });
  await usuario.click(await screen.findByLabelText(es("checkout.payment_pse")));
  await usuario.type(screen.getByLabelText(new RegExp(es("checkout.notes"))), "Portería");

  // Act
  await usuario.click(screen.getByRole("button", { name: new RegExp(es("checkout.pay_btn")) }));

  // Assert
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/proyectos"));
  expect(backend.de("POST /orders")[0].cuerpo).toStrictEqual({
    paymentMethod: "pse",
    shippingAddress: "Calle 1 #2-3",
    shippingCity: "Bogotá",
    shippingState: "Cundinamarca",
    shippingZip: "110111",
    shippingNotes: "Portería",
  });
  expect(await screen.findByRole("alert")).toHaveTextContent(es("checkout.order_success"));
});

test("ui-chk-04", "Si faltan datos obligatorios avisa y no crea el pedido", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend, { firstName: "Ana", lastName: "Rojas", email: "ana@homara.com", role: "CUSTOMER", id: "usr_001" });
  backend.responder("GET /cart", carrito([item("1", "Piso Beige", 38_900, 1)]));
  const { usuario, container } = renderizar(<CheckoutPage />, { ruta: "/checkout" });
  await screen.findByLabelText(new RegExp(es("checkout.first_name")));
  container.querySelector("form")!.noValidate = true; // deja que la validación propia de la página actúe

  // Act
  await usuario.click(screen.getByRole("button", { name: new RegExp(es("checkout.pay_btn")) }));

  // Assert
  expect(await screen.findByRole("alert")).toHaveTextContent(es("checkout.required_fields_error"));
  expect(backend.de("POST /orders")).toHaveLength(0);
});

test("ui-chk-05", "Un rechazo del backend muestra su mensaje y no sale del checkout", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend);
  backend.responder("GET /cart", carrito([item("1", "Piso Beige", 38_900, 1)]));
  backend.fallar("POST /orders", 400, "El carrito está vacío");
  const { usuario } = renderizar(<CheckoutPage />, { ruta: "/checkout" });

  // Act
  await usuario.click(await screen.findByRole("button", { name: new RegExp(es("checkout.pay_btn")) }));

  // Assert
  expect(await screen.findByRole("alert")).toHaveTextContent("El carrito está vacío");
  expect(router.push).not.toHaveBeenCalledWith("/proyectos");
});
