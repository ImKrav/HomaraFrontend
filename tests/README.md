# Pruebas manuales del frontend

Mismo enfoque **a la antigua** que el backend: scripts de Node en TypeScript,
sin framework, sin jsdom. Comprueban con `node:assert/strict` e imprimen
`[PASS]` / `[FAIL]` por caso.

Alcance: **solo la lógica pura de `app/lib/`**. No hay renderizado de React
(eso requeriría jsdom + una librería de testing, que sería un framework).

## Cómo ejecutar

```bash
npm install
npm test                 # corre los 41 casos
npm test -- api          # filtra por subcadena del id
npm test -- mat-note-04  # un caso puntual
```

`npm test` es `tsx tests/run-all.mts`. Los archivos son `.mts` (ESM) porque el
proyecto no declara `"type": "module"`.

## Qué se cubre

| Archivo | Unidad | Casos |
|---|---|---|
| `api.test.mts` | `apiFetch` / `api.*` (`app/lib/api.ts`) | 19 — armado de URL (strip `/api/vN/`, base, absolutas), cabeceras (`Content-Type`, `Bearer`), respuestas y errores, manejo de 401 (`auth:401` + borrar token), verbos |
| `utils.test.mts` | `app/lib/utils.ts` | 18 — `formatPrice` (COP entero), `getStatusLabel` / `getStatusColor`, `translateMaterialName` / `translateMaterialNote` (ramas fijas, dinámicas, interpolación `{waste}`, fallbacks) |
| `toast.test.mts` | `showToast` (`app/lib/toast.ts`) | 4 — evento `homara:toast`, defaults, ids únicos, no-op en SSR |

## Infra

| Archivo | Rol |
|---|---|
| `tests/harness.mts` | `test()`, `run()`, aserciones (`is`, `eq`, `ok`, `has`, `grab`, `soft`). Igual que el del backend. |
| `tests/helpers.mts` | `spy()`, `instalarNavegador()` (fakes de `window` + `localStorage`), `instalarFetch()` (doble de `fetch`), `tIdentidad` / `tDiccionario` (traductores de prueba). |
| `tests/run-all.mts` | Importa los 3 archivos de casos y ejecuta. |

`tests/**` está excluido de ESLint (`eslint.config.mjs`): son scripts sueltos,
no van al bundle.
