# Refactorización del frontend guiada por las pruebas

Este documento presenta la versión **final** del frontend de Homara, corregida a
partir de los hallazgos de **todas** las suites (Vitest, Cypress E2E/API/
seguridad/interfaz/accesibilidad/componentes, Screenplay con Gherkin y
Lighthouse), y la compara con la versión **anterior** (commit `6fc7ae8`).

La contraparte del backend está en `HomaraBackend/docs/REFACTORIZACION.md`; los
defectos de API que Cypress encontró en el backend (DEF-03, 07, 08, 09, 10, 11,
21, 28 y DEF-SEG-*) se corrigieron allí.

## 1. Resumen: antes y después

| Indicador | Antes (`6fc7ae8`) | Después |
|---|---|---|
| Vitest (`npm test`) | 152 casos; **3 con `test.fails`** | **162 casos, 0 `test.fails`** |
| Demo de regresión por mutación | 20/20 | **24/24** |
| Cypress E2E (232 pruebas) | 232/232, pero **31 `DEF-*` fijaban el defecto observado** | **232/232 afirmando el comportamiento corregido** |
| Cypress componentes | 55/55 (3 `DEF-*` observados) | **55/55** corregidos |
| Screenplay (Gherkin) | 33 escenarios: 31 pasan, **2 `@fail`** (DEF-02, DEF-03) | **33/33**, sin `@fail` |
| axe-core WCAG 2.1 A/AA (14 páginas) | **127 nodos** en 3 reglas, **2 críticas** aceptadas en línea base | **0 violaciones**; línea base de críticas vacía |
| Lighthouse Accessibility (6 mediciones) | 90 – 95 | **100** en todas |
| Lighthouse Best Practices | 96 | **100** |
| CLS de `/catalogo` (escritorio / móvil) | 0,079 / 0,22 | **0 / 0** |
| CLS de `/` en escritorio | 0,261 | **0** |
| Defectos del frontend abiertos | 27 + 6 observaciones | **0** (DEF-SEG-FE-02 se cerró en una segunda iteración, §7) + 2 observaciones de producto |

Las cifras de Lighthouse son la mediana de 3 corridas de **ambas versiones en la
misma máquina** (ver §4); las de antes de Cypress, Vitest y Screenplay vienen de
las evidencias originales del equipo.

## 2. Funcionales

