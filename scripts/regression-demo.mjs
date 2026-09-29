// ============================================================================
// Demostración de la suite de regresión:  npm run test:regression:demo
//
// Introduce a propósito un error conocido en cada funcionalidad (uno por vez),
// corre `tests/regression` y comprueba que la suite lo detecta (queda en rojo).
// Después de cada cambio el archivo se restaura byte a byte, también si el
// proceso se interrumpe. Termina con código 1 si algún cambio pasa inadvertido.
// ============================================================================

import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MUTACIONES = [
  {
    modulo: "Autenticación",
    cambio: "El checkout deja de ser una ruta privada",
    archivo: "app/components/RequireAuth.tsx",
    buscar: 'const PRIVATE_PREFIXES = ["/proyectos", "/cuenta", "/checkout"];',
    poner: 'const PRIVATE_PREFIXES = ["/proyectos", "/cuenta"];',
  },
  {
    modulo: "Autenticación",
    cambio: "Un 401 ya no borra el token guardado",
    archivo: "app/lib/api.ts",
    buscar: 'localStorage.removeItem("homara_token");',
    poner: "/* token conservado */",
  },
  {
    modulo: "Catálogo",
    cambio: "Agregar al carrito no avisa a la barra (contador desactualizado)",
    archivo: "app/components/AddToCartButton.tsx",
    buscar: 'window.dispatchEvent(new Event("cartUpdated"));',
    poner: "/* sin aviso */",
  },
  {
    modulo: "Catálogo",
    cambio: "El filtro de categoría usa ?cat= en vez de ?category=",
    archivo: "app/(shop)/catalogo/page.tsx",
    buscar: "`/api/v1/products?category=${selectedCategory}`",
    poner: "`/api/v1/products?cat=${selectedCategory}`",
  },
  {
    modulo: "Carrito",
    cambio: "Cambiar la cantidad usa el id del producto en vez del ítem",
    archivo: "app/(shop)/carrito/page.tsx",
    buscar: "await api.put(`/api/v1/cart/items/${item.id}`, { quantity });",
    poner: "await api.put(`/api/v1/cart/items/${item.product.id}`, { quantity });",
  },
  {
    modulo: "Checkout",
    cambio: "El pedido envía el departamento como ciudad",
    archivo: "app/(shop)/checkout/page.tsx",
    buscar: "shippingCity: city,",
    poner: "shippingCity: state,",
  },
  {
    modulo: "Cuenta",
    cambio: "Guardar el perfil apunta a una ruta que no existe",
    archivo: "app/(shop)/cuenta/page.tsx",
    buscar: "api.put(`/api/v1/users/me`, formData)",
    poner: "api.put(`/api/v1/users/profile`, formData)",
  },
  {
    modulo: "Proyectos",
    cambio: "El área neta ignora las deducciones",
    archivo: "app/(shop)/proyectos/nuevo/page.tsx",
    buscar: "const netArea = Math.max(0.1, grossArea - totalDeductions);",
    poner: "const netArea = Math.max(0.1, grossArea);",
  },
  {
    modulo: "Proyectos",
    cambio: "El patrón diagonal deja el desperdicio en 10%",
    archivo: "app/(shop)/proyectos/nuevo/page.tsx",
    buscar: "setWastePercent(15);",
    poner: "setWastePercent(10);",
  },
  {
    modulo: "Proyectos",
    cambio: "El editor no reescala el precio al cambiar la cantidad",
    archivo: "app/components/MaterialsListEditor.tsx",
    buscar: "const newPrice = Math.round(roundedNum * unitPrice);",
    poner: "const newPrice = mat.price;",
  },
  {
    modulo: "Administración",
    cambio: "Un cliente ve el panel de administración",
    archivo: "app/components/RequireAdmin.tsx",
    buscar: 'user?.role?.toUpperCase() !== "ADMIN"',
    poner: "false",
    todas: true,
  },
  {
    modulo: "Administración",
    cambio: "La oferta se ignora y se cobra el precio normal",
    archivo: "app/(admin)/admin/productos/page.tsx",
    buscar: "price: offerPriceNum ?? normalPriceNum,",
    poner: "price: normalPriceNum,",
  },
  {
    modulo: "Administración",
    cambio: "El cambio de estado usa el número de pedido en vez del id interno",
    archivo: "app/(admin)/admin/pedidos/page.tsx",
    buscar: "`/api/v1/orders/${selectedOrder.dbId}/status`",
    poner: "`/api/v1/orders/${selectedOrder.id}/status`",
  },
  {
    modulo: "Utilidades",
    cambio: "Vuelve la regex de cantidades vulnerable a ReDoS",
    archivo: "app/lib/utils.ts",
    buscar: String.raw`const QUANTITY_REGEX = /^([\d.,]+)(?:\s+(\S.*))?$/;`,
    poner: String.raw`const QUANTITY_REGEX = /^([\d.,]+)(?:\s+(.*))?$/;`,
  },
  {
    modulo: "Traducción",
    cambio: "Una nota del backend deja de estar en el diccionario",
    archivo: "app/lib/utils.ts",
    buscar: '"Para retoques y esquinas": [',
    poner: '"Para retoques": [',
  },
];

