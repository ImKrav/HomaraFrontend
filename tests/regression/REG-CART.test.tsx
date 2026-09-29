// @vitest-environment jsdom
//
// REG-CART · Regresión de carrito y checkout (frontend)
// Flujos protegidos: modificar ítems por su id de carrito, y pagar enviando
// la dirección y el método elegidos.

import { screen, waitFor } from "@testing-library/react";
import { test, expect } from "../harness.mjs";
import { backendFalso, conSesion, renderizar, es } from "../ui/soporte";
import { router } from "../ui/navegacion.mjs";
import CarritoPage from "@/app/(shop)/carrito/page";
import CheckoutPage from "@/app/(shop)/checkout/page";

const carrito = {
  id: "cart_1",
  items: [{ id: "itm_42", quantity: 2, isBackorder: false, backorderQuantity: 0, product: { id: "prd_7", name: "Piso Beige", price: 38_900, unit: "m²", categorySlug: "pisos-ceramicas", tags: [] } }],
  subtotal: 77_800,
  shipping: 25_000,
  total: 102_800,
};

test("REG-CART-01", "Cambiar cantidad y quitar usan el id del ítem del carrito, no el del producto", async () => {
  // Arrange
  const backend = backendFalso({ "GET /cart": carrito, "PUT /cart/items/:id": {}, "DELETE /cart/items/:id": {} });
  conSesion(backend);
  const { usuario } = renderizar(<CarritoPage />, { ruta: "/carrito" });
  await screen.findByText("Piso Beige");

  // Act
  await usuario.click(screen.getByRole("button", { name: "+" }));
  await usuario.click(screen.getByRole("button", { name: es("catalog.remove_item") }));

  // Assert
  await waitFor(() => expect(backend.de("DELETE /cart/items/:id")).toHaveLength(1));
  expect(backend.de("PUT /cart/items/:id")[0]).toMatchObject({ ruta: "/cart/items/itm_42", cuerpo: { quantity: 3 } });
  expect(backend.de("DELETE /cart/items/:id")[0].ruta).toBe("/cart/items/itm_42");
});

test("REG-CART-02", "El resumen muestra exactamente los montos que calcula el backend", async () => {
  // Arrange
  const backend = backendFalso({ "GET /cart": carrito });
  conSesion(backend);

  // Act
  renderizar(<CarritoPage />, { ruta: "/carrito" });

  // Assert
  expect((await screen.findAllByText(/77\.800/)).length).toBeGreaterThan(0);
  expect(screen.getByText(/102\.800/)).toBeInTheDocument();
});

test("REG-CART-03", "El checkout envía la dirección del usuario y el método de pago elegido", async () => {
  // Arrange
  const backend = backendFalso({ "GET /cart": carrito, "POST /orders": { id: "ORD-1" } });
  conSesion(backend);
  const { usuario } = renderizar(<CheckoutPage />, { ruta: "/checkout" });
  await usuario.click(await screen.findByLabelText(es("checkout.payment_cash")));

  // Act
  await usuario.click(screen.getByRole("button", { name: new RegExp(es("checkout.pay_btn")) }));

  // Assert
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/proyectos"));
  expect(backend.de("POST /orders")[0].cuerpo).toMatchObject({
    paymentMethod: "cash",
    shippingAddress: "Calle 1 #2-3",
    shippingCity: "Bogotá",
    shippingState: "Cundinamarca",
    shippingZip: "110111",
  });
});