| ID | Antes | Después | Dónde |
|---|---|---|---|
| F-1 | Las notas "Pegante/Boquilla real vinculado…" nunca se traducían: el diccionario tenía como clave solo el prefijo y el backend agrega el rendimiento | Claves con el texto completo + patrón para "1 unidad de {peso}kg por cada {m²}m²" (claves nuevas `note_*_linked_weight`) | `lib/utils.ts`, `locales/*.json` |
| F-2 / DEF-02 | Los enlaces de categoría usaban `?cat=` y el catálogo solo lee `?category=` (breadcrumb, "Ver todo", "Agregar material" y **las tarjetas de categoría de la portada**) | `?category=` en los 4 sitios | `catalogo/[id]`, `proyectos/[id]`, `MaterialsListEditor`, `CategoryCard` |
| F-3 | El detalle del pedido mostraba el medio de pago crudo ("card"); el modal buscaba `tarjeta_credito` y claves inexistentes | Mapa `card/pse/cash` (y los nombres antiguos) → claves existentes `account.payment_*` | `OrderDetailModal.tsx` |
| DEF-01 / DEF-17 | El registro anunciaba y validaba "mínimo 6", el backend exige 8; los mensajes estaban escritos en duro en español | Mínimo 8 (misma regla que `registerSchema`) y mensajes en `locales/*.json` | `register/page.tsx` |
| DEF-03 (Screenplay) | Datos de envío con solo espacios creaban el pedido | Se valida con `trim()` y se envían recortados (el backend también los rechaza) | `checkout/page.tsx` |
| DEF-04 | El asistente enviaba un largo negativo y el error llegaba del backend | Validación "> 0" con mensaje propio antes de enviar | `proyectos/nuevo/page.tsx` |
| DEF-05 | Cualquier error al validar la sesión (red caída, navegación) cerraba la sesión | Solo un 401 la cierra (lo resuelve `api.ts`); ante error de red se conserva el token y se reintenta al volver la conexión | `context/AuthContext.tsx` |
| DEF-06 | Escribir en el buscador de `/admin/pedidos` lanzaba `TypeError` (`order.orderNumber` no existe) y la tabla desaparecía | Filtro sobre `id`, cliente, dirección y ciudad con encadenamiento opcional; el backend ahora envía la ciudad | `admin/pedidos/page.tsx` |
| DEF-27 | "Usar en Proyecto" → "Crear Primer Proyecto" ignoraba `?selectedProductId=` | El asistente lee el parámetro, ajusta el tipo de material al del producto y lo deja preseleccionado | `proyectos/nuevo/page.tsx` |
| DEF-29 | Si `GET /products` fallaba, se veía "0 productos encontrados" sin aviso | Aviso de error (`role="alert"`) con botón "Reintentar" | `catalogo/page.tsx` |
| DEF-30 | El stock negativo (envío diferido) se etiquetaba "Stock Bajo" y no salía en "Sin Stock" | Etiqueta "Stock negativo (pedidos en espera)" y entra en el filtro "Sin Stock" | `admin/inventario/page.tsx` |
| OBS-01 | Tras pagar se iba a `/proyectos` | Va al historial de pedidos (`/cuenta`) | `checkout/page.tsx` |
| OBS-03 | `t(clave) \|\| respaldo` nunca usaba el respaldo (`t` devuelve la clave) | `t(clave, respaldo)`: el respaldo es un argumento; se reemplazaron los 15 usos | `context/LanguageContext.tsx` y 8 pantallas |
| OBS-04 | "¡Reseña publicada con éxito!" desaparecía al instante | También se muestra como toast | `ProductReviews.tsx` |
| OBS-04 (Screenplay) | "Subtotal (1 productos)" | Singular/plural | `carrito/page.tsx`, `CategoryCard.tsx` |
| OBS-05 | Tras el login siempre se iba a `/cuenta` | Vuelve a `?redirect=` si es una ruta **interna** (`/x` sí; `//sitio`, `/\sitio` o URL absoluta no → sin redirección abierta) | `login/page.tsx` |
| RN-031 (texto) | "Envío gratis en compras **mayores a** $ 500.000" | "…**desde** $ 500.000" (coincide con el backend corregido) | `locales/*.json` |

## 3. Accesibilidad e interfaz

| ID | Criterio | Antes | Después |
|---|---|---|---|
| DEF-12 | WCAG 1.3.1 | `Input` sin `id` dejaba la etiqueta sin asociar (registro, perfil) | `useId()` genera un id si no se pasa uno; además `aria-invalid` con error |
| DEF-13 | 4.1.2 | Buscador del admin sin etiqueta y botón de limpiar anunciado como "X" | `aria-label` en el campo y "Limpiar búsqueda" (traducido) en el botón |
| DEF-14 | Visual | 7 íconos sin mapear dibujaban "?" o el nombre como texto | Mapeados, y se encontraron 6 más sin mapear (`AlertCircle`, `Check`, `MapPin`, `PieChart`, `ShoppingBag`, `TrendingDown`); los íconos son `aria-hidden` |
| DEF-15 | 3.1.1 | `<html lang>` quedaba en `es` con la interfaz en inglés | `LanguageProvider` actualiza `document.documentElement.lang` |
| DEF-16 | 4.1.2 | Botón "Menú" sin `aria-expanded`/`aria-controls` | Ambos atributos y `id="menu-movil"` |
| DEF-18 | 2.4.1 | Sin "Saltar al contenido" | Primer elemento enfocable de la app, hacia `<main id="contenido">` en los tres layouts |
| DEF-19 | 4.1.2 (axe *critical*) | `<select>` sin nombre en catálogo y admin | `<label htmlFor>` en catálogo; `aria-label` "Filtrar por…" en los filtros del admin. La línea base de violaciones críticas de axe quedó **vacía** |
| DEF-19 (nuevo) | 4.1.2 | La barra de búsqueda del catálogo tampoco tenía nombre (lo reveló A11Y-LBL-03 al exigir 0 campos sin etiqueta) | `aria-label` en `SearchBar` |
| DEF-20 | 4.1.2 | Estrellas de la reseña sin nombre ni estado | `role="radiogroup"` + `role="radio"`, `aria-checked` y "N estrellas" |
| DEF-22 | 1.4.3 | `--text-muted` #71717A: 4,4:1 en claro y 3,7:1 en oscuro | #5E5E66 en claro (≥ 5,06:1 en todas las superficies) y #A1A1AA en oscuro (≥ 5,8:1) |
| DEF-23 | 4.1.2 | Botón dentro de botón en el historial de `/cuenta` | Un solo botón, estirado sobre la tarjeta (se conserva el clic en cualquier parte) |
| DEF-24 | 4.1.2 | Barras del gráfico con `aria-label` en un `div` sin rol | `role="img"` |
| DEF-25 | 2.5.3 / 1.3.1 | El botón de tema se llamaba "Alternar tema" y mostraba "Claro"; saltos h1 → h3 | Nombre "Claro · Alternar tema"; títulos del pie y conteo de resultados como `h2` |

