# Pruebas E2E con Stagehand y Claude

Pruebas de los flujos principales de Homara con [Stagehand](https://www.stagehand.dev/)
4 y **Claude Sonnet 5.5** (`anthropic/claude-sonnet-5-5`), sobre la versión
refactorizada de la app.

Mismo enfoque visto en clase: **la IA actúa a partir de lenguaje natural y el
resultado se comprueba con una verificación determinística** (API del backend o
URL), nunca preguntándole a la IA si la prueba pasó. Una excepción de la IA
cuenta como fallo, no como éxito.

## Capacidades usadas

| Capacidad | Para qué | Casos |
|---|---|---|
| `act` | Ejecutar una acción descrita en lenguaje natural (escribir, hacer clic, seleccionar). Los datos sensibles van en `variables` (`%correo%`, `%clave%`), no en el prompt | Todos |
| `observe` | Descubrir elementos de la página antes de actuar; la acción observada se ejecuta después con `act` | ST05, ST08 |
| `extract` | Leer datos estructurados de la página con un esquema zod, para compararlos con la API | ST02, ST03, ST04, ST08 |
| `metrics()` | Tokens y tiempo de inferencia por caso (en `resultados.json`) | Todos |

## Casos

| ID | Caso (escenario) | Qué hace la IA | Verificación determinística |
|---|---|---|---|
| ST01 | Login exitoso (ESC02) | `act` ×3: correo, clave, botón | URL final termina en `/cuenta` |
| ST02 | Login inválido (ESC02) | `act` ×3 + `extract` del mensaje de error | Mensaje empieza por "Credenciales incorrectas" y sigue en `/login` |
| ST03 | Búsqueda con resultados (ESC09) | `act` busca "Porcelanato" + `extract` de los nombres | Mismos productos y misma cantidad que `GET /products?q=Porcelanato` |
| ST04 | Búsqueda sin resultados (ESC09) | `extract` del conteo de resultados | 0 en pantalla y 0 en la API |
| ST05 | Agregar al carrito (ESC13, ESC16) | `act` abre el producto, `observe` encuentra "Agregar al Carrito", `act` ejecuta la acción observada | Carrito por API: 1 ítem, subtotal 549.000, envío 0, total 549.000 |
| ST06 | Checkout completo (ESC28) | `act` llena dirección, ciudad, teléfono, departamento, elige pago contra entrega y paga | Un pedido más y carrito vacío por API |
| ST07 | Crear proyecto (ESC17) | `act` llena nombre, largo 4, ancho 3 y guarda | El proyecto existe por API con área 12 m² |
| ST08 | Panel de administración (ESC31) | `observe` de la navegación + `extract` de las tarjetas de métricas | Valores iguales a `GET /admin/metrics` |
| ST09 | Cerrar sesión (ESC03) | `act` abre el menú de usuario y cierra sesión | Al volver a `/cuenta` la app redirige a `/login` |

Cada corrida registra por API un cliente nuevo (`st.<fecha>@homara.co`), así no
comparte carrito ni pedidos con otras suites. El login de los casos que no
prueban el login se hace sin IA (precondición determinística).

## Ejecutar

Requiere Node.js 22+ y Google Chrome. Usa el `.env` de `pruebas-ia/`
(`ANTHROPIC_API_KEY`, `BASE_URL`, `API_URL`).

```bash
cd pruebas-ia/stagehand
npm install
npm test                    # los 9 casos
npm test -- ST05 ST06       # solo algunos
```

`HEADLESS=true` corre sin ventana. `STAGEHAND_MODEL` cambia el modelo.

La consola muestra, por cada paso, lo que respondió la IA (`act ->`, `observe ->`,
`extract ->`) y al final el resultado verificado de cada caso.

## Evidencias

`evidencias/`:
- `salida.txt`: salida completa de la corrida final.
- `resultados.json`: resultado, detalle, duración y métricas de tokens por caso.
- `ST01.png` … `ST09.png`: captura de la página al terminar cada caso.
- `salida-corrida-1.txt`: primera corrida (4/9), antes de corregir la prueba (ver abajo).

## Análisis

**Aportes.** Las instrucciones sobreviven a cambios de interfaz: tras el rediseño
y la refactorización no hubo que tocar selectores, porque Stagehand resuelve el
elemento en cada ejecución (en el log se ve el XPath que eligió). `extract`
permite comparar lo que ve el usuario con lo que devuelve la API sin escribir
lectores del DOM.

**Limitaciones encontradas.**
- `act` hace **una** acción por instrucción: "completa los demás campos" solo
  llenó el teléfono, quedó vacío "Departamento" (obligatorio) y el pedido no se
  creó. Hay que dar una instrucción por campo.
- La IA no conoce la app: en la primera corrida la prueba usaba `?q=` en la URL
  del catálogo (el parámetro real es `search`) y `observe` buscó "agregar al
  carrito" en la tarjeta del catálogo, donde el "+" es decorativo; el botón real
  está en el detalle del producto. Eran errores de la prueba, no de la app.
- Comparar métricas en vivo es frágil si otras pruebas crean datos a la vez: se
  compara contra la API antes y después de leer la página.
- Cada ejecución cuesta tokens (ver `metrics` en `resultados.json`) y es más
  lenta que un selector fijo.
