// Genera los flujos de QA Wolf (src/flows/*.flow.ts) con Claude a partir de los
// casos de Katalon Recorder que ya tiene el proyecto (katalon/recorder).
//
// Uso:
//   npm run generar            # los 15 casos
//   npm run generar TC01 TC07  # solo algunos

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

const aqui = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(aqui, "..", ".env"), quiet: true });
const recorder = path.join(aqui, "casos-katalon");
const salida = path.join(aqui, "src", "flows");
const modelo = process.env.CLAUDE_MODEL || "claude-opus-5-5";

const SISTEMA = `Eres un ingeniero de QA. Conviertes casos de prueba de Katalon Recorder (comandos Selenese)
en flujos de QA Wolf escritos en TypeScript. Responde SOLO con el contenido del archivo, sin explicaciones
ni bloques de código markdown.

Formato obligatorio de un flujo de QA Wolf:

import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export default flow(
  "Nombre del caso",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    await test("descripción del paso", async () => {
      await page.goto(\`\${BASE_URL}/login\`);
      await expect(page).toHaveURL(/\\/login/);
    });
  },
);

Reglas:
- "page" es una página de Playwright: usa page.locator, page.goto, page.evaluate y expect de "@qawolf/flows/web".
- Las URL de la app se arman con BASE_URL (nunca localhost fijo).
- La sesión vive en la cookie HttpOnly "homara_session": para limpiarla usa page.context().clearCookies().
- Conserva los mismos localizadores (id=x -> #x, css=... -> el selector css, xpath=... -> "xpath=...") y las mismas verificaciones.
- Convierte las esperas waitFor* en expect(...).toBeVisible() o equivalentes; no uses esperas fijas.
- runScript/storeEval/verifyEval -> page.evaluate. "store" y variables \${x} -> constantes de TypeScript.
- loadVars con un CSV: escribe las filas como un arreglo de objetos en el archivo y recorre cada fila con un test() por fila.
- Agrupa los pasos en test() con nombres en español. No agregues pasos que el caso original no tiene.`;

function casos() {
  const html = fs.readFileSync(path.join(recorder, "TS_Regresion_Completa.html"), "utf8");
  const limpiar = (s) => s.replace(/<datalist>[\s\S]*?<\/datalist>/g, "").replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
  return html.split("<table").slice(1).map((tabla) => {
    const nombre = limpiar(tabla.match(/<thead>([\s\S]*?)<\/thead>/)[1]);
    const pasos = [...tabla.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].slice(1)
      .map((fila) => [...fila[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((c) => limpiar(c[1])).join(" | "));
    const csvs = [...new Set(pasos.filter((p) => p.startsWith("loadVars")).map((p) => p.split(" | ")[1]))];
    return { id: nombre.slice(0, 4), nombre, pasos, csvs };
  });
}

async function generar(cliente, caso) {
  const datos = caso.csvs.map((f) => `Archivo ${f}:\n${fs.readFileSync(path.join(recorder, "datos", f), "utf8")}`);
  const respuesta = await cliente.beta.messages.create({
    model: modelo,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SISTEMA,
    messages: [{
      role: "user",
      content: `Caso de Katalon Recorder "${caso.nombre}" (comando | objetivo | valor):\n\n${caso.pasos.join("\n")}`
        + (datos.length ? `\n\nDatos:\n\n${datos.join("\n\n")}` : ""),
    }],
  });
  if (respuesta.stop_reason === "refusal") throw new Error(`${caso.id}: el modelo rechazó la solicitud`);
  const codigo = respuesta.content.filter((b) => b.type === "text").map((b) => b.text).join("")
    .replace(/^```(?:typescript|ts)?\n/, "").replace(/\n```\s*$/, "");
  const archivo = path.join(salida, `${caso.nombre}.flow.ts`);
  fs.writeFileSync(archivo, codigo.trim() + "\n");
  console.log(`${caso.id} -> ${path.relative(aqui, archivo)} (${respuesta.usage.output_tokens} tokens)`);
}

const filtro = process.argv.slice(2);
const cliente = new Anthropic();
fs.mkdirSync(salida, { recursive: true });
for (const caso of casos().filter((c) => !filtro.length || filtro.includes(c.id))) {
  await generar(cliente, caso);
}