## 4. Seguridad y rendimiento

| ID | Antes | Después |
|---|---|---|
| DEF-SEG-FE-01 | `X-Powered-By: Next.js`, sin `X-Frame-Options` ni CSP (clickjacking) | `poweredByHeader: false`; `X-Frame-Options: DENY`, CSP `frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`, `nosniff` y `Referrer-Policy` (`next.config.ts`) |
| DEF-26 (CLS) | El HTML inicial de `/catalogo` es el *fallback* de `Suspense` (70vh): el pie quedaba a la vista y la grilla lo empujaba al cargar. CLS 0,22 en móvil | *Fallback* y contenido con al menos una pantalla de alto: el pie arranca fuera de la vista. CLS 0. (La primera hipótesis, igualar el número de esqueletos, se midió y **no** lo resolvía; se revirtió) |
| DEF-22 (tema) | El tema oscuro se aplicaba después de hidratar: la página se pintaba clara y transicionaba (parpadeo, CLS 0,26 en `/` y contraste insuficiente durante la transición). Además, `dark:` de Tailwind seguía al sistema y no al selector de tema de la app | Un script al inicio de `<body>` aplica el tema guardado antes de pintar; `@custom-variant dark` sigue a la clase `.dark` |
| DEF-SEG-FE-02 | JWT en `localStorage`, legible por cualquier script (un XSS robaría la sesión) | Cookie `homara_session` `HttpOnly; SameSite=Strict` emitida por el backend; el frontend nunca ve el token (ver §7) |

### Lighthouse antes / después (misma máquina, mediana de 3 corridas)

Ambas versiones se construyeron en producción y se midieron contra el mismo
backend con `LH_RONDAS=3` (nueva opción `LH_SALIDA` del script para no
sobrescribir las evidencias originales). Reportes completos en
[`pruebas/evidencias/lighthouse-comparacion/`](pruebas/evidencias/lighthouse-comparacion/).

| Página | Perfil | Perf. antes → después | Accesib. | Best Pr. | SEO | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | escritorio | 87 → **100** | 95 → **100** | 96 → **100** | 100 → 100 | 0,261 → **0** | 0 → 0 ms |
| `/catalogo` | escritorio | 99 → 99 | 90 → **100** | 96 → **100** | 100 → 100 | 0,079 → **0** | 0 → 0 ms |
| `/login` | escritorio | 100 → 100 | 94 → **100** | 96 → **100** | 100 → 100 | 0,024 → 0,024 | 0 → 0 ms |
| `/` | móvil | 99 → 97 | 95 → **100** | 96 → **100** | 100 → 100 | 0 → 0 | 80 → 100 ms |
| `/catalogo` | móvil | 88 → 86 | 90 → **100** | 96 → **100** | 100 → 100 | 0,22 → **0** | 50 → 140 ms |
| `/login` | móvil | 97 → 96 | 94 → **100** | 96 → **100** | 100 → 100 | 0,071 → 0,071 | 150 → 160 ms |

