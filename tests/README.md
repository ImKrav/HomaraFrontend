# Pruebas del frontend

Suite sobre **Vitest**, mismo enfoque que el backend: los dobles son mocks de
Vitest (`vi.fn()`, `vi.stubGlobal`) y todas las aserciones son fluidas, con el
`expect` de Vitest (`expect(x).toBe(y)`). Sin jsdom — los globales del
navegador se instalan a mano.

Alcance: **solo la lógica pura de `app/lib/`**. No hay renderizado de React.

Todos los casos están escritos con el **patrón AAA** (Arrange · Act · Assert),
marcado explícitamente con comentarios en cada cuerpo de prueba:

```ts
test("fmt-01", "Formatea pesos enteros sin decimales", () => {
  // Arrange
  const precio = 38900;

  // Act
  const formateado = formatPrice(precio);

  // Assert
  expect(soloDigitos(formateado)).toBe("38900");
  expect(formateado).toContain("38.900"); // separador de miles es punto (es-CO)
});
```

En `api.test.mts` el Arrange es `conEntorno`, que instala el navegador y el
`fetch` falsos y los restaura al terminar; el Act y el Assert van dentro del
callback. Los casos de tabla dejan las entradas y esperados en el Arrange, un
`map` en el Act y la comparación por índice en el Assert, para que el mensaje de
fallo diga cuál entrada falló.

## Cómo ejecutar

```bash
npm install
npm test                          # corre los 44 casos
npm run test:watch                # modo watch de Vitest
npm test -- tests/api.test.mts    # un archivo
npm test -- -t mat-note-04        # un caso por id (filtro por nombre)
npm run test:coverage             # cobertura v8 de app/lib
```

`npm test` es `vitest run`. Los archivos son `.mts` (ESM) porque el proyecto no
declara `"type": "module"`; `vitest.config.mts` trae el alias que traduce los
imports `"./x.mjs"` / `"../app/lib/x.js"` a los `.mts` / `.ts` reales.

## Qué se cubre

| Archivo | Unidad | Casos |
|---|---|---|
| `api.test.mts` | `apiFetch` / `api.*` (`app/lib/api.ts`) | 18 — armado de URL (strip `/api/vN/`, base, absolutas), cabeceras (`Content-Type`, `Bearer`), respuestas y errores, manejo de 401 (`auth:401` + borrar token), verbos |
| `utils.test.mts` | `app/lib/utils.ts` | 19 — `formatPrice` (COP entero), `getStatusLabel` / `getStatusColor`, `translateMaterialName` / `translateMaterialNote` (ramas fijas, dinámicas, interpolación `{waste}`, fallbacks) |
| `toast.test.mts` | `showToast` (`app/lib/toast.ts`) | 4 — evento `homara:toast`, defaults, ids únicos, no-op en SSR |
| `translations.test.mts` | `app/lib/translations.ts` | 3 — idiomas expuestos, locales, secciones presentes en es/en |

## Infra

| Archivo | Rol |
|---|---|
| `vitest.config.mts` | `include: tests/**/*.test.mts`, cobertura v8 sobre `app/lib`, alias de extensiones. |
| `tests/harness.mts` | `test(id, desc, fn)` → `it()` de Vitest, `grab`/`grabSync` para capturar errores en el Act, re-export de `expect` / `vi` (aserciones fluidas). Igual que el del backend. |
| `tests/helpers.mts` | `instalarNavegador()` (fakes de `window` + `localStorage`), `instalarFetch()` (reemplaza `fetch` por un `vi.fn()` vía `vi.stubGlobal`, inspeccionable con `.mock.calls`), `tIdentidad` / `tDiccionario` (traductores de prueba). |

No hay `run-all.mts`: Vitest descubre los archivos por el `include` del config.

`tests/**` está excluido de ESLint (`eslint.config.mjs`): son scripts sueltos,
no van al bundle.
