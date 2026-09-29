// @vitest-environment jsdom
//
// UI · Autenticación: inicio de sesión, registro y guardas de rutas privadas.

import { screen, waitFor } from "@testing-library/react";
import { test, expect } from "../harness.mjs";
import { backendFalso, conSesion, renderizar, CLIENTE, ADMIN } from "./soporte";
import { router } from "./navegacion.mjs";
import LoginPage from "@/app/(shop)/login/page";
import RegisterPage from "@/app/(shop)/register/page";
import RequireAuth from "@/app/components/RequireAuth";
import RequireAdmin from "@/app/components/RequireAdmin";

test("ui-auth-01", "Iniciar sesión guarda el token y lleva a la cuenta", async () => {
  // Arrange
  const backend = backendFalso({ "POST /users/login": { token: "jwt-nuevo", user: CLIENTE } });
  const { usuario } = renderizar(<LoginPage />, { ruta: "/login" });
  await usuario.type(await screen.findByLabelText(/Correo Electrónico/), "ana@homara.com");
  await usuario.type(screen.getByLabelText(/Contraseña/), "ClaveSegura8");

  // Act
  await usuario.click(screen.getByRole("button", { name: "Iniciar Sesión" }));

  // Assert
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/cuenta"));
  expect(backend.de("POST /users/login")[0].cuerpo).toStrictEqual({ email: "ana@homara.com", password: "ClaveSegura8" });
  expect(localStorage.getItem("homara_token")).toBe("jwt-nuevo");
});

test("ui-auth-02", "Credenciales incorrectas muestran el error del backend y no guardan token", async () => {
  // Arrange
  const backend = backendFalso();
  backend.fallar("POST /users/login", 401, "Credenciales incorrectas. Verifique correo y contraseña.");
  const { usuario } = renderizar(<LoginPage />, { ruta: "/login" });
  await usuario.type(await screen.findByLabelText(/Correo Electrónico/), "ana@homara.com");
  await usuario.type(screen.getByLabelText(/Contraseña/), "mala");

  // Act
  await usuario.click(screen.getByRole("button", { name: "Iniciar Sesión" }));

  // Assert
  expect(await screen.findByText("Credenciales incorrectas. Verifique correo y contraseña.")).toBeInTheDocument();
  expect(localStorage.getItem("homara_token")).toBeNull();
  expect(router.push).not.toHaveBeenCalledWith("/cuenta");
});

test("ui-auth-03", "El registro valida que las contraseñas coincidan antes de llamar al backend", async () => {
  // Arrange
  const backend = backendFalso();
  const { usuario } = renderizar(<RegisterPage />, { ruta: "/register" });
  await usuario.type(await screen.findByPlaceholderText("Juan"), "Ana");
  await usuario.type(screen.getByPlaceholderText("Pérez"), "Rojas");
  await usuario.type(screen.getByPlaceholderText("juan@email.com"), "ana@homara.com");
  await usuario.type(screen.getByPlaceholderText("Mínimo 6 caracteres"), "ClaveSegura8");
  await usuario.type(screen.getByPlaceholderText("Repite la contraseña"), "OtraClave8");

  // Act
  await usuario.click(screen.getByRole("button", { name: "Registrarme y Comenzar" }));

  // Assert
  expect(await screen.findByText("Las contraseñas no coinciden.")).toBeInTheDocument();
  expect(backend.de("POST /users/register")).toHaveLength(0);
});

test("ui-auth-04", "El registro envía solo los campos llenos y entra a la cuenta", async () => {
  // Arrange
  const backend = backendFalso({ "POST /users/register": { token: "jwt-registro", user: CLIENTE } });
  const { usuario } = renderizar(<RegisterPage />, { ruta: "/register" });
  await usuario.type(await screen.findByPlaceholderText("Juan"), "Ana");
  await usuario.type(screen.getByPlaceholderText("Pérez"), "Rojas");
  await usuario.type(screen.getByPlaceholderText("juan@email.com"), "ana@homara.com");
  await usuario.type(screen.getByPlaceholderText("Mínimo 6 caracteres"), "ClaveSegura8");
  await usuario.type(screen.getByPlaceholderText("Repite la contraseña"), "ClaveSegura8");
  await usuario.type(screen.getByPlaceholderText("Bogotá"), "Medellín");

  // Act
  await usuario.click(screen.getByRole("button", { name: "Registrarme y Comenzar" }));

  // Assert
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/cuenta"));
  expect(backend.de("POST /users/register")[0].cuerpo).toStrictEqual({
    email: "ana@homara.com",
    password: "ClaveSegura8",
    firstName: "Ana",
    lastName: "Rojas",
    city: "Medellín",
  });
  expect(localStorage.getItem("homara_token")).toBe("jwt-registro");
});

test("ui-auth-05", "Una ruta privada sin sesión redirige al login y no muestra el contenido", async () => {
  // Arrange
  backendFalso();

  // Act
  renderizar(<RequireAuth><p>Contenido privado</p></RequireAuth>, { ruta: "/checkout" });

  // Assert
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
  expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
});

test("ui-auth-06", "Una ruta pública se muestra sin sesión y una privada con sesión", async () => {
  // Arrange
  const backend = backendFalso();

  // Act
  const publica = renderizar(<RequireAuth><p>Catálogo abierto</p></RequireAuth>, { ruta: "/catalogo" });
  const textoPublico = (await publica.findByText("Catálogo abierto")).textContent;
  publica.unmount();
  conSesion(backend);
  renderizar(<RequireAuth><p>Mis proyectos</p></RequireAuth>, { ruta: "/proyectos" });

  // Assert
  expect(textoPublico).toBe("Catálogo abierto");
  expect(await screen.findByText("Mis proyectos")).toBeInTheDocument();
  expect(router.replace).not.toHaveBeenCalled();
});

test("ui-auth-07", "El panel admin rechaza a un cliente y admite a un administrador", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend, CLIENTE);

  // Act
  const cliente = renderizar(<RequireAdmin><p>Panel</p></RequireAdmin>, { ruta: "/admin" });
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  const panelParaCliente = cliente.queryByText("Panel");
  cliente.unmount();
  conSesion(backend, ADMIN);
  renderizar(<RequireAdmin><p>Panel</p></RequireAdmin>, { ruta: "/admin" });

  // Assert
  expect(panelParaCliente).toBeNull();
  expect(await screen.findByText("Panel")).toBeInTheDocument();
});

test("ui-auth-08", "Un 401 del backend cierra la sesión y manda al login", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend);
  renderizar(<RequireAuth><p>Mi cuenta</p></RequireAuth>, { ruta: "/cuenta" });
  await screen.findByText("Mi cuenta");

  // Act
  window.dispatchEvent(new Event("auth:401"));

  // Assert
  await waitFor(() => expect(screen.queryByText("Mi cuenta")).not.toBeInTheDocument());
  expect(router.push).toHaveBeenCalledWith("/login");
});
