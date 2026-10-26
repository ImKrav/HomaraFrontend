# Pruebas E2E de Homara con Gherkin y el patrón Screenplay

Suite de pruebas de extremo a extremo (E2E) del frontend de Homara. Los escenarios se escriben en **Gherkin**
(español, estructura **Dado-Cuando-Entonces**) y se ejecutan con el **patrón Screenplay** usando **Serenity/JS 3**
sobre **Playwright Test** y TypeScript; **playwright-bdd** une ambos mundos. Vive en su propia carpeta con su propio
`package.json`, aislada del frontend (Next.js).

| Elemento | Valor |
|---|---|
| Escenarios | 33 escenarios Gherkin en 7 archivos `features/*.feature` (`# language: es`), etiquetados con los ESC del equipo |
| Enlace Gherkin → código | playwright-bdd 9.2.1 (`bddgen` convierte cada `.feature` en una prueba de Playwright; los pasos están en `pasos/*.pasos.ts`) |
| Framework | Serenity/JS 3.48.0 (`core`, `web`, `playwright`, `playwright-test`, `assertions`, `rest`, `console-reporter`) |
| Motor | Playwright Test 1.63.0, navegador Chromium (headless) |
| Lenguaje | TypeScript 5 |
| Reportes | consola de Serenity/JS, HTML de Cucumber (pasos Gherkin), HTML de Playwright, JUnit XML, una captura PNG por escenario |

> No se usa `@serenity-js/serenity-bdd` porque requiere Java y la máquina de ejecución no lo tiene; en su lugar se
> usan el reportero de consola de Serenity/JS, el reporte HTML de Cucumber que genera playwright-bdd y los reportes
> HTML y JUnit de Playwright.

---

## 1. ¿Qué es el patrón Screenplay?

Screenplay es un patrón de diseño para pruebas de aceptación centrado en el **usuario** y en sus **objetivos de
negocio**, no en las páginas. Se describe como un guion de teatro:

- Un **Actor** (persona con nombre y rol) intenta lograr un objetivo.
- Lo logra gracias a sus **Habilidades** (*Abilities*): navegar con un navegador, llamar a una API, tomar notas.
- Ejecuta **Tareas** (*Tasks*) de negocio ("iniciar sesión", "agregar al carrito"), que se componen de otras tareas
  o de **Interacciones** (*Interactions*) de bajo nivel (hacer clic, escribir, ejecutar un script).
