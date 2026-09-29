import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: [
      // Los tests y `app/lib` importan "./x.js" / "./x.mjs" apuntando a .ts/.mts.
      // Vite no traduce esa extensión sola, así que se la quitamos.
      { find: /^(\.{1,2}\/.*)\.(js|mjs)$/, replacement: "$1" },
      // El alias "@/..." de tsconfig.json, que usan los componentes.
      { find: /^@\/(.*)$/, replacement: fileURLToPath(new URL("./$1", import.meta.url)) },
    ],
  },
  test: {
    // .test.mts: lógica pura en Node · .test.tsx: interfaz en jsdom (docblock por archivo)
    include: ["tests/**/*.test.mts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.mts"],
    coverage: {
      provider: "v8",
      all: true,
      include: ["app/**/*.{ts,tsx}"],
      exclude: ["app/lib/translations.ts", "app/layout.tsx"],
      reporter: ["text-summary", "lcov"],
    },
  },
});
