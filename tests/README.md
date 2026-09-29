# Pruebas del frontend

Suite sobre **Vitest**, mismo enfoque que el backend: los dobles son mocks de
Vitest (`vi.fn()`, `vi.stubGlobal`) y todas las aserciones son fluidas, con el
`expect` de Vitest (`expect(x).toBe(y)`) y los matchers de DOM de
`@testing-library/jest-dom` (`toBeInTheDocument`, `toHaveValue`…).

Alcance: **todas las funcionalidades de la app**.

- `tests/*.test.mts` — lógica pura de `app/lib/` en Node (sin DOM).
- `tests/ui/*.test.tsx` — pantallas y componentes renderizados con Testing
  Library en jsdom: se montan dentro de los mismos proveedores que
  `app/layout.tsx` (Auth, Theme, Language) y el usuario interactúa con
  `user-event`. El `fetch` se reemplaza por un **backend falso en memoria**, así
  que `app/lib/api.ts` corre tal cual y cada prueba inspecciona qué se envió.
- `tests/regression/` — la suite de regresión (ver abajo).

Todos los casos están escritos con el **patrón AAA** (Arrange · Act · Assert),
marcado explícitamente con comentarios en cada cuerpo de prueba:

```tsx
test("ui-cart-06", "Los botones + y − actualizan la cantidad del ítem sin bajar de 1", async () => {
  // Arrange
  const backend = backendFalso();
  conSesion(backend);
  backend.responder("GET /cart", carrito([item("itm_a", "Piso Beige", 38_900, 1)]));
  backend.responder("PUT /cart/items/:id", {});
  const { usuario } = renderizar(<CarritoPage />, { ruta: "/carrito" });
  await screen.findByText("Piso Beige");

  // Act
  await usuario.click(screen.getByRole("button", { name: "+" }));
  await usuario.click(screen.getByRole("button", { name: "-" }));

  // Assert
  await waitFor(() => expect(backend.de("PUT /cart/items/:id")).toHaveLength(2));
  const [suma, resta] = backend.de("PUT /cart/items/:id");
  expect(suma.cuerpo).toStrictEqual({ quantity: 2 });
  expect(resta.cuerpo).toStrictEqual({ quantity: 1 });
});
```

Los textos de la interfaz no se copian a mano: `es("cart.checkout_btn")` los lee
del diccionario real, así que la prueba sigue valiendo si cambia la redacción.

## Cómo ejecutar

```bash
npm install
npm test                           # corre los 152 casos
npm run test:regression            # solo la suite de regresión
npm run test:regression:demo       # demuestra que la regresión detecta cambios que rompen algo
npm run test:watch                 # modo watch de Vitest
npm test -- tests/ui/admin.test.tsx  # un archivo
npm test -- -t ui-chk-03           # un caso por id (filtro por nombre)
npm run test:coverage              # cobertura v8 de todo app/
```

`npm test` es `vitest run`. Un run limpio es `152 passed (152)` con código 0: los
3 casos que documentan defectos abiertos están declarados con `test.fails`
(ver la tabla de defectos). Cobertura actual sobre `app/`: ~86 % de líneas.

## Qué se cubre

### Lógica (`tests/*.test.mts`, Node)

| Archivo | Unidad | Casos |
|---|---|---|
| `api.test.mts` | `apiFetch` / `api.*` (`app/lib/api.ts`) | 18 — armado de URL (strip `/api/vN/`, base, absolutas), cabeceras (`Content-Type`, `Bearer`), respuestas y errores, manejo de 401 (`auth:401` + borrar token), verbos |
| `utils.test.mts` | `app/lib/utils.ts` | 19 — `formatPrice` (COP entero), `getStatusLabel` / `getStatusColor`, `translateMaterialName` / `translateMaterialNote` (ramas fijas, dinámicas, interpolación `{waste}`, fallbacks) |
| `toast.test.mts` | `showToast` (`app/lib/toast.ts`) | 4 — evento `homara:toast`, defaults, ids únicos, no-op en SSR |
| `translations.test.mts` | `app/lib/translations.ts` | 3 — idiomas expuestos, locales, secciones presentes en es/en |

### Interfaz (`tests/ui/*.test.tsx`, jsdom)

