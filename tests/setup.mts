// Setup global de Vitest.
//
// - Agrega los matchers fluidos de DOM (`toBeInTheDocument`, `toHaveValue`…).
// - Reemplaza los módulos de Next que necesitan el runtime de Next:
//   `next/navigation` (router falso inspeccionable) y `next/link` (un <a>).
// - En los archivos con `// @vitest-environment jsdom` completa las APIs del
//   navegador que jsdom no trae y limpia el DOM y el almacenamiento entre casos.

import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { createElement } from "react";

vi.mock("next/navigation", async () => (await import("./ui/navegacion.mjs")).moduloNavegacion);

vi.mock("next/link", () => ({
  default: ({ href, children, prefetch: _p, scroll: _s, replace: _r, ...resto }: Record<string, any>) =>
    createElement("a", { href: typeof href === "string" ? href : href?.pathname, ...resto }, children),
}));

if (typeof document !== "undefined") {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  window.scrollTo = () => {};

  beforeEach(async () => {
    (await import("./ui/navegacion.mjs")).reiniciarNavegacion();
    localStorage.clear();
  });

  afterEach(async () => {
    (await import("@testing-library/react")).cleanup();
    vi.unstubAllGlobals();
  });
}
