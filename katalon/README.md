# Pruebas E2E de Homara con Katalon Studio

> **Dos variantes de los mismos 15 casos:**
>
> | Variante | Ubicación | Formato |
> |---|---|---|
> | Katalon Studio | esta carpeta (`katalon/`) | Proyecto de Studio (`Homara.prj`, scripts Groovy, Object Repository) |
> | **Katalon Recorder** | [`recorder/`](recorder/README.md) | Suites HTML (Selenese) para la extensión de navegador + CSV de datos |
>
> **El equipo ejecuta con Katalon Recorder.** Las instrucciones de importación, ejecución y evidencia están en
> [`recorder/README.md`](recorder/README.md). Este documento describe la variante de Studio, que se conserva como
> referencia de flujos, localizadores y datos.

Proyecto de Katalon Studio con 15 casos de prueba E2E de la tienda Homara (frontend Next.js + backend Express).
Cubre registro, login, logout, rutas privadas, búsqueda, carrito, checkout, proyectos y la gestión de productos del administrador.

> **Estado:** el proyecto está **pendiente de ejecución en Katalon Studio**. Las columnas "Resultado obtenido" y
> "Evidencia" de la tabla de casos se diligencian después de correr las suites en Katalon.
> Lo que sí se hizo antes es una validación previa de los localizadores y de los flujos con Playwright
> (ver [Validación previa de localizadores](#validación-previa-de-localizadores)). **Esa validación no reemplaza
> la ejecución en Katalon.**

---

## 1. Requisitos

| Requisito | Detalle |
|---|---|
| Katalon Studio | 9.x o 10.x (usa Selenium 4; el keyword `homara.Acciones` usa `WebDriverWait(driver, Duration)`). Sirve la edición gratuita para ejecutar desde la interfaz. |
| Navegador | Google Chrome actualizado. Katalon descarga el ChromeDriver correspondiente (*Tools > Update WebDrivers > Chrome* si falla). |
| Aplicación | Frontend en `http://localhost:3000` (hace proxy de `/api/v1` al backend en `:5000`). Backend y base de datos con los datos semilla. |
| Usuarios semilla | `admin@homara.co` / `123456` (ADMIN) y `juan@email.com` / `123456` (CUSTOMER). |
| Datos de catálogo | Los productos *Pintura Koraza Caneca 5 Galones* (549.000 COP) y *Rodillo de Pintura Antigoteo 23cm* deben existir con stock. |
| Resolución | La ventana se maximiza (diseño de escritorio, ancho ≥ 768 px), necesario para el menú de usuario de la barra de navegación. |
| Codificación | Los scripts y los CSV están en UTF-8 (hay tildes y "ñ" en los textos esperados). |

## 2. Estructura del proyecto

```
katalon/
├── Homara.prj                      Archivo del proyecto (abrir este)
├── Profiles/default.glbl           Variables globales (baseUrl, credenciales, timeout)
├── Object Repository/              70 objetos de prueba (.rs) agrupados por página
│   ├── Comunes/  Navbar/  Pagina_Login/  Pagina_Registro/  Pagina_Cuenta/
│   ├── Pagina_Catalogo/  Pagina_Producto/  Pagina_Carrito/  Pagina_Checkout/
│   └── Pagina_Proyecto/  Pagina_Admin_Productos/
├── Test Cases/<Módulo>/TCxx_*.tc   Metadatos de cada caso (descripción con ESC, variables)
├── Scripts/<Módulo>/TCxx_*/Script<timestamp>.groovy   Script de cada caso (misma ruta que el .tc)
├── Data Files/                     6 archivos de datos CSV (.dat + .csv)
├── Keywords/homara/Acciones.groovy Custom keywords reutilizables
├── Test Listeners/HomaraListener.groovy  Captura en fallo y cierre del navegador
├── Test Suites/                    3 Test Suites + 1 Test Suite Collection
├── settings/                       Configuración de ejecución (timeouts, capturas, Chrome)
└── README.md
```

### Variables globales (perfil `default`)

| Variable | Valor | Uso |
|---|---|---|
| `baseUrl` | `http://localhost:3000` | URL base de la aplicación |
| `adminEmail` / `adminPassword` | `admin@homara.co` / `123456` | Usuario ADMIN (TC13) |
| `clienteEmail` / `clientePassword` | `juan@email.com` / `123456` | Usuario CUSTOMER (TC01, TC07 a TC10, TC12, TC14, TC15) |
| `clienteNombre` | `Juan` | Nombre esperado en la barra de navegación |
| `timeout` | `15` | Segundos máximos de cada espera explícita |

Si la aplicación corre en otro puerto o servidor, basta con cambiar `baseUrl` (o crear otro perfil en *Profiles*).

### Custom keywords (`Keywords/homara/Acciones.groovy`)

| Keyword | Qué hace |
|---|---|
| `abrirNavegador(ruta)` | Abre el navegador, lo maximiza y navega a `baseUrl + ruta`. |
| `navegarA(ruta)` | Navega a una ruta relativa de la aplicación. |
| `esperarUrl(regex)` | Espera explícita (WebDriverWait) hasta que la URL cumpla la expresión regular; si no, marca el caso como fallido. |
| `limpiarSesion()` | Borra `localStorage` (token `homara_token`), `sessionStorage` y cookies. |
| `iniciarSesion(email, password)` | Limpia la sesión, hace login desde `/login` y espera la redirección a `/cuenta` y el nombre en la barra. |
| `cerrarSesion()` | Abre el menú de usuario, pulsa "Cerrar Sesión" y espera `/login`. |
| `limpiarCarrito()` | Vacía el carrito del usuario autenticado eliminando ítem por ítem, esperando la recarga tras cada clic. |
| `agregarProductoAlCarrito(termino, nombre)` | Busca el producto en el catálogo, abre el detalle, lo agrega y verifica el toast. |
| `leerLocalStorage(clave)` | Devuelve un valor de `localStorage` (para verificar el token). |

Uso: `CustomKeywords.'homara.Acciones.iniciarSesion'(GlobalVariable.clienteEmail, GlobalVariable.clientePassword)`

### Data Files (CSV, UTF-8, con encabezado)

| Data File | Columnas | Filas | Usado por |
|---|---|---|---|
| `Login_Credenciales_Validas` | caso, correo, clave, nombreEsperado | 2 (cliente, admin) | TC01 |
| `Login_Credenciales_Invalidas` | caso, correo, clave, mensajeEsperado | 3 | TC02 |
| `Registro_Datos_Validos` | nombre, apellido, prefijoEmail, dominioEmail, clave | 2 | TC03 |
| `Registro_Contrasenas_Distintas` | nombre, apellido, prefijoEmail, clave, confirmacion, mensajeEsperado | 2 | TC04 |
| `Busqueda_Con_Resultados` | termino, minimoResultados | 3 (Porcelanato, Taladro, pintura) | TC05 |
| `Busqueda_Sin_Resultados` | termino, mensajeEsperado | 2 | TC06 |

El enlace de datos (*data binding*) se hace en las Test Suites: cada columna del CSV se asocia a la variable del caso (`correo` → `email`, `clave` → `password`; el resto por nombre)
y se ejecuta una iteración por fila. Si un caso se ejecuta solo (fuera de una suite) usa los
valores por defecto de sus variables, que coinciden con la primera fila del CSV.

### Test Suites

| Suite | Casos | Data binding |
|---|---|---|
| `TS_Regresion_Completa` | TC01 a TC15 | TC01, TC02, TC03, TC04, TC05, TC06 |
| `TS_Casos_Positivos` | TC01, TC03, TC05, TC07, TC08, TC10, TC13, TC14, TC15 | TC01, TC03, TC05 |
| `TS_Casos_Negativos` | TC02, TC04, TC06, TC09, TC11, TC12 | TC02, TC04, TC06 |
| `TSC_Homara_Positivos_y_Negativos` (Test Suite Collection) | Ejecuta en secuencia `TS_Casos_Positivos` y `TS_Casos_Negativos` en Chrome con el perfil `default` | — |

Con el data binding, `TS_Regresion_Completa` produce 23 ejecuciones de caso (2 + 3 + 2 + 2 + 3 + 2 iteraciones de los
casos con datos, más 9 casos sin datos).

---

## 3. Cómo abrir y ejecutar

### 3.1 Abrir el proyecto

1. Levantar backend y frontend, y comprobar que `http://localhost:3000` responde.
2. En Katalon Studio: *File > Open Project…* y seleccionar la carpeta `katalon` (o el archivo `Homara.prj`).
3. Esperar a que Katalon termine de indexar (genera `Libs/`, `bin/` y `.classpath`, que están en `.gitignore`).
4. Revisar en *Profiles > default* que `baseUrl` apunte a la aplicación.

### 3.2 Ejecutar desde la interfaz (GUI)

- **Un caso:** abrir el caso en *Test Cases* y pulsar *Run* (flecha verde) eligiendo **Chrome**.
- **Una suite:** abrir la suite en *Test Suites* y pulsar *Run > Chrome*. Para ver el binding de datos: pestaña
  *Data Binding* de la suite.
- **La colección:** abrir `TSC_Homara_Positivos_y_Negativos` y pulsar *Execute*.

Recomendación: ejecutar las suites **sin otras pruebas corriendo en paralelo** contra la misma aplicación
(Serenity/JS del mismo repositorio), porque todas comparten el carrito del usuario `juan@email.com`.

### 3.3 Ejecutar por consola (katalonc)

`katalonc` viene con Katalon Studio (también con Katalon Runtime Engine) y requiere una API Key de Katalon
(*Profile > API Keys* en Katalon TestOps / Katalon Platform). En Windows, desde la carpeta de instalación de Katalon:

```bat
katalonc.exe -noSplash -runMode=console ^
  -projectPath="C:\ruta\al\repo\HomaraFrontend\katalon\Homara.prj" ^
  -retry=0 ^
  -testSuitePath="Test Suites/TS_Regresion_Completa" ^
  -executionProfile="default" ^
  -browserType="Chrome" ^
  -reportFolder="Reports/consola" ^
  -reportFileName="reporte_regresion" ^
  -apiKey="<API_KEY>" ^
  --config -webui.autoUpdateDrivers=true
```

Para la colección se cambia `-testSuitePath` por `-testSuiteCollectionPath="Test Suites/TSC_Homara_Positivos_y_Negativos"`
(y se quitan `-browserType` y `-executionProfile`, que ya vienen en la colección). Para ejecución sin ventana se puede
usar `-browserType="Chrome (headless)"`.

El código de salida de `katalonc` es `0` si todo pasó, `1` si hubo fallos y `2` si hubo errores de ejecución.

## 4. Reportes y evidencia

- Cada ejecución de una suite crea una carpeta `Reports/<fecha_hora>/<Suite>/<fecha_hora>/` con:
  - `JUnit_Report.xml` (reporte JUnit, siempre se genera),
  - `execution0.log` y los archivos `.png` de las capturas (`WebUI.takeScreenshot()` en los puntos clave de cada
    caso y la captura automática del listener cuando un caso falla).
- **HTML / CSV / PDF:** en Katalon 9/10 se generan desde la vista del reporte (*Reports* > abrir la ejecución >
  botón *Export*, formatos HTML, CSV o PDF) o activando la generación automática en
  *Project > Settings > Plugins > Basic Report* (si el plugin *Basic Report* está instalado desde Katalon Store).
  Por consola, con el plugin activo, los archivos quedan en la carpeta de `-reportFolder`.
- La carpeta `Reports/` está en `.gitignore`. Para la entrega, copiar el HTML/PDF y las capturas relevantes a la
  carpeta de evidencias del informe y enlazarlas en la columna "Evidencia" de la tabla de abajo.

---

## 5. Casos de prueba

Escenarios del equipo cubiertos: ESC01 registro, ESC02 login, ESC03 logout, ESC07 rutas privadas, ESC09 búsqueda,
ESC13-ESC16 carrito, ESC17 proyecto, ESC27/ESC28 checkout, ESC32 administración de productos.

> **Resultado obtenido** y **Evidencia**: pendientes de diligenciar tras la ejecución en Katalon Studio.

| ID | ESC | Objetivo | Datos | Resultado esperado | Resultado obtenido | Evidencia |
|---|---|---|---|---|---|---|
| TC01 Login exitoso | ESC02 | Iniciar sesión con credenciales válidas | `Login_Credenciales_Validas` (cliente y admin) | Redirección a `/cuenta`, título "Mi Cuenta", nombre del usuario en la barra y token `homara_token` guardado | Pendiente (ejecución en Katalon) | Pendiente |
| TC02 Login inválido | ESC02 | Impedir el acceso con credenciales inválidas (data-driven) | `Login_Credenciales_Invalidas` (3 filas) | Mensaje "Credenciales incorrectas. Verifique correo y contraseña.", se permanece en `/login`, sin token | Pendiente (ejecución en Katalon) | Pendiente |
| TC03 Registro exitoso | ESC01 | Registrar un usuario nuevo | `Registro_Datos_Validos` (2 filas); correo único `prefijo.<timestamp>@dominio`; contraseña ≥ 8 caracteres | Redirección a `/cuenta`, nombre registrado en la barra, token guardado, sin mensaje de error | Pendiente (ejecución en Katalon) | Pendiente |
| TC04 Registro con contraseñas distintas | ESC01 | Rechazar el registro si la confirmación no coincide | `Registro_Contrasenas_Distintas` (2 filas) | Mensaje "Las contraseñas no coinciden.", se permanece en `/register`, sin token | Pendiente (ejecución en Katalon) | Pendiente |
| TC05 Búsqueda con resultados | ESC09 | Buscar productos existentes en el catálogo | `Busqueda_Con_Resultados`: Porcelanato, Taladro, pintura (mínimo 1) | Texto `Resultados para: "<término>"`, conteo "N productos técnicos encontrados" con N ≥ mínimo y tarjetas visibles | Pendiente (ejecución en Katalon) | Pendiente |
| TC06 Búsqueda sin resultados | ESC09 | Mostrar el estado vacío con un término inexistente | `Busqueda_Sin_Resultados` (2 términos) | "No se encontraron productos coincidentes", "0 productos técnicos encontrados" y ninguna tarjeta | Pendiente (ejecución en Katalon) | Pendiente |
| TC07 Agregar al carrito y validar total | ESC13, ESC16 | Agregar un producto y verificar los montos | Cliente; *Pintura Koraza Caneca 5 Galones* (549.000 COP) | Toast "Producto agregado al carrito exitosamente"; en `/carrito`: subtotal $ 549.000, envío "Gratis" (≥ 500.000 COP) y total $ 549.000 | Pendiente (ejecución en Katalon) | Pendiente |
| TC08 Eliminar del carrito | ESC15 | Quitar un producto del carrito | Cliente; *Rodillo de Pintura Antigoteo 23cm* | El ítem desaparece y se muestra "Tu carrito está vacío" | Pendiente (ejecución en Katalon) | Pendiente |
| TC09 Checkout con campos faltantes | ESC27 | Impedir el pedido con datos obligatorios vacíos | Cliente; se borran Dirección y Ciudad | El formulario no se envía: `#address` y `#city` quedan con `valueMissing = true` (validación del navegador), sin toast de éxito y se permanece en `/checkout` | Pendiente (ejecución en Katalon) | Pendiente |
| TC10 Checkout completo genera pedido | ESC28 | Crear un pedido con todos los datos | Cliente; Rodillo; datos de envío de Medellín; pago contra entrega (`cash`) | Toast "¡Pedido realizado con éxito!", redirección a `/proyectos` y carrito vacío | Pendiente (ejecución en Katalon) | Pendiente |
| TC11 Ruta privada sin sesión | ESC07 | Proteger rutas privadas | Sin sesión; rutas `/proyectos`, `/cuenta`, `/checkout` | Cada ruta redirige a `/login` y muestra el formulario | Pendiente (ejecución en Katalon) | Pendiente |
| TC12 Cliente no accede a /admin | ESC07, ESC32 | Restringir el panel por rol | Cliente (CUSTOMER) | `/admin` redirige a `/`; no aparece el menú de administración ni la opción "Panel Admin" | Pendiente (ejecución en Katalon) | Pendiente |
| TC13 Admin crea y elimina producto | ESC32 | CRUD básico de productos | Admin; "Producto Katalon <timestamp>", precio 15000, stock 10, unidad "unidad", primera categoría | Toast "Producto guardado correctamente", fila visible en la tabla; tras eliminar, toast "Producto eliminado correctamente" y la fila desaparece | Pendiente (ejecución en Katalon) | Pendiente |
| TC14 Crear proyecto válido | ESC17 | Crear un proyecto de piso | Cliente; "Proyecto Katalon <timestamp>", largo 4.5, ancho 3.2 | Navegación a `/proyectos/{id}` con el nombre del proyecto como título | Pendiente (ejecución en Katalon) | Pendiente |
| TC15 Cerrar sesión | ESC03 | Cerrar la sesión del usuario | Cliente | Redirección a `/login`, enlace "Iniciar Sesión" visible, token eliminado y `/cuenta` vuelve a redirigir a `/login` | Pendiente (ejecución en Katalon) | Pendiente |

Clasificación usada en las suites: positivos TC01, TC03, TC05, TC07, TC08, TC10, TC13, TC14, TC15; negativos
TC02, TC04, TC06, TC09, TC11, TC12.

### Efectos sobre los datos

- TC03 crea usuarios nuevos en cada ejecución (correos con marca de tiempo).
- TC10 crea un pedido real del usuario `juan@email.com` y descuenta stock del Rodillo.
- TC13 crea un producto y lo elimina en el mismo caso.
- TC14 crea un proyecto del usuario `juan@email.com`.
- TC07, TC08, TC09 y TC10 vacían el carrito de `juan@email.com` al empezar (TC07 deja el producto en el carrito,
  que el siguiente caso de carrito vuelve a vaciar).

---

## 6. Estrategia de espera

- **Solo esperas explícitas.** No se usa `WebUI.delay` ni pausas fijas en ningún script ni keyword.
- Antes de interactuar: `WebUI.waitForElementVisible` (campos y textos) y `WebUI.waitForElementClickable` (botones y
  enlaces); `WebUI.waitForElementPresent` para elementos que no se ven (la primera `<option>` de categorías).
- Para desapariciones: `WebUI.waitForElementNotPresent` seguido de `WebUI.verifyElementNotPresent`.
- Para navegaciones del router de Next.js (que no recargan la página): keyword `esperarUrl(regex)` con
  `WebDriverWait` + `ExpectedConditions.urlMatches`, luego `WebUI.verifyMatch(WebUI.getUrl(), regex, true)`.
- Para el carrito: `limpiarCarrito` espera, tras cada clic en eliminar, a que el carrito termine de recargar (vuelve
  el título) **y** tenga un ítem menos, con `WebDriverWait` y una condición propia.
- Verificaciones: `WebUI.verifyElementText`, `WebUI.verifyMatch` (regex), `WebUI.verifyEqual`/`verifyNotEqual`,
  `WebUI.verifyGreaterThanOrEqual`, `WebUI.verifyElementPresent/Visible/NotPresent/Checked/Clickable`.
- Tiempo máximo común: `GlobalVariable.timeout` (15 s). Timeout por defecto de Katalon en `settings`: 15 s.
- Capturas: `WebUI.takeScreenshot()` en los puntos clave de cada caso + captura automática en fallo (listener).

## 7. Localizadores

Se usan los `id` reales de la aplicación cuando existen (no hay `data-testid`). Donde no hay `id` (registro, toasts,
textos, filas de tablas) se usa XPath por placeholder, rol, `aria-label` o texto visible. Los objetos con `${...}` son
**objetos parametrizados**: se usan con `findTestObject('Object Repository/...', [('nombre') : valor])`.

| Objeto (Object Repository) | Tipo | Selector | Descripción |
|---|---|---|---|
| `Comunes/div_Toast` | XPATH | `//div[@role='alert'][.//p[contains(normalize-space(.),'${mensaje}')]]` | Toast (role=alert) que contiene el mensaje indicado. Parámetro: mensaje |
| `Comunes/div_ToastCualquiera` | CSS | `div[role='alert']` | Cualquier toast visible (role=alert) |
| `Navbar/btn_MenuUsuario` | XPATH | `//nav//button[.//span[contains(@class,'truncate')]]` | Botón del menú desplegable del usuario autenticado (muestra el nombre) |
| `Navbar/span_NombreUsuario` | XPATH | `//nav//button//span[contains(@class,'truncate')]` | Nombre del usuario autenticado en la barra de navegación |
| `Navbar/btn_CerrarSesion` | XPATH | `//nav//button[normalize-space()='Cerrar Sesión']` | Opción Cerrar Sesión del menú de usuario |
| `Navbar/lnk_IniciarSesion` | CSS | `nav a[href='/login']` | Enlace Iniciar Sesión (solo visible sin sesión) |
| `Navbar/lnk_PanelAdmin` | XPATH | `//nav//a[@href='/admin']` | Enlace Panel Admin del menú (solo rol ADMIN) |
| `Pagina_Login/input_Email` | CSS | `#email` | Campo correo del login |
| `Pagina_Login/input_Password` | CSS | `#password` | Campo contraseña del login |
| `Pagina_Login/btn_IniciarSesion` | CSS | `form button[type='submit']` | Botón Iniciar Sesión |
| `Pagina_Login/div_MensajeError` | XPATH | `//div[contains(@class,'bg-error/10')]/span` | Mensaje de error de AuthCard (login y registro) |
| `Pagina_Registro/input_Nombre` | XPATH | `//form//input[@placeholder='Juan']` | Campo nombre (sin id, por placeholder) |
| `Pagina_Registro/input_Apellido` | XPATH | `//form//input[@placeholder='Pérez']` | Campo apellido (sin id, por placeholder) |
| `Pagina_Registro/input_Email` | XPATH | `//form//input[@placeholder='juan@email.com']` | Campo correo (sin id, por placeholder) |
| `Pagina_Registro/input_Password` | XPATH | `(//form//input[@type='password'])[1]` | Primer campo de tipo password (contraseña) |
| `Pagina_Registro/input_ConfirmarPassword` | XPATH | `(//form//input[@type='password'])[2]` | Segundo campo de tipo password (confirmación) |
| `Pagina_Registro/btn_Registrarme` | CSS | `form button[type='submit']` | Botón Registrarme y Comenzar |
| `Pagina_Registro/div_MensajeError` | XPATH | `//div[contains(@class,'bg-error/10')]/span` | Mensaje de error del formulario de registro |
| `Pagina_Cuenta/h1_MiCuenta` | XPATH | `//h1[normalize-space()='Mi Cuenta']` | Título de la página Mi Cuenta |
| `Pagina_Catalogo/input_Busqueda` | CSS | `#search-bar` | Barra de búsqueda del catálogo |
| `Pagina_Catalogo/select_Calificacion` | CSS | `#min-rating` | Filtro de calificación mínima |
| `Pagina_Catalogo/select_OrdenarPor` | CSS | `#sort-by` | Selector de ordenamiento |
| `Pagina_Catalogo/p_ConteoResultados` | XPATH | `//p[contains(normalize-space(),'productos técnicos encontrados')]` | Texto con el número de productos encontrados |
| `Pagina_Catalogo/span_ResultadosPara` | XPATH | `//span[starts-with(normalize-space(),'Resultados para:')]` | Texto Resultados para: "término" |
| `Pagina_Catalogo/h3_SinResultados` | XPATH | `//h3[normalize-space()='No se encontraron productos coincidentes']` | Estado vacío de la búsqueda |
| `Pagina_Catalogo/lnk_PrimerProducto` | XPATH | `(//a[starts-with(@href,'/catalogo/')][.//h3])[1]` | Primera tarjeta de producto del listado |
| `Pagina_Catalogo/lnk_ProductoPorNombre` | XPATH | `//a[starts-with(@href,'/catalogo/')][.//h3[normalize-space()='${nombre}']]` | Tarjeta de producto por nombre exacto. Parámetro: nombre |
| `Pagina_Producto/h1_NombreProducto` | XPATH | `//h1[normalize-space()='${nombre}']` | Título del producto en el detalle. Parámetro: nombre |
| `Pagina_Producto/btn_AgregarAlCarrito` | XPATH | `//button[normalize-space()='Agregar al Carrito']` | Botón Agregar al Carrito |
| `Pagina_Carrito/h1_TituloCarrito` | XPATH | `//h1[normalize-space()='Carrito de Compras']` | Título de la página del carrito |
| `Pagina_Carrito/h3_ItemPorNombre` | XPATH | `//h3[normalize-space()='${nombre}']` | Item del carrito por nombre. Parámetro: nombre |
| `Pagina_Carrito/btn_EliminarItem` | CSS | `button[aria-label='Eliminar']` | Botón eliminar (primer item del carrito) |
| `Pagina_Carrito/btn_EliminarItemPorNombre` | XPATH | `//h3[normalize-space()='${nombre}']/ancestor::div[contains(@class,'gap-4')][1]//button[@aria-label='Eliminar']` | Botón eliminar del item indicado. Parámetro: nombre |
| `Pagina_Carrito/span_Subtotal` | XPATH | `//span[starts-with(normalize-space(),'Subtotal')]/following-sibling::span` | Valor del subtotal |
| `Pagina_Carrito/span_Envio` | XPATH | `//span[normalize-space()='Envío']/following-sibling::span` | Valor del envío (Gratis o monto) |
| `Pagina_Carrito/span_Total` | XPATH | `//span[normalize-space()='Total']/following-sibling::span` | Valor total del pedido |
| `Pagina_Carrito/h3_CarritoVacio` | XPATH | `//h3[normalize-space()='Tu carrito está vacío']` | Mensaje de carrito vacío |
| `Pagina_Carrito/lnk_IrAPagar` | XPATH | `//a[@href='/checkout' and normalize-space()='Ir a Pagar']` | Botón Ir a Pagar |
| `Pagina_Checkout/h1_Checkout` | XPATH | `//h1[normalize-space()='Checkout']` | Título de la página de checkout |
| `Pagina_Checkout/input_Nombre` | CSS | `#first-name` | Nombre del comprador |
| `Pagina_Checkout/input_Apellido` | CSS | `#last-name` | Apellido del comprador |
| `Pagina_Checkout/input_Email` | CSS | `#email` | Correo del comprador |
| `Pagina_Checkout/input_Telefono` | CSS | `#phone` | Teléfono del comprador |
| `Pagina_Checkout/input_Direccion` | CSS | `#address` | Dirección de envío |
| `Pagina_Checkout/input_Ciudad` | CSS | `#city` | Ciudad de envío |
| `Pagina_Checkout/input_Departamento` | CSS | `#state` | Departamento de envío |
| `Pagina_Checkout/input_CodigoPostal` | CSS | `#zip` | Código postal (opcional) |
| `Pagina_Checkout/radio_MetodoPago` | XPATH | `//input[@name='payment' and @value='${metodo}']` | Método de pago (card, pse, cash). Parámetro: metodo |
| `Pagina_Checkout/btn_Pagar` | XPATH | `//form//button[@type='submit' and starts-with(normalize-space(),'Pagar')]` | Botón Pagar $ total |
| `Pagina_Proyecto/input_NombreProyecto` | CSS | `#project-name` | Nombre descriptivo del proyecto |
| `Pagina_Proyecto/input_Largo` | CSS | `#length` | Largo en metros |
| `Pagina_Proyecto/input_Ancho` | CSS | `#width` | Ancho en metros |
| `Pagina_Proyecto/input_Alto` | CSS | `#height` | Alto en metros |
| `Pagina_Proyecto/btn_GuardarYCalcular` | XPATH | `//button[normalize-space()='Guardar y Calcular Insumos']` | Botón Guardar y Calcular Insumos |
| `Pagina_Proyecto/h1_NombreProyecto` | XPATH | `//h1[normalize-space()='${nombre}']` | Título del detalle del proyecto. Parámetro: nombre |
| `Pagina_Admin_Productos/h1_Productos` | XPATH | `//h1[normalize-space()='Productos']` | Título de la gestión de productos |
| `Pagina_Admin_Productos/lnk_MenuProductos` | CSS | `a[href='/admin/productos']` | Enlace Productos del sidebar de administración |
| `Pagina_Admin_Productos/btn_AgregarProducto` | CSS | `#btn-add-product` | Botón Agregar producto |
| `Pagina_Admin_Productos/input_Nombre` | CSS | `#input-name` | Nombre del producto (modal) |
| `Pagina_Admin_Productos/textarea_Descripcion` | CSS | `#input-description` | Descripción del producto (modal) |
| `Pagina_Admin_Productos/select_Categoria` | CSS | `#select-category` | Categoría del producto (modal) |
| `Pagina_Admin_Productos/option_PrimeraCategoria` | XPATH | `//select[@id='select-category']/option[2]` | Primera categoría real del selector (indica que las categorías ya cargaron) |
| `Pagina_Admin_Productos/select_Unidad` | CSS | `#select-unit` | Unidad de medida (modal) |
| `Pagina_Admin_Productos/input_Precio` | CSS | `#input-price` | Precio normal (modal) |
| `Pagina_Admin_Productos/input_Stock` | CSS | `#input-stock` | Stock (modal) |
| `Pagina_Admin_Productos/btn_GuardarProducto` | CSS | `#btn-submit-product` | Botón Guardar Producto (modal) |
| `Pagina_Admin_Productos/btn_ConfirmarEliminar` | CSS | `#btn-confirm-delete` | Botón Eliminar de Por Vida (modal de confirmación) |
| `Pagina_Admin_Productos/input_BuscarProducto` | XPATH | `//main//input[@placeholder='Buscar herramientas, cerámicas, pinturas o materiales...']` | Buscador de la tabla de productos |
| `Pagina_Admin_Productos/span_ProductoPorNombre` | XPATH | `//tbody//span[normalize-space()='${nombre}']` | Fila de la tabla por nombre. Parámetro: nombre |
| `Pagina_Admin_Productos/btn_EliminarProductoPorNombre` | XPATH | `//tr[.//span[normalize-space()='${nombre}']]//button[starts-with(@id,'btn-delete-product-')]` | Botón eliminar de la fila indicada. Parámetro: nombre |

Textos tomados de `app/lib/locales/es.json` y de los componentes en `app/`. Observaciones:

- `p_ConteoResultados` incluye el texto "productos técnicos encontrados" (`catalog.results_found`).
- El título del estado vacío del catálogo se muestra en MAYÚSCULAS por CSS; Selenium devuelve el texto transformado,
  por eso TC06 lo compara sin distinguir mayúsculas.
- Los montos usan el formato `es-CO` (`$ 549.000`, con espacio duro); las regex usan `\W?` entre `$` y el número.
- Las rutas privadas usan redirección del lado del cliente (`router.replace('/login')`), por eso se espera la URL y
  luego el formulario de login.

---

## 8. Validación previa de localizadores

Como Katalon Studio no estaba disponible donde se construyó el proyecto, antes de entregarlo se hizo un ensayo en seco
(*dry run*) con **Playwright 1.48 + Google Chrome (headless, 1366×900)** desde una carpeta temporal fuera del
repositorio, contra la aplicación corriendo en `http://localhost:3000`. El ensayo:

- usó **exactamente los mismos selectores** (CSS/XPath) que los `.rs` del Object Repository, sustituyendo los
  parámetros `${...}` igual que Katalon;
- leyó **los mismos CSV** de `Data Files/` y repitió las iteraciones del data binding;
- siguió los mismos pasos y verificaciones de cada script (mismas regex, mismos textos esperados).

Resultado (12/10/2026):

| Caso | Resultado del ensayo | Detalle |
|---|---|---|
| TC01 | OK | 2 filas (cliente "Juan", admin "Admin") |
| TC02 | OK | 3 filas, mensaje "Credenciales incorrectas. Verifique correo y contraseña." |
| TC03 | OK | 2 filas, registro y redirección a `/cuenta` |
| TC04 | OK | 2 filas, "Las contraseñas no coinciden." |
| TC05 | OK | Porcelanato → 8, Taladro → 2, pintura → 11 productos |
| TC06 | OK | 2 términos, conteo 0 |
| TC07 | OK | Subtotal "$ 549.000", envío "Gratis", total "$ 549.000" |
| TC08 | OK | Carrito vacío tras eliminar |
| TC09 | OK | `valueMissing` en dirección y ciudad; mensaje del navegador "Completa este campo" |
| TC10 | OK | Toast de pedido exitoso, redirección a `/proyectos`, carrito vacío |
| TC11 | OK | `/proyectos`, `/cuenta` y `/checkout` → `/login` |
| TC12 | OK | `/admin` → `/` sin opciones de administración |
| TC13 | OK | Producto creado, encontrado y eliminado |
| TC14 | OK | Detalle `/proyectos/{id}` con el nombre del proyecto |
| TC15 | OK | Logout, token eliminado, `/cuenta` → `/login` |
| `limpiarCarrito` con 2 ítems | OK | Escenario adicional para el keyword |

Los **70 objetos** del Object Repository se encontraron en la aplicación en al menos un flujo.

Esto confirma que los localizadores existen y que los flujos son viables contra la aplicación real; **no es la
ejecución en Katalon** ni sustituye su evidencia. Lo que el ensayo no puede comprobar es el comportamiento propio de
Katalon (compilación de los scripts en Katalon, binding de datos, generación de reportes), que se verifica al ejecutar.

### Hallazgos durante la preparación

1. **Contraseña mínima inconsistente:** el formulario de registro acepta contraseñas desde 6 caracteres
   (placeholder "Mínimo 6 caracteres"), pero el backend exige 8 y responde
   "Validación fallida: password: La contraseña debe tener al menos 8 caracteres". Por eso los datos de TC03 usan
   contraseñas de 8 o más caracteres. Se puede reportar como defecto.
2. **Toast de proyecto no observable:** al crear un proyecto la app muestra un toast y recarga la página de inmediato
   (`window.location.href`), así que el toast desaparece antes de poder verificarlo; TC14 verifica la URL y el título.
3. **Mensaje de campos faltantes del checkout:** los campos obligatorios tienen `required`, así que el navegador
   bloquea el envío antes de que se muestre el toast "Por favor completa todos los campos requeridos."; TC09 verifica
   la validación del navegador (`validity.valueMissing`).
4. **Ejecuciones en paralelo:** si otras suites (Serenity/JS) usan al mismo tiempo la cuenta
   `juan@email.com`, los casos de carrito pueden fallar por cambios ajenos en el carrito.

---

## 9. Qué debe hacer el estudiante en Katalon

1. Levantar la aplicación (backend + frontend) con los datos semilla.
2. Abrir `katalon/Homara.prj` en Katalon Studio 9.x o 10.x y dejar que indexe.
3. Revisar el perfil `default` (`baseUrl`, credenciales).
4. Ejecutar `TS_Regresion_Completa` en Chrome (o la colección `TSC_Homara_Positivos_y_Negativos`).
5. Abrir el reporte en *Reports*, exportarlo a HTML/PDF y guardar `JUnit_Report.xml` y las capturas.
6. Diligenciar las columnas "Resultado obtenido" y "Evidencia" de la tabla de la sección 5.
7. Si algún caso falla, revisar el log y la captura del listener; los fallos por datos (stock, productos) se corrigen
   en las variables del caso o en los CSV de `Data Files/`.
