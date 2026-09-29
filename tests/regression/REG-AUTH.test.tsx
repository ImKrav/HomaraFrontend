// @vitest-environment jsdom
//
// REG-AUTH · Regresión de autenticación y cuenta (frontend)
// Flujos protegidos: iniciar sesión, guarda de rutas privadas, cierre por 401
// y edición del perfil.

import { screen, waitFor } from "@testing-library/react";
import { test, expect } from "../harness.mjs";
import { backendFalso, conSesion, renderizar, es, CLIENTE } from "../ui/soporte";
import { router } from "../ui/navegacion.mjs";
import LoginPage from "@/app/(shop)/login/page";
import CuentaPage from "@/app/(shop)/cuenta/page";
import RequireAuth from "@/app/components/RequireAuth";

test("REG-AUTH-01", "Iniciar sesión guarda el JWT y lleva a la cuenta", async () => {
  // Arrange
  const backend = backendFalso({ "POST /users/login": { token: "jwt-real", user: CLIENTE }, "GET /users/me": CLIENTE });
  const { usuario } = renderizar(<LoginPage />, { ruta: "/login" });
  await usuario.type(await screen.findByLabelText(/Correo Electrónico/), "ana@homara.com");
  await usuario.type(screen.getByLabelText(/Contraseña/), "ClaveSegura8");

  // Act
  await usuario.click(screen.getByRole("button", { name: es("auth.submit_login") }));

  // Assert
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/cuenta"));
  expect(localStorage.getItem("homara_token")).toBe("jwt-real");
  expect(backend.de("POST /users/login")).toHaveLength(1);
});

test("REG-AUTH-02", "Proyectos, cuenta y checkout son privados; el catálogo es público", async () => {
  // Arrange
  backendFalso();
  const rutas = ["/proyectos", "/cuenta", "/checkout", "/catalogo"];

  // Act
  const visibles: Record<string, boolean> = {};
  for (const ruta of rutas) {
    const vista = renderizar(<RequireAuth><p>contenido</p></RequireAuth>, { ruta });
    await waitFor(() => expect(vista.container.querySelector(".animate-spin")).toBeNull());
    visibles[ruta] = vista.queryByText("contenido") !== null;
    vista.unmount();
  }

  // Assert
  expect(visibles).toStrictEqual({ "/proyectos": false, "/cuenta": false, "/checkout": false, "/catalogo": true });
  expect(router.replace).toHaveBeenCalledWith("/login");
});

test("REG-AUTH-03", "Un 401 en cualquier llamada borra el token y cierra la sesión", async () => {
  // Arrange
  const backend = backendFalso({ "GET /orders": [], "GET /projects": [] });
  conSesion(backend);
  backend.fallar("PUT /users/me", 401, "Token expirado");
  const { usuario } = renderizar(<CuentaPage />, { ruta: "/cuenta" });
  await usuario.click(await screen.findByRole("button", { name: es("account.edit_profile_btn") }));

  // Act
  await usuario.click(screen.getByRole("button", { name: es("account.save_btn") }));

  // Assert
  await waitFor(() => expect(localStorage.getItem("homara_token")).toBeNull());
  expect(router.push).toHaveBeenCalledWith("/login");
});

test("REG-AUTH-04", "Editar el perfil envía los datos a /users/me", async () => {
  // Arrange
  const backend = backendFalso({ "GET /orders": [], "GET /projects": [], "PUT /users/me": CLIENTE });
  conSesion(backend);
  const { usuario } = renderizar(<CuentaPage />, { ruta: "/cuenta" });
  await usuario.click(await screen.findByRole("button", { name: es("account.edit_profile_btn") }));
  await usuario.type(screen.getByPlaceholderText("Ej: 110111"), "9");

  // Act
  await usuario.click(screen.getByRole("button", { name: es("account.save_btn") }));

  // Assert
  await waitFor(() => expect(backend.de("PUT /users/me")).toHaveLength(1));
  expect(backend.de("PUT /users/me")[0].cuerpo).toStrictEqual({
    firstName: "Ana", lastName: "Rojas", phone: "3001234567", address: "Calle 1 #2-3",
    city: "Bogotá", state: "Cundinamarca", zipCode: "1101119",
  });
});
