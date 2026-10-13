// Auditoría Lighthouse del frontend (ESC38 / ESC39 · rendimiento percibido en el cliente).
//
// Recorre /, /catalogo y /login en perfil escritorio y móvil con Chrome headless,
// guarda los reportes HTML y JSON y un resumen con las 4 categorías.
//
// Uso:  npm run test:lighthouse            (requiere el stack corriendo en :3000)
//       LH_BASE_URL=http://otro:3000 npm run test:lighthouse
//       LH_RONDAS=3 npm run test:lighthouse  (mediana de N corridas por página)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import * as chromeLauncher from "chrome-launcher";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.LH_BASE_URL ?? "http://localhost:3000";
const RONDAS = Number(process.env.LH_RONDAS ?? 1);
const SALIDA = path.join(raiz, "docs", "pruebas", "evidencias", "lighthouse");
const PAGINAS = [
  { id: "inicio", ruta: "/" },
  { id: "catalogo", ruta: "/catalogo" },
  { id: "login", ruta: "/login" },
];
const PERFILES = [
  { id: "escritorio", config: desktopConfig },
  { id: "movil", config: undefined }, // configuración por defecto de Lighthouse = móvil (Moto G Power, 4G lenta)
];
const CATEGORIAS = ["performance", "accessibility", "best-practices", "seo"];
const METRICAS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
];

const mediana = (xs) => {
  const o = [...xs].sort((a, b) => a - b);
  return o[Math.floor(o.length / 2)];
};

fs.mkdirSync(SALIDA, { recursive: true });
const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"] });
const resumen = [];

try {
  for (const perfil of PERFILES) {
    for (const pagina of PAGINAS) {
      const url = `${BASE}${pagina.ruta}`;
      const corridas = [];
      for (let i = 0; i < RONDAS; i++) {
        const r = await lighthouse(
          url,
          { port: chrome.port, output: ["html", "json"], logLevel: "error", onlyCategories: CATEGORIAS },
          perfil.config,
        );
        corridas.push(r);
      }
      // Se conserva el reporte de la corrida con el puntaje de rendimiento mediano.
      const puntajes = corridas.map((c) => c.lhr.categories.performance.score);
      const elegida = corridas[puntajes.indexOf(mediana(puntajes))];
      const base = path.join(SALIDA, `${pagina.id}-${perfil.id}`);
      fs.writeFileSync(`${base}.report.html`, elegida.report[0]);
      fs.writeFileSync(`${base}.report.json`, elegida.report[1]);

      const lhr = elegida.lhr;
      const fila = {
        pagina: pagina.id,
        ruta: pagina.ruta,
        perfil: perfil.id,
        corridas: RONDAS,
        lighthouse: lhr.lighthouseVersion,
        fecha: lhr.fetchTime,
        puntajes: Object.fromEntries(CATEGORIAS.map((c) => [c, Math.round(lhr.categories[c].score * 100)])),
        metricas: Object.fromEntries(METRICAS.map((m) => [m, lhr.audits[m].displayValue])),
        oportunidades: Object.values(lhr.audits)
          .filter((a) => a.details?.type === "opportunity" && (a.score ?? 1) < 0.9)
          .sort((a, b) => (b.details.overallSavingsMs ?? 0) - (a.details.overallSavingsMs ?? 0))
          .slice(0, 4)
          .map((a) => `${a.title} (${a.displayValue ?? ""})`),
        fallasAccesibilidad: lhr.categories.accessibility.auditRefs
          .filter((ref) => lhr.audits[ref.id].score === 0)
          .map((ref) => ref.id),
      };
      resumen.push(fila);
      console.log(
        `[lighthouse] ${perfil.id.padEnd(10)} ${pagina.ruta.padEnd(10)} ` +
          CATEGORIAS.map((c) => `${c}=${fila.puntajes[c]}`).join("  ") +
          `  LCP=${fila.metricas["largest-contentful-paint"]}  TBT=${fila.metricas["total-blocking-time"]}  CLS=${fila.metricas["cumulative-layout-shift"]}`,
      );
    }
  }
} finally {
  await chrome.kill();
}

fs.writeFileSync(path.join(SALIDA, "resumen.json"), JSON.stringify(resumen, null, 2));
const tabla = [
  "| Página | Perfil | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |",
  "|---|---|---|---|---|---|---|---|---|---|",
  ...resumen.map((f) =>
    `| ${f.ruta} | ${f.perfil} | ${f.puntajes.performance} | ${f.puntajes.accessibility} | ${f.puntajes["best-practices"]} | ${f.puntajes.seo} | ` +
    `${f.metricas["first-contentful-paint"]} | ${f.metricas["largest-contentful-paint"]} | ${f.metricas["total-blocking-time"]} | ${f.metricas["cumulative-layout-shift"]} |`,
  ),
].join("\n");
fs.writeFileSync(path.join(SALIDA, "resumen.md"), `# Resumen Lighthouse\n\nBase: ${BASE} · corridas por página: ${RONDAS}\n\n${tabla}\n`);
console.log(`\n${tabla}\n\nReportes en ${path.relative(raiz, SALIDA)}`);
