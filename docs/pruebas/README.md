# Pruebas del frontend de Homara (Cypress + Lighthouse)

Este directorio documenta las verificaciones **de caja negra sobre la aplicación
desplegada** (stack Docker: frontend en `:3000`, backend en `:5000`). Complementan
las pruebas unitarias/de interfaz con Vitest que ya existen en `tests/` (ver
`tests/README.md`), sin modificarlas.

| Documento | Contenido |
|---|---|
| [CYPRESS.md](CYPRESS.md) | Suites Cypress: flujos E2E completos, regresión por funcionalidad, API, seguridad, interfaz, accesibilidad (axe-core) y componentes. Cómo ejecutarlas, resultados, **matriz de trazabilidad prueba → ESC → resultado**, defectos y evidencias (reporte HTML con capturas, JUnit y consola). |
| [RENDIMIENTO-FRONTEND.md](RENDIMIENTO-FRONTEND.md) | Auditoría Lighthouse (Performance, Accessibility, Best Practices, SEO) de `/`, `/catalogo` y `/login` en escritorio y móvil. |
| [evidencias/](evidencias/) | Consola de cada ejecución, reporte HTML y JUnit de Cypress (`evidencias/cypress/`) y reportes HTML/JSON de Lighthouse. |
| [evidencias/vitest/](evidencias/vitest/) | Salida de `npm test` (152 casos: lógica, componentes y páginas con Testing Library, regresión `REG-*`) y de `npm run test:regression:demo` (mutación: la suite de regresión detecta 20/20 errores reintroducidos). Detalle de los casos en [`tests/README.md`](../../tests/README.md). |
| [../../e2e-screenplay/README.md](../../e2e-screenplay/README.md) | E2E con escenarios **Gherkin** (Dado-Cuando-Entonces, `e2e-screenplay/features/`) ejecutados con el **patrón Screenplay** (Serenity/JS + playwright-bdd + Playwright): actores, habilidades, tareas, interacciones y preguntas; trazabilidad ESC y evidencias propias en `e2e-screenplay/evidencias/`. |

## Requisitos

- Node 22+ y `npm install` (instala Cypress 14, cypress-axe, los reporteros y Lighthouse).
- Stack corriendo: `http://localhost:3000` (frontend en build de producción, que
  hace de proxy de `/api/v1/*`) y `http://localhost:5000/api/v1` (backend).

## Cómo ejecutar

Cypress: ver [CYPRESS.md](CYPRESS.md#cómo-ejecutar).

`npm run test:lighthouse` corre [`scripts/lighthouse.mjs`](../../scripts/lighthouse.mjs)
con Chrome headless (`LH_RONDAS=3` para la mediana de 3 corridas).
