// @vitest-environment jsdom
//
// UI · Estructura general: portada con vitrina, barra de navegación (contador
// del carrito y menú de cuenta), cambio de idioma y de tema, y barra lateral admin.

import { screen, waitFor, act } from "@testing-library/react";
import { test, expect } from "../harness.mjs";
import { backendFalso, conSesion, renderizar, es, esperarA, ADMIN } from "./soporte";
import { router } from "./navegacion.mjs";
import { translations } from "@/app/lib/translations";
import HomePage from "@/app/page";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import AdminSidebar from "@/app/components/AdminSidebar";

const producto = (id: string, name: string) => ({
  id, name, description: "", price: 10_000, image: "", category: "Pinturas", categorySlug: "pinturas",
  rating: 4, reviews: 1, inStock: true, stockQuantity: 5, unit: "galón", tags: [],
});

const carritoCon = (...cantidades: number[]) => ({
  id: "cart_1",
  items: cantidades.map((q, i) => ({ id: `itm_${i}`, quantity: q, product: producto(`p${i}`, `P${i}`) })),
});

test("ui-gen-01", "La portada muestra recomendados, ofertas y más vendidos de la vitrina", async () => {
  // Arrange
  backendFalso({
    "GET /products/storefront": {
      recommended: [producto("r1", "Rodillo Pro")],
      offers: [producto("o1", "Pintura en Oferta")],
      bestSellers: [producto("b1", "Cemento Top")],
    },
  });

  // Act
  renderizar(<HomePage />);

  // Assert
  expect(await screen.findByText("Rodillo Pro")).toBeInTheDocument();
  expect(screen.getByText("Pintura en Oferta")).toBeInTheDocument();
  expect(screen.getByText("Cemento Top")).toBeInTheDocument();
  expect(screen.getByText(es("home.weekly_deals"))).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: es("projects.new_project") })[0]).toHaveAttribute("href", "/proyectos/nuevo");
});

test("ui-gen-02", "El contador del carrito suma unidades y se refresca con el evento cartUpdated", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend);
  backend.responder("GET /cart", carritoCon(2, 3));
  renderizar(<Navbar />);
  const carrito = await screen.findByRole("link", { name: es("nav.cart") });
  // Espera la carga al montar y la que ocurre cuando la sesión resuelve, para que
  // el "9" del Assert solo pueda llegar por el evento cartUpdated.
  await esperarA(() => screen.queryByRole("link", { name: es("nav.login") }) === null);
  await esperarA(() => backend.de("GET /cart").length >= 2 && /\d/.test(carrito.textContent ?? ""));
  const contadorInicial = carrito.textContent;
  backend.responder("GET /cart", carritoCon(2, 3, 4));

  // Act
  act(() => {
    window.dispatchEvent(new Event("cartUpdated"));
  });

  // Assert
  expect(contadorInicial).toContain("5");
  await waitFor(() => expect(carrito).toHaveTextContent("9"));
});

test("ui-gen-03", "Sin sesión la barra ofrece iniciar sesión", async () => {
  // Arrange
  backendFalso({ "GET /cart": { id: "guest", items: [] } });

  // Act
  renderizar(<Navbar />);

  // Assert
  expect(await screen.findByRole("link", { name: es("nav.login") })).toHaveAttribute("href", "/login");
});

test("ui-gen-04", "El menú de un administrador incluye el panel y cerrar sesión borra el token", async () => {
  // Arrange
  const backend = backendFalso({ "GET /cart": { id: "c", items: [] } });
  conSesion(backend, ADMIN);
  const { usuario } = renderizar(<Navbar />);
  await usuario.click(await screen.findByRole("button", { name: /^A/ }));
  const panel = screen.getByRole("link", { name: es("nav.admin") }).getAttribute("href");

  // Act
  await usuario.click(screen.getByRole("button", { name: es("nav.logout") }));

  // Assert
  expect(panel).toBe("/admin");
  expect(localStorage.getItem("homara_token")).toBeNull();
  expect(router.push).toHaveBeenCalledWith("/login");
});

test("ui-gen-05", "Cambiar a inglés traduce la navegación y recuerda el idioma", async () => {
  // Arrange
  backendFalso({ "GET /cart": { id: "c", items: [] } });
  const { usuario } = renderizar(
    <>
      <Navbar />
      <Footer />
    </>,
  );
  await screen.findAllByRole("link", { name: es("nav.catalog") });

  // Act
  await usuario.click(screen.getByRole("button", { name: "EN" }));

  // Assert
  expect((await screen.findAllByRole("link", { name: translations.en.nav.catalog })).length).toBeGreaterThan(0);
  expect(screen.queryByRole("link", { name: es("nav.catalog") })).not.toBeInTheDocument();
  expect(localStorage.getItem("homara_lang")).toBe("en");
});

test("ui-gen-06", "El botón de tema alterna el modo oscuro y lo recuerda", async () => {
  // Arrange
  backendFalso();
  const { usuario } = renderizar(<Footer />);
  const boton = await screen.findByRole("button", { name: es("footer.theme_toggle") });
  const oscuroAntes = document.documentElement.classList.contains("dark");

  // Act
  await usuario.click(boton);

  // Assert
  expect(document.documentElement.classList.contains("dark")).toBe(!oscuroAntes);
  expect(localStorage.getItem("homara_theme")).toBe(oscuroAntes ? "light" : "dark");
});

test("ui-gen-07", "La barra lateral admin enlaza tablero, productos, inventario y pedidos", async () => {
  // Arrange
  backendFalso();

  // Act
  renderizar(<AdminSidebar />, { ruta: "/admin/pedidos" });

  // Assert
  const destino = (clave: string) => screen.getByRole("link", { name: new RegExp(es(clave)) }).getAttribute("href");
  expect(destino("admin.dashboard")).toBe("/admin");
  expect(destino("admin.products")).toBe("/admin/productos");
  expect(destino("admin.inventory")).toBe("/admin/inventario");
  expect(destino("admin.orders")).toBe("/admin/pedidos");
});
