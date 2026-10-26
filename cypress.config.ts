import { defineConfig } from "cypress";
import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";

// ============================================================
// Configuración de Cypress para Homara (E2E, API y Componentes)
// ------------------------------------------------------------
// - E2E: corre contra el stack en Docker (frontend :3000, que
//   hace de proxy de /api/v1 hacia el backend :5000).
// - API: usa cy.request contra `env.apiUrl` (backend directo).
// - Componentes: Vite + @vitejs/plugin-react con el alias "@/".
// ============================================================

// Raíz del proyecto (Cypress carga este archivo como CommonJS).
const raiz = __dirname;

/** Tareas de Node disponibles desde las pruebas (cy.task). */
const tareas = {
  /** Imprime en la consola de `cypress run` (queda en la evidencia .txt). */
  log(mensaje: string) {
    console.log(mensaje);
    return null;
  },
  /** Agrega un registro de violaciones axe al archivo JSON acumulado. */
  registrarA11y({ archivo, registro }: { archivo: string; registro: unknown }) {
    const destino = path.resolve(raiz, archivo);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    const previo: unknown[] = fs.existsSync(destino)
      ? JSON.parse(fs.readFileSync(destino, "utf8"))
      : [];
    previo.push(registro);
    fs.writeFileSync(destino, JSON.stringify(previo, null, 2), "utf8");
    return null;
  },
  /** Reinicia un archivo JSON de resultados al inicio de una suite. */
  reiniciarArchivo(archivo: string) {
    const destino = path.resolve(raiz, archivo);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, "[]", "utf8");
    return null;
  },
};

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  screenshotsFolder: "cypress/screenshots",
  downloadsFolder: "cypress/downloads",
  viewportWidth: 1280,
  viewportHeight: 800,
  defaultCommandTimeout: 10000,
  requestTimeout: 15000,
  responseTimeout: 20000,
  retries: { runMode: 0, openMode: 0 },
  reporter: "cypress-multi-reporters",
  reporterOptions: {
    reporterEnabled: "spec, mocha-junit-reporter",
    mochaJunitReporterReporterOptions: {
      mochaFile: "cypress/results/junit-[hash].xml",
      testsuitesTitle: "Homara - Cypress",
      jenkinsMode: false,
      toConsole: false,
    },
  },
  env: {
    apiUrl: "http://localhost:5000/api/v1",
    // Usuarios sembrados (no se modifican; solo se usan para leer/iniciar sesión)
    adminEmail: "admin@homara.co",
    adminPassword: "123456",
    clienteEmail: "juan@email.com",
    clientePassword: "123456",
    // Archivo donde la suite de accesibilidad acumula las violaciones axe
    a11yResultados: "cypress/results/a11y-violaciones.json",
  },
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    experimentalRunAllSpecs: true,
    setupNodeEvents(on) {
      on("task", tareas);
      // Pantallas consistentes en Chrome/Edge headless
      on("before:browser:launch", (browser, opciones) => {
        if (browser.family === "chromium" && browser.name !== "electron") {
          opciones.args.push("--window-size=1440,900", "--force-device-scale-factor=1");
        }
        return opciones;
      });
    },
  },
  component: {
    specPattern: "cypress/component/**/*.cy.tsx",
    supportFile: "cypress/support/component.tsx",
    indexHtmlFile: "cypress/support/component-index.html",
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig: {
        plugins: [react()],
        resolve: {
          alias: [{ find: /^@\/(.*)$/, replacement: `${raiz.replaceAll("\\", "/")}/$1` }],
        },
        // Algunos módulos de Next leen process.env en el navegador.
        define: { "process.env": {} },
        server: { fs: { allow: [raiz] } },
        // Pre-empaquetado explícito: evita que Vite "re-optimice" y recargue la
        // página en mitad de la primera spec (fallos intermitentes en frío).
        optimizeDeps: {
          include: ["react", "react-dom", "react-dom/client", "react/jsx-dev-runtime", "cypress/react", "next/link", "lucide-react"],
        },
      },
    },
    setupNodeEvents(on) {
      on("task", tareas);
    },
  },
});
