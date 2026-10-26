# Pruebas Cypress del frontend de Homara

Pruebas de **caja negra contra la aplicación desplegada** (frontend Next.js en
`:3000`, que hace de proxy de `/api/v1/*`, y backend Express en `:5000`) con
Cypress 14. Complementan las pruebas Vitest de `tests/` sin modificarlas.

| Tipo de prueba | Carpeta | Specs | Pruebas | Qué verifica |
|---|---|---|---|---|
| **E2E de flujo completo** | [`cypress/e2e/flujos`](../../cypress/e2e/flujos) | 5 | 21 | Viajes de punta a punta por la interfaz que encadenan varias funcionalidades: compras (perfil, varios productos, inglés y tema oscuro, móvil, reseña), proyectos (planificar y comprar, ciclo de vida, asignar productos), administración ↔ clientes (catálogo, estados del pedido, agotados, cancelación, dashboard) y recuperación de errores (pago fallido, sesión vencida, registro con errores, catálogo caído). Ver [Flujos](#flujos-e2e-de-punta-a-punta) |
| **Regresión E2E** por funcionalidad | [`cypress/e2e/regresion`](../../cypress/e2e/regresion) | 8 | 79 | Autenticación, catálogo, carrito, checkout y pedidos, proyectos (estimador), perfil, administración, reseñas y reserva de stock |
| **API** (contrato y reglas) | [`cypress/e2e/api`](../../cypress/e2e/api) | 5 | 45 | Contrato `{ success, data }` / `{ success:false, error }`, códigos de estado, validaciones, reglas de envío, numeración de pedidos e inventario |
| **Seguridad** | [`cypress/e2e/seguridad`](../../cypress/e2e/seguridad) | 2 | 33 | JWT (firma alterada, `alg: none`, vencido, esquema), autorización por rol y propietario (IDOR), asignación masiva de rol, inyección SQL/NoSQL, límite de cuerpo, CORS, XSS almacenado y reflejado, redirección abierta, sesión tras logout, cabeceras |
| **Interfaz (UI)** | [`cypress/e2e/interfaz`](../../cypress/e2e/interfaz) | 2 | 32 | Responsive en móvil/tablet/escritorio sin scroll horizontal, grilla del catálogo, menú móvil, idioma ES/EN y tema claro/oscuro persistentes |
| **Accesibilidad** | [`cypress/e2e/accesibilidad`](../../cypress/e2e/accesibilidad) | 2 | 22 | axe-core WCAG 2.1 A/AA en 14 páginas (con línea base de críticas aceptadas), orden de tabulación, foco visible, uso solo con teclado y etiquetas de formularios |
| **Componentes** aislados | [`cypress/component`](../../cypress/component) | 3 | 55 | Props, eventos y estados de Button, Input, Badge, Card, SearchInput, Pagination, Toast, AuthCard, SearchBar, ProductCard, CartItem, OrderSummaryBreakdown |
| **Total** | | **27** | **287** | |

Cada funcionalidad tiene escenarios **exitosos** (camino feliz), **alternativos**
(otras rutas válidas: filtros, orden, idioma, edición, cancelación, límites) y de
**error / negativos** (validaciones, permisos, datos inexistentes, ataques). Las
pruebas `DEF-*` fijan el comportamiento **observado** de un defecto abierto. El
tipo de cada prueba está en la [matriz](#matriz-de-trazabilidad).

| Tipo de escenario | E2E (232) | Componentes (55) |
|---|---|---|
| Éxito | 71 | 37 |
| Alternativo | 58 | 12 |
| Error / negativo | 72 | 3 |
| Defecto (comportamiento observado) | 31 | 3 |

## Flujos E2E de punta a punta

Cada flujo recorre un viaje completo por la interfaz, como lo haría una persona,
y verifica en cada etapa la pantalla, la petición enviada y el estado del backend.
Los datos que el flujo necesita de antemano (usuarios y productos propios) se
crean por API y los productos se eliminan al final. Cada etapa deja una captura
con nombre en el reporte HTML.

| Flujo | Spec | Recorrido | Tipo |
|---|---|---|---|
| FLU-01 | [flujos-completos](../../cypress/e2e/flujos/flujos-completos.cy.ts) | Visitante se **registra** → busca → ficha → carrito (+1) → checkout → pedido → historial en la cuenta → cierra sesión | Éxito |
| FLU-02 | [flujos-completos](../../cypress/e2e/flujos/flujos-completos.cy.ts) | Admin revisa inventario → cliente compra → admin marca **Enviado** → baja el stock → cliente ve el estado | Éxito |
| FLU-03 | [cliente](../../cypress/e2e/flujos/cliente.cy.ts) | Inicio → acceso a la categoría Pisos → orden por precio → ficha → agregar **sin sesión** (401 → login) → inicia sesión → vuelve y agrega | Alternativo |
| FLU-04 | [cliente](../../cypress/e2e/flujos/cliente.cy.ts) | Completa el **perfil** → compra → el checkout llega **precargado** con esos datos → paga en efectivo → el detalle del pedido muestra la dirección | Éxito |
| FLU-05 | [cliente](../../cypress/e2e/flujos/cliente.cy.ts) | Dos productos (≥ $500.000) → **envío gratis** → elimina el caro → vuelve a cobrar $25.000 → sube la cantidad → paga con el total correcto | Alternativo |
| FLU-06 | [cliente](../../cypress/e2e/flujos/cliente.cy.ts) | Cambia a **inglés** y **tema oscuro** → login → compra completa en inglés → las preferencias persisten | Alternativo |
| FLU-07 | [cliente](../../cypress/e2e/flujos/cliente.cy.ts) | Compra completa en **celular** (375 px) usando solo el menú móvil, sin scroll horizontal | Alternativo |
| FLU-08 | [cliente](../../cypress/e2e/flujos/cliente.cy.ts) | Compra → **califica** con 5 estrellas → cierra sesión → un visitante ve la reseña y el promedio | Éxito |
| FLU-09 | [proyectos](../../cypress/e2e/flujos/proyectos.cy.ts) | Proyecto de piso 4 × 3 m → **compra todos sus materiales** desde el proyecto → checkout → marca el proyecto **Completado** → estadísticas | Éxito |
| FLU-10 | [proyectos](../../cypress/e2e/flujos/proyectos.cy.ts) | Paredes con una puerta (33 m²) → **pausa** → **edita** nombre y largo (recalcula 38 m²) → **elimina** | Alternativo |
| FLU-11 | [proyectos](../../cypress/e2e/flujos/proyectos.cy.ts) | Crea un proyecto → desde la ficha de una cerámica **"Usar en Proyecto"** → la compra desde el proyecto | Éxito |
| FLU-12 | [proyectos](../../cypress/e2e/flujos/proyectos.cy.ts) | Visitante → "Usar en Proyecto" pide login → sin proyectos → **"Crear Primer Proyecto"** → el asistente no preselecciona el producto (**DEF-27**) | Defecto |
| FLU-13 | [admin](../../cypress/e2e/flujos/admin.cy.ts) | Admin **publica** un producto → el cliente lo encuentra → admin le **cambia el precio** → el cliente ve el nuevo → admin lo **retira** → ya no aparece | Éxito |
| FLU-14 | [admin](../../cypress/e2e/flujos/admin.cy.ts) | Un pedido pasa por **Pendiente → Procesando → Enviado → Entregado** y el cliente ve cada estado en su cuenta | Éxito |
| FLU-15 | [admin](../../cypress/e2e/flujos/admin.cy.ts) | Un cliente compra todo el stock → el admin lo ve en **"Sin Stock"** → otro cliente compra en **envío diferido** (backorder) → el stock −1 aparece como "Stock Bajo" (**DEF-30**) | Defecto |
| FLU-16 | [admin](../../cypress/e2e/flujos/admin.cy.ts) | El admin **cancela** un pedido → el cliente lo ve cancelado → el stock no se devuelve (**DEF-28**) | Defecto |
| FLU-21 | [admin](../../cypress/e2e/flujos/admin.cy.ts) | El **dashboard** suma el pedido nuevo como activo y, al entregarlo, como venta del mes | Éxito |
| FLU-17 | [errores](../../cypress/e2e/flujos/errores.cy.ts) | El pago recibe un **503** → aviso, el carrito y los datos se conservan → el **reintento** crea el pedido | Error / recuperación |
| FLU-18 | [errores](../../cypress/e2e/flujos/errores.cy.ts) | La **sesión vence** con productos en el carrito → vuelve a entrar → el carrito sigue ahí → compra | Error / recuperación |
| FLU-19 | [errores](../../cypress/e2e/flujos/errores.cy.ts) | Registro con clave corta, claves distintas y **correo duplicado** → corrige → se registra → crea su primer proyecto | Error / recuperación |
| FLU-20 | [errores](../../cypress/e2e/flujos/errores.cy.ts) | El **catálogo cae** (500) y se muestra vacío sin aviso (**DEF-29**) → recarga → se recupera → agrega al carrito | Defecto |

## Resultados

Stack local: backend `npm start` (PostgreSQL 16 con la semilla del proyecto,
`NODE_ENV=production`, `CORS_ORIGINS=http://localhost:3000`) y frontend
`next build && next start` con `INTERNAL_API_URL=http://localhost:5000`. Navegador
Electron 130 (headless), Cypress 14.5.4, Node 22.

| Suite | Pruebas | Corrida 1 | Corrida 2 | Evidencia |
|---|---|---|---|---|
| E2E (flujos, regresión, API, seguridad, interfaz, accesibilidad) | 232 | 232/232 ✅ (8 min 39 s) | 232/232 ✅ (8 min 39 s) | [reporte HTML](evidencias/cypress/reporte-e2e.html) · [consola 1](evidencias/cypress/consola-e2e-run1.txt) · [consola 2](evidencias/cypress/consola-e2e-run2.txt) · [JUnit](evidencias/cypress/junit-e2e/) · [violaciones axe](evidencias/cypress/a11y-violaciones.json) |
| Componentes | 55 | 55/55 ✅ (6 s) | — | [consola](evidencias/cypress/consola-componentes.txt) · [JUnit](evidencias/cypress/junit-componentes/) |

Dos corridas completas seguidas, sin reintentos (`retries: 0`), dan el mismo
resultado. Antes de ellas, una corrida previa falló en 2 pruebas que se
corrigieron en su causa, no con reintentos:

- `REG-RES-02` verificaba el mensaje "¡Reseña publicada con éxito!", que solo
  existe mientras `fetchReviews()` recarga la lista y luego se reemplaza por
  "✓ Producto Calificado" (OBS-04). Ahora verifica ese estado final estable.
- `SEG-UI-08` navegaba con dos `cy.visit` seguidos; la recarga abortaba
  `/users/me` en vuelo y disparaba DEF-05 (cierre de sesión por error de red).
  Ahora navega dentro de la app y repite 3/3 en verde.

Al sumar los flujos FLU-03…FLU-21 aparecieron dos fallos más, también corregidos en su causa:

- `API-ADM-02` suponía que ningún producto tiene stock negativo. Las compras en
  envío diferido lo dejan en −1, y el backend lo modela a propósito
  (`stock_negativo`, `negativeStockCount`); la prueba ahora verifica ese modelo.
- `FLU-02` buscaba el producto nuevo en la primera página del inventario (25
  filas). Como los productos con pedidos no se pueden borrar (OBS-06), quedó en
  otra página; ahora filtra por nombre.

### Reporte HTML de evidencias

[`evidencias/cypress/reporte-e2e.html`](evidencias/cypress/reporte-e2e.html) es
un único archivo (abrir en el navegador tras descargarlo) con las 232 pruebas
agrupadas por spec, su duración y:

- una **captura de pantalla del estado final** de cada prueba con interfaz (y
  capturas por etapa en los flujos `FLU-*`);
- para las pruebas de API y seguridad, **cada petición** con método, ruta, código
  de respuesta y cuerpo (recortado a 1500 caracteres);
- la captura del momento del fallo cuando una prueba falla.

## Cómo ejecutar

Requisitos: Node 22+, `npm install` (descarga Cypress 14) y el stack corriendo
(`docker compose up -d` en cada repositorio, o `npm start` en ambos). Usuarios
sembrados: `admin@homara.co` (ADMIN) y `juan@email.com` (CUSTOMER).

| Script | Qué corre |
|---|---|
| `npm run test:cypress` | Todo: E2E + componentes |
| `npm run cy:run` | Todas las specs E2E (flujos, regresión, API, seguridad, interfaz, accesibilidad) |
| `npm run test:flujos` | Flujos de punta a punta |
| `npm run test:e2e` (`:chrome`, `:edge`) | Regresión por funcionalidad |
| `npm run test:api` | API |
| `npm run test:seguridad` | Seguridad (API + interfaz) |
| `npm run test:interfaz` | Responsive, menú móvil, idioma y tema |
| `npm run test:a11y` | axe-core, teclado y etiquetas |
| `npm run test:component` | Componentes aislados |
| `npm run cy:open` | Runner interactivo |

Cada corrida deja en `cypress/reports/index.html` el reporte HTML, en
`cypress/results/` los JUnit y `a11y-violaciones.json`, y en
`cypress/screenshots/` las capturas (todo ignorado por git; lo curado se copia a
`docs/pruebas/evidencias/cypress/`). Para no tomar capturas por prueba:
`npx cypress run --env evidencias=false`. Para grabar video:
`npx cypress run --config video=true`.

> El caso `DEF-SEG-01` firma un token con el secreto JWT por defecto del backend
> (`env.jwtSecretoPorDefecto` en `cypress.config.ts`). Contra un backend con otro
> `JWT_SECRET` (lo correcto en producción) ese caso falla, y es la señal de que el
> defecto está corregido.

## Diseño de las pruebas

- **Datos aislados**: cada prueba crea su propio usuario CUSTOMER por API (correo
  único `cy-<flujo>-<marca de tiempo>@pruebas.homara.co`, contraseña generada en
  la ejecución) y, cuando necesita stock o reseñas controlados, su propio producto
  como ADMIN, que borra al final. No se modifica ningún dato sembrado salvo el
  stock de productos con 50+ unidades que compran los flujos.
- **Sesión**: `cy.session` con login real por la interfaz (usuarios sembrados) o
  inyectando el token emitido por el backend (usuarios de la prueba).
- **Sincronización**: `cy.intercept` + `cy.wait('@alias')` y aserciones
  reintentables; nunca `cy.wait(ms)`.
- **Aserciones**: sobre la interfaz (textos de `app/lib/locales/es.json`, URL,
  `localStorage`), sobre la petición enviada (cuerpo) y sobre la respuesta y el
  estado del backend después de la acción.
- **Productos con pedidos**: el backend no permite borrarlos (OBS-06), así que
  los productos propios que un flujo compra quedan en la base con el nombre
  `Producto Cypress <marca de tiempo>`. Ninguna prueba depende de que no existan.
- **Seguridad**: los `SEG-*` afirman el control seguro y deben pasar; los
  `DEF-SEG-*` reproducen las vulnerabilidades abiertas (sus ids coinciden con los
  de `HomaraBackend/docs/pruebas/SEGURIDAD.md`).
- **Defectos**: una prueba con `DEF-xx` en el nombre pasa mientras el defecto
  exista y fallará cuando se corrija, avisando que hay que actualizarla al
  comportamiento esperado (equivalente al `test.fails` de Vitest).

## Defectos encontrados

Severidad: **Crítica** (seguridad o datos de terceros), **Alta** (rompe una
funcionalidad o expone datos), **Media** (funciona con errores visibles o
incumple una regla), **Baja** (cosmético o menor).

### Funcionales y de API

| ID | Severidad | Componente | Descripción (observado) | Esperado | Prueba(s) | Recomendación |
|---|---|---|---|---|---|---|
| DEF-01 | Media | Frontend `/register` | El formulario valida y anuncia "mínimo 6 caracteres", pero el backend exige 8: claves de 6-7 pasan la validación del cliente y el backend responde 400 | Misma regla en cliente y servidor | REG-AUT-04, API-USR-05 | Subir la validación y el placeholder a 8 caracteres (o leer la regla de un único origen) |
| DEF-02 | Baja | Frontend `/catalogo/[id]` | El breadcrumb de categoría enlaza a `/catalogo?cat=<slug>`, pero el catálogo lee `?category=`: se muestra el catálogo completo | Catálogo filtrado por la categoría | REG-CAT-13 (y `ui-cat-15` en Vitest) | Usar `?category=` en el enlace |
| DEF-03 | Media | Backend `GET /cart` | Un carrito vacío de un usuario autenticado devuelve `shipping: 25000`, `total: 25000`; el checkout muestra "Pagar $ 25.000" sin productos | Envío 0 con carrito vacío | API-CAR-06, REG-CHK-06 | Calcular envío solo si hay ítems |
| DEF-04 | Baja | Frontend `/proyectos/nuevo` | No valida dimensiones positivas: envía largo negativo y el error llega del backend ("Longitud debe ser positiva") | Validación en el cliente antes de enviar | REG-PRY-04 | Agregar `min` y validación > 0 en `validateProjectForm` |
| DEF-05 | Media | Frontend `AuthContext.refreshUser` | Cualquier error al validar la sesión (red caída, petición abortada al navegar) ejecuta `logout()` y borra el token, no solo un 401 | Cerrar sesión solo ante 401; ante error de red conservar el token y reintentar | REG-AUT-16 | Distinguir `status === 401` de errores de red en el `catch` |
| DEF-06 | Alta | Frontend `/admin/pedidos` | Escribir en el buscador lanza `TypeError` (el filtro usa `order.orderNumber.toLowerCase()` y el listado no trae `orderNumber`); la tabla desaparece | Filtrar pedidos por número, cliente o ciudad | REG-ADM-07 | Usar `order.id` o encadenamiento opcional (`order.orderNumber?.`) en el filtro |
| DEF-07 | Crítica | Backend `PUT /users/me` | La respuesta incluye el campo `password` con el hash bcrypt | Nunca exponer el hash | API-USR-09 | Omitir `password` en el `select`/serializador de la respuesta |
| DEF-08 | Baja | Backend `PUT /users/me` | Acepta `firstName` vacío (200); solo el frontend lo impide | Validación 400 en el servidor | API-USR-10 | Reutilizar el esquema de registro (nombre no vacío) |
| DEF-09 | Baja | Backend `GET /cart` | Los ítems del carrito traen `category: "Sin Categoría"` y `categorySlug: "sin-categoria"`, aunque el producto sí tiene categoría | Misma categoría que en `/products` | API-CAR-07 | Incluir la relación `category` al consultar los ítems |
| DEF-10 | Crítica | Backend `/orders` | Un CUSTOMER obtiene **todos** los pedidos de otros clientes con `GET /orders?admin=true` y el detalle de un pedido ajeno con `GET /orders/:numero` (incluye dirección de envío) | 403/404 para pedidos ajenos | API-PED-03, API-PED-05 | Ignorar `admin=true` si el rol no es ADMIN y validar propiedad en el detalle |
| DEF-11 | Alta | Backend `GET /projects/:id` | Un usuario lee el proyecto de otro (200), aunque `PUT`/`DELETE` sí responden 403 | 403/404 | API-PRY-06 | Aplicar la misma verificación de propiedad del `PUT` al `GET` |
| DEF-21 | Media | Backend `GET /cart` + `CartItem` | La API no envía `updatedAt` en los ítems, por lo que el contador "Stock reservado por: mm:ss" (15 min) nunca se muestra | Mostrar la cuenta regresiva de la reserva | REG-STK-03 (el componente sí funciona: CMP-CIT-04/05) | Incluir `updatedAt` del ítem en la respuesta del carrito |
| OBS-01 | Observación | Frontend `/checkout` | Tras pagar, la app redirige a `/proyectos` y no al historial de pedidos | Llevar a `/cuenta` (pedidos) o a una confirmación | REG-CHK-04 | Redirigir a la confirmación/historial |
| OBS-02 | Observación | Backend `GET /products` | Ignora `?search=` y `?limit=`; el frontend filtra y pagina en el cliente (y el admin pide `limit=100`) | — | API-CAT-03 | Documentarlo o implementarlo para catálogos grandes |
| OBS-03 | Observación | Frontend (`t(...) \|\| fallback`) | `t()` devuelve la clave si no existe, por lo que los `\|\| product.category` nunca se aplican: una categoría nueva sin traducción mostraría `categories.slug` | Mostrar el nombre de la categoría | revisión de código | Comparar `t(clave) !== clave` antes de usar el respaldo |
| DEF-27 | Media | Frontend `/proyectos/nuevo` | "Usar en Proyecto" → "Crear Primer Proyecto" abre `/proyectos/nuevo?selectedProductId=<id>`, pero el asistente no lee ese parámetro: guarda el primer producto de la lista del material, no el elegido | El proyecto se crea con el producto de la ficha | FLU-12 | Leer `selectedProductId` de `useSearchParams` como valor inicial |
| DEF-28 | Alta | Backend `PUT /orders/:id/status` | Cancelar un pedido no devuelve al inventario las unidades descontadas (10 → 7 → sigue en 7) | El stock vuelve a 10 al cancelar | FLU-16 | Reponer el stock en la misma transacción que pasa el pedido a `CANCELADO` |
| DEF-29 | Media | Frontend `/catalogo` | Si `GET /products` falla (500), el catálogo muestra "0 productos técnicos encontrados" sin ningún aviso ni opción de reintentar | Mensaje de error y botón "Reintentar" | FLU-20 | Guardar el error en el estado y mostrarlo en lugar del estado vacío |
| DEF-30 | Media | Frontend `/admin/inventario` | Una compra en envío diferido deja el stock en −1 (el backend lo marca `stock_negativo` y lo cuenta en `negativeStockCount`), pero la tabla del admin lo etiqueta "Stock Bajo" y no aparece en el filtro "Sin Stock" | Etiqueta y filtro propios para stock negativo, o tratarlo como "Sin Stock" | FLU-15 | Contemplar `stockQuantity < 0` en `getStockInfo` y en los filtros |
| OBS-06 | Observación | Backend `DELETE /products/:id` | Un producto con pedidos no se puede eliminar (400 "Error de integridad de datos"): `OrderItem` lo referencia sin cascada. Es correcto para conservar el historial, pero no hay forma de retirarlo del catálogo; los productos de prueba que se compran quedan publicados | Poder despublicar (archivar) un producto sin borrarlo | FLU-01, FLU-02, FLU-04…FLU-21 | Campo `active` y filtro en el catálogo |
| OBS-05 | Observación | Frontend `/login` | Tras iniciar sesión siempre se va a `/cuenta`: se pierde la página desde la que se pidió el login (ficha, checkout) | Volver a la página de origen (validando que sea una ruta interna) | FLU-03, FLU-12, SEG-UI-05 | Leer `?redirect=` y aceptar solo rutas que empiecen con `/` |
| OBS-04 | Observación | Frontend `ProductReviews` | "¡Reseña publicada con éxito!" desaparece en cuanto se recarga la lista de reseñas (se reemplaza por "✓ Producto Calificado"): el usuario casi no lo ve | Confirmación visible unos segundos | REG-RES-02 | Mostrar la confirmación con un toast o mantenerla junto a la insignia |

### Seguridad

| ID | Severidad | Componente | Descripción (observado) | Prueba | Recomendación |
|---|---|---|---|---|---|
| DEF-SEG-01 | Crítica | Backend JWT | Un token de ADMIN firmado a mano con el secreto por defecto (público en `.env.example`) es aceptado: `GET /admin/metrics` → 200 | DEF-SEG-01 | `JWT_SECRET` obligatorio por entorno, sin valor por defecto; rotar el secreto |
| DEF-SEG-03/04/05 | Alta | Backend `/orders`, `/projects`, `/cart` | Sin token, `?userId=<ajeno>` devuelve pedidos, proyectos y carrito de otro usuario | DEF-SEG-03/04/05 | `requireAuth` e ignorar `userId` del query; derivarlo del token |
| DEF-SEG-06 | Alta | Backend `GET /orders/:numero` | Sin token entrega el pedido con la dirección de envío del cliente | DEF-SEG-06 (y API-PED-05 con token ajeno) | `requireAuth` y verificación de propietario |
| DEF-SEG-08 | Alta | Backend `GET /users/:id` | Cualquier usuario autenticado lee el teléfono de otro | DEF-SEG-08 | Solo el propio usuario o un ADMIN |
| DEF-SEG-09 | Crítica | Backend `PUT /users/:id` | La respuesta incluye el hash bcrypt de la contraseña (mismo origen que DEF-07) | DEF-SEG-09, API-USR-09 | Proyectar la salida sin `password` |
| DEF-SEG-10 | Media | Backend | Sin `X-Content-Type-Options` ni `X-Frame-Options` | DEF-SEG-10 | `helmet()` |
| DEF-SEG-11 | Media | Backend `POST /users/login` | 20 intentos fallidos seguidos, ninguno bloqueado (sin 429) | DEF-SEG-11 | `express-rate-limit` en el login |
| DEF-SEG-FE-01 | Baja | Frontend (Next.js) | Responde `X-Powered-By: Next.js` y no envía `X-Frame-Options` ni CSP (la app puede embeberse en un iframe: clickjacking) | DEF-SEG-FE-01 | `poweredByHeader: false` y `headers()` con `X-Frame-Options: DENY` / CSP `frame-ancestors 'none'` en `next.config.ts` |
| DEF-SEG-FE-02 | Media | Frontend `AuthContext` | La sesión (JWT) se guarda en `localStorage`, legible por cualquier script: un XSS futuro robaría la sesión | DEF-SEG-FE-02 | Cookie `HttpOnly; Secure; SameSite` emitida por el backend |

Controles verificados como **correctos**: firma y vencimiento del JWT,
rechazo de `alg: none`, rol forzado a CUSTOMER en el registro y en la edición
del perfil, edición de perfil ajeno (403), ítems de carrito ajenos (403),
CRUD de productos solo ADMIN, inyección SQL/NoSQL rechazada por validación,
límite de 100 KB (413), CORS con lista blanca, sin `X-Powered-By` en el backend,
XSS almacenado y reflejado neutralizado por React en reseñas, proyectos, nombre
de usuario y búsqueda, `?redirect=` externo ignorado, token fuera de la URL y del
DOM, contraseñas enmascaradas, rutas privadas tras cerrar sesión y token falso
con rol ADMIN descartado.

### Interfaz y accesibilidad

| ID | Severidad | Criterio | Descripción (observado) | Prueba(s) | Recomendación |
|---|---|---|---|---|---|
| DEF-12 | Media | WCAG 1.3.1 / 3.3.2 | `/register` y el modal "Editar Perfil" usan `Input` sin `id`: el `<label>` no queda asociado (clic en la etiqueta no enfoca el campo; lectores de pantalla dependen del placeholder) | A11Y-LBL-02, CMP-INP-05 | Pasar `id` a cada `Input` (o generar uno con `useId()` dentro del componente) |
| DEF-13 | Baja | WCAG 4.1.2 | `SearchInput` (admin) no tiene etiqueta y su botón de limpiar solo se anuncia como "X" | CMP-SRC-03 | `aria-label` en el input y `aria-label="Limpiar búsqueda"` en el botón |
| DEF-14 | Baja | Visual | `LucideIcon` no mapea `ChevronLeft`, `ChevronRight`, `X`, `Scale`, `Info`, `DoorOpen`, `Tv`: se dibuja el ícono de ayuda (?) (paginación, pestaña Precisión) o el nombre como texto ("X" en el buscador, "Info", "Tv" en el estimador) | CMP-PAG-06, CMP-SRC-03 | Agregar los íconos al mapa |
| DEF-15 | Media | WCAG 3.1.1 | Con el idioma en inglés, `<html lang>` sigue en `es` | INT-IDI-04 | Actualizar `document.documentElement.lang` en `LanguageProvider` |
| DEF-16 | Baja | WCAG 4.1.2 | El botón "Menú" móvil no expone `aria-expanded` ni `aria-controls` | INT-MOV-03 | Agregar ambos atributos |
| DEF-17 | Baja | i18n | "Las contraseñas no coinciden." y "La contraseña debe tener al menos 6 caracteres." están escritos en duro y no se traducen | INT-IDI-05 | Moverlos a `locales/*.json` |
| DEF-18 | Baja | WCAG 2.4.1 | No hay enlace "Saltar al contenido": un usuario de teclado debe recorrer toda la navegación (8 Tab hasta el login) | A11Y-TEC-01/04 | Enlace oculto visualmente al inicio del `<body>` hacia `<main id>` |
| DEF-19 | Alta | WCAG 4.1.2 (axe *critical*) | `<select>` de calificación/orden del catálogo y filtros de `/admin/productos` sin nombre accesible | A11Y-AXE catalogo/admin-productos, A11Y-LBL-03 | `<label htmlFor>` o `aria-label` en cada select |
| DEF-20 | Media | WCAG 4.1.2 | Los 5 botones de estrellas de la reseña no tienen nombre accesible ni estado (`aria-pressed`) | REG-RES-03 | `aria-label="N estrellas"` y grupo con `role="radiogroup"` |
| DEF-22 | Media | WCAG 1.4.3 | Contraste insuficiente: etiquetas de 10 px en `text-muted` del pie (todas las páginas) y textos secundarios en tema oscuro (56 nodos en el inicio) | A11Y-AXE (todas) | Oscurecer `--text-muted` en claro (p. ej. `#52525B`) y aclarar `zinc-400/700` en oscuro; evitar 10 px |
| DEF-23 | Media | WCAG 4.1.2 | Controles interactivos anidados en el historial de `/cuenta` (botón dentro de botón) | A11Y-AXE cuenta | Usar un `div` clicable con un solo botón, o quitar el botón interno |
| DEF-24 | Baja | WCAG 4.1.2 | Barras del gráfico del dashboard con `aria-label` en `div` sin rol | A11Y-AXE admin-dashboard | `role="img"` en cada barra o tabla de datos alternativa |
| DEF-25 | Baja | WCAG 2.5.3 / 1.3.1 | Lighthouse: el botón de tema tiene `aria-label="Alternar tema"` pero muestra "Claro/Oscuro" (*label-content-name-mismatch*); salto de encabezados h1 → h3 en catálogo y login (*heading-order*) | Lighthouse | Incluir el texto visible en el nombre accesible; respetar la jerarquía de encabezados |

DEF-26 (rendimiento móvil) está en [RENDIMIENTO-FRONTEND.md](RENDIMIENTO-FRONTEND.md).

## Matriz de trazabilidad

Generada a partir de los JUnit de las dos corridas
([`junit-e2e/`](evidencias/cypress/junit-e2e/)). ESC = escenario del plan del equipo.

### E2E (flujos, regresión, API, seguridad, interfaz y accesibilidad)

| Prueba | ESC | Escenario | Tipo | Corrida 1 | Corrida 2 |
|---|---|---|---|---|---|
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | admin-dashboard (/admin) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | admin-productos (/admin/productos) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | carrito-invitado (/carrito) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | catalogo (/catalogo) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | checkout (/checkout) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | cuenta (/cuenta) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | detalle-producto (/catalogo/:primero) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | inicio (/) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | inicio-oscuro (/) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | login (/login) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | login-oscuro (/login) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | proyecto-nuevo (/proyectos/nuevo) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | proyectos (/proyectos) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | registro (/register) no agrega violaciones críticas nuevas | Éxito | ✅ | ✅ |
| [A11Y-LBL-01](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | /login: todos los campos tienen etiqueta asociada | Éxito | ✅ | ✅ |
| [A11Y-LBL-02](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | DEF-12: /register tiene campos SIN etiqueta asociada (labels sin for / inputs sin id) | Defecto (observado) | ✅ | ✅ |
| [A11Y-LBL-03](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | DEF-19: en /catalogo los selects de calificación y orden no tienen etiqueta | Defecto (observado) | ✅ | ✅ |
| [A11Y-LBL-04](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | /checkout: los campos de contacto y envío están etiquetados | Éxito | ✅ | ✅ |
| [A11Y-TEC-01](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | con Tab se llega al formulario de login (correo → contraseña) en orden lógico | Éxito | ✅ | ✅ |
| [A11Y-TEC-02](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | el campo enfocado tiene un indicador de foco visible distinto al estado normal | Éxito | ✅ | ✅ |
| [A11Y-TEC-03](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | el login se completa solo con teclado (Enter envía el formulario) | Éxito | ✅ | ✅ |
| [A11Y-TEC-04](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | DEF-18: no existe un enlace 'Saltar al contenido' como primer elemento enfocable | Defecto (observado) | ✅ | ✅ |
| [API-CAR-01](../../cypress/e2e/api/carrito-pedidos.api.cy.ts) | ESC13 | GET /cart sin token → carrito invitado vacío; POST /cart/items sin token → 401 | Error / negativo | ✅ | ✅ |
| [API-CAR-02](../../cypress/e2e/api/carrito-pedidos.api.cy.ts) | ESC13 | POST /cart/items → 201 y el carrito refleja ítem, subtotal, envío y total | Éxito | ✅ | ✅ |
| [API-CAR-03](../../cypress/e2e/api/carrito-pedidos.api.cy.ts) | ESC13 | validaciones: productId inválido y cantidades 0 / negativas → 400 | Error / negativo | ✅ | ✅ |
| [API-CAR-04](../../cypress/e2e/api/carrito-pedidos.api.cy.ts) | ESC14/15 | PUT cambia la cantidad (0 → 400) y DELETE elimina el ítem | Alternativo | ✅ | ✅ |
| [API-CAR-05](../../cypress/e2e/api/carrito-pedidos.api.cy.ts) | ESC16 | envío gratis cuando el subtotal alcanza $500.000 (regla de negocio) | Alternativo | ✅ | ✅ |
| [API-CAR-06](../../cypress/e2e/api/carrito-pedidos.api.cy.ts) | ESC16 | DEF-03: un carrito vacío de un usuario autenticado cobra envío ($25.000) | Defecto (observado) | ✅ | ✅ |
| [API-CAR-07](../../cypress/e2e/api/carrito-pedidos.api.cy.ts) | ESC13 | DEF-09: los ítems de GET /cart vienen con categoría 'Sin Categoría' | Defecto (observado) | ✅ | ✅ |
| [API-PED-01](../../cypress/e2e/api/carrito-pedidos.api.cy.ts) | ESC28 | POST /orders con carrito vacío → 400 'El carrito está vacío' | Error / negativo | ✅ | ✅ |
| [API-PED-02](../../cypress/e2e/api/carrito-pedidos.api.cy.ts) | ESC28/29 | POST /orders → 201 ORD-YYYY-NNN, PENDIENTE, totales correctos y aparece en GET /orders | Éxito | ✅ | ✅ |
| [API-PED-03](../../cypress/e2e/api/carrito-pedidos.api.cy.ts) | ESC29/ESC36 | DEF-10: GET /orders?admin=true con un CUSTOMER devuelve pedidos de OTROS clientes | Defecto (observado) | ✅ | ✅ |
| [API-PED-04](../../cypress/e2e/api/carrito-pedidos.api.cy.ts) | ESC06/ESC34 | PUT /orders/:id/status: CUSTOMER → 403; ADMIN → 200 (pedido propio de la prueba) | Error / negativo | ✅ | ✅ |
| [API-PED-05](../../cypress/e2e/api/carrito-pedidos.api.cy.ts) | ESC29/ESC36 | DEF-10: GET /orders/:numero de un pedido AJENO responde 200 (IDOR) | Defecto (observado) | ✅ | ✅ |
| [API-CAT-01](../../cypress/e2e/api/catalogo.api.cy.ts) | ESC08 | GET /products → 200 { success, data[] } con el contrato que usa ProductCard | Éxito | ✅ | ✅ |
| [API-CAT-02](../../cypress/e2e/api/catalogo.api.cy.ts) | ESC11 | GET /products?category=pinturas → solo productos de esa categoría | Alternativo | ✅ | ✅ |
| [API-CAT-03](../../cypress/e2e/api/catalogo.api.cy.ts) | ESC09 | OBS-02: GET /products ignora ?search y ?limit (el filtrado lo hace el cliente) | Alternativo | ✅ | ✅ |
| [API-CAT-04](../../cypress/e2e/api/catalogo.api.cy.ts) | ESC10 | GET /products/:id → 200 con el producto; id inexistente → 404 | Éxito | ✅ | ✅ |
| [API-CAT-05](../../cypress/e2e/api/catalogo.api.cy.ts) | ESC11 | GET /categories → 200 con slug, nombre e ícono únicos | Éxito | ✅ | ✅ |
| [API-CAT-06](../../cypress/e2e/api/catalogo.api.cy.ts) | ESC12 | GET /products/storefront → recommended, offers y bestSellers (las ofertas tienen descuento) | Éxito | ✅ | ✅ |
| [API-CAT-07](../../cypress/e2e/api/catalogo.api.cy.ts) | ESC10 | GET /products/:id/reviews → 200 con reseñas de 1 a 5 estrellas | Éxito | ✅ | ✅ |
| [API-ERR-01](../../cypress/e2e/api/errores-integridad.api.cy.ts) | ESC41 | todos los errores que consume el frontend usan { success:false, error:string } y el código correcto | Error / negativo | ✅ | ✅ |
| [API-ERR-02](../../cypress/e2e/api/errores-integridad.api.cy.ts) | ESC41 | un JSON mal formado responde 400 con el mismo formato de error | Error / negativo | ✅ | ✅ |
| [API-INT-01](../../cypress/e2e/api/errores-integridad.api.cy.ts) | ESC37/ESC28 | crear el pedido descuenta el inventario exactamente una vez | Éxito | ✅ | ✅ |
| [API-SEG-01](../../cypress/e2e/api/errores-integridad.api.cy.ts) | ESC35 | la contraseña no viaja en login/registro/me y el token expira (exp en el JWT) | Éxito | ✅ | ✅ |
| [API-ADM-01](../../cypress/e2e/api/proyectos-admin.api.cy.ts) | ESC06/ESC31/ESC33 | GET /admin/inventory: sin token 401, CUSTOMER 403, ADMIN 200 | Error / negativo | ✅ | ✅ |
| [API-ADM-01](../../cypress/e2e/api/proyectos-admin.api.cy.ts) | ESC06/ESC31/ESC33 | GET /admin/metrics: sin token 401, CUSTOMER 403, ADMIN 200 | Error / negativo | ✅ | ✅ |
| [API-ADM-02](../../cypress/e2e/api/proyectos-admin.api.cy.ts) | ESC33 | /admin/inventory: estadísticas coherentes con la lista de productos | Éxito | ✅ | ✅ |
| [API-ADM-03](../../cypress/e2e/api/proyectos-admin.api.cy.ts) | ESC32 | POST /products: CUSTOMER 403; ADMIN con datos incompletos 400; ADMIN válido 201 y DELETE 200 | Error / negativo | ✅ | ✅ |
| [API-PRY-01](../../cypress/e2e/api/proyectos-admin.api.cy.ts) | ESC17 | POST /projects sin token → 401 | Error / negativo | ✅ | ✅ |
| [API-PRY-02](../../cypress/e2e/api/proyectos-admin.api.cy.ts) | ESC17/ESC18 | POST /projects válido → 201 EN_PROGRESO con materiales y costo estimado | Éxito | ✅ | ✅ |
| [API-PRY-03](../../cypress/e2e/api/proyectos-admin.api.cy.ts) | ESC17 | validaciones: nombre vacío y longitud negativa → 400 | Error / negativo | ✅ | ✅ |
| [API-PRY-04](../../cypress/e2e/api/proyectos-admin.api.cy.ts) | ESC19/ESC36 | GET /projects lista solo los propios; otro usuario no puede modificar ni borrar | Error / negativo | ✅ | ✅ |
| [API-PRY-05](../../cypress/e2e/api/proyectos-admin.api.cy.ts) | ESC19 | DELETE /projects/:id elimina el proyecto propio | Éxito | ✅ | ✅ |
| [API-PRY-06](../../cypress/e2e/api/proyectos-admin.api.cy.ts) | ESC19/ESC36 | DEF-11: GET /projects/:id de OTRO usuario responde 200 con sus datos (IDOR) | Defecto (observado) | ✅ | ✅ |
| [API-USR-01](../../cypress/e2e/api/usuarios.api.cy.ts) | ESC02 | POST /users/login válido → 200 con token JWT y usuario sin contraseña | Éxito | ✅ | ✅ |
| [API-USR-02](../../cypress/e2e/api/usuarios.api.cy.ts) | ESC02 | login con clave errada y con correo inexistente → 401 con el mismo mensaje genérico | Error / negativo | ✅ | ✅ |
| [API-USR-03](../../cypress/e2e/api/usuarios.api.cy.ts) | ESC01 | POST /users/register válido → 201 con token y rol CUSTOMER | Éxito | ✅ | ✅ |
| [API-USR-04](../../cypress/e2e/api/usuarios.api.cy.ts) | ESC01 | registro duplicado → 400 'El correo electrónico ya está registrado.' | Error / negativo | ✅ | ✅ |
| [API-USR-05](../../cypress/e2e/api/usuarios.api.cy.ts) | ESC01 | registro con clave de 7 caracteres → 400 de validación | Error / negativo | ✅ | ✅ |
| [API-USR-05](../../cypress/e2e/api/usuarios.api.cy.ts) | ESC01 | registro con correo mal formado → 400 de validación | Error / negativo | ✅ | ✅ |
| [API-USR-05](../../cypress/e2e/api/usuarios.api.cy.ts) | ESC01 | registro con sin nombre → 400 de validación | Error / negativo | ✅ | ✅ |
| [API-USR-06](../../cypress/e2e/api/usuarios.api.cy.ts) | ESC07 | GET /users/me sin token → 401 'Token no provisto.'; con token basura → 401 | Error / negativo | ✅ | ✅ |
| [API-USR-07](../../cypress/e2e/api/usuarios.api.cy.ts) | ESC04 | GET /users/me con token → 200 con datos y contadores | Éxito | ✅ | ✅ |
| [API-USR-08](../../cypress/e2e/api/usuarios.api.cy.ts) | ESC05 | PUT /users/me actualiza los campos enviados | Éxito | ✅ | ✅ |
| [API-USR-09](../../cypress/e2e/api/usuarios.api.cy.ts) | ESC05 | DEF-07: la respuesta de PUT /users/me expone el hash de la contraseña | Defecto (observado) | ✅ | ✅ |
| [API-USR-10](../../cypress/e2e/api/usuarios.api.cy.ts) | ESC05 | DEF-08: PUT /users/me acepta firstName vacío (sin validación en el backend) | Defecto (observado) | ✅ | ✅ |
| [FLU-13](../../cypress/e2e/flujos/admin.cy.ts) | ESC06→ESC32→ESC09→ESC10 | el admin publica, reprecia y retira un producto y el cliente ve cada cambio en el catálogo | Éxito | ✅ | ✅ |
| [FLU-14](../../cypress/e2e/flujos/admin.cy.ts) | ESC28→ESC34→ESC29 | un pedido recorre todos sus estados y el cliente sigue cada avance desde su cuenta | Éxito | ✅ | ✅ |
| [FLU-15](../../cypress/e2e/flujos/admin.cy.ts) | ESC28→ESC33→ESC25→ESC26 | DEF-30: el stock se agota, el admin lo ve en alertas, otro cliente compra en envío diferido y el stock negativo se muestra como 'Stock Bajo' | Alternativo | ✅ | ✅ |
| [FLU-16](../../cypress/e2e/flujos/admin.cy.ts) | ESC28→ESC34→ESC29 | DEF-28: el admin cancela un pedido, el cliente lo ve cancelado y el stock no se devuelve | Defecto (observado) | ✅ | ✅ |
| [FLU-21](../../cypress/e2e/flujos/admin.cy.ts) | ESC31→ESC28→ESC34 | el dashboard del admin suma el pedido nuevo como activo y, al entregarlo, como venta del mes | Éxito | ✅ | ✅ |
| [FLU-03](../../cypress/e2e/flujos/cliente.cy.ts) | ESC12→ESC11→ESC09→ESC10→ESC13→ESC02 | un visitante explora desde el inicio, intenta comprar sin sesión, inicia sesión y agrega al carrito | Alternativo | ✅ | ✅ |
| [FLU-04](../../cypress/e2e/flujos/cliente.cy.ts) | ESC05→ESC09→ESC13→ESC27→ESC28→ESC29 | el cliente completa su perfil y el checkout usa esos datos de envío | Éxito | ✅ | ✅ |
| [FLU-05](../../cypress/e2e/flujos/cliente.cy.ts) | ESC13→ESC16→ESC15→ESC14→ESC27→ESC28 | el carrito con varios productos gana y pierde el envío gratis según el subtotal | Alternativo | ✅ | ✅ |
| [FLU-06](../../cypress/e2e/flujos/cliente.cy.ts) | ESC40→ESC02→ESC09→ESC13→ESC27→ESC28 | una compra completa en inglés y con tema oscuro mantiene las preferencias | Alternativo | ✅ | ✅ |
| [FLU-07](../../cypress/e2e/flujos/cliente.cy.ts) | ESC39→ESC02→ESC09→ESC13→ESC27→ESC28 | un cliente compra desde el celular con el menú móvil | Alternativo | ✅ | ✅ |
| [FLU-08](../../cypress/e2e/flujos/cliente.cy.ts) | ESC28→ESC30→ESC03→ESC10 | tras comprar, el cliente califica el producto y otro visitante ve la reseña | Éxito | ✅ | ✅ |
| [FLU-17](../../cypress/e2e/flujos/errores.cy.ts) | ESC27→ESC28→ESC41 | el pago falla por un error del servidor, el carrito se conserva y el reintento crea el pedido | Error / negativo | ✅ | ✅ |
| [FLU-18](../../cypress/e2e/flujos/errores.cy.ts) | ESC07→ESC02→ESC13→ESC28 | la sesión vence con productos en el carrito; tras volver a entrar el carrito sigue ahí y la compra termina | Error / negativo | ✅ | ✅ |
| [FLU-19](../../cypress/e2e/flujos/errores.cy.ts) | ESC01→ESC17→ESC04 | el registro falla tres veces por datos inválidos, el usuario corrige y crea su primer proyecto | Error / negativo | ✅ | ✅ |
| [FLU-20](../../cypress/e2e/flujos/errores.cy.ts) | ESC08→ESC41→ESC09→ESC13 | DEF-29: con el catálogo caído la app muestra un catálogo vacío sin aviso; al recargar se recupera y el cliente compra | Defecto (observado) | ✅ | ✅ |
| [FLU-01](../../cypress/e2e/flujos/flujos-completos.cy.ts) | ESC01→ESC09→ESC13→ESC14→ESC27→ESC28→ESC29→ESC03 | un visitante se registra, compra y consulta su pedido | Éxito | ✅ | ✅ |
| [FLU-02](../../cypress/e2e/flujos/flujos-completos.cy.ts) | ESC33→ESC13→ESC28→ESC34→ESC29 | el admin ve el stock, el cliente compra y el admin despacha el pedido | Éxito | ✅ | ✅ |
| [FLU-09](../../cypress/e2e/flujos/proyectos.cy.ts) | ESC17→ESC18→ESC24→ESC27→ESC28→ESC23→ESC19 | el cliente planifica un piso, compra todos sus materiales y cierra el proyecto | Éxito | ✅ | ✅ |
| [FLU-10](../../cypress/e2e/flujos/proyectos.cy.ts) | ESC17→ESC20→ESC19→ESC23 | ciclo de vida: crea paredes personalizadas, las pausa, las edita y las elimina | Alternativo | ✅ | ✅ |
| [FLU-11](../../cypress/e2e/flujos/proyectos.cy.ts) | ESC17→ESC10→ESC22→ESC24→ESC13 | desde la ficha de un producto lo asigna a su proyecto y lo compra desde el proyecto | Éxito | ✅ | ✅ |
| [FLU-12](../../cypress/e2e/flujos/proyectos.cy.ts) | ESC10→ESC22→ESC02→ESC17 | DEF-27: un visitante usa 'Crear Primer Proyecto' desde la ficha y el asistente no preselecciona ese producto | Defecto (observado) | ✅ | ✅ |
| [INT-IDI-01](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | cambiar a EN traduce la navegación y la página, y se guarda en localStorage | Alternativo | ✅ | ✅ |
| [INT-IDI-02](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | el idioma inglés persiste al recargar y al navegar | Alternativo | ✅ | ✅ |
| [INT-IDI-03](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | volver a ES restaura los textos en español | Alternativo | ✅ | ✅ |
| [INT-IDI-04](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | DEF-15: en inglés el atributo <html lang> sigue en 'es' | Defecto (observado) | ✅ | ✅ |
| [INT-IDI-05](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | DEF-17: el error de contraseñas no coincidentes del registro no se traduce | Defecto (observado) | ✅ | ✅ |
| [INT-TEM-01](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | sin preferencia guardada, el tema sigue a prefers-color-scheme del sistema | Alternativo | ✅ | ✅ |
| [INT-TEM-02](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | 'Alternar tema' pasa de claro a oscuro, lo guarda y persiste al recargar y navegar | Alternativo | ✅ | ✅ |
| [INT-TEM-03](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | el tema guardado se aplica al cargar y el fondo cambia de color | Alternativo | ✅ | ✅ |
| [INT-TEM-04](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | 'Alternar tema' pasa de oscuro a claro y también persiste | Alternativo | ✅ | ✅ |
| [INT-MOV-01](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | en móvil se oculta la navegación de escritorio y aparece el botón Menú | Alternativo | ✅ | ✅ |
| [INT-MOV-02](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | el menú móvil se abre, navega al catálogo y se cierra | Alternativo | ✅ | ✅ |
| [INT-MOV-03](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | DEF-16: el botón Menú no expone aria-expanded ni aria-controls | Defecto (observado) | ✅ | ✅ |
| [INT-MOV-04](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | en escritorio el botón Menú no se muestra | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | detalle de producto se adapta a escritorio | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | detalle de producto se adapta a movil | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | detalle de producto se adapta a tablet | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | / se adapta a escritorio sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | / se adapta a movil sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | / se adapta a tablet sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /carrito se adapta a escritorio sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /carrito se adapta a movil sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /carrito se adapta a tablet sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /catalogo se adapta a escritorio sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /catalogo se adapta a movil sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /catalogo se adapta a tablet sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /login se adapta a escritorio sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /login se adapta a movil sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /login se adapta a tablet sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /register se adapta a escritorio sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /register se adapta a movil sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /register se adapta a tablet sin scroll horizontal | Alternativo | ✅ | ✅ |
| [INT-RSP-GRID](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | la grilla del catálogo pasa de 1 a 2 y 4 columnas según el ancho | Alternativo | ✅ | ✅ |
| [REG-ADM-01](../../cypress/e2e/regresion/admin.cy.ts) | ESC31 | el dashboard carga las métricas del backend | Éxito | ✅ | ✅ |
| [REG-ADM-02](../../cypress/e2e/regresion/admin.cy.ts) | ESC32 | el formulario de producto exige los campos obligatorios | Error / negativo | ✅ | ✅ |
| [REG-ADM-03](../../cypress/e2e/regresion/admin.cy.ts) | ESC32 | rechaza un precio en 0 con el mensaje de validación | Error / negativo | ✅ | ✅ |
| [REG-ADM-04](../../cypress/e2e/regresion/admin.cy.ts) | ESC32 | crea un producto propio y luego lo elimina (CRUD) | Éxito | ✅ | ✅ |
| [REG-ADM-05](../../cypress/e2e/regresion/admin.cy.ts) | ESC33 | el inventario muestra las estadísticas y la tabla de stock | Éxito | ✅ | ✅ |
| [REG-ADM-06](../../cypress/e2e/regresion/admin.cy.ts) | ESC34 | el administrador cambia el estado de un pedido propio de la prueba | Éxito | ✅ | ✅ |
| [REG-ADM-07](../../cypress/e2e/regresion/admin.cy.ts) | ESC34 | DEF-06: escribir en el buscador de pedidos rompe la página (orderNumber indefinido) | Defecto (observado) | ✅ | ✅ |
| [REG-ADM-08](../../cypress/e2e/regresion/admin.cy.ts) | ESC32 | edita el precio de un producto propio y el cambio persiste | Alternativo | ✅ | ✅ |
| [REG-ADM-09](../../cypress/e2e/regresion/admin.cy.ts) | ESC33 | el filtro de alertas del inventario deja solo los productos con stock bajo | Alternativo | ✅ | ✅ |
| [REG-ADM-10](../../cypress/e2e/regresion/admin.cy.ts) | ESC34 | el filtro por estado deja solo los pedidos con ese estado | Alternativo | ✅ | ✅ |
| [REG-ADM-11](../../cypress/e2e/regresion/admin.cy.ts) | ESC06 | el menú de usuario del ADMIN muestra 'Panel Admin' y lleva al dashboard | Alternativo | ✅ | ✅ |
| [REG-AUT-01](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC01 | registra un usuario con datos válidos y lo lleva a /cuenta | Éxito | ✅ | ✅ |
| [REG-AUT-02](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC01 | rechaza un correo ya registrado y muestra el error del backend | Error / negativo | ✅ | ✅ |
| [REG-AUT-03](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC01 | no envía la petición si las contraseñas no coinciden | Error / negativo | ✅ | ✅ |
| [REG-AUT-04](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC01 | DEF-01: el frontend acepta claves de 6-7 caracteres que el backend rechaza (mín. 8) | Defecto (observado) | ✅ | ✅ |
| [REG-AUT-05](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC01 | rechaza en el cliente una clave de menos de 6 caracteres | Error / negativo | ✅ | ✅ |
| [REG-AUT-06](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC02 | inicia sesión con credenciales válidas y guarda el token | Éxito | ✅ | ✅ |
| [REG-AUT-07](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC02 | con clave incorrecta muestra un mensaje genérico y no crea sesión | Error / negativo | ✅ | ✅ |
| [REG-AUT-08](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC02 | con un correo inexistente muestra el MISMO mensaje genérico (no revela cuentas) | Error / negativo | ✅ | ✅ |
| [REG-AUT-09](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC02 | no envía el formulario con campos vacíos (validación nativa required) | Error / negativo | ✅ | ✅ |
| [REG-AUT-10](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC03 | cierra sesión desde el menú de usuario, borra el token y redirige a /login | Éxito | ✅ | ✅ |
| [REG-AUT-11](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC07 | sin sesión, /checkout redirige a /login | Error / negativo | ✅ | ✅ |
| [REG-AUT-11](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC07 | sin sesión, /cuenta redirige a /login | Error / negativo | ✅ | ✅ |
| [REG-AUT-11](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC07 | sin sesión, /proyectos/nuevo redirige a /login | Error / negativo | ✅ | ✅ |
| [REG-AUT-12](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC07 | sin sesión, /carrito muestra el aviso de inicio de sesión requerido | Error / negativo | ✅ | ✅ |
| [REG-AUT-13](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC07 | sin sesión, /admin redirige a /login | Error / negativo | ✅ | ✅ |
| [REG-AUT-14](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC07 | un CUSTOMER que entra a /admin es devuelto al inicio | Error / negativo | ✅ | ✅ |
| [REG-AUT-15](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC07 | un token inválido se descarta (401) y la ruta privada termina en /login | Error / negativo | ✅ | ✅ |
| [REG-AUT-16](../../cypress/e2e/regresion/autenticacion.cy.ts) | ESC07 | DEF-05: un fallo de red al validar la sesión (no un 401) también borra el token | Defecto (observado) | ✅ | ✅ |
| [REG-CAR-01](../../cypress/e2e/regresion/carrito.cy.ts) | ESC13 | agrega un producto desde el detalle: toast de éxito y contador del navbar en 1 | Éxito | ✅ | ✅ |
| [REG-CAR-02](../../cypress/e2e/regresion/carrito.cy.ts) | ESC13 | el carrito muestra el producto agregado con su precio unitario | Éxito | ✅ | ✅ |
| [REG-CAR-03](../../cypress/e2e/regresion/carrito.cy.ts) | ESC14 | los botones + y − modifican la cantidad y recalculan el subtotal | Éxito | ✅ | ✅ |
| [REG-CAR-04](../../cypress/e2e/regresion/carrito.cy.ts) | ESC14 | el botón − no baja la cantidad de 1 (límite inferior) | Error / negativo | ✅ | ✅ |
| [REG-CAR-05](../../cypress/e2e/regresion/carrito.cy.ts) | ESC15 | eliminar el único ítem deja el carrito vacío y el contador en 0 | Alternativo | ✅ | ✅ |
| [REG-CAR-06](../../cypress/e2e/regresion/carrito.cy.ts) | ESC16 | por debajo de $500.000 cobra envío de $25.000 y total = subtotal + envío | Éxito | ✅ | ✅ |
| [REG-CAR-07](../../cypress/e2e/regresion/carrito.cy.ts) | ESC16 | desde $500.000 el envío es gratis y el total es igual al subtotal | Alternativo | ✅ | ✅ |
| [REG-CAR-08](../../cypress/e2e/regresion/carrito.cy.ts) | ESC13 | sin sesión, agregar al carrito responde 401 y redirige a /login | Error / negativo | ✅ | ✅ |
| [REG-CAT-01](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC08 | lista los productos del backend con el conteo correcto (máx. 25 por página) | Éxito | ✅ | ✅ |
| [REG-CAT-02](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC08 | la paginación avanza a la página 2 y muestra el rango correcto | Alternativo | ✅ | ✅ |
| [REG-CAT-03](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC09 | la búsqueda por nombre encuentra el producto y actualiza la URL | Éxito | ✅ | ✅ |
| [REG-CAT-04](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC09 | una búsqueda sin coincidencias muestra el estado vacío y permite volver al catálogo | Error / negativo | ✅ | ✅ |
| [REG-CAT-05](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC09 | el filtro de calificación 4.5+ muestra solo los productos que lo cumplen | Alternativo | ✅ | ✅ |
| [REG-CAT-06](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC09 | ordenar por precio ascendente deja los precios en orden no decreciente | Alternativo | ✅ | ✅ |
| [REG-CAT-07](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC09 | ordenar por precio descendente pone primero el más caro | Alternativo | ✅ | ✅ |
| [REG-CAT-08](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC11 | filtrar por categoría consulta al backend con ?category y solo muestra esa categoría | Alternativo | ✅ | ✅ |
| [REG-CAT-09](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC11 | la URL /catalogo?category=herramientas llega filtrada (enlace del footer) | Alternativo | ✅ | ✅ |
| [REG-CAT-10](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC10 | el detalle muestra nombre, precio, descripción y stock del producto | Éxito | ✅ | ✅ |
| [REG-CAT-11](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC10 | navega del catálogo al detalle al hacer clic en una tarjeta | Éxito | ✅ | ✅ |
| [REG-CAT-12](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC10 | un id inexistente muestra el mensaje de producto no encontrado | Error / negativo | ✅ | ✅ |
| [REG-CAT-13](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC10 | DEF-02: el breadcrumb de categoría usa ?cat= y el catálogo lo ignora (muestra todo) | Defecto (observado) | ✅ | ✅ |
| [REG-CAT-14](../../cypress/e2e/regresion/catalogo.cy.ts) | ESC12 | la vitrina del inicio carga recomendados, ofertas y más vendidos | Éxito | ✅ | ✅ |
| [REG-CHK-01](../../cypress/e2e/regresion/checkout-pedidos.cy.ts) | ESC27 | precarga los datos del usuario y resume el carrito con su total | Éxito | ✅ | ✅ |
| [REG-CHK-02](../../cypress/e2e/regresion/checkout-pedidos.cy.ts) | ESC27 | con campos obligatorios vacíos el navegador bloquea el envío (required) | Error / negativo | ✅ | ✅ |
| [REG-CHK-03](../../cypress/e2e/regresion/checkout-pedidos.cy.ts) | ESC27 | si se omite la validación nativa, la app advierte con un toast y no crea el pedido | Error / negativo | ✅ | ✅ |
| [REG-CHK-04](../../cypress/e2e/regresion/checkout-pedidos.cy.ts) | ESC28 | con datos válidos crea el pedido ORD-YYYY-NNN, vacía el carrito y confirma | Éxito | ✅ | ✅ |
| [REG-CHK-05](../../cypress/e2e/regresion/checkout-pedidos.cy.ts) | ESC29 | el pedido creado aparece en el historial de /cuenta y su detalle se puede abrir | Éxito | ✅ | ✅ |
| [REG-CHK-06](../../cypress/e2e/regresion/checkout-pedidos.cy.ts) | ESC28 | con el carrito vacío el backend rechaza el pedido y la app muestra el error | Error / negativo | ✅ | ✅ |
| [REG-PER-01](../../cypress/e2e/regresion/perfil.cy.ts) | ESC04 | /cuenta muestra nombre, correo, ubicación sin especificar y contadores en 0 | Éxito | ✅ | ✅ |
| [REG-PER-02](../../cypress/e2e/regresion/perfil.cy.ts) | ESC05 | edita teléfono, ciudad y departamento; persiste y se refleja en la tarjeta | Alternativo | ✅ | ✅ |
| [REG-PER-03](../../cypress/e2e/regresion/perfil.cy.ts) | ESC05 | con nombre vacío muestra el error de campos requeridos y no guarda | Error / negativo | ✅ | ✅ |
| [REG-PER-04](../../cypress/e2e/regresion/perfil.cy.ts) | ESC05 | cancelar la edición cierra el modal sin enviar cambios | Alternativo | ✅ | ✅ |
| [REG-PER-05](../../cypress/e2e/regresion/perfil.cy.ts) | ESC03 | el botón Cerrar Sesión de la cuenta termina la sesión | Alternativo | ✅ | ✅ |
| [REG-PRY-01](../../cypress/e2e/regresion/proyectos.cy.ts) | ESC17 | sin nombre muestra la advertencia del campo obligatorio y no envía nada | Error / negativo | ✅ | ✅ |
| [REG-PRY-02](../../cypress/e2e/regresion/proyectos.cy.ts) | ESC17 | con nombre pero sin largo advierte por el campo Largo | Error / negativo | ✅ | ✅ |
| [REG-PRY-03](../../cypress/e2e/regresion/proyectos.cy.ts) | ESC17 | crea un proyecto de piso 4 x 3 m, calcula 12 m² y abre su detalle | Éxito | ✅ | ✅ |
| [REG-PRY-04](../../cypress/e2e/regresion/proyectos.cy.ts) | ESC17 | con dimensiones negativas el frontend no valida y el backend responde 400 | Error / negativo | ✅ | ✅ |
| [REG-PRY-05](../../cypress/e2e/regresion/proyectos.cy.ts) | ESC19 | la lista de proyectos muestra el proyecto creado y el total en las estadísticas | Éxito | ✅ | ✅ |
| [REG-PRY-06](../../cypress/e2e/regresion/proyectos.cy.ts) | ESC24 | el botón Comprar de un material vinculado lo agrega al carrito | Éxito | ✅ | ✅ |
| [REG-PRY-07](../../cypress/e2e/regresion/proyectos.cy.ts) | ESC17 | un proyecto de paredes exige la altura | Error / negativo | ✅ | ✅ |
| [REG-PRY-08](../../cypress/e2e/regresion/proyectos.cy.ts) | ESC20 | personaliza el cálculo: paredes 4x3x2.5 m, 1 puerta, 1 ventana y patrón diagonal (15%) | Alternativo | ✅ | ✅ |
| [REG-PRY-09](../../cypress/e2e/regresion/proyectos.cy.ts) | ESC21 | excluir insumos opcionales (crucetas y herramientas) los quita del cálculo | Alternativo | ✅ | ✅ |
| [REG-PRY-10](../../cypress/e2e/regresion/proyectos.cy.ts) | ESC22 | 'Usar en Proyecto' desde la ficha vincula el producto a un proyecto existente | Éxito | ✅ | ✅ |
| [REG-PRY-11](../../cypress/e2e/regresion/proyectos.cy.ts) | ESC23 | cambia el estado, edita el nombre y elimina un proyecto propio | Alternativo | ✅ | ✅ |
| [REG-RES-01](../../cypress/e2e/regresion/resenas-stock.cy.ts) | ESC30 | sin sesión, la sección de reseñas invita a iniciar sesión | Error / negativo | ✅ | ✅ |
| [REG-RES-02](../../cypress/e2e/regresion/resenas-stock.cy.ts) | ESC30 | calificar exige estrellas; con 4 estrellas publica la reseña y actualiza el promedio | Éxito | ✅ | ✅ |
| [REG-RES-03](../../cypress/e2e/regresion/resenas-stock.cy.ts) | ESC30 | DEF-20: los botones de estrellas no tienen nombre accesible | Defecto (observado) | ✅ | ✅ |
| [REG-STK-01](../../cypress/e2e/regresion/resenas-stock.cy.ts) | ESC25/ESC28 | la reserva descuenta el stock visible en el catálogo y el pedido lo consume | Éxito | ✅ | ✅ |
| [REG-STK-02](../../cypress/e2e/regresion/resenas-stock.cy.ts) | ESC26 | pedir más unidades que el stock marca el ítem como envío diferido (backorder) | Alternativo | ✅ | ✅ |
| [REG-STK-03](../../cypress/e2e/regresion/resenas-stock.cy.ts) | ESC25 | DEF-21: el carrito no muestra la cuenta regresiva de la reserva (la API no envía updatedAt) | Defecto (observado) | ✅ | ✅ |
| [DEF-SEG-FE-01](../../cypress/e2e/seguridad/seguridad-ui.cy.ts) | ESC35 | el frontend anuncia Next.js y no envía X-Frame-Options ni CSP (clickjacking) | Defecto (observado) | ✅ | ✅ |
| [DEF-SEG-FE-02](../../cypress/e2e/seguridad/seguridad-ui.cy.ts) | ESC35 | la sesión vive en localStorage (legible por cualquier script) y no en una cookie HttpOnly | Defecto (observado) | ✅ | ✅ |
| [SEG-UI-01](../../cypress/e2e/seguridad/seguridad-ui.cy.ts) | ESC35 | una reseña con HTML/JS se muestra como texto y no se ejecuta | Error / negativo | ✅ | ✅ |
| [SEG-UI-02](../../cypress/e2e/seguridad/seguridad-ui.cy.ts) | ESC35 | el nombre de un proyecto con HTML/JS se muestra como texto en el detalle | Error / negativo | ✅ | ✅ |
| [SEG-UI-03](../../cypress/e2e/seguridad/seguridad-ui.cy.ts) | ESC35 | un nombre de usuario con HTML/JS se muestra como texto en la barra y en /cuenta | Error / negativo | ✅ | ✅ |
| [SEG-UI-04](../../cypress/e2e/seguridad/seguridad-ui.cy.ts) | ESC35 | una búsqueda con HTML/JS en la URL se refleja como texto (XSS reflejado) | Error / negativo | ✅ | ✅ |
| [SEG-UI-05](../../cypress/e2e/seguridad/seguridad-ui.cy.ts) | ESC35 | ?redirect= a un dominio externo se ignora: tras el login se queda en la app | Error / negativo | ✅ | ✅ |
| [SEG-UI-06](../../cypress/e2e/seguridad/seguridad-ui.cy.ts) | ESC35 | el token no aparece en la URL, en el DOM ni en una cookie legible | Error / negativo | ✅ | ✅ |
| [SEG-UI-07](../../cypress/e2e/seguridad/seguridad-ui.cy.ts) | ESC35 | las contraseñas se escriben en campos enmascarados (type=password) | Error / negativo | ✅ | ✅ |
| [SEG-UI-08](../../cypress/e2e/seguridad/seguridad-ui.cy.ts) | ESC07 | tras cerrar sesión, volver atrás hasta /cuenta no muestra los datos de la cuenta | Error / negativo | ✅ | ✅ |
| [SEG-UI-09](../../cypress/e2e/seguridad/seguridad-ui.cy.ts) | ESC07 | un token falso con rol ADMIN (alg none) en localStorage no abre /admin | Error / negativo | ✅ | ✅ |
| [DEF-SEG-01](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC35 | un token de ADMIN forjado con el secreto por defecto es aceptado | Defecto (observado) | ✅ | ✅ |
| [DEF-SEG-03/04/05](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC36 | sin token, ?userId=<ajeno> expone pedidos, proyectos y carrito de otro usuario | Defecto (observado) | ✅ | ✅ |
| [DEF-SEG-06](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC36 | GET /orders/:numero sin token expone el pedido y la dirección del cliente | Defecto (observado) | ✅ | ✅ |
| [DEF-SEG-08](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC36 | GET /users/:id entrega el teléfono de otro usuario | Defecto (observado) | ✅ | ✅ |
| [DEF-SEG-09](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC35 | PUT /users/:id devuelve el hash bcrypt de la contraseña | Defecto (observado) | ✅ | ✅ |
| [DEF-SEG-10](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC35 | faltan cabeceras de seguridad (X-Content-Type-Options, X-Frame-Options) | Defecto (observado) | ✅ | ✅ |
| [DEF-SEG-11](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC35 | el login no limita intentos: 20 fallos seguidos, ninguno con 429 | Defecto (observado) | ✅ | ✅ |
| [SEG-API-01](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC35 | un token con la firma alterada se rechaza con 401 | Error / negativo | ✅ | ✅ |
| [SEG-API-02](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC35 | un token con alg "none" que se declara ADMIN se rechaza con 401 | Error / negativo | ✅ | ✅ |
| [SEG-API-03](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC35 | un token vencido se rechaza con 401 | Error / negativo | ✅ | ✅ |
| [SEG-API-04](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC35 | un esquema distinto de Bearer (Basic, token pelado) no autentica | Error / negativo | ✅ | ✅ |
| [SEG-API-05](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC35 | el JWT emitido no transporta la contraseña y expira en 7 días o menos | Éxito | ✅ | ✅ |
| [SEG-API-06](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC06 | un "role": "ADMIN" enviado en el registro se ignora (queda CUSTOMER) | Error / negativo | ✅ | ✅ |
| [SEG-API-07](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC06 | PUT /users/:id con "role": "ADMIN" no escala privilegios | Error / negativo | ✅ | ✅ |
| [SEG-API-08](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC36 | un usuario no puede editar el perfil de otro (403) y el perfil queda intacto | Error / negativo | ✅ | ✅ |
| [SEG-API-09](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC36 | un usuario no puede cambiar ni borrar ítems del carrito de otro | Error / negativo | ✅ | ✅ |
| [SEG-API-10](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC06 | crear, editar y borrar productos exige rol ADMIN (sin token 401, CUSTOMER 403) | Error / negativo | ✅ | ✅ |
| [SEG-API-11](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC41 | operadores NoSQL y SQL en el login se rechazan por validación (400), sin sesión | Error / negativo | ✅ | ✅ |
| [SEG-API-12](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC41 | cadenas de inyección en filtros e ids no provocan errores 500 ni fugas de datos | Error / negativo | ✅ | ✅ |
| [SEG-API-13](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC41 | un cuerpo de más de 100 KB se corta con 413 | Error / negativo | ✅ | ✅ |
| [SEG-API-14](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC36 | CORS refleja solo el origen del frontend y nunca el comodín * | Error / negativo | ✅ | ✅ |
| [SEG-API-15](../../cypress/e2e/seguridad/seguridad.api.cy.ts) | ESC35 | el backend no anuncia su tecnología (sin X-Powered-By) | Error / negativo | ✅ | ✅ |

### Componentes

| Prueba | ESC | Escenario | Tipo | Resultado |
|---|---|---|---|---|
| [CMP-CIT-01](../../cypress/component/comercio.cy.tsx) | — | muestra nombre, precio unitario, cantidad y subtotal (precio × cantidad) | Éxito | ✅ |
| [CMP-CIT-02](../../cypress/component/comercio.cy.tsx) | — | + incrementa y − decrementa (nunca por debajo de 1) vía onQuantityChange | Alternativo | ✅ |
| [CMP-CIT-03](../../cypress/component/comercio.cy.tsx) | — | el botón Eliminar invoca onRemove | Alternativo | ✅ |
| [CMP-CIT-04](../../cypress/component/comercio.cy.tsx) | — | con updatedAt reciente muestra la cuenta regresiva de la reserva (15 min) | Éxito | ✅ |
| [CMP-CIT-05](../../cypress/component/comercio.cy.tsx) | — | con updatedAt de hace más de 15 minutos indica que la reserva expiró | Alternativo | ✅ |
| [CMP-CIT-06](../../cypress/component/comercio.cy.tsx) | — | en backorder muestra la cantidad diferida | Alternativo | ✅ |
| [CMP-OSB-01](../../cypress/component/comercio.cy.tsx) | — | muestra subtotal, envío y total con formato COP | Éxito | ✅ |
| [CMP-OSB-02](../../cypress/component/comercio.cy.tsx) | — | con envío 0 muestra la etiqueta de envío gratis | Alternativo | ✅ |
| [CMP-PRD-01](../../cypress/component/comercio.cy.tsx) | — | muestra nombre, categoría traducida, precio, precio original y unidad | Éxito | ✅ |
| [CMP-PRD-02](../../cypress/component/comercio.cy.tsx) | — | calcula el descuento (-25%) y muestra la insignia 'Nuevo' | Éxito | ✅ |
| [CMP-PRD-03](../../cypress/component/comercio.cy.tsx) | — | pinta tantas estrellas como la parte entera del rating y el número de reseñas | Éxito | ✅ |
| [CMP-PRD-04](../../cypress/component/comercio.cy.tsx) | — | sin stock muestra 'Envío Diferido' y sin precio original no muestra descuento | Alternativo | ✅ |
| [CMP-PRD-05](../../cypress/component/comercio.cy.tsx) | — | toda la tarjeta enlaza al detalle /catalogo/:id | Éxito | ✅ |
| [CMP-PRD-06](../../cypress/component/comercio.cy.tsx) | — | en inglés traduce la categoría y la insignia | Alternativo | ✅ |
| [CMP-AUT-01](../../cypress/component/navegacion-feedback.cy.tsx) | — | AuthCard muestra subtítulo y contenido; sin error no muestra el aviso | Éxito | ✅ |
| [CMP-AUT-02](../../cypress/component/navegacion-feedback.cy.tsx) | — | AuthCard con errorMsg muestra el error y respeta maxWidth=2xl | Error / negativo | ✅ |
| [CMP-AUT-03](../../cypress/component/navegacion-feedback.cy.tsx) | — | AuthRequiredState ofrece enlaces a /login y /register | Éxito | ✅ |
| [CMP-PAG-01](../../cypress/component/navegacion-feedback.cy.tsx) | — | con una sola página no renderiza nada | Alternativo | ✅ |
| [CMP-PAG-02](../../cypress/component/navegacion-feedback.cy.tsx) | — | muestra el rango, deshabilita 'Anterior' en la página 1 y marca la actual | Éxito | ✅ |
| [CMP-PAG-03](../../cypress/component/navegacion-feedback.cy.tsx) | — | navegar a la última página llama onPageChange y deshabilita 'Siguiente' | Éxito | ✅ |
| [CMP-PAG-04](../../cypress/component/navegacion-feedback.cy.tsx) | — | con muchas páginas resume con puntos suspensivos alrededor de la actual | Éxito | ✅ |
| [CMP-PAG-05](../../cypress/component/navegacion-feedback.cy.tsx) | — | traduce sus textos al inglés con LanguageProvider | Alternativo | ✅ |
| [CMP-PAG-06](../../cypress/component/navegacion-feedback.cy.tsx) | — | DEF-14: los íconos ChevronLeft/Right no están en LucideIcon y se dibuja el ícono de ayuda (?) | Defecto (observado) | ✅ |
| [CMP-SBR-01](../../cypress/component/navegacion-feedback.cy.tsx) | — | al presionar Enter invoca onSearch con el texto escrito | Éxito | ✅ |
| [CMP-SBR-02](../../cypress/component/navegacion-feedback.cy.tsx) | — | sincroniza el valor inicial y usa el placeholder en inglés | Alternativo | ✅ |
| [CMP-TST-01](../../cypress/component/navegacion-feedback.cy.tsx) | — | showToast muestra una alerta con el mensaje y el estilo del tipo | Éxito | ✅ |
| [CMP-TST-02](../../cypress/component/navegacion-feedback.cy.tsx) | — | apila varias notificaciones y cada tipo usa su color | Éxito | ✅ |
| [CMP-TST-03](../../cypress/component/navegacion-feedback.cy.tsx) | — | el botón Cerrar descarta la notificación | Éxito | ✅ |
| [CMP-TST-04](../../cypress/component/navegacion-feedback.cy.tsx) | — | se oculta sola al cumplirse la duración (reloj controlado) | Éxito | ✅ |
| [CMP-BDG-01](../../cypress/component/ui-basicos.cy.tsx) | — | la variante "default" aplica la clase bg-zinc-100 | Éxito | ✅ |
| [CMP-BDG-01](../../cypress/component/ui-basicos.cy.tsx) | — | la variante "error" aplica la clase bg-rose-50 | Éxito | ✅ |
| [CMP-BDG-01](../../cypress/component/ui-basicos.cy.tsx) | — | la variante "info" aplica la clase bg-sky-50 | Éxito | ✅ |
| [CMP-BDG-01](../../cypress/component/ui-basicos.cy.tsx) | — | la variante "success" aplica la clase bg-emerald-50 | Éxito | ✅ |
| [CMP-BDG-01](../../cypress/component/ui-basicos.cy.tsx) | — | la variante "warning" aplica la clase bg-amber-50 | Éxito | ✅ |
| [CMP-BDG-02](../../cypress/component/ui-basicos.cy.tsx) | — | el tamaño sm usa menos relleno que md | Éxito | ✅ |
| [CMP-BTN-01](../../cypress/component/ui-basicos.cy.tsx) | — | renderiza el texto, es type=button por defecto y usa la variante primary | Éxito | ✅ |
| [CMP-BTN-02](../../cypress/component/ui-basicos.cy.tsx) | — | invoca onClick una vez por clic | Éxito | ✅ |
| [CMP-BTN-03](../../cypress/component/ui-basicos.cy.tsx) | — | deshabilitado: atributo disabled, estilos y no dispara onClick | Alternativo | ✅ |
| [CMP-BTN-04](../../cypress/component/ui-basicos.cy.tsx) | — | con href se renderiza como enlace <a> y aplica tamaño y ancho completo | Éxito | ✅ |
| [CMP-BTN-05](../../cypress/component/ui-basicos.cy.tsx) | — | type=submit envía el formulario que lo contiene | Éxito | ✅ |
| [CMP-BTN-06](../../cypress/component/ui-basicos.cy.tsx) | — | la variante "danger" es visible y enfocable con teclado | Éxito | ✅ |
| [CMP-BTN-06](../../cypress/component/ui-basicos.cy.tsx) | — | la variante "ghost" es visible y enfocable con teclado | Éxito | ✅ |
| [CMP-BTN-06](../../cypress/component/ui-basicos.cy.tsx) | — | la variante "outline" es visible y enfocable con teclado | Éxito | ✅ |
| [CMP-BTN-06](../../cypress/component/ui-basicos.cy.tsx) | — | la variante "primary" es visible y enfocable con teclado | Éxito | ✅ |
| [CMP-BTN-06](../../cypress/component/ui-basicos.cy.tsx) | — | la variante "secondary" es visible y enfocable con teclado | Éxito | ✅ |
| [CMP-BTN-06](../../cypress/component/ui-basicos.cy.tsx) | — | la variante "white" es visible y enfocable con teclado | Éxito | ✅ |
| [CMP-CRD-01](../../cypress/component/ui-basicos.cy.tsx) | — | sin onClick es un <div>; con onClick es un <button> que dispara el evento | Éxito | ✅ |
| [CMP-INP-01](../../cypress/component/ui-basicos.cy.tsx) | — | con id, la etiqueta queda asociada: clic en el label enfoca el campo | Éxito | ✅ |
| [CMP-INP-02](../../cypress/component/ui-basicos.cy.tsx) | — | propaga onChange con el valor escrito | Éxito | ✅ |
| [CMP-INP-03](../../cypress/component/ui-basicos.cy.tsx) | — | con error muestra el mensaje y pinta borde y etiqueta en rojo | Error / negativo | ✅ |
| [CMP-INP-04](../../cypress/component/ui-basicos.cy.tsx) | — | deshabilitado no permite escribir | Alternativo | ✅ |
| [CMP-INP-05](../../cypress/component/ui-basicos.cy.tsx) | — | DEF-12: sin id (como en /register y el modal de perfil) el label NO queda asociado | Defecto (observado) | ✅ |
| [CMP-SRC-01](../../cypress/component/ui-basicos.cy.tsx) | — | escribe, notifica cada cambio y muestra el botón de limpiar solo con texto | Éxito | ✅ |
| [CMP-SRC-02](../../cypress/component/ui-basicos.cy.tsx) | — | el botón de limpiar vacía el campo (onChange con cadena vacía) | Error / negativo | ✅ |
| [CMP-SRC-03](../../cypress/component/ui-basicos.cy.tsx) | — | DEF-13/DEF-14: el botón de limpiar solo se anuncia como "X" (letra, no ícono) y el campo no tiene label | Defecto (observado) | ✅ |
