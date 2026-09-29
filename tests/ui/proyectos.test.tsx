// @vitest-environment jsdom
//
// UI · Proyectos: listado con contadores, detalle con ficha técnica, cambio de
// estado y borrado, editor de materiales y asistente de creación/edición.

import { Suspense } from "react";
import { act, screen, waitFor, within } from "@testing-library/react";
import { vi } from "vitest";
import { test, expect } from "../harness.mjs";
import { backendFalso, conSesion, renderizar, es, type BackendFalso } from "./soporte";
import { router } from "./navegacion.mjs";
import ProyectosPage from "@/app/(shop)/proyectos/page";
import ProjectDetailPage from "@/app/(shop)/proyectos/[id]/page";
import NuevoProyectoPage from "@/app/(shop)/proyectos/nuevo/page";

const proyecto = (over: Record<string, unknown> = {}) => ({
  id: "proy_1",
  name: "Cocina",
  type: "PISO",
  status: "EN_PROGRESO",
  area: 20,
  length: 5,
  width: 4,
  height: null,
  materialType: "ceramica",
  tileFormat: "60x60",
  wastePercent: 10,
  layingPattern: "directo",
  deductDoors: 0,
  deductWindows: 0,
  customSubtractions: 0,
  estimatedCost: 1_250_000,
  thumbnail: "🏠",
  createdAt: "2026-02-01T00:00:00.000Z",
  materials: [
    { id: "m1", name: "Pegante cerámico flexible 25kg", quantity: "5 bultos", note: "25kg c/u (Rendimiento: 4m²/bulto)", icon: "🧱", price: 100_000, productId: null },
    { id: "m2", name: "Boquilla", quantity: "3 kg", note: "Rendimiento: 8m²/kg", icon: "🪣", price: 30_000, productId: null },
  ],
  ...over,
});

function detalle(over: Record<string, unknown> = {}): BackendFalso {
  const backend = backendFalso({ "GET /projects/:id": proyecto(over), "GET /products": [] });
  conSesion(backend);
  return backend;
}

/** La página lee `params` con `use()` y se suspende: se monta dentro de un act asíncrono. */
async function renderDetalle() {
  let resultado!: ReturnType<typeof renderizar>;
  await act(async () => {
    resultado = renderizar(
      <Suspense fallback={null}>
        <ProjectDetailPage params={Promise.resolve({ id: "proy_1" })} />
      </Suspense>,
      { ruta: "/proyectos/proy_1" },
    );
  });
  return resultado;
}

// --- Listado --------------------------------------------------------------------

test("ui-proy-01", "Sin sesión, 'Mis proyectos' invita a iniciar sesión", async () => {
  // Arrange
  backendFalso();

  // Act
  renderizar(<ProyectosPage />, { ruta: "/proyectos" });

  // Assert
  expect(await screen.findByText(es("projects.login_required"))).toBeInTheDocument();
});

test("ui-proy-02", "Lista los proyectos con contadores por estado y acceso a crear uno", async () => {
  // Arrange
  const backend = backendFalso({
    "GET /projects": [
      proyecto({ id: "p1", name: "Cocina", status: "EN_PROGRESO" }),
      proyecto({ id: "p2", name: "Baño", status: "COMPLETADO" }),
      proyecto({ id: "p3", name: "Sala", status: "EN_PROGRESO" }),
    ],
  });
  conSesion(backend);

  // Act
  renderizar(<ProyectosPage />, { ruta: "/proyectos" });

  // Assert
  expect(await screen.findByText("Baño")).toBeInTheDocument();
  const contador = (etiqueta: string) =>
    screen.getAllByText(etiqueta).map((e) => e.previousElementSibling?.textContent).find((v) => v !== undefined);
  expect(contador(es("projects.stat_total"))).toBe("3");
  expect(contador(es("projects.stat_in_progress"))).toBe("2");
  expect(contador(es("projects.stat_completed"))).toBe("1");
  expect(screen.getByRole("link", { name: /Cocina/ })).toHaveAttribute("href", "/proyectos/p1");
  expect(screen.getByRole("link", { name: es("projects.add_project_btn") })).toHaveAttribute("href", "/proyectos/nuevo");
});

// --- Detalle ----------------------------------------------------------------------

test("ui-proy-03", "El detalle muestra estado, área, presupuesto, materiales y ficha técnica", async () => {
  // Arrange
  detalle();

  // Act
  await renderDetalle();

  // Assert
  expect(await screen.findByRole("heading", { level: 1, name: /Cocina/ })).toBeInTheDocument();
  expect(screen.getAllByText(es("status.en_progreso")).length).toBeGreaterThan(0);
  expect(screen.getAllByText("20.00 m²").length).toBeGreaterThan(0);
  expect(screen.getAllByText(/1\.250\.000/).length).toBeGreaterThan(0);
  expect(screen.getByText("Pegante cerámico flexible 25kg")).toBeInTheDocument();
  expect(screen.getByText(`2 ${es("projects.materials")}`)).toBeInTheDocument();
});

