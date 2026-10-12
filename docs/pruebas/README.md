# Pruebas del frontend de Homara (Cypress + Lighthouse)

Este directorio documenta las suites de verificación y validación **de caja negra
sobre la aplicación desplegada** (stack Docker: frontend en `:3000`, backend en
`:5000`). Complementan las pruebas unitarias/de interfaz con Vitest que ya existen
en `tests/` (ver `tests/README.md`), sin modificarlas.

| Documento | Contenido |
|---|---|
| [REGRESION-API-COMPONENTES.md](REGRESION-API-COMPONENTES.md) | Regresión E2E de los flujos principales, contrato de la API que consume el frontend y pruebas de componentes aislados (Cypress Component Testing). Incluye la **matriz de trazabilidad ESC → prueba → resultado** y la tabla de defectos. |
| [INTERFAZ-ACCESIBILIDAD.md](INTERFAZ-ACCESIBILIDAD.md) | Responsive en 3 viewports, menú móvil, idioma/tema (ESC39, ESC40), compatibilidad de navegadores (ESC44) y accesibilidad WCAG 2.1 A/AA con axe-core, teclado y etiquetas. |
| [RENDIMIENTO-FRONTEND.md](RENDIMIENTO-FRONTEND.md) | Auditoría Lighthouse (Performance, Accessibility, Best Practices, SEO) de `/`, `/catalogo` y `/login` en escritorio y móvil. |
| [evidencias/](evidencias/) | Salida de consola de cada ejecución, reportes JUnit, capturas, JSON de axe y reportes HTML/JSON de Lighthouse. |
| [../../e2e-screenplay/README.md](../../e2e-screenplay/README.md) | E2E con el **patrón Screenplay** (Serenity/JS + Playwright): actores, habilidades, tareas, interacciones y preguntas; trazabilidad ESC y evidencias propias en `e2e-screenplay/evidencias/`. |
| [../../katalon/recorder/README.md](../../katalon/recorder/README.md) | E2E con **Katalon Recorder** (suites HTML + CSV data-driven), la variante que usa el equipo. El proyecto equivalente para Katalon Studio está en [../../katalon/README.md](../../katalon/README.md). |

## Estructura

```
cypress.config.ts                 # baseUrl :3000, env.apiUrl :5000/api/v1, reportes spec + JUnit
cypress/
├── e2e/
│   ├── regresion/   *.cy.ts      # flujos E2E positivos y negativos (ESC01-ESC34)
│   ├── api/         *.api.cy.ts  # contrato y regresión de la API con cy.request
│   ├── interfaz/    *.cy.ts      # responsive, menú móvil, idioma y tema
│   └── accesibilidad/ *.cy.ts    # axe-core (cypress-axe), teclado y etiquetas
├── component/       *.cy.tsx     # componentes aislados (React + Vite)
├── fixtures/a11y-linea-base.json # violaciones axe críticas aceptadas (línea base)
└── support/                      # comandos (sesión, datos por API), utilidades
scripts/lighthouse.mjs            # auditoría Lighthouse con Chrome headless
```

## Requisitos

- Node 20+ y `npm install` (instala Cypress 14, cypress-axe, axe-core, Lighthouse).
- Stack corriendo: `http://localhost:3000` (frontend en build de producción, que
  hace de proxy de `/api/v1/*`) y `http://localhost:5000/api/v1` (backend).
- Usuarios sembrados: `admin@homara.co` / `123456` (ADMIN) y `juan@email.com` /
  `123456` (CUSTOMER). Las pruebas **no modifican datos sembrados**: crean sus
  propios usuarios con correo único (`cy-<flujo>-<timestamp>@pruebas.homara.co`),
  sus propios productos (como ADMIN, y los eliminan) y solo cambian el estado de
  pedidos creados por la propia prueba.

## Cómo ejecutar

| Script | Qué corre |
|---|---|
| `npm run cy:open` | Abre el runner interactivo de Cypress |
| `npm run cy:run` | Todas las specs E2E (regresión + API + interfaz + accesibilidad) en Electron |
| `npm run test:e2e` | Regresión E2E (`cypress/e2e/regresion`) |
| `npm run test:e2e:chrome` / `test:e2e:edge` | Regresión E2E en Chrome / Edge (ESC44) |
| `npm run test:api` | Contrato/regresión de la API (`cypress/e2e/api`) |
| `npm run test:component` | Cypress Component Testing (`cypress/component`) |
| `npm run test:interfaz` (`:chrome`, `:edge`) | Responsive, menú móvil, idioma y tema |
| `npm run test:a11y` | axe-core + teclado + etiquetas |
| `npm run test:lighthouse` | Lighthouse (`LH_RONDAS=3` para mediana de 3 corridas) |
| `npm run test:cypress` | Todo lo de Cypress (E2E + componentes) |

Las suites existentes no cambian: `npm test`, `npm run test:regression` y
`npm run lint` siguen pasando (Vitest solo incluye `tests/**`; la carpeta
`cypress/` tiene su propio `cypress/tsconfig.json` y está excluida del
`tsconfig.json` raíz para que `next build` no la compile).

> En CI sin pruebas E2E se puede evitar la descarga del binario de Cypress con
> `CYPRESS_INSTALL_BINARY=0 npm ci`.

## Convenciones

- **IDs**: `REG-*` (regresión E2E), `API-*`, `CMP-*` (componentes), `INT-*`
  (interfaz), `A11Y-*` (accesibilidad). Cada nombre de prueba incluye el escenario
  del equipo entre corchetes, p. ej. `REG-CAR-06 [ESC16] ...`.
- **Sincronización**: siempre con `cy.intercept` + `cy.wait('@alias')` o con
  aserciones reintentables; no se usa `cy.wait(ms)`.
- **Sesiones**: `cy.session` (login por la interfaz para usuarios sembrados y por
  token para usuarios creados en la prueba).
- **Defectos conocidos**: las pruebas con `DEF-xx` en el nombre verifican el
  comportamiento **observado** (equivalente al `test.fails` de la suite Vitest):
  pasan mientras el defecto exista y fallarán cuando se corrija, avisando que hay
  que actualizar la prueba al comportamiento esperado. El detalle y la
  recomendación de cada uno está en la tabla de defectos.
- Las capturas y resultados crudos de cada ejecución (`cypress/screenshots`,
  `cypress/results`) no se versionan; las relevantes se copian a `evidencias/`.
