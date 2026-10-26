import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    // Suite de pruebas manuales: scripts sueltos, no van al bundle.
    "tests/**",
    // Artefactos de ejecución de pruebas E2E y pruebas generadas desde Gherkin.
    "e2e-screenplay/.features-gen/**",
    "e2e-screenplay/evidencias/**",
    "e2e-screenplay/test-results/**",
    "docs/pruebas/evidencias/**",
  ]),
]);

export default eslintConfig;
