# Pruebas E2E de Homara con Katalon Recorder

Versión para **Katalon Recorder** (la extensión de Chrome, Edge y Firefox sucesora de Selenium IDE) de los 15 casos
de prueba del proyecto de Katalon Studio que está en la carpeta superior (`katalon/`). Los flujos, los localizadores,
los datos y las verificaciones son los mismos; aquí están escritos como comandos Selenese (`comando | objetivo | valor`)
en el formato nativo de Katalon Recorder.

> **Estado:** las suites están **pendientes de ejecución en Katalon Recorder**. Las columnas "Resultado obtenido" y
> "Evidencia" de la [tabla de casos](#5-casos-de-prueba) las diligencia el equipo después de correr las suites.
> Antes de entregarlas se hizo una validación previa con un intérprete de Selenese propio contra la aplicación real
> (ver [sección 8](#8-validación-previa)); esa validación **no reemplaza** la ejecución en Katalon Recorder.

---

## 1. Requisitos

| Requisito | Detalle |
|---|---|
| Katalon Recorder | Extensión instalada desde la Chrome Web Store, Edge Add-ons o Firefox Add-ons (versión 5.x o superior). |
| Navegador | Chrome, Edge o Firefox. La ventana donde se reproducen las pruebas debe estar **maximizada** (ancho ≥ 1024 px): el menú de usuario de la barra de navegación solo se ve en escritorio. |
| Aplicación | Frontend en `http://localhost:3000` (hace proxy de `/api/v1` al backend en `:5000`) con los datos semilla. Las URL de las suites son absolutas: si la aplicación corre en otra dirección hay que reemplazar `http://localhost:3000` en los `.html`. |
| Usuarios semilla | `admin@homara.co` / `123456` (ADMIN) y `juan@email.com` / `123456` (CUSTOMER). |
| Catálogo | Deben existir con stock *Pintura Koraza Caneca 5 Galones* (549.000 COP) y *Rodillo de Pintura Antigoteo 23cm*. |
| Ejecución aislada | No correr al mismo tiempo Serenity/JS ni Katalon Studio contra la misma aplicación: todos usan el carrito de `juan@email.com`. |

## 2. Estructura

```
katalon/recorder/
├── TS_Regresion_Completa.html     Suite con los 15 casos (TC01 a TC15)
├── TS_Casos_Positivos.html        TC01, TC03, TC05, TC07, TC08, TC10, TC13, TC14, TC15
├── TS_Casos_Negativos.html        TC02, TC04, TC06, TC09, TC11, TC12
├── datos/                         Archivos CSV para el panel "Test Data" (data-driven)
│   ├── login_valido.csv                       caso, correo, clave, nombreEsperado           (TC01, 2 filas)
│   ├── login_invalido.csv                     caso, correo, clave, mensajeEsperado          (TC02, 3 filas)
│   ├── registro_valido.csv                    nombre, apellido, prefijoEmail, dominioEmail, password (TC03, 2 filas)
│   ├── registro_contrasenas_distintas.csv     nombre, apellido, prefijoEmail, password, confirmacion, mensajeEsperado (TC04, 2 filas)
│   ├── busqueda_con_resultados.csv            termino, minimoResultados                     (TC05, 3 filas)
│   ├── busqueda_sin_resultados.csv            termino, mensajeEsperado                      (TC06, 2 filas)
│   └── rutas_privadas.csv                     ruta                                          (TC11, 3 filas)
└── README.md
```

Cada suite es un archivo HTML con una `<table>` por caso: la fila del `<thead>` tiene el nombre del caso y cada fila del
`<tbody>` es un comando (`comando | objetivo | valor`). Es el mismo formato que genera el botón **Export** de Katalon
Recorder, por eso se abre directamente con **Open test suite**.

Los datos de los CSV salen de los Data Files del proyecto de Studio. Diferencias:

- Las columnas de credenciales se llaman `correo` y `clave` (no `email`/`password` como en Studio). En Katalon Recorder
  las variables de un CSV tienen prioridad sobre las variables guardadas con `storeEval`; si un CSV tuviera una columna
  `email`, taparía la variable `${email}` que TC03 genera con la marca de tiempo.
- Los prefijos de correo de registro empiezan por `kr.` para distinguir los usuarios creados por esta suite.
- TC01 (login válido, cliente y admin) y TC11 (las tres rutas privadas) también son data-driven.
- Los CSV están en UTF-8 sin BOM y **sin salto de línea al final**: el lector CSV de Katalon Recorder (PapaParse)
  convierte una línea vacía final en una fila extra con valores vacíos.

## 3. Cómo importar y ejecutar en Katalon Recorder

1. Levantar backend y frontend y comprobar que `http://localhost:3000` responde.
2. Abrir una pestaña con `http://localhost:3000` en una ventana **maximizada** y, desde esa ventana, abrir Katalon
   Recorder (icono de la extensión). La reproducción ocurre en la pestaña activa de esa ventana.
3. **Importar las suites:** en el panel *Test Suites* pulsar **Open test suite** (o el menú `+` > *Open Test Suites*) y
   elegir los `.html` de esta carpeta. Opciones:
   - solo `TS_Regresion_Completa.html` (los 15 casos), o
   - `TS_Casos_Positivos.html` y `TS_Casos_Negativos.html` (los mismos 15 casos repartidos).

   No conviene cargar las tres y usar *Play all*, porque se ejecutarían 30 casos (cada caso dos veces).
4. **Cargar los datos:** en el panel **Test Data** (sección *Data Driven*) pulsar `+` y seleccionar los **7 archivos**
   de `datos/` (se pueden elegir todos a la vez). No cambiarles el nombre: los comandos `loadVars` los buscan por nombre
   (`loadVars | login_invalido.csv`). Los archivos quedan guardados en la extensión; si se cambia un CSV hay que
   borrarlo del panel (clic derecho > *Delete*) y volver a cargarlo.
5. **Velocidad:** menú `⋮` (*More*) > **Speed**. Las suites esperan de forma explícita antes de cada interacción, así
   que funcionan en la velocidad máxima (*Fast*). Si en el equipo aparecen fallos intermitentes, bajar uno o dos niveles.
6. **Ejecutar:**
   - **P. Suite** (*Play test suite*): ejecuta la suite seleccionada en el panel.
   - **P. All** (*Play all test suites*): ejecuta en orden todas las suites cargadas (útil con Positivos + Negativos).
   - **Play**: ejecuta solo el caso seleccionado (sirve para repetir un caso que falló).

   Durante la ejecución no usar la pestaña ni cambiar de ventana. Los casos en verde pasaron y en rojo fallaron; los
   contadores *Passed* / *Failed* quedan al final del panel.

### Problema conocido: CSV en Windows

Katalon Recorder decide el tipo de archivo de datos por el tipo MIME que le entrega el navegador: si no es `text/csv`
lo trata como JSON. En Windows con Excel instalado, `.csv` suele quedar registrado como `application/vnd.ms-excel` y
el primer `loadVars` falla con un error de JSON (*Unexpected token…*). Solución (una sola vez, sin permisos de
administrador), en una consola `cmd`:

```bat
reg add "HKCU\Software\Classes\.csv" /v "Content Type" /t REG_SZ /d "text/csv" /f
```

Después cerrar por completo el navegador, abrirlo de nuevo, borrar los CSV del panel *Test Data* y volver a cargarlos.
Para comprobarlo rápido se puede ejecutar solo TC06 (es corto y usa `loadVars`).

## 4. Evidencia de la ejecución

Después de correr una suite:

1. **Log:** pestaña **Log** del panel inferior > **Save**. Descarga un `.html` con todos los pasos ejecutados, los
   mensajes `echo` (fila de datos usada, correo generado, conteos) y los errores en rojo. Es el reporte de la ejecución.
2. **Capturas:** pestaña **Screenshots** > **Download All**. Están las capturas de `captureEntirePageScreenshot`
   (nombradas `TCxx_...`) y las que Katalon Recorder toma solo en cada paso que falla (`fail-<caso>-<paso>`).
3. **Resumen visual:** una captura de pantalla del panel de Katalon Recorder con los casos en verde/rojo y los
   contadores *Passed* / *Failed*.
4. **Opcional:** **Upload report** sube la ejecución a Katalon TestOps (requiere cuenta) y genera un reporte web.

Guardar todo en la carpeta de evidencias del informe y enlazarlo en la columna "Evidencia" de la tabla de la sección 5.
Si se edita un caso dentro de Katalon Recorder, exportar la suite con **Export** y reemplazar el `.html` de esta carpeta.

---

## 5. Casos de prueba

Escenarios cubiertos: ESC01 registro, ESC02 login, ESC03 logout, ESC07 rutas privadas, ESC09 búsqueda, ESC13-ESC16
carrito, ESC17 proyecto, ESC27/ESC28 checkout, ESC32 administración de productos (misma asignación que el proyecto de
Studio). Cada caso empieza con la sesión limpia (`open` de la página de inicio, `runScript` que borra `localStorage`
con el token `homara_token` y `refresh`).

> **Resultado obtenido** y **Evidencia**: pendientes; los diligencia el equipo tras ejecutar en Katalon Recorder.

| ID (nombre del caso) | ESC | Objetivo | Datos | Resultado esperado | Resultado obtenido | Evidencia |
|---|---|---|---|---|---|---|
| TC01_Login_exitoso_ESC02 | ESC02 | Iniciar sesión con credenciales válidas | `login_valido.csv`: cliente (Juan) y admin (Admin) | Redirección a `/cuenta`, título "Mi Cuenta", nombre del usuario en la barra y token `homara_token` guardado | Pendiente (ejecución en KR) | Pendiente |
| TC02_Login_invalido_ESC02 | ESC02 | Impedir el acceso con credenciales inválidas | `login_invalido.csv`: contraseña incorrecta (cliente), correo no registrado, contraseña incorrecta (admin) | Mensaje "Credenciales incorrectas. Verifique correo y contraseña.", se permanece en `/login` y no hay token | Pendiente (ejecución en KR) | Pendiente |
| TC03_Registro_exitoso_ESC01 | ESC01 | Registrar un usuario nuevo | `registro_valido.csv` (2 filas); correo único `prefijo.<Date.now()>@homara.co` creado con `storeEval` en `${email}`; contraseñas de 8 o más caracteres | Redirección a `/cuenta`, nombre registrado en la barra, token guardado y sin mensaje de error | Pendiente (ejecución en KR) | Pendiente |
| TC04_Registro_contrasenas_distintas_ESC01 | ESC01 | Rechazar el registro si la confirmación no coincide | `registro_contrasenas_distintas.csv` (2 filas) | Mensaje "Las contraseñas no coinciden.", se permanece en `/register` y no hay token | Pendiente (ejecución en KR) | Pendiente |
| TC05_Busqueda_con_resultados_ESC09 | ESC09 | Buscar productos existentes | `busqueda_con_resultados.csv`: Porcelanato, Taladro, pintura (mínimo 1) | `Resultados para: "<término>"`, conteo "N productos técnicos encontrados" con N ≥ mínimo, tarjetas visibles y sin estado vacío | Pendiente (ejecución en KR) | Pendiente |
| TC06_Busqueda_sin_resultados_ESC09 | ESC09 | Mostrar el estado vacío con un término inexistente | `busqueda_sin_resultados.csv` (2 términos) | "No se encontraron productos coincidentes", "0 productos técnicos encontrados" y ninguna tarjeta | Pendiente (ejecución en KR) | Pendiente |
| TC07_Agregar_al_carrito_validar_total_ESC13_ESC16 | ESC13, ESC16 | Agregar un producto y verificar los montos | Cliente; *Pintura Koraza Caneca 5 Galones* (549.000 COP) | Toast "Producto agregado al carrito exitosamente"; en `/carrito`: subtotal $ 549.000, envío "Gratis" y total $ 549.000 | Pendiente (ejecución en KR) | Pendiente |
| TC08_Eliminar_del_carrito_ESC15 | ESC15 | Quitar un producto del carrito | Cliente; *Rodillo de Pintura Antigoteo 23cm* | El ítem desaparece y se muestra "Tu carrito está vacío" | Pendiente (ejecución en KR) | Pendiente |
| TC09_Checkout_campos_faltantes_ESC27 | ESC27 | Impedir el pedido con datos obligatorios vacíos | Cliente; Rodillo; se borran Dirección y Ciudad | El formulario no se envía: `#address` y `#city` con `validity.valueMissing = true` (atributo `required`), mensaje de validación del navegador, sin toast de pedido y se permanece en `/checkout` | Pendiente (ejecución en KR) | Pendiente |
| TC10_Checkout_completo_genera_pedido_ESC28 | ESC28 | Crear un pedido con todos los datos | Cliente; Rodillo; Juan Pérez, 3001234567, Calle 10 # 20-30, Medellín, Antioquia, 050001; pago contra entrega (`cash`) | Toast "¡Pedido realizado con éxito!", redirección a `/proyectos` y carrito vacío | Pendiente (ejecución en KR) | Pendiente |
| TC11_Ruta_privada_sin_sesion_ESC07 | ESC07 | Proteger las rutas privadas | `rutas_privadas.csv`: `/proyectos`, `/cuenta`, `/checkout`; sin sesión | Cada ruta redirige a `/login` y muestra el formulario | Pendiente (ejecución en KR) | Pendiente |
| TC12_Cliente_no_accede_admin_ESC07_ESC32 | ESC07, ESC32 | Restringir el panel por rol | Cliente (CUSTOMER) | `/admin` redirige a `/`; no aparece el menú de administración ni la opción "Panel Admin" | Pendiente (ejecución en KR) | Pendiente |
| TC13_Admin_crea_y_elimina_producto_ESC32 | ESC32 | CRUD básico de productos | Admin; "Producto Katalon `<Date.now()>`", precio 15000, stock 10, unidad "unidad", primera categoría | Toast "Producto guardado correctamente" y fila visible; tras eliminar, toast "Producto eliminado correctamente" y la fila desaparece | Pendiente (ejecución en KR) | Pendiente |
| TC14_Crear_proyecto_valido_ESC17 | ESC17 | Crear un proyecto de piso | Cliente; "Proyecto Katalon `<Date.now()>`", largo 4.5, ancho 3.2 | Navegación a `/proyectos/{id}` con el nombre del proyecto como título | Pendiente (ejecución en KR) | Pendiente |
| TC15_Cerrar_sesion_ESC03 | ESC03 | Cerrar la sesión | Cliente | Redirección a `/login`, enlace "Iniciar Sesión" visible, token eliminado y `/cuenta` vuelve a redirigir a `/login` | Pendiente (ejecución en KR) | Pendiente |

### Efectos sobre los datos

- TC03 crea dos usuarios nuevos en cada ejecución (`kr.registro.<marca>@homara.co`, `kr.cliente.<marca>@homara.co`).
- TC10 crea un pedido real de `juan@email.com` y descuenta stock del Rodillo.
- TC13 crea un producto y lo elimina en el mismo caso (solo toca el producto que crea).
- TC14 crea un proyecto de `juan@email.com`.
- TC07 a TC10 vacían el carrito de `juan@email.com` al empezar; TC07 deja la Pintura Koraza en el carrito y TC09 lo
  deja vacío al terminar.

---

## 6. Comandos usados y estrategia de espera

| Tipo | Comandos |
|---|---|
| Navegación | `open` (URL absolutas), `refresh` |
| Interacción | `click`, `type`, `sendKeys` (`${KEY_ENTER}` en el buscador), `select` (`index=1`, `value=unidad`), `setText` |
| Esperas | `waitForVisible`, `waitForElementPresent`, `waitForElementNotPresent`, `waitForEditable`, `waitForText`, `waitForLocation`, `waitForEval` |
| Verificaciones (continúan si fallan) | `verifyText`, `verifyValue`, `verifyVisible`, `verifyElementPresent`, `verifyElementNotPresent`, `verifyChecked`, `verifyLocation`, `verifyEval`, `verifyNotEval` |
| Variables y scripts | `storeEval`, `storeText`, `storeXpathCount`, `runScript`, `echo` |
| Control de flujo | `loadVars` / `endLoadVars` (data-driven), `while` / `endWhile` (vaciar el carrito) |
| Evidencia | `captureEntirePageScreenshot` en los puntos clave de cada caso |

Localizadores con prefijo explícito: `id=`, `css=` y `xpath=` (los mismos selectores del Object Repository de Studio).
Los patrones de texto usan la sintaxis de Selenium: texto exacto por defecto (*glob*), `regexp:` y `regexpi:` (sin
distinguir mayúsculas).

**Estrategia de espera:**

- **No se usa `pause`.** Todas las esperas son explícitas y terminan en cuanto se cumple la condición (máximo 30 s, el
  tiempo por defecto de Katalon Recorder).
- Antes de cada `type`, `click` o `select` hay un `waitForVisible` del elemento; en botones que pueden estar
  deshabilitados (enviar, agregar al carrito, guardar) también `waitForEditable`.
- **Animaciones de entrada:** varias vistas aparecen con animaciones CSS que empiezan con opacidad 0, y Katalon Recorder
  no escribe ni hace clic en un elemento invisible. Después de cada `open`, `refresh`, `click` o `sendKeys`, y antes de la
  siguiente interacción, se espera a que no quede ninguna animación finita en curso:
  `waitForEval | document.getAnimations().filter(...).length | 0` (las animaciones infinitas, como los spinners, se
  ignoran).
- Navegaciones del router de Next.js (no recargan la página): `waitForLocation | regexp:/cuenta$` y luego
  `verifyLocation`.
- Desapariciones: `waitForElementNotPresent` seguido de `verifyElementNotPresent`.
- Vaciar el carrito: se cuenta con `storeXpathCount` cuántos botones "Eliminar" hay y un `while` elimina uno por uno;
  tras cada clic, `waitForEval` espera a que el carrito termine de recargar (vuelve el título) **y** tenga exactamente
  un ítem menos.

**Otras decisiones de diseño:**

- Al carrito se entra con el enlace de la barra de navegación y no con `open` (ver hallazgo 1).
- En TC14 los campos numéricos con decimales (4.5 y 3.2) se llenan con `setText`. `type` escribe tecla por tecla y en un
  `input type="number"` el valor intermedio `4.` no es válido, así que el campo terminaría en `5`.
- En TC09 los campos se vacían con `type` con valor vacío y se comprueba con `verifyValue` que quedaron vacíos.
- En TC06 el título del estado vacío se compara con `regexpi:` porque se muestra en mayúsculas por CSS.
- Los comandos no contienen los caracteres `<`, `>` ni `&`: Katalon Recorder lee las celdas como HTML y los
  convertiría en entidades. Por eso, por ejemplo, "N ≥ mínimo" se verifica con
  `verifyEval | Math.max(${encontrados}, ${minimoResultados}) === ${encontrados} | true`.
- `verify*` registra el fallo y sigue con el caso; `waitFor*` que vence el tiempo detiene el caso (comportamiento
  estándar de Katalon Recorder).

---

## 7. Hallazgos durante la preparación

1. **El carrito muestra un instante "Tu carrito está vacío" al cargar la página directamente.** Al abrir `/carrito`
   con `open` (recarga completa), la página pinta el carrito vacío durante un momento, mientras se valida la sesión,
   antes de pedir los ítems al backend. Una prueba que cuente los ítems justo en ese momento ve 0. Las suites entran al
   carrito con el enlace de la barra (navegación del lado del cliente, con la sesión ya resuelta), donde no ocurre. Se
   puede reportar como defecto de interfaz menor. **Corregido en el código** (`ui-cart-08`): `/carrito` muestra
   «Cargando carrito...» hasta recibir los ítems, y tras +/−/quitar la lista ya no se reemplaza por el cargador.
2. **Animaciones con opacidad 0:** las tarjetas de login, registro y otras vistas entran con una animación que empieza
   con opacidad 0 (unos 500 ms). Sin la espera de animaciones descrita arriba, `type` falla con *Element is not
   currently interactable*.
3. **Contraseña mínima inconsistente** (ya reportado en Studio): el formulario de registro acepta 6 caracteres, pero el
   backend exige 8. Los datos de TC03 usan 8 o más.
4. **Umbral de envío gratis (DEF-02, ver `e2e-screenplay/README.md`):** el backend da envío gratis solo con subtotal
   estrictamente mayor que 500.000 COP. TC07 usa un producto de 549.000 COP, por encima del umbral, así que no depende
   de ese defecto; el valor límite 500.000 lo cubre la suite Serenity/JS.

---

## 8. Validación previa

Katalon Recorder no se puede ejecutar sin interfaz gráfica en el equipo donde se prepararon las suites. Por eso, antes
de entregarlas, se ejecutaron con un **intérprete de Selenese** hecho para esto (Node.js + Playwright 1.63, Chromium
1366×900), guardado fuera del repositorio. El intérprete:

- lee los mismos `.html` con el mismo algoritmo de importación de Katalon Recorder (`DOMParser`, nombre del caso en el
  `<thead>`, objetivo, valor y opciones de cada fila);
- carga los CSV de `datos/` con PapaParse (`header: true`, igual que Katalon Recorder) y repite el bloque
  `loadVars` / `endLoadVars` por cada fila;
- reproduce la expansión de `${variables}` de Katalon Recorder (prioridad de las variables del CSV, `storeEval` con las
  variables declaradas, `${KEY_ENTER}`), los bloques `while` / `endWhile`, los patrones `glob` / `regexp:` /
  `regexpi:`, la diferencia entre `verify` (continúa) y `assert` / `waitFor` (detiene el caso), la espera implícita de
  1 s ante un elemento no encontrado y el tiempo máximo de 30 s de los `waitFor*`;
- ejecuta los comandos como lo hace la extensión: eventos sintéticos para `click`, escritura tecla por tecla con
  eventos de teclado e `input` para `type`, envío de formulario al presionar Enter, y el texto de `verifyText` calculado
  como en Katalon Recorder (espacios normalizados, espacio duro convertido en espacio).

Antes de usarlo sobre las suites se comprobó que el intérprete detecta fallos: un `verifyText` con texto incorrecto
falla y el caso continúa, un `assertText` incorrecto detiene el caso, un `click` sobre un elemento inexistente detiene el
caso, y el vaciado del carrito funciona con dos productos.

Resultado (12/10/2026), contra la aplicación en `http://localhost:3000`:

| Caso | Resultado | Detalle |
|---|---|---|
| TC01 | OK | 2 filas: cliente "Juan" y admin "Admin" |
| TC02 | OK | 3 filas, mensaje "Credenciales incorrectas. Verifique correo y contraseña." |
| TC03 | OK | 2 filas, usuarios `kr.registro.<marca>` y `kr.cliente.<marca>` registrados y redirigidos a `/cuenta` |
| TC04 | OK | 2 filas, "Las contraseñas no coinciden." |
| TC05 | OK | Porcelanato → 8, Taladro → 2, pintura → 11 productos |
| TC06 | OK | 2 términos, conteo 0 y sin tarjetas |
| TC07 | OK | Subtotal "$ 549.000", envío "Gratis", total "$ 549.000" |
| TC08 | OK | Ítem eliminado y carrito vacío |
| TC09 | OK | `valueMissing` en dirección y ciudad, mensaje del navegador, sin pedido |
| TC10 | OK | Toast de pedido exitoso, redirección a `/proyectos`, carrito vacío |
| TC11 | OK | `/proyectos`, `/cuenta` y `/checkout` → `/login` |
| TC12 | OK | `/admin` → `/` sin opciones de administración |
| TC13 | OK | Producto creado, encontrado en la tabla y eliminado |
| TC14 | OK | Detalle `/proyectos/{id}` con el nombre del proyecto |
| TC15 | OK | Logout, token eliminado, `/cuenta` → `/login` |

`TS_Regresion_Completa` pasó 15/15 en dos corridas, `TS_Casos_Positivos` 9/9 y `TS_Casos_Negativos` 6/6.

Lo que esta validación **no** comprueba es el comportamiento propio de la extensión (importación real del archivo,
carga de los CSV en el panel, velocidad de reproducción, capturas y log), que se verifica al ejecutar en Katalon
Recorder.

---

## 9. Qué debe hacer el equipo

1. Levantar la aplicación con los datos semilla y cerrar cualquier otra suite que use la misma aplicación.
2. Instalar Katalon Recorder y abrirlo desde una ventana maximizada con `http://localhost:3000`.
3. *Open test suite* > `TS_Regresion_Completa.html` (o Positivos + Negativos).
4. *Test Data* > `+` > los 7 CSV de `datos/` (en Windows, si `loadVars` falla, aplicar la solución de la sección 3).
5. *P. Suite* (o *P. All* con Positivos + Negativos).
6. Guardar el log (*Log* > *Save*), las capturas (*Screenshots* > *Download All*) y una captura del panel con los
   resultados.
7. Diligenciar "Resultado obtenido" y "Evidencia" en la tabla de la sección 5.
8. Si un caso falla: revisar en el log el paso en rojo y la captura `fail-...`, repetir solo ese caso con *Play* y, si el
   fallo es de datos (stock, productos), corregir el CSV o el valor del paso.
