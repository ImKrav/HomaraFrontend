# Refactorización del frontend guiada por las pruebas

Este documento presenta la versión **final** del frontend de Homara, corregida a
partir de los hallazgos de **todas** las suites (Vitest, Cypress E2E/API/
seguridad/interfaz/accesibilidad/componentes, Screenplay con Gherkin y
Lighthouse), y la compara con la versión **anterior** (commit `6fc7ae8`).

La contraparte del backend está en `HomaraBackend/docs/REFACTORIZACION.md`; los
defectos de API que Cypress encontró en el backend (DEF-03, 07, 08, 09, 10, 11,
21, 28 y DEF-SEG-*) se corrigieron allí.

## 1. Resumen: antes y después

<!-- RESUMEN -->

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
| DEF-26 (CLS) | El catálogo pintaba 8 esqueletos y luego 25 tarjetas: CLS 0,22 en móvil | 25 esqueletos (el tamaño de página) |
| DEF-SEG-FE-02 | JWT en `localStorage` | **Abierto** (ver §6) |

<!-- LIGHTHOUSE -->

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

<!-- RESULTADOS -->

## 6. Lo que no se cambió (y por qué)

- **DEF-SEG-FE-02 (JWT en `localStorage`):** pasar a una cookie `HttpOnly` cambia
  el contrato de autenticación de ambos repositorios (emisión y borrado de la
  cookie en el backend, protección CSRF, `api.ts`, `AuthContext`) y todas las
  suites E2E que inyectan el token. Es el siguiente paso recomendado; mientras
  tanto, ninguna prueba encontró un XSS (React escapa el contenido) y la CSP nueva
  bloquea `object`/`base`/`form-action` externos.
- **DEF-26 (TBT en móvil):** la causa es el peso del JavaScript cliente (todo el
  árbol es `"use client"`). Reducirlo exige reestructurar páginas en componentes
  de servidor; se corrigió el CLS, que sí tenía una causa puntual.
- **OBS-02 / OBS-06:** son mejoras de producto (búsqueda y paginación en el
  servidor, archivar productos), no defectos.
