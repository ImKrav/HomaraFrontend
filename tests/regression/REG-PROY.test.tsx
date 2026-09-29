// @vitest-environment jsdom
//
// REG-PROY · Regresión del estimador de proyectos (frontend)
// Flujos protegidos: el área neta que se envía al backend (dimensiones menos
// deducciones), el desperdicio según el patrón y el precio proporcional del editor.

import { Suspense } from "react";
import { act, screen, waitFor } from "@testing-library/react";
import { test, expect } from "../harness.mjs";
import { backendFalso, conSesion, renderizar, es, type BackendFalso } from "../ui/soporte";
import NuevoProyectoPage from "@/app/(shop)/proyectos/nuevo/page";
import ProjectDetailPage from "@/app/(shop)/proyectos/[id]/page";
import ProyectosPage from "@/app/(shop)/proyectos/page";

async function asistente(): Promise<{ backend: BackendFalso } & ReturnType<typeof renderizar>> {
  const backend = backendFalso({ "GET /products": [], "POST /projects": { id: "proy_nuevo" } });
  conSesion(backend);
  const vista = renderizar(<NuevoProyectoPage />, { ruta: "/proyectos/nuevo" });
  await vista.usuario.type(await screen.findByLabelText(es("projects.descriptive_name_label"), { exact: false }), "Muro");
  return { backend, ...vista };
}

const guardar = () => screen.getAllByRole("button", { name: es("projects.save_and_calculate") })[0];

test("REG-PROY-01", "Una pared de 4 × 2,5 m con 1,5 m² deducidos se envía con 8,5 m² netos", async () => {
  // Arrange
  const { backend, usuario } = await asistente();
  await usuario.click(screen.getByLabelText(es("projects.surface_walls")));
  await usuario.type(screen.getByLabelText(es("projects.length_meters"), { exact: false }), "4");
  await usuario.type(screen.getByLabelText(es("projects.height_meters"), { exact: false }), "2.5");
  await usuario.click(screen.getByRole("button", { name: es("projects.tab_precision") }));
  const otras = screen.getByLabelText(es("projects.custom_deductions_label"), { exact: false });
  await usuario.clear(otras);
  await usuario.type(otras, "1.5");

  // Act
  await usuario.click(guardar());

  // Assert
  await waitFor(() => expect(backend.de("POST /projects")).toHaveLength(1));
  expect(backend.de("POST /projects")[0].cuerpo).toMatchObject({ type: "PARED", length: 4, height: 2.5, customSubtractions: 1.5, area: 8.5 });
});

test("REG-PROY-02", "El patrón diagonal fija 15% de desperdicio", async () => {
  // Arrange
  const { backend, usuario } = await asistente();
  await usuario.type(screen.getByLabelText(es("projects.length_meters"), { exact: false }), "5");
  await usuario.type(screen.getByLabelText(es("projects.width_meters"), { exact: false }), "4");
  await usuario.click(screen.getByRole("button", { name: es("projects.tab_precision") }));
  await usuario.click(screen.getByRole("button", { name: (n) => n.includes(es("projects.pattern_diagonal")) }));

  // Act
  await usuario.click(guardar());

  // Assert
  await waitFor(() => expect(backend.de("POST /projects")).toHaveLength(1));
  expect(backend.de("POST /projects")[0].cuerpo).toMatchObject({ area: 20, layingPattern: "diagonal", wastePercent: 15 });
});

test("REG-PROY-03", "El editor reescala el precio al cambiar la cantidad (precio unitario constante)", async () => {
  // Arrange
  const backend = backendFalso({
    "GET /products": [],
    "GET /projects/:id": {
      id: "proy_1", name: "Cocina", type: "PISO", status: "EN_PROGRESO", area: 20, materialType: "ceramica",
      estimatedCost: 90_000, createdAt: "2026-02-01", thumbnail: "🏠", wastePercent: 10,
      materials: [{ id: "m1", name: "Boquilla", quantity: "3 kg", note: null, icon: "🪣", price: 90_000, productId: null }],
    },
    "PUT /projects/:id": (l: any) => ({ id: "proy_1", materials: l.cuerpo.materials }),
  });
  conSesion(backend);
  let vista!: ReturnType<typeof renderizar>;
  await act(async () => {
    vista = renderizar(
      <Suspense fallback={null}>
        <ProjectDetailPage params={Promise.resolve({ id: "proy_1" })} />
      </Suspense>,
    );
  });
  await screen.findByText(es("projects.supply_grout_title"));

  // Act
  await vista.usuario.click(screen.getByTitle(es("projects.editor_reduce_qty")));

  // Assert
  await waitFor(() => expect(backend.de("PUT /projects/:id")).toHaveLength(1));
  expect(backend.de("PUT /projects/:id")[0].cuerpo.materials[0]).toMatchObject({ quantity: "2 kg", price: 60_000 });
});

test("REG-PROY-04", "El listado cuenta los proyectos por estado (cantidades distintas por estado)", async () => {
  // Arrange
  const base = { type: "PISO", area: 20, estimatedCost: 0, createdAt: "2026-02-01", thumbnail: "🏠" };
  const backend = backendFalso({
    "GET /projects": [
      { ...base, id: "p1", name: "Cocina", status: "EN_PROGRESO" },
      { ...base, id: "p2", name: "Baño", status: "COMPLETADO" },
      { ...base, id: "p3", name: "Patio", status: "COMPLETADO" },
      { ...base, id: "p4", name: "Sala", status: "PAUSADO" },
    ],
  });
  conSesion(backend);

  // Act
  renderizar(<ProyectosPage />, { ruta: "/proyectos" });

  // Assert
  await screen.findByText("Baño");
  const contador = (clave: string) =>
    screen.getAllByText(es(clave)).map((e) => e.previousElementSibling?.textContent).find((v) => v !== undefined);
  expect([contador("projects.stat_total"), contador("projects.stat_in_progress"), contador("projects.stat_completed"), contador("projects.stat_paused")])
    .toStrictEqual(["4", "1", "2", "1"]);
});