Lectura honesta: accesibilidad, buenas prácticas y estabilidad visual mejoran en
todas las páginas. En móvil, Performance queda igual o 1–2 puntos abajo: el LCP de
`/catalogo` pasó de 2,2 s a 4,0 s porque, al reservar la altura que elimina el
salto, el elemento más grande se pinta más tarde, y el TBT varía entre corridas
(es la métrica más sensible a la carga de la máquina). El cuello de botella de
fondo (DEF-26, JavaScript cliente) sigue abierto, ver §6.

## 5. Pruebas actualizadas

- **Vitest:** los 3 casos `test.fails` (F-1, F-2, F-3) pasaron a `test(...)`; los
  casos que fijaban textos o rutas viejas se actualizaron ("Mínimo 8", `/cuenta`
  tras pagar, estrellas como `radio`). Nueva suite `tests/regression/REG-DEF.test.tsx`
  (10 casos) y 4 mutaciones nuevas en la demo de regresión.
- **Cypress:** las pruebas `DEF-*` que fijaban el comportamiento **observado**
  del defecto ahora afirman el comportamiento **corregido** (p. ej. `DEF-SEG-01
  corregido` espera 401, `FLU-16` espera que el stock vuelva a 10, `A11Y-TEC-04`
  espera el enlace "Saltar al contenido"). La línea base de axe
  (`cypress/fixtures/a11y-linea-base.json`) quedó vacía.
- **Screenplay:** SP-24 (DEF-02) y SP-27 (DEF-03) dejaron de estar marcados
  `@fail`; SP-04 verifica "Mínimo 8 caracteres"; SP-28 termina en `/cuenta`.

### Resultados de la corrida final

| Suite | Resultado | Evidencia |
|---|---|---|
| Vitest | 162/162 | `npm test` |
| Demo de regresión | 24/24 errores detectados | `npm run test:regression:demo` |
| Cypress E2E | 232/232 (8 min 48 s) | [`pruebas/evidencias/cypress-despues/consola-e2e.txt`](pruebas/evidencias/cypress-despues/consola-e2e.txt), JUnit y `a11y-violaciones.json` (vacío) |
| Cypress componentes | 55/55 | [`pruebas/evidencias/cypress-despues/consola-componentes.txt`](pruebas/evidencias/cypress-despues/consola-componentes.txt) |
| Screenplay | 33/33 | `../e2e-screenplay/evidencias/consola-corrida-final.txt` |

Correr la suite completa contra el código corregido destapó **cuatro problemas
nuevos** que se corrigieron antes de cerrar: el filtro `?admin=true` dejó de
funcionar para el propio ADMIN (Express 5 recalcula `req.query`; corregido en el
backend con su prueba de regresión), la barra de búsqueda del catálogo sin nombre
accesible, el contraste del inicio en tema oscuro y un error de hidratación al
poner el script de tema en `<head>`.

## 6. Lo que no se cambió (y por qué)

- **DEF-26 (TBT y LCP en móvil):** la causa es el peso del JavaScript cliente (todo el
  árbol es `"use client"`). Reducirlo exige reestructurar páginas en componentes
  de servidor; se corrigió el CLS, que sí tenía una causa puntual.
- **OBS-02 / OBS-06:** son mejoras de producto (búsqueda y paginación en el
  servidor, archivar productos), no defectos.

## 7. Segunda iteración: DEF-SEG-FE-02, sesión en cookie `HttpOnly`

**Antes:** `AuthContext` guardaba el JWT en `localStorage` y `api.ts` lo leía para
mandar `Authorization: Bearer`. Cualquier script de la página (un XSS, una
dependencia comprometida) podía leerlo y usar la sesión desde otro equipo
durante 7 días.

**Después:** el backend emite el JWT en la cookie `homara_session`
(`HttpOnly; SameSite=Strict; Path=/`, `Secure` en producción) y el frontend
nunca lo toca.