test("ui-proy-04", "Cambiar el estado lo guarda en el backend y confirma", async () => {
  // Arrange
  const backend = detalle();
  backend.responder("PUT /projects/:id", { id: "proy_1" });
  const { usuario } = await renderDetalle();

  // Act
  await usuario.selectOptions(await screen.findByDisplayValue(es("status.en_progreso")), "COMPLETADO");

  // Assert
  expect(await screen.findByRole("alert")).toHaveTextContent(es("projects.actions_toast.status_updated"));
  expect(backend.de("PUT /projects/:id")[0].cuerpo).toStrictEqual({ status: "COMPLETADO" });
});

test("ui-proy-05", "Borrar pide confirmación, elimina el proyecto y vuelve al listado", async () => {
  // Arrange
  const backend = detalle();
  backend.responder("DELETE /projects/:id", {});
  const { usuario } = await renderDetalle();
  await usuario.click(await screen.findByRole("button", { name: es("projects.actions_delete_btn") }));
  const pedidoDeConfirmacion = (await screen.findByText(es("projects.delete_modal_title"))).textContent;

  // Act
  // El modal se pinta después del botón de la cabecera y ambos se llaman "Eliminar".
  await usuario.click(screen.getAllByRole("button", { name: es("projects.delete_modal_confirm") }).at(-1)!);

  // Assert
  expect(pedidoDeConfirmacion).toBe(es("projects.delete_modal_title"));
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/proyectos"));
  expect(backend.de("DELETE /projects/:id")[0].ruta).toBe("/projects/proy_1");
});

test("ui-proy-06", "Editar lleva al asistente en modo edición", async () => {
  // Arrange
  detalle();
  const { usuario } = await renderDetalle();

  // Act
  await usuario.click(await screen.findByRole("button", { name: es("projects.actions_edit_btn") }));

  // Assert
  expect(router.push).toHaveBeenCalledWith("/proyectos/nuevo?edit=proy_1");
});

// --- Editor de materiales -------------------------------------------------------------

test("ui-proy-07", "Sumar una unidad recalcula el precio proporcional y sincroniza la lista", async () => {
  // Arrange
  const backend = detalle();
  backend.responder("PUT /projects/:id", (l: any) => ({ id: "proy_1", materials: l.cuerpo.materials }));
  const { usuario } = await renderDetalle();
  await screen.findByText("Pegante cerámico flexible 25kg");

  // Act
  await usuario.click(screen.getAllByTitle(es("projects.editor_increase_qty"))[0]);

  // Assert
  await waitFor(() => expect(backend.de("PUT /projects/:id")).toHaveLength(1));
  const [pegante, boquilla] = backend.de("PUT /projects/:id")[0].cuerpo.materials;
  expect(pegante).toMatchObject({ quantity: "6 bultos", price: 120_000 });
  expect(boquilla).toMatchObject({ quantity: "3 kg", price: 30_000 });
  expect(await screen.findByText(/150\.000/)).toBeInTheDocument();
});

test("ui-proy-08", "Quitar un material pide confirmación y lo saca de la lista", async () => {
  // Arrange
  const backend = detalle();
  backend.responder("PUT /projects/:id", (l: any) => ({ id: "proy_1", materials: l.cuerpo.materials }));
  const confirmar = vi.fn(() => true);
  vi.stubGlobal("confirm", confirmar);
  const { usuario } = await renderDetalle();
  await screen.findByText("Pegante cerámico flexible 25kg");

  // Act
  await usuario.click(screen.getAllByTitle(es("projects.editor_remove_material_tooltip"))[1]);

  // Assert
  await waitFor(() => expect(backend.de("PUT /projects/:id")).toHaveLength(1));
  expect(confirmar).toHaveBeenCalledTimes(1);
  expect(backend.de("PUT /projects/:id")[0].cuerpo.materials.map((m: any) => m.name)).toStrictEqual([
    "Pegante cerámico flexible 25kg",
  ]);
});

// --- Asistente de creación ---------------------------------------------------------------

const CERAMICAS = [
  { id: "prd_c1", name: "Piso Ceramica Beige 60x60", price: 38_900, unit: "m²", categorySlug: "pisos-ceramicas" },
  { id: "prd_p1", name: "Porcelanato Gris 60x60", price: 71_000, unit: "m²", categorySlug: "pisos-ceramicas" },
];

const guardar = () => screen.getAllByRole("button", { name: es("projects.save_and_calculate") })[0];

