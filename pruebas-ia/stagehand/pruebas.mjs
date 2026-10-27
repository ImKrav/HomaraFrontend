// Pruebas E2E de Homara con Stagehand y Claude (Sonnet 5.5).
// La IA actúa (act), descubre elementos (observe) y lee datos (extract) desde
// lenguaje natural; cada resultado se verifica de forma determinística contra
// la API del backend o la URL, nunca preguntándole a la IA.
//
// Uso:
//   npm test               # todos los casos
//   npm test -- ST03 ST07  # solo algunos

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Stagehand, localBrowser } from "@browserbasehq/stagehand";
import { z } from "zod";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL ?? "http://localhost:5000/api/v1";
const MODELO = process.env.STAGEHAND_MODEL ?? "anthropic/claude-sonnet-5-5";
const ADMIN = { email: "admin@homara.co", clave: "123456" };
const KORAZA = "Pintura Koraza Caneca 5 Galones"; // 549.000 COP: envío gratis
const EVIDENCIAS = path.join(path.dirname(fileURLToPath(import.meta.url)), "evidencias");
const SELLO = Date.now();
// Cliente propio de esta corrida: no comparte carrito con otras suites.
const CLIENTE = { email: `st.${SELLO}@homara.co`, clave: `Hm-${SELLO}-st`, nombre: "Stagehand" };

// ------------------------------------------------------------ API (oráculo)

async function api(metodo, ruta, token, cuerpo) {
  const r = await fetch(`${API_URL}${ruta}`, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: cuerpo && JSON.stringify(cuerpo),
  });
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
}
const token = async ({ email, clave }) => (await api("POST", "/users/login", null, { email, password: clave })).data?.token;
const buscar = async (q) => (await api("GET", `/products?q=${encodeURIComponent(q)}`)).data;

function verificar(condicion, detalle) {
  if (!condicion) throw new Error(`Verificación fallida: ${detalle}`);
  return detalle;
}

// ------------------------------------------------------- Pasos deterministas

async function esperarUrl(page, patron, ms = 20_000) {
  for (const fin = Date.now() + ms; Date.now() < fin; await new Promise((r) => setTimeout(r, 300))) {
    if (patron.test(await page.url())) return page.url();
  }
  return page.url();
}

// Precondición de los casos que no prueban el login: se entra sin IA.
async function iniciarSesion(page, { email, clave }) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector("#email", { state: "visible" });
  await new Promise((r) => setTimeout(r, 800)); // animación de entrada
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(clave);
  await page.locator("button[type=submit]").click();
  await esperarUrl(page, /\/(cuenta|admin)/);
}

// -------------------------------------------------------------------- Casos