- Verifica el resultado haciendo **Preguntas** (*Questions*) sobre el estado del sistema ("¿qué total muestra el
  carrito?") y comparando la respuesta con una expectativa (`Ensure.that(pregunta, equals(...))`).
- Los **elementos de la interfaz** (*targets*) se declaran aparte, de modo que un cambio de selector se corrige en
  un solo lugar.

Frente a Page Object, Screenplay favorece la composición (tareas pequeñas y reutilizables), separa el *qué* (tareas)
del *cómo* (interacciones y selectores), y produce reportes que se leen como lenguaje natural:
`Camila la clienta agrega 1 unidad(es) de "Insumo de Prueba E2E Screenplay" al carrito`.

### Cómo se mapea cada capa al código

```
Actor ──tiene──▶ Habilidades ──permiten──▶ Tareas ──se componen de──▶ Interacciones
  │                                                                      │
  └──────────────── hace ──▶ Preguntas ◀──── leen ──── UI (PageElements) ┘
```

| Capa Screenplay | Carpeta | Ejemplos en el código |
|---|---|---|
| **Actores / Elenco** (*Actor*, *Cast*) | `screenplay/actores/` | `Actores.ts` define a **Camila la clienta**, **Andrés el administrador** y **Valentina la visitante**. `ElencoHomara.ts` es el *Cast* que entrega las habilidades. `escenario.ts` inyecta el elenco en Playwright Test (cada actor con su propio contexto de navegador, es decir, sesión independiente). `NotasDelActor.ts` tipa lo que un actor puede recordar. |
| **Habilidades** (*Abilities*) | `screenplay/actores/ElencoHomara.ts` | `BrowseTheWebWithPlaywright` (navegar), `CallAnApi` (API REST del backend, para preparar/limpiar datos y verificar efectos persistidos), `TakeNotes` (pasar datos entre pasos: correo registrado, token, nombre del producto creado). |
| **Tareas** (*Tasks*) | `screenplay/tareas/` | `IniciarSesion`, `Registrarse`, `CerrarSesion`, `BuscarProducto`, `AgregarAlCarrito`, `IrAlCarrito`, `ModificarCantidad`, `EliminarDelCarrito`, `IrAlCheckout`, `CompletarCheckout`, `CrearProyecto`, `AbrirPanelDeProductos`, `CrearProductoAdmin`, `FiltrarProductosDelPanel`, `EliminarProductoAdmin`. Tareas de preparación/limpieza por API: `RegistrarClientePorApi`, `ObtenerTokenPorApi`, `AsegurarProductoDePrueba`, `VaciarCarritoPorApi`, `EliminarProductoPorApi`. |
| **Interacciones** (*Interactions*) | `screenplay/interacciones/` | Solo las que aportan valor sobre las de Serenity/JS (`Click`, `Enter`, `Navigate`, `Select`, `Press`, `Wait`): `EnviarSinValidacionNativa` (envía un formulario saltando el `required` del navegador para probar la validación propia de la app), `LlamarALaApi` (petición HTTP autenticada con el token anotado), `OlvidarSesion` (borra `homara_token`), `GuardarEvidencia` (captura PNG en `evidencias/capturas`). |
| **Preguntas** (*Questions*) | `screenplay/preguntas/` | `MensajeDeError`, `Notificacion` (toasts `role="alert"`), `CantidadEnCarrito`, `TotalDelCarrito`, `UrlActual`, `NombreDelUsuario`, `ResultadosDeBusqueda`, `SesionDelNavegador`, `CamposInvalidos`, `NombreDelProyecto` y preguntas al backend: `PedidosDelCliente`, `CarritoEnElBackend`, `ProductoEnElCatalogo`. |
| **Interfaz** (*PageElements*) | `screenplay/ui/` | Un archivo por página: `PaginaLogin`, `PaginaRegistro`, `BarraDeNavegacion`, `Notificaciones`, `PaginaCatalogo` / `PaginaDetalleProducto`, `PaginaCarrito`, `PaginaCheckout`, `PaginaNuevoProyecto` / `PaginaDetalleProyecto`, `PaginaAdminProductos`. |
| **Datos de prueba** | `screenplay/datos/` | URLs del entorno, usuarios semilla (solo lectura), generador de correos únicos, datos de envío, producto de apoyo y reglas de envío. |
| **Escenarios Gherkin** | `features/` | Un `.feature` por funcionalidad, en español: `Característica`, `Regla`, `Antecedentes`, `Escenario`, `Esquema del escenario` + `Ejemplos`, y pasos `Dado` / `Cuando` / `Entonces` / `Y` / `Pero`. Etiquetas `@ESCxx`, `@DEF-xx` y `@fail`. |
| **Pasos** (*step definitions*) | `pasos/` | Traducen cada frase Gherkin a actividades Screenplay. `fixtures.ts` une el `test` de Serenity/JS con el de playwright-bdd, define los tipos de parámetro `{actor}` (Camila, Andrés, Valentina) y `{cop}` (`$ 275.000` → 275000), el fixture `enEscena` (actor en el foco) y los ganchos `Despues` (evidencia y limpieza). |

## 2. Escenarios en Gherkin

Cada escenario se lee como una especificación de negocio y, al mismo tiempo, es una prueba E2E ejecutable:

```
features/carrito.feature ──bddgen──▶ .features-gen/features/carrito.feature.spec.js ──playwright test──▶
   pasos/carrito.pasos.ts ──▶ Actor.attemptsTo(Tareas / Interacciones, Ensure.that(Preguntas, …))
```

Ejemplo (`features/carrito.feature`):

```gherkin
# language: es
@carrito
Característica: Carrito de compras
  Como clienta de Homara
  Quiero agregar, modificar y eliminar productos de mi carrito y ver sus totales
  Para saber cuánto voy a pagar antes de hacer el pedido

  Antecedentes:
    Dado que Andrés mantiene disponible el producto de apoyo a $ 250.000 la unidad
    Y que Camila es una clienta nueva con sesión iniciada

  @ESC16
  Escenario: SP-22 Con subtotal menor a $ 500.000 se cobra el envío
    Dado que Camila agrega 1 unidad del producto de apoyo al carrito
    Cuando abre su carrito
    Entonces el subtotal es $ 250.000
    Y el envío cuesta $ 25.000
    Y el total es $ 275.000
```

Y los pasos que lo ejecutan (`pasos/carrito.pasos.ts`), cada uno delega en Screenplay:

```ts
Cuando('(que ){actor} agrega {int} unidad(es) del producto de apoyo al carrito', async ({ actorCalled }, actor: string, unidades: number) => {
    await actorCalled(actor).attemptsTo(AgregarAlCarrito.elProducto(PRODUCTO).unidades(unidades));     // Tarea
});

Cuando('abre su carrito', async ({ enEscena }) => {
    await enEscena().attemptsTo(
        IrAlCarrito.desdeLaBarra(),                                                                  // Tarea
        Wait.until(PaginaCarrito.item(PRODUCTO), isVisible()),                                       // Interacción + PageElement
    );
});

Entonces('el subtotal es {cop}', async ({ enEscena }, valor: number) => {
    await enEscena().attemptsTo(Wait.until(TotalDelCarrito.subtotal(), equals(valor)));            // Pregunta + expectativa
});
```

- Los pasos que nombran al actor (`Cuando Camila agrega…`) lo llaman con `actorCalled`; los demás (`Entonces el
  subtotal es…`) los ejecuta el **actor en el foco** (`enEscena()`, el último que entró en escena).
- `Antecedentes` reemplaza al `beforeEach`: la preparación queda visible en el escenario.
- Los escenarios con fallo esperado por un defecto conocido llevan `@fail` y la etiqueta del defecto (`@DEF-02`).

| Feature | Escenarios | ESC |
|---|---|---|
| `features/autenticacion.feature` | SP-01 a SP-08 (con `Regla` por ESC) | ESC01, ESC02, ESC03 |
| `features/rutas-privadas.feature` | SP-09 a SP-13 (SP-09 a SP-11 con `Esquema del escenario`) | ESC06, ESC07 |
| `features/busqueda-catalogo.feature` | SP-14 a SP-16 | ESC09 |
| `features/carrito.feature` | SP-17 a SP-24 | ESC13, ESC14, ESC15, ESC16 |
| `features/checkout.feature` | SP-25 a SP-28 | ESC27, ESC28 |
| `features/proyectos.feature` | SP-29 a SP-31 | ESC17 |
| `features/admin-productos.feature` | SP-32, SP-33 | ESC32 |

### Decisiones de diseño

- **Selectores**: la app no tiene `data-testid`. Se usan `id` (`#email`, `#search-bar`, `#first-name`,
  `#project-name`, `#btn-add-product`, ...), roles y nombres accesibles, `aria-label` (`Carrito`, `+`, `-`,
  `Eliminar`) y placeholders (registro: `"Juan"`, `"Pérez"`, `"juan@email.com"`). Todos los textos se confirmaron en
  `app/` y `app/lib/locales/es.json`.
- **Esperas**: solo esperas explícitas (`Wait.until(..., isVisible())`, `Wait.until(pregunta, equals(...))`); no hay
  pausas fijas. Por ejemplo, `AgregarAlCarrito` lee el contador del carrito antes del clic y espera a que suba en uno.
- **Datos aislados**: los usuarios semilla (`admin@homara.co`, `juan@email.com`) solo se usan para iniciar sesión.
  Los escenarios que cambian estado registran por API una clienta nueva con correo único
  (`camila.<timestamp>.<n>.w<worker>@e2e-screenplay.co`, clave de 8+ caracteres).
- **Producto de apoyo**: un pedido descuenta stock de forma permanente, por eso carrito y checkout usan el producto
  propio **"Insumo de Prueba E2E Screenplay"** (250.000 COP, categoría Herramientas). Andrés lo crea por API si no
  existe y repone su stock a 500 antes de cada escenario (`AsegurarProductoDePrueba`). Es el único dato que la suite
  deja en el catálogo de forma permanente.
- **Limpieza**: ganchos `Despues` por etiqueta (`pasos/fixtures.ts`): en `@carrito` y `@checkout` se vacía el carrito
  de la clienta por API (libera el stock reservado) y en `@admin-productos` se elimina por API el producto creado si
  el escenario falló a mitad de camino.
- **Evidencias**: un gancho `Despues` guarda la captura final de **cada** escenario (pase o falle) en
  `evidencias/capturas/<título del escenario>.png` y la adjunta a los reportes HTML de Cucumber y de Playwright.
- **Defectos conocidos**: los escenarios que verifican una regla que hoy no se cumple llevan la etiqueta `@fail`
  (más `@DEF-xx`). Playwright los cuenta como "fallo esperado"; si el defecto se corrige, el escenario pasará a
  "inesperadamente exitoso" y avisará que hay que quitar la etiqueta.

---

## 3. Cómo ejecutarlo

Requisitos: Node.js 20+ y el stack de Homara corriendo:

- Frontend en `http://localhost:3000` (hace proxy de `/api/v1` al backend).
- Backend en `http://localhost:5000/api/v1` con los datos semilla.

```bash
cd e2e-screenplay
npm ci
npx playwright install chromium
npm test
```

Otros comandos:

| Comando | Para qué |
|---|---|
| `npm test` | Genera las pruebas desde los `.feature` (`bddgen`) y ejecuta los 33 escenarios (3 workers, Chromium headless). |
| `npx bddgen && npx playwright test --grep @ESC16` | Ejecuta solo los escenarios de un ESC (por etiqueta). |
| `npx bddgen && npx playwright test --grep SP-24` | Ejecuta un escenario por su identificador. |
| `npx bddgen && npx playwright test .features-gen/features/carrito.feature.spec.js` | Ejecuta una sola feature. |
| `npm run test:headed` | Ejecuta con el navegador visible. |
| `npm run reporte` | Abre el reporte HTML de Playwright (`evidencias/reporte-html`). El reporte de Cucumber se abre directamente: `evidencias/reporte-cucumber.html`. |
| `npm run lint:tipos` | Verifica los tipos de TypeScript. |
| `npx bddgen --dry-run` o `npx bddgen` | Comprueba que cada paso Gherkin tiene su definición (falla si falta alguno). |

Las URLs se pueden cambiar con las variables `HOMARA_URL_FRONTEND` y `HOMARA_URL_API`.

---

## 4. Resultados

Ejecución real del 26/10/2026 en Linux (contenedor Ubuntu), Node 22, Chromium headless, 3 workers, contra el stack
local: PostgreSQL 16 con los datos semilla (`npx prisma db push` + `npm run seed`), backend en `:5000` y frontend en
build de producción (`next build` + `next start`) en `:3000`. La suite se ejecutó completa **tres veces seguidas** con
el mismo resultado (`evidencias/consola-corrida-1.txt`, `-2.txt`, `-3.txt`); los reportes HTML (Cucumber y
Playwright), el JUnit y las capturas corresponden a la tercera corrida.

**Resumen (después de la refactorización):** 33 escenarios, **33 pasan**. SP-24 (DEF-02) y SP-27 (DEF-03), que antes
fallaban por defectos reales y estaban marcados `@fail`, ahora pasan sin esa marca porque los defectos se corrigieron
(ver `../docs/REFACTORIZACION.md`). Corrida final: [`evidencias/consola-corrida-final.txt`](evidencias/consola-corrida-final.txt);
las corridas anteriores están en [`evidencias/antes-refactorizacion/`](evidencias/antes-refactorizacion/).

**Resumen (antes):** 33 escenarios: 31 pasaban y 2 fallaban por defectos reales del sistema (DEF-02 y DEF-03).

| Feature | Escenarios | Pasan | Fallan (defecto conocido) |
|---|---|---|---|
| `autenticacion.feature` | 8 | 8 | 0 |
| `rutas-privadas.feature` | 5 | 5 | 0 |
| `busqueda-catalogo.feature` | 3 | 3 | 0 |
| `carrito.feature` | 8 | 7 | 1 (SP-24, DEF-02) |
| `checkout.feature` | 4 | 3 | 1 (SP-27, DEF-03) |
| `proyectos.feature` | 3 | 3 | 0 |
| `admin-productos.feature` | 2 | 2 | 0 |
| **Total** | **33** | **31** | **2** |

La relación ESC → historia de usuario se tomó de `VyV/MATRICES/MATRIZ DE TRAZABILIDAD.xlsx`: ESC13 agregar al
carrito, ESC14 modificar cantidad, ESC15 eliminar ítem, ESC16 calcular totales, ESC27 registrar datos de envío,
ESC28 generar pedido.

Cada escenario tiene su captura final en `evidencias/capturas/`. El reporte `evidencias/reporte-cucumber.html` muestra
cada escenario Gherkin con el resultado de cada paso (Dado/Cuando/Entonces) y la captura adjunta; los mismos
escenarios están en `evidencias/reporte-html`, `evidencias/resultados-junit.xml` y en las salidas de consola (que
listan cada paso del actor, es decir, cada tarea, interacción y pregunta de Screenplay).

### 4.1 Trazabilidad ESC → feature → resultado

Los escenarios salen de la matriz del equipo (`VyV/MATRICES/MATRIZ DE TRAZABILIDAD.xlsx`, `REGLAS DE NEGOCIO.xlsx`).
Los flujos y casos se tomaron de las pruebas existentes del frontend (`tests/ui/*.test.tsx` y
`tests/regression/*.test.tsx`, Vitest + Testing Library con backend falso). Aquí se repiten **de extremo a extremo**,
contra el frontend y el backend reales. La columna "Base" indica qué caso existente origina cada escenario.

| ESC | Historia / funcionalidad | Reglas (RN) | Feature | Escenarios Gherkin | Base en `tests/ui` y `tests/regression` | Resultado |
|---|---|---|---|---|---|---|
| ESC01 | HU1 Registrar usuario | RN-002, RN-003 | `autenticacion.feature` | SP-01, SP-02, SP-03, SP-04 | ui-auth-03, ui-auth-04, REG-AUTH-05, REG-AUTH-06 | 4/4 pasan (SP-04 documenta DEF-01) |
| ESC02 | HU2 Iniciar sesión | RN-006 | `autenticacion.feature` | SP-05, SP-06, SP-07 | ui-auth-01, ui-auth-02, REG-AUTH-01 | 3/3 pasan |
| ESC03 | HU3 Cerrar sesión | RN-065 | `autenticacion.feature` | SP-08 | ui-acc-07, ui-gen-04 | 1/1 pasa |
| ESC06 | HU4 Controlar acceso por rol | RN-010, RN-015 | `rutas-privadas.feature` | SP-12, SP-13 | ui-auth-07, REG-ADM-01 | 2/2 pasan |
| ESC07 | HU7 Proteger rutas privadas | RN-014 | `rutas-privadas.feature` | SP-09, SP-10, SP-11, SP-12 | ui-auth-05, ui-auth-06, ui-acc-01, ui-chk-01, REG-AUTH-02 | 4/4 pasan |
| ESC09 | HU9 Buscar y filtrar productos | RN-017 | `busqueda-catalogo.feature` | SP-14, SP-15, SP-16 | ui-cat-03, ui-cat-05, REG-CAT-03 | 3/3 pasan |
| ESC13 | HU15 Agregar producto al carrito | RN-023, RN-024, RN-025 | `carrito.feature` | SP-17, SP-18 | ui-cat-08, ui-gen-02, REG-CAT-01 | 2/2 pasan |
| ESC14 | Modificar cantidad en el carrito | RN-029 | `carrito.feature` | SP-19, SP-20 | ui-cart-06, REG-CART-01 | 2/2 pasan |
| ESC15 | Eliminar ítem del carrito | RN-025 | `carrito.feature` | SP-21 | ui-cart-07, ui-cart-05, REG-CART-01 | 1/1 pasa |
| ESC16 | HU19 Calcular totales del carrito | RN-029, RN-030, RN-031, RN-032 | `carrito.feature` | SP-22, SP-23, SP-24 (+ SP-19, SP-20) | ui-cart-02, ui-cart-03, REG-CART-02 | 2/3 pasan; **SP-24 falla por DEF-02** |
| ESC17 | HU26 Crear proyecto | (validaciones del estimador) | `proyectos.feature` | SP-29, SP-30, SP-31 | ui-proy-09, ui-proy-10, ui-proy-11 | 3/3 pasan |
| ESC27 | HU21 Registrar datos de envío | condición "solo espacios = vacío" de la matriz | `checkout.feature` | SP-25, SP-26, SP-27 (+ SP-28) | ui-chk-02, ui-chk-04, REG-CART-03 | 2/3 pasan; **SP-27 falla por DEF-03** |
| ESC28 | Generar pedido | RN-036, RN-038 | `checkout.feature` | SP-28 | ui-chk-03, REG-CART-03 | 1/1 pasa |
| ESC32 | HU39 Gestionar productos (admin) | RN-010 | `admin-productos.feature` | SP-32, SP-33 | ui-adm-03, ui-adm-04, ui-adm-07, ui-adm-09 | 2/2 pasan |

**ESC de la matriz que esta suite no cubre**, y por qué:

- **Ya cubiertos por la suite de componentes (`tests/ui`, `tests/regression`) y fuera del alcance pedido para
  Screenplay:** ESC04/ESC05 perfil (ui-acc-02, ui-acc-05, ui-acc-06, REG-AUTH-04), ESC08 listar productos (ui-cat-01),
  ESC10 detalle (ui-cat-06, ui-cat-07, ui-cat-09), ESC11 categorías (ui-cat-04, REG-CAT-02), ESC12 vitrina (ui-gen-01,
  REG-CAT-04), ESC18 a ESC24 cálculo, edición y materiales de proyectos (ui-proy-*, REG-PROY-*), ESC29 consultar
  pedidos (ui-acc-04), ESC30 calificar (ui-cat-10, ui-cat-11, ui-cat-12), ESC31, ESC33 y ESC34 consola admin
  (ui-adm-01, ui-adm-02, ui-adm-10 a ui-adm-13), ESC40 internacionalización y tema (ui-gen-05, ui-gen-06, REG-I18N-*).
  Son candidatos naturales para ampliar esta suite con las mismas tareas y preguntas.
- **Propios del backend o no funcionales (no se verifican desde la interfaz):** ESC25 reserva de stock, ESC26 marcar
  pedido pendiente, ESC35 y ESC36 seguridad de credenciales y autorización por recurso, ESC37 integridad
  transaccional, ESC38 rendimiento, ESC39 usabilidad responsiva, ESC41 manejo de errores de la API, ESC42
  documentación de la API, ESC43 despliegue, ESC44 compatibilidad de navegadores. Esta suite solo corre en Chromium.

### ESC01: Registro de usuario (`autenticacion.feature`)

| ID | ESC | Objetivo | Resultado esperado | Resultado obtenido (real) | Estado | Evidencia |
|---|---|---|---|---|---|---|
| SP-01 | ESC01 | Registro con datos válidos | Redirige a `/cuenta`, la barra muestra "Camila" y existe `homara_token` | Redirigió a `/cuenta`, barra con "Camila", token presente | Pasa | `capturas/SP-01-Registro-con-datos-validos.png` |
| SP-02 | ESC01 | Registro con correo ya existente (`juan@email.com`) | Error "El correo electrónico ya está registrado.", sigue en `/register`, sin token | Mensaje exacto mostrado, sin sesión | Pasa | `capturas/SP-02-Registro-con-un-correo-que-ya-existe.png` |
| SP-03 | ESC01 | Contraseña y confirmación distintas | Error "Las contraseñas no coinciden.", sin sesión | Mensaje exacto mostrado, sin sesión | Pasa | `capturas/SP-03-Registro-con-contrasenas-que-no-coinciden.png` |
| SP-04 | ESC01 | Contraseña de 7 caracteres | La cuenta no se crea | No se creó; el backend respondió "…al menos 8 caracteres" mientras el campo indica "Mínimo 6 caracteres" (ver DEF-01) | Pasa (con defecto DEF-01 anotado) | `capturas/SP-04-Registro-con-una-contrasena-de-7-caracteres.png` |

### ESC02: Inicio de sesión / ESC03: Cierre de sesión (`autenticacion.feature`)

| ID | ESC | Objetivo | Resultado esperado | Resultado obtenido (real) | Estado | Evidencia |
|---|---|---|---|---|---|---|
| SP-05 | ESC02 | Login válido (`juan@email.com`) | Redirige a `/cuenta`, barra muestra "Juan", token guardado | Redirigió a `/cuenta`, "Juan" en la barra, token presente | Pasa | `capturas/SP-05-Inicio-de-sesion-con-credenciales-validas.png` |
| SP-06 | ESC02 | Login con contraseña incorrecta | Error "Credenciales incorrectas. Verifique correo y contraseña.", sigue en `/login`, sin token | Mensaje exacto, sin sesión | Pasa | `capturas/SP-06-Inicio-de-sesion-con-una-contrasena-incorrecta.png` |
| SP-07 | ESC02 | Login con correo no registrado | El mismo mensaje genérico (no revela si el correo existe) | Mismo mensaje genérico | Pasa | `capturas/SP-07-Inicio-de-sesion-con-un-correo-no-registrado-recibe-el-mismo-mensaje-generico.png` |
| SP-08 | ESC03 | Cerrar sesión desde el menú de cuenta | Redirige a `/login`, borra `homara_token`; luego `/cuenta` redirige a `/login` | Todo se cumplió | Pasa | `capturas/SP-08-Cerrar-sesion-desde-el-menu-de-la-cuenta.png` |

### ESC07: Protección de rutas privadas (`rutas-privadas.feature`)

| ID | ESC | Objetivo | Resultado esperado | Resultado obtenido (real) | Estado | Evidencia |
|---|---|---|---|---|---|---|
| SP-09 | ESC07 | Visitante abre `/proyectos` | Redirige a `/login` | Redirigió a `/login` | Pasa | `capturas/SP-09-Una-visitante-sin-sesion-que-abre-proyectos-es-enviada-al-inicio-de-sesion.png` |
| SP-10 | ESC07 | Visitante abre `/cuenta` | Redirige a `/login` | Redirigió a `/login` | Pasa | `capturas/SP-10-Una-visitante-sin-sesion-que-abre-cuenta-es-enviada-al-inicio-de-sesion.png` |
| SP-11 | ESC07 | Visitante abre `/checkout` | Redirige a `/login` | Redirigió a `/login` | Pasa | `capturas/SP-11-Una-visitante-sin-sesion-que-abre-checkout-es-enviada-al-inicio-de-sesion.png` |
| SP-12 | ESC07, ESC06 | Cliente abre `/admin/productos` | Redirige a `/` y no ve el panel | Redirigió a `/`, sin botón "Agregar producto" | Pasa | `capturas/SP-12-Una-clienta-no-puede-entrar-al-panel-de-administracion.png` |
| SP-13 | ESC07, ESC06 | Administrador abre `/admin/productos` (control positivo) | Ve el panel | Panel visible en `/admin/productos` | Pasa | `capturas/SP-13-El-administrador-si-puede-entrar-al-panel-de-administracion.png` |

### ESC09: Búsqueda en el catálogo (`busqueda-catalogo.feature`)

| ID | ESC | Objetivo | Resultado esperado | Resultado obtenido (real) | Estado | Evidencia |
|---|---|---|---|---|---|---|
| SP-14 | ESC09 | Buscar "Porcelanato" | Más de 0 resultados, el contador coincide con las tarjetas y al menos un nombre contiene "Porcelanato" | Se cumplió | Pasa | `capturas/SP-14-Busqueda-con-resultados.png` |
| SP-15 | ESC09 | Buscar "TALADRO" (mayúsculas) | Encuentra productos "Taladro…" | Se cumplió | Pasa | `capturas/SP-15-La-busqueda-no-distingue-mayusculas-de-minusculas.png` |
| SP-16 | ESC09 | Buscar un término inexistente | "0 productos…", ninguna tarjeta y el mensaje "No se encontraron productos coincidentes" | Se cumplió | Pasa | `capturas/SP-16-Busqueda-sin-coincidencias.png` |

### ESC13 a ESC16: Carrito y totales (`carrito.feature`)

| ID | ESC | Objetivo | Resultado esperado | Resultado obtenido (real) | Estado | Evidencia |
|---|---|---|---|---|---|---|
| SP-17 | ESC13 | Agregar un producto | Contador de la barra = 1; el ítem aparece en `/carrito` con cantidad 1; el backend registra 1 unidad | Se cumplió | Pasa | `capturas/SP-17-Agregar-un-producto-al-carrito.png` |
| SP-18 | ESC13 | Agregar dos veces el mismo producto | Una sola línea con cantidad 2; contador = 2 | Se cumplió | Pasa | `capturas/SP-18-Agregar-dos-veces-el-mismo-producto-acumula-la-cantidad-en-una-sola-linea.png` |
| SP-19 | ESC14, ESC16 | Aumentar con "+" | Cantidad 2, subtotal 500.000, backend 2 unidades | Se cumplió | Pasa | `capturas/SP-19-Aumentar-la-cantidad-recalcula-el-subtotal.png` |
| SP-20 | ESC14, ESC16 | Disminuir con "-" de 2 a 1 | Subtotal 250.000, vuelve a cobrar envío, total 275.000, contador = 1 | Se cumplió | Pasa | `capturas/SP-20-Disminuir-la-cantidad-vuelve-a-cobrar-el-envio.png` |
| SP-21 | ESC15 | Eliminar el ítem | Mensaje "Tu carrito está vacío", contador = 0, backend 0 unidades | Se cumplió | Pasa | `capturas/SP-21-Eliminar-el-unico-producto-deja-el-carrito-vacio.png` |
| SP-22 | ESC16 | Subtotal < 500.000 (1 × 250.000) | Envío 25.000, total 275.000 | Envío $ 25.000, total $ 275.000 | Pasa | `capturas/SP-22-Con-subtotal-menor-a-500-000-se-cobra-el-envio.png` |
| SP-23 | ESC16 | Subtotal > 500.000 (3 × 250.000) | Envío "Gratis", total 750.000 | Envío "Gratis", total $ 750.000 | Pasa | `capturas/SP-23-Con-subtotal-mayor-a-500-000-el-envio-es-gratis.png` |
| SP-24 | ESC16 | Subtotal = 500.000 (valor límite, RN-031 "igual o mayor") | Envío "Gratis", total 500.000 | Envío **$ 25.000**, total **$ 525.000** | Fallaba por DEF-02; **pasa tras la corrección** | `capturas/SP-24-Con-subtotal-exactamente-igual-a-500-000-el-envio-es-gratis.png` |

### ESC27 / ESC28: Checkout (`checkout.feature`)

| ID | ESC | Objetivo | Resultado esperado | Resultado obtenido (real) | Estado | Evidencia |
|---|---|---|---|---|---|---|
| SP-25 | ESC27 | Pagar sin teléfono, dirección, ciudad ni departamento | El navegador bloquea el envío (campos `:invalid`), sigue en `/checkout`, 0 pedidos, el carrito intacto | Campos `phone`, `address`, `city`, `state` inválidos; 0 pedidos | Pasa | `capturas/SP-25-El-navegador-bloquea-el-pago-si-faltan-los-datos-de-envio.png` |
| SP-26 | ESC27 | Validación propia de la app con campos vacíos (saltando la validación nativa) | Toast de advertencia "Por favor completa todos los campos requeridos.", 0 pedidos | Toast mostrado, 0 pedidos | Pasa | `capturas/SP-26-La-aplicacion-avisa-si-faltan-datos-aunque-se-salte-la-validacion-del-navegador.png` |
| SP-27 | ESC27 | Datos de envío con solo espacios ("   ") | Se tratan como vacíos: toast de advertencia, 0 pedidos | Se creó el pedido y se mostró "¡Pedido realizado con éxito!" | Fallaba por DEF-03; **pasa tras la corrección** | `capturas/SP-27-Los-datos-de-envio-con-solo-espacios-se-tratan-como-vacios.png` |
| SP-28 | ESC28, ESC27 | Checkout completo | Toast "¡Pedido realizado con éxito!", redirige a `/proyectos`, 1 pedido de 275.000 en el backend, carrito vacío | Se cumplió | Pasa | `capturas/SP-28-Checkout-completo-genera-el-pedido.png` |

### ESC17: Crear proyecto (`proyectos.feature`)

| ID | ESC | Objetivo | Resultado esperado | Resultado obtenido (real) | Estado | Evidencia |
|---|---|---|---|---|---|---|
| SP-29 | ESC17 | Crear un proyecto de piso válido (4,5 × 3,2 m) | Redirige a `/proyectos/{id}` y el detalle muestra el nombre | Se cumplió | Pasa | `capturas/SP-29-Crear-un-proyecto-de-piso-con-datos-validos.png` |
| SP-30 | ESC17 | Guardar sin nombre | Toast "Por favor, ingresa el campo obligatorio: Nombre descriptivo.", sigue en `/proyectos/nuevo` | Se cumplió | Pasa | `capturas/SP-30-No-se-puede-guardar-un-proyecto-sin-nombre.png` |
| SP-31 | ESC17 | Guardar un piso sin ancho | Toast "Por favor, ingresa el campo obligatorio: Ancho (Habitación).", sigue en `/proyectos/nuevo` | Se cumplió | Pasa | `capturas/SP-31-No-se-puede-guardar-un-proyecto-de-piso-sin-el-ancho.png` |

### ESC32: Administración de productos (`admin-productos.feature`)

| ID | ESC | Objetivo | Resultado esperado | Resultado obtenido (real) | Estado | Evidencia |
|---|---|---|---|---|---|---|
| SP-32 | ESC32 | Andrés crea un producto y luego lo elimina | Toast "Producto guardado correctamente", fila visible y producto en la API; tras borrar: toast "Producto eliminado correctamente", tabla sin resultados y producto ausente en la API | Se cumplió | Pasa | `capturas/SP-32-Crear-un-producto-y-luego-eliminarlo.png` |
| SP-33 | ESC32 | Crear un producto con precio 0 | Error "El precio normal debe ser un número positivo válido.", el modal sigue abierto y no se crea nada | Se cumplió | Pasa | `capturas/SP-33-No-se-puede-crear-un-producto-con-precio-0.png` |

---

## 5. Defectos encontrados (corregidos en la refactorización)

| ID | Severidad | Escenario | Descripción | Pasos para reproducir | Esperado | Obtenido |
|---|---|---|---|---|---|---|
| **DEF-01** | Baja | SP-04 (ESC01) | El frontend no cumple RN-002 ("longitud mínima de 8 caracteres"): el formulario de registro indica "Mínimo 6 caracteres" y su validación acepta 6 o más (`app/(shop)/register/page.tsx`). El backend sí exige 8. | Registrarse con una clave de 7 caracteres. | El formulario debería informar y validar el mínimo real (8) antes de enviar. | El formulario deja enviar y aparece el error técnico del backend: "Validación fallida: password: La contraseña debe tener al menos 8 caracteres". |
| **DEF-02** | Media | SP-24 (ESC16) | Valor límite del envío gratis. La regla RN-031 (`VyV/MATRICES/REGLAS DE NEGOCIO.xlsx`) dice "igual o mayor a $500.000 COP → envío gratis", pero el backend usa `subtotal > 500000` (`cart.use-cases.ts` y `order.use-cases.ts`). | Carrito con subtotal de exactamente 500.000 COP. | Envío "Gratis", total 500.000. | Envío 25.000, total 525.000. |
| **DEF-03** | Media | SP-27 (ESC27) | El checkout acepta datos de envío formados solo por espacios. El atributo `required` del navegador y la validación de React (`!campo`) consideran "   " como lleno, y el backend no exige ni recorta esos campos (`order.validator.ts`). Se crea un pedido sin dirección real. | Checkout con teléfono, dirección, ciudad y departamento = "   ". | Advertencia "Por favor completa todos los campos requeridos." y ningún pedido (condición del ESC27 en la matriz de trazabilidad). | "¡Pedido realizado con éxito!" y pedido creado. |

**Observación sobre DEF-02:** la documentación del equipo se contradice. RN-031 dice "igual o mayor", mientras que el
caso CP-067 de `CASOS Y ESCENARIOS DE PRUEBAS.xlsx` y el texto de la interfaz ("Envío gratis en compras mayores a
$ 500.000") esperan cobrar envío en exactamente 500.000. Esta suite toma como referencia RN-031 y el alcance que se
definió para ella (">= 500.000"). Si el equipo decide que la regla correcta es "mayor que", hay que corregir RN-031
y quitar la etiqueta `@fail` de SP-24.

### Observaciones adicionales (no automatizadas como defecto)

- **OBS-01:** en `/checkout` todos los campos obligatorios tienen `required`, así que el toast de advertencia
  de la app solo aparece si se salta la validación nativa (SP-26). No es un error, pero esa validación queda como
  código casi inalcanzable.
- **OBS-02:** tras pagar, la app redirige a `/proyectos` y no al historial de pedidos (`/cuenta`), lo que puede
  confundir al cliente.
- **OBS-03 (API):** al eliminar un producto que ya tiene pedidos, `DELETE /api/v1/products/{id}` responde
  "Error de integridad de datos. La entidad referenciada no existe.", un mensaje engañoso: la entidad sí existe y el
  problema es que está referenciada por pedidos. Se detectó al preparar los datos de prueba (relacionado con RN-060).
- **OBS-04:** el resumen del carrito dice "Subtotal (1 productos)" (concordancia en plural).

---

## 6. Estructura de la carpeta

```
e2e-screenplay/
├── package.json / package-lock.json / tsconfig.json / playwright.config.ts / .gitignore
├── screenplay/
│   ├── actores/        Actores.ts, ElencoHomara.ts (Cast + habilidades), escenario.ts (fixtures), NotasDelActor.ts
│   ├── datos/          entorno.ts, usuarios.ts, productos.ts, formato.ts
│   ├── interacciones/  EnviarSinValidacionNativa.ts, LlamarALaApi.ts, OlvidarSesion.ts, GuardarEvidencia.ts
│   ├── tareas/         IniciarSesion, Registrarse, CerrarSesion, BuscarProducto, AgregarAlCarrito,
│   │                   GestionarCarrito (IrAlCarrito, ModificarCantidad, EliminarDelCarrito),
│   │                   CompletarCheckout (IrAlCheckout), CrearProyecto,
│   │                   AdministrarProductos (CrearProductoAdmin, EliminarProductoAdmin, ...),
│   │                   PrepararDatosPorApi (RegistrarClientePorApi, AsegurarProductoDePrueba, ...)
│   ├── preguntas/      UrlActual, MensajeDeError, Notificacion, CantidadEnCarrito, TotalDelCarrito,
│   │                   NombreDelUsuario, ResultadosDeBusqueda, SesionDelNavegador, CamposInvalidos,
│   │                   NombreDelProyecto, EstadoEnElBackend (PedidosDelCliente, CarritoEnElBackend, ProductoEnElCatalogo)
│   └── ui/             Un archivo de PageElements por página
├── features/           Escenarios Gherkin: autenticacion, rutas-privadas, busqueda-catalogo, carrito, checkout,
│                       proyectos, admin-productos (.feature)
├── pasos/              fixtures.ts (enlace Gherkin ↔ Serenity/JS, parámetros, ganchos) y un *.pasos.ts por dominio:
│                       comunes, autenticacion, catalogo, carrito, checkout, proyectos, admin
└── evidencias/
    ├── consola-corrida-1.txt, consola-corrida-2.txt, consola-corrida-3.txt   (salida completa con cada paso)
    ├── reporte-cucumber.html   (escenarios Gherkin con el resultado de cada paso y su captura)
    ├── resultados-junit.xml
    ├── reporte-html/   (reporte de Playwright: npm run reporte)
    └── capturas/       (33 PNG: la captura final de cada escenario)
```

`node_modules/`, `test-results/` y `.features-gen/` (pruebas generadas por `bddgen`) están excluidos en
`e2e-screenplay/.gitignore`.

## 7. Nota para el pipeline del frontend

El `tsconfig.json` raíz del frontend excluye `e2e-screenplay`, así que un `npm run build` en CI que solo
instale las dependencias de la raíz no intenta resolver los módulos `@serenity-js/*`. ESLint de la raíz ya pasa sin
errores sobre esta carpeta (ignora `.features-gen/`, que es código generado).