test("ui-proy-09", "Guardar sin nombre avisa qué campo falta y no crea nada", async () => {
  // Arrange
  const backend = backendFalso({ "GET /products": CERAMICAS });
  conSesion(backend);
  const { usuario } = renderizar(<NuevoProyectoPage />, { ruta: "/proyectos/nuevo" });
  const [botonGuardar] = await screen.findAllByRole("button", { name: es("projects.save_and_calculate") });

  // Act
  await usuario.click(botonGuardar);

  // Assert
  const aviso = es("projects.required_field_alert").replace("{field}", es("projects.descriptive_name_label"));
  expect(await screen.findByRole("alert")).toHaveTextContent(aviso);
  expect(backend.de("POST /projects")).toHaveLength(0);
});

test("ui-proy-10", "Un piso de 5 × 4 m se envía con 20 m² netos, desperdicio 10% y la cerámica sugerida", async () => {
  // Arrange
  const backend = backendFalso({ "GET /products": CERAMICAS, "POST /projects": { id: "proy_nuevo" } });
  conSesion(backend);
  const { usuario } = renderizar(<NuevoProyectoPage />, { ruta: "/proyectos/nuevo" });
  await usuario.type(await screen.findByLabelText(es("projects.descriptive_name_label"), { exact: false }), "Cocina nueva");
  await usuario.type(screen.getByLabelText(es("projects.length_meters"), { exact: false }), "5");
  await usuario.type(screen.getByLabelText(es("projects.width_meters"), { exact: false }), "4");

  // Act
  await usuario.click(guardar());

  // Assert
  expect(await screen.findByRole("alert")).toHaveTextContent(es("projects.create_success"));
  expect(backend.de("POST /projects")[0].cuerpo).toMatchObject({
    name: "Cocina nueva",
    type: "PISO",
    length: 5,
    width: 4,
    area: 20,
    materialType: "ceramica",
    wastePercent: 10,
    layingPattern: "directo",
    includeAdhesive: true,
    selectedProductId: "prd_c1",
  });
});

test("ui-proy-11", "Una pared exige la altura", async () => {
  // Arrange
  const backend = backendFalso({ "GET /products": CERAMICAS });
  conSesion(backend);
  const { usuario } = renderizar(<NuevoProyectoPage />, { ruta: "/proyectos/nuevo" });
  await usuario.type(await screen.findByLabelText(es("projects.descriptive_name_label"), { exact: false }), "Muro");
  await usuario.click(screen.getByLabelText(es("projects.surface_walls")));
  await usuario.type(screen.getByLabelText(es("projects.length_meters"), { exact: false }), "4");

  // Act
  await usuario.click(guardar());

  // Assert
  const aviso = es("projects.required_field_alert").replace("{field}", es("projects.height"));
  expect(await screen.findByRole("alert")).toHaveTextContent(aviso);
  expect(backend.de("POST /projects")).toHaveLength(0);
});

test("ui-proy-12", "En modo edición precarga el proyecto y guarda con PUT", async () => {
  // Arrange
  const backend = backendFalso({
    "GET /products": CERAMICAS,
    "GET /projects/:id": proyecto({ selectedProductId: "prd_c1" }),
    "PUT /projects/:id": { id: "proy_1" },
  });
  conSesion(backend);
  const { usuario } = renderizar(<NuevoProyectoPage />, { ruta: "/proyectos/nuevo?edit=proy_1" });
  const nombre = await screen.findByDisplayValue("Cocina");
  await usuario.clear(nombre);
  await usuario.type(nombre, "Cocina remodelada");

  // Act
  await usuario.click(screen.getAllByRole("button", { name: es("projects.save_changes") })[0]);

  // Assert
  expect(await screen.findByRole("alert")).toHaveTextContent(es("projects.update_success"));
  const [edicion] = backend.de("PUT /projects/:id");
  expect(edicion.ruta).toBe("/projects/proy_1");
  expect(edicion.cuerpo).toMatchObject({ name: "Cocina remodelada", type: "PISO", area: 20 });
  expect(backend.de("POST /projects")).toHaveLength(0);
});

test("ui-proy-13", "Un error del backend al crear se muestra y no se sale del asistente", async () => {
  // Arrange
  const backend = backendFalso({ "GET /products": CERAMICAS });
  conSesion(backend);
  backend.fallar("POST /projects", 400, "Tipo de material no soportado.");
  const { usuario } = renderizar(<NuevoProyectoPage />, { ruta: "/proyectos/nuevo" });
  await usuario.type(await screen.findByLabelText(es("projects.descriptive_name_label"), { exact: false }), "Cocina");
  await usuario.type(screen.getByLabelText(es("projects.length_meters"), { exact: false }), "5");
  await usuario.type(screen.getByLabelText(es("projects.width_meters"), { exact: false }), "4");

  // Act
  await usuario.click(guardar());

  // Assert
  const aviso = await screen.findByRole("alert");
  expect(within(aviso).getByText("Tipo de material no soportado.")).toBeInTheDocument();
});