const casos = [
  {
    id: "ST01", nombre: "Login exitoso (ESC02) — act con variables",
    async correr({ stagehand, page }) {
      await page.goto(`${BASE_URL}/login`);
      await stagehand.act("Escribe %correo% en el campo de correo electrónico", { page, variables: { correo: CLIENTE.email } });
      await stagehand.act("Escribe %clave% en el campo de contraseña", { page, variables: { clave: CLIENTE.clave } });
      await stagehand.act("Haz clic en el botón para iniciar sesión", { page });
      const url = await esperarUrl(page, /\/cuenta$/);
      return verificar(url.endsWith("/cuenta"), `URL final ${url}`);
    },
  },
  {
    id: "ST02", nombre: "Login inválido (ESC02) — act + extract del mensaje",
    async correr({ stagehand, page }) {
      await page.goto(`${BASE_URL}/login`);
      await stagehand.act("Escribe %correo% en el campo de correo electrónico", { page, variables: { correo: CLIENTE.email } });
      await stagehand.act("Escribe %clave% en el campo de contraseña", { page, variables: { clave: "clave-incorrecta-123" } });
      await stagehand.act("Haz clic en el botón para iniciar sesión", { page });
      await new Promise((r) => setTimeout(r, 2000));
      const { data } = await stagehand.extract("Extrae el mensaje de error que muestra el formulario de inicio de sesión",
        z.object({ mensaje: z.string() }), { page });
      const url = await page.url();
      return verificar(data.mensaje.startsWith("Credenciales incorrectas") && url.endsWith("/login"),
        `mensaje="${data.mensaje}", URL ${url}`);
    },
  },
  {
    id: "ST03", nombre: "Búsqueda con resultados (ESC09) — act + extract comparado con la API",
    async correr({ stagehand, page }) {
      await page.goto(`${BASE_URL}/catalogo`);
      await stagehand.act("Escribe %termino% en la barra de búsqueda", { page, variables: { termino: "Porcelanato" } });
      await stagehand.act("Presiona Enter en la barra de búsqueda para buscar", { page });
      await esperarUrl(page, /search=Porcelanato/i);
      await new Promise((r) => setTimeout(r, 2000));
      const { data } = await stagehand.extract("Extrae los nombres de todos los productos que aparecen en los resultados",
        z.object({ productos: z.array(z.string()) }), { page });
      const enApi = new Set((await buscar("Porcelanato")).map((p) => p.name));
      const ajenos = data.productos.filter((n) => !enApi.has(n));
      return verificar(data.productos.length === enApi.size && ajenos.length === 0,
        `vistos=${data.productos.length}, API=${enApi.size}, no encontrados en API=${JSON.stringify(ajenos)}`);
    },
  },
  {
    id: "ST04", nombre: "Búsqueda sin resultados (ESC09) — extract",
    async correr({ stagehand, page }) {
      await page.goto(`${BASE_URL}/catalogo?search=xyzproductoinexistente`);
      await new Promise((r) => setTimeout(r, 3000));
      const { data } = await stagehand.extract("Extrae cuántos productos se encontraron según el texto del conteo de resultados",
        z.object({ cantidad: z.number() }), { page });
      const enApi = (await buscar("xyzproductoinexistente")).length;
      return verificar(data.cantidad === 0 && enApi === 0, `cantidad en pantalla=${data.cantidad}, API=${enApi}`);
    },
  },
  {
    id: "ST05", nombre: "Agregar al carrito y validar total (ESC13, ESC16) — observe + act",
    async correr({ stagehand, page }) {
      await iniciarSesion(page, CLIENTE);
      await page.goto(`${BASE_URL}/catalogo?search=${encodeURIComponent("Pintura Koraza")}`);
      await new Promise((r) => setTimeout(r, 3000));
      await stagehand.act(`Abre el producto "${KORAZA}"`, { page });
      await esperarUrl(page, /\/catalogo\/[^/?]+$/);
      await new Promise((r) => setTimeout(r, 2000));
      const { data: acciones } = await stagehand.observe("Encuentra el botón para agregar el producto al carrito", { page });
      verificar(acciones.length > 0, "observe no encontró el botón de agregar al carrito");
      console.log("   observe ->", JSON.stringify(acciones[0]));
      await stagehand.act(acciones[0], { page });
      await new Promise((r) => setTimeout(r, 2000));
      const c = (await api("GET", "/cart", await token(CLIENTE))).data;
      return verificar(c.items.length === 1 && c.subtotal === 549000 && c.shipping === 0 && c.total === 549000,
        `ítems=${c.items.length} subtotal=${c.subtotal} envío=${c.shipping} total=${c.total}`);
    },
  },
  {
    id: "ST06", nombre: "Checkout completo genera pedido (ESC28) — act",
    async correr({ stagehand, page }) {
      const tk = await token(CLIENTE);
      const antes = (await api("GET", "/orders", tk)).data.length;
      await iniciarSesion(page, CLIENTE);
      await page.goto(`${BASE_URL}/checkout`);
      await new Promise((r) => setTimeout(r, 2000));
      await stagehand.act("Completa la dirección de envío con %dir%", { page, variables: { dir: "Calle 10 # 20-30" } });
      await stagehand.act("Completa la ciudad con %ciudad%", { page, variables: { ciudad: "Bogotá" } });
      await stagehand.act("Completa el teléfono con %tel%", { page, variables: { tel: "3001234567" } });
      await stagehand.act("Completa el departamento con %dep%", { page, variables: { dep: "Cundinamarca" } });
      await stagehand.act("Selecciona el método de pago contra entrega", { page });
      await stagehand.act("Haz clic en el botón para pagar y confirmar el pedido", { page });
      await esperarUrl(page, /\/cuenta$/);
      const despues = (await api("GET", "/orders", tk)).data.length;
      const carrito = (await api("GET", "/cart", tk)).data;
      return verificar(despues === antes + 1 && carrito.items.length === 0,
        `pedidos ${antes}→${despues}, carrito vacío=${carrito.items.length === 0}`);
    },
  },
  {
    id: "ST07", nombre: "Crear proyecto válido (ESC17) — act",
    async correr({ stagehand, page }) {
      const nombre = `Proyecto Stagehand ${SELLO}`;
      await iniciarSesion(page, CLIENTE);
      await page.goto(`${BASE_URL}/proyectos/nuevo`);
      await new Promise((r) => setTimeout(r, 2000));
      await stagehand.act("Escribe %nombre% en el nombre del proyecto", { page, variables: { nombre } });
      await stagehand.act("Escribe 4 en el largo", { page });
      await stagehand.act("Escribe 3 en el ancho", { page });
      await stagehand.act("Haz clic en el botón para crear o guardar el proyecto", { page });
      await new Promise((r) => setTimeout(r, 3000));
      const proyectos = (await api("GET", "/projects", await token(CLIENTE))).data;
      const p = proyectos.find((x) => x.name === nombre);
      return verificar(p && p.area === 12, `proyecto en API=${Boolean(p)}, área=${p?.area}`);
    },
  },
  {
    id: "ST08", nombre: "Panel de administración (ESC31) — observe + extract comparado con la API",
    async correr({ stagehand, page }) {
      await iniciarSesion(page, ADMIN);
      const metricasApi = async () => (await api("GET", "/admin/metrics", await token(ADMIN))).data;
      const antes = await metricasApi();
      await page.goto(`${BASE_URL}/admin`);
      await new Promise((r) => setTimeout(r, 3000));
      const { data: enlaces } = await stagehand.observe("Encuentra los enlaces de navegación del panel de administración", { page });
      console.log("   observe ->", enlaces.map((e) => e.description).join(" | "));
      const { data } = await stagehand.extract("Extrae las tarjetas de métricas del panel: etiqueta y valor tal como se muestran",
        z.object({ metricas: z.array(z.object({ etiqueta: z.string(), valor: z.string() })) }), { page });
      // Se compara con la API antes y después de leer: otras suites pueden crear clientes o pedidos en paralelo.
      const despues = await metricasApi();
      const distintas = despues.filter((m, i) =>
        !data.metricas.some((v) => v.etiqueta === m.label &&
          [m.value, antes[i]?.value].some((x) => x?.replace(/\s/g, "") === v.valor.replace(/\s/g, ""))));
      return verificar(enlaces.length > 0 && distintas.length === 0,
        `enlaces observados=${enlaces.length}, métricas=${JSON.stringify(data.metricas)}, distintas a la API=${JSON.stringify(distintas)}`);
    },
  },
  {
    id: "ST09", nombre: "Cerrar sesión (ESC03) — act",
    async correr({ stagehand, page }) {
      await iniciarSesion(page, CLIENTE);
      await stagehand.act("Abre el menú del usuario en la barra de navegación", { page });
      await stagehand.act("Haz clic en la opción para cerrar sesión", { page });
      await new Promise((r) => setTimeout(r, 2000));
      await page.goto(`${BASE_URL}/cuenta`);
      const url = await esperarUrl(page, /\/login/);
      return verificar(/\/login/.test(url), `al volver a /cuenta la app redirige a ${url}`);
    },
  },
];