| Pieza | Antes | Después |
|---|---|---|
| `app/lib/api.ts` | Leía `homara_token` y ponía `Authorization: Bearer`; en un 401 lo borraba | `credentials: "include"`; sin cabecera `Authorization`; en un 401 solo emite `auth:401` |
| `AuthContext` — login/registro | `localStorage.setItem("homara_token", token)` | Solo guarda el usuario en memoria; la cookie la pone el backend |
| `AuthContext` — validar sesión | Sin token no preguntaba; con token, `GET /users/me` | `GET /users/session`: 200 con el perfil o `null`, así un visitante no genera un 401 (ni un error en consola) en cada carga |
| `AuthContext` — logout | `localStorage.removeItem` | `await POST /users/logout` con `keepalive` (solo el servidor puede borrar una cookie `HttpOnly`) y después limpia el estado y va a `/login`; si la red falla, la interfaz igual se cierra |
| Token de versiones anteriores | — | Se borra `homara_token` de `localStorage` al iniciar la app |
| CSRF | No aplicaba | `SameSite=Strict` + CORS con lista de orígenes |

```ts
// ANTES — app/lib/api.ts
const token = localStorage.getItem("homara_token");
if (token) headers.set("Authorization", `Bearer ${token}`);
const response = await fetch(url, { ...options, headers });

// DESPUÉS
const response = await fetch(url, {
  credentials: "include", // envía la cookie también si NEXT_PUBLIC_API_URL apunta a otro puerto del mismo sitio
  ...options,
  headers,
});
```

Con la configuración por defecto (`NEXT_PUBLIC_API_URL=/api/v1`, proxy de
`next.config.ts`) la cookie es del mismo origen que la página. Si la API se sirve
en otro **sitio** (otro dominio registrable), `SameSite=Strict` impide enviarla:
hay que mantener el proxy o servir ambos bajo el mismo dominio.

**Pruebas:**

- **Vitest:** `REG-DEF-11` (el login no deja el JWT en `localStorage`, todas las
  peticiones van con `credentials: "include"` y sin `Authorization`);
  `api-hdr-04` ahora afirma eso mismo; los casos de login, registro y logout
  afirman la ausencia del token y la llamada a `/users/logout`. El backend falso
  responde `GET /users/session` (sin sesión por defecto). Demo de regresión con
  2 mutaciones nuevas (quitar `credentials`, volver a guardar el JWT).
- **Cypress:** `iniciarSesionConToken` pone la cookie con `cy.setCookie(…, { httpOnly: true })`
  y valida contra `/users/session`; las aserciones sobre `homara_token` pasaron a
  `cy.getCookie("homara_session")`. `DEF-SEG-FE-02 corregido` inicia sesión por la
  interfaz y verifica `Set-Cookie` con `HttpOnly` y `SameSite=Strict`, que
  `document.cookie` no la ve y que no hay ningún JWT en `localStorage`.
  `cy.api` ahora conserva la cookie del navegador: `cy.request` guarda las
  cookies de la respuesta, y crear un usuario por API iniciaba sesión en el
  navegador sin querer (lo destapó `SEG-UI-05` en la primera corrida).
- **Logout que no esperaba al servidor:** la segunda corrida completa de Cypress
  falló una vez en `FLU-01` (la cookie seguía tras "Cerrar sesión"). `logout()`
  lanzaba la petición sin esperarla; si la página navegaba o se cerraba antes de
  la respuesta, la sesión seguía viva en el servidor. Ahora espera la respuesta
  (con `keepalive`) antes de navegar, y `/cuenta` dejó de hacer su propio
  `router.push("/login")`, que con el logout asíncrono habría devuelto al usuario
  a `/cuenta`.
- **Screenplay:** `SesionDelNavegador` pregunta por la cookie `HttpOnly` y
  `OlvidarSesion` borra las cookies.

| Suite | Resultado |
|---|---|
| Vitest | **163/163** (+1) |
| Demo de regresión | **26/26** (+2) |
| Cypress E2E | 1.ª corrida completa 230/232 y 2.ª 231/232 (causas en las pruebas y en el logout, corregidas arriba); specs de sesión repetidos 2 veces: 36/36. Corrida final: en curso |
| Screenplay | **33/33** ([`consola-corrida-final.txt`](../e2e-screenplay/evidencias/consola-corrida-final.txt)) |
