# Pruebas del frontend de Homara (Lighthouse)

Este directorio documenta las verificaciones **de caja negra sobre la aplicación
desplegada** (stack Docker: frontend en `:3000`, backend en `:5000`). Complementan
las pruebas unitarias/de interfaz con Vitest que ya existen en `tests/` (ver
`tests/README.md`), sin modificarlas.

| Documento | Contenido |
|---|---|
| [RENDIMIENTO-FRONTEND.md](RENDIMIENTO-FRONTEND.md) | Auditoría Lighthouse (Performance, Accessibility, Best Practices, SEO) de `/`, `/catalogo` y `/login` en escritorio y móvil. |
| [evidencias/](evidencias/) | Consola de cada ejecución y reportes HTML/JSON de Lighthouse. |
| [evidencias/vitest/](evidencias/vitest/) | Salida de `npm test` (152 casos: lógica, componentes y páginas con Testing Library, regresión `REG-*`) y de `npm run test:regression:demo` (mutación: la suite de regresión detecta 20/20 errores reintroducidos). Detalle de los casos en [`tests/README.md`](../../tests/README.md). |
| [../../e2e-screenplay/README.md](../../e2e-screenplay/README.md) | E2E con el **patrón Screenplay** (Serenity/JS + Playwright): actores, habilidades, tareas, interacciones y preguntas; trazabilidad ESC y evidencias propias en `e2e-screenplay/evidencias/`. |
| [../../katalon/recorder/README.md](../../katalon/recorder/README.md) | E2E con **Katalon Recorder** (suites HTML + CSV data-driven), la variante que usa el equipo. El proyecto equivalente para Katalon Studio está en [../../katalon/README.md](../../katalon/README.md). |

## Requisitos

- Node 20+ y `npm install` (instala Lighthouse).
- Stack corriendo: `http://localhost:3000` (frontend en build de producción, que
  hace de proxy de `/api/v1/*`) y `http://localhost:5000/api/v1` (backend).

## Cómo ejecutar

`npm run test:lighthouse` corre [`scripts/lighthouse.mjs`](../../scripts/lighthouse.mjs)
con Chrome headless (`LH_RONDAS=3` para la mediana de 3 corridas).