| Archivo | Funcionalidad | Casos |
|---|---|---|
| `auth.test.tsx` | Login (token y redirección, error del backend), registro (validación de claves, solo campos llenos), guardas `RequireAuth` / `RequireAdmin`, cierre por 401 | 8 |
| `catalogo.test.tsx` | Listado, orden, búsqueda, categorías, estado vacío; ficha (precio, descuento, stock, bajo pedido, no encontrado); agregar al carrito; reseñas; usar en proyecto | 15 |
| `carrito-checkout.test.tsx` | Carrito (sin sesión, totales, envío gratis, backorder, vacío, + / −, quitar); checkout (redirección, datos precargados, pago, validación, rechazo del backend) | 12 |
| `cuenta.test.tsx` | Perfil y contadores, proyectos y pedidos, detalle de pedido, edición del perfil, cerrar sesión | 8 |
| `proyectos.test.tsx` | Listado con contadores; detalle, cambio de estado, borrado; editor de materiales; asistente (validación, creación, edición, errores) | 13 |
| `admin.test.tsx` | Tablero; productos (alta, oferta, validaciones, edición, baja); pedidos (filtro, cambio de estado); inventario (umbrales y filtro) | 13 |
| `general.test.tsx` | Portada con vitrina, contador del carrito, menú de cuenta, idioma, tema, barra lateral admin | 7 |

## Pruebas de regresión

`tests/regression/` es la suite que se vuelve a correr después de cada cambio
para comprobar que **todas las funcionalidades** siguen funcionando: un archivo
por funcionalidad con sus flujos críticos (atraviesan varios componentes y el
`api.ts` real), más dos que protegen correcciones puntuales. Mismo harness,
aserciones fluidas y AAA.

| Archivo | Funcionalidad / qué protege | Casos |
|---|---|---|
| `REG-AUTH.test.tsx` | Login y registro guardan el JWT; el registro valida las contraseñas; rutas privadas vs públicas; cierre de sesión ante un 401; edición del perfil | 6 |
| `REG-CAT.test.tsx` | Portada con la vitrina; agregar desde la ficha actualiza el contador de la barra; filtro `?category=`; búsqueda + orden | 4 |
| `REG-CART.test.tsx` | Ítems modificados por su id de carrito; montos del backend; checkout con dirección y método | 3 |
| `REG-PROY.test.tsx` | Contadores del listado por estado; área neta con deducciones que se envía al backend; desperdicio por patrón; precio proporcional del editor | 4 |
| `REG-ADM.test.tsx` | Solo ADMIN ve el panel; la oferta se guarda como precio de venta; cambio de estado por id interno; umbrales del inventario; métricas del tablero traducidas | 5 |
| `REG-QTY.test.mts` | `20f4880` — `parseQuantity` (movida de `MaterialsListEditor.tsx` a `app/lib/utils.ts` para poder probarla): resultados de parseo y tiempo lineal ante una entrada de 50 000 caracteres (la regex anterior tardaba ~5 s, ReDoS) | 5 |
| `REG-I18N.test.mts` | `c492c7c` — contrato de traducción con el backend: cada nombre y nota que emite `calculateMaterials` se reconoce y traduce (contraparte: `HomaraBackend/tests/regression/REG-MAT.ts`) | 5 |

### Demostración: la suite detecta los cambios que rompen algo

`npm run test:regression:demo` (`scripts/regression-demo.mjs`) introduce a
propósito, de a uno, un error conocido en cada funcionalidad, corre la suite y
restaura el archivo byte a byte (también si se interrumpe). Termina con código 1
si algún error pasa inadvertido. Salida actual:

```
Línea base: 32/32 casos en verde
✔ detectado  [Autenticación] El checkout deja de ser una ruta privada → REG-AUTH-02
✔ detectado  [Autenticación] Un 401 ya no borra el token guardado → REG-AUTH-03
✔ detectado  [Autenticación] El registro deja pasar contraseñas distintas → REG-AUTH-05
✔ detectado  [Catálogo] La portada deja de mostrar las ofertas → REG-CAT-04
✔ detectado  [Catálogo] Agregar al carrito no avisa a la barra (contador desactualizado) → REG-CAT-01
✔ detectado  [Catálogo] El filtro de categoría usa ?cat= en vez de ?category= → REG-CAT-02
✔ detectado  [Carrito] Cambiar la cantidad usa el id del producto en vez del ítem → REG-CART-01
✔ detectado  [Checkout] El pedido envía el departamento como ciudad → REG-CART-03
✔ detectado  [Cuenta] Guardar el perfil apunta a una ruta que no existe → REG-AUTH-03, REG-AUTH-04
✔ detectado  [Proyectos] El contador de proyectos pausados cuenta los completados → REG-PROY-04
✔ detectado  [Proyectos] El área neta ignora las deducciones → REG-PROY-01
✔ detectado  [Proyectos] El patrón diagonal deja el desperdicio en 10% → REG-PROY-02
✔ detectado  [Proyectos] El editor no reescala el precio al cambiar la cantidad → REG-PROY-03
✔ detectado  [Administración] Un cliente ve el panel de administración → REG-ADM-01
✔ detectado  [Administración] El umbral de stock bajo del inventario pasa de 50 a 5 → REG-ADM-04
✔ detectado  [Administración] El tablero deja sin traducir una métrica → REG-ADM-05
✔ detectado  [Administración] La oferta se ignora y se cobra el precio normal → REG-ADM-02
✔ detectado  [Administración] El cambio de estado usa el número de pedido en vez del id interno → REG-ADM-03
✔ detectado  [Utilidades] Vuelve la regex de cantidades vulnerable a ReDoS → REG-QTY-05
✔ detectado  [Traducción] Una nota del backend deja de estar en el diccionario → REG-I18N-03
Resultado: 20/20 errores detectados por la suite. Código restaurado.
```

## Defectos localizados

Igual que en el backend, un defecto abierto se declara con `test.fails(...)`:
**se espera que falle** y la suite queda en verde mientras siga abierto. El día
que se corrija, el caso se pone rojo con «expected to fail, but passed»: es el
aviso de pasarlo a `test(...)` y tachar la fila.

| # | Defecto | Unidad | Caso que lo evidencia |
|---|---|---|---|
| F-1 | Las notas de pegante y boquilla vinculados nunca se traducen: el diccionario usa `"Pegante real vinculado"` como clave exacta y el backend emite `"Pegante real vinculado: 1 bulto por cada 4m²"` | `translateMaterialNote` | `REG-I18N-05` |
| F-2 | Los enlaces de categoría usan `?cat=` pero el catálogo solo lee `?category=`: el breadcrumb de la ficha, "Ver todo" de productos sugeridos y "Agregar material" del editor abren el catálogo sin filtrar | `catalogo/[id]/page.tsx`, `proyectos/[id]/page.tsx`, `MaterialsListEditor` | `ui-cat-15` |
| F-3 | El detalle de un pedido muestra el medio de pago crudo ("card", "cash"): el checkout envía `card`/`pse`/`cash`, el modal solo reconoce `tarjeta_credito`/`pse`/`contra_entrega`, y las claves `account.*_payment` no existen en el diccionario | `OrderDetailModal` | `ui-acc-08` |

## Infra

| Archivo | Rol |
|---|---|
| `vitest.config.mts` | `include` de `*.test.mts` y `*.test.tsx`, `setupFiles`, alias `@/` y de extensiones, cobertura v8 sobre `app/`. |
| `tests/setup.mts` | Matchers de jest-dom; reemplaza `next/navigation` y `next/link`; en jsdom agrega `matchMedia`/`scrollTo` y limpia DOM, `localStorage` y globales entre casos. |
| `tests/harness.mts` | `test(id, desc, fn)` → `it()` de Vitest, `test.fails` para defectos abiertos, `grab`/`grabSync` para capturar errores en el Act, re-export de `expect` / `vi`. Igual que el del backend. |
| `tests/helpers.mts` | Para las pruebas de lógica: `instalarNavegador()`, `instalarFetch()`, `tIdentidad` / `tDiccionario`. |
| `tests/ui/soporte.tsx` | `backendFalso()` (responde por "METODO /ruta", registra llamadas, `fallar()`, `crudo()`), `conSesion()`, `renderizar()` con los proveedores de la app, `es()` y los usuarios `CLIENTE` / `ADMIN`. |
| `tests/ui/navegacion.mts` | Router falso inspeccionable (`router.push`/`replace`) e `irA(ruta, params)`. |
| `scripts/regression-demo.mjs` | La demostración de la suite de regresión. |

Cada archivo `.test.tsx` declara `// @vitest-environment jsdom` en la primera
línea; los `.test.mts` corren en Node. Los archivos de lógica son `.mts` porque
el proyecto no declara `"type": "module"`.

`tests/**` está excluido de ESLint (`eslint.config.mjs`).