const VITEST = join("node_modules", "vitest", "vitest.mjs");
const REPORTE = join(tmpdir(), `homara-regresion-front-${process.pid}.json`);

/** Corre la suite de regresión y devuelve los ids de los casos que fallaron. */
function correrSuite() {
  spawnSync(process.execPath, [VITEST, "run", "tests/regression", "--reporter=json", `--outputFile=${REPORTE}`], {
    stdio: "ignore",
  });
  const r = JSON.parse(readFileSync(REPORTE, "utf8"));
  const fallidos = r.testResults
    .flatMap((f) => f.assertionResults)
    .filter((t) => t.status === "failed")
    .map((t) => t.title.split(/\s+/)[0]);
  const archivosRotos = r.testResults.filter((f) => f.status === "failed" && f.assertionResults.length === 0).length;
  return { total: r.numTotalTests, fallidos, archivosRotos };
}

let pendiente = null; // { archivo, original } mientras hay una mutación aplicada
const restaurar = () => {
  if (pendiente) writeFileSync(pendiente.archivo, pendiente.original);
  pendiente = null;
};
for (const senal of ["SIGINT", "SIGTERM"]) process.on(senal, () => (restaurar(), process.exit(130)));
process.on("exit", restaurar);

console.log(`\nDemostración de regresión — ${MUTACIONES.length} errores introducidos a propósito\n`);

const base = correrSuite();
if (base.fallidos.length || base.archivosRotos) {
  console.error(`La línea base no está en verde (${base.fallidos.join(", ")}). Corrige eso antes de la demo.`);
  process.exit(1);
}
console.log(`Línea base: ${base.total}/${base.total} casos en verde\n`);

let detectados = 0;
for (const m of MUTACIONES) {
  const original = readFileSync(m.archivo, "utf8");
  if (!original.includes(m.buscar)) {
    console.error(`✖ ${m.modulo}: el fragmento a mutar ya no existe en ${m.archivo}. Actualiza el script.`);
    process.exitCode = 1;
    continue;
  }
  pendiente = { archivo: m.archivo, original };
  writeFileSync(m.archivo, m.todas ? original.split(m.buscar).join(m.poner) : original.replace(m.buscar, m.poner));
  const { fallidos, archivosRotos } = correrSuite();
  restaurar();

  const detectado = fallidos.length > 0 || archivosRotos > 0;
  if (detectado) detectados++;
  const marca = detectado ? "✔ detectado" : "✖ NO DETECTADO";
  const por = fallidos.length ? `→ ${fallidos.join(", ")}` : "";
  console.log(`${marca}  [${m.modulo}] ${m.cambio} ${por}`);
}

rmSync(REPORTE, { force: true });
console.log(`\nResultado: ${detectados}/${MUTACIONES.length} errores detectados por la suite. Código restaurado.\n`);
if (detectados !== MUTACIONES.length) process.exitCode = 1;