// ------------------------------------------------------------------- Runner

async function ejecutar(caso) {
  const browser = await localBrowser.launch({ headless: process.env.HEADLESS === "true" });
  const stagehand = await Stagehand.create({ browser, model: { modelName: MODELO, apiKey: process.env.ANTHROPIC_API_KEY } });
  const [page] = await browser.context.pages();
  // Muestra en consola la respuesta de la IA en cada act/extract (evidencia de lo que decidió).
  for (const metodo of ["act", "extract"]) {
    const original = stagehand[metodo].bind(stagehand);
    stagehand[metodo] = async (...args) => {
      const r = await original(...args);
      console.log(`   ${metodo} ->`, JSON.stringify(r.data ?? r).slice(0, 400));
      return r;
    };
  }
  const inicio = Date.now();
  let ok = false, detalle;
  try {
    detalle = await caso.correr({ stagehand, page });
    ok = true;
  } catch (e) {
    detalle = e.message; // una excepción de la IA cuenta como fallo, nunca como éxito
  }
  await page.screenshot({ path: path.join(EVIDENCIAS, `${caso.id}.png`), fullPage: true }).catch(() => {});
  const metricas = await stagehand.metrics().catch(() => null);
  await stagehand.close();
  if (!browser.closed) await browser.close();
  return { id: caso.id, caso: caso.nombre, ok, detalle, segundos: (Date.now() - inicio) / 1000, metricas };
}

fs.mkdirSync(EVIDENCIAS, { recursive: true });
const registro = await api("POST", "/users/register", null,
  { email: CLIENTE.email, password: CLIENTE.clave, firstName: CLIENTE.nombre, lastName: "E2E" });
if (registro.status !== 201 && registro.status !== 200) throw new Error(`No se pudo crear el cliente de prueba: ${JSON.stringify(registro)}`);

const filtro = process.argv.slice(2);
const resultados = [];
for (const caso of casos.filter((c) => !filtro.length || filtro.includes(c.id))) {
  console.log(`\n▶ ${caso.id} ${caso.nombre}`);
  const r = await ejecutar(caso);
  console.log(`${r.ok ? "APROBADO" : "FALLIDO "} ${r.id} — ${r.detalle} (${r.segundos}s)`);
  resultados.push(r);
}
const aprobados = resultados.filter((r) => r.ok).length;
fs.writeFileSync(path.join(EVIDENCIAS, "resultados.json"),
  JSON.stringify({ modelo: MODELO, baseUrl: BASE_URL, fecha: new Date().toISOString(), aprobados, total: resultados.length, resultados }, null, 2));
console.log(`\n${aprobados}/${resultados.length} aprobados (${MODELO})`);
process.exitCode = aprobados === resultados.length ? 0 : 1;
