# Pruebas E2E con IA

Pruebas de los flujos de Homara apoyadas en inteligencia artificial, con Claude
como modelo. Se aplica la misma idea vista en clase: **la IA ejecuta o genera
los pasos a partir de lenguaje natural, pero el resultado se comprueba con una
verificación determinística** (API o URL), nunca preguntándole a la IA si la
prueba pasó.

| Herramienta | Carpeta | Modelo | Papel de la IA | Cómo se verifica |
|---|---|---|---|---|
| **Browser Use** | `browser-use/` | Claude Opus 5.5 | Un agente recorre la app siguiendo una instrucción en lenguaje natural | Consultas a la API del backend (carrito, pedidos, proyectos, login) y URL final |
| **QA Wolf** | `qawolf/` | Claude Opus 5.5 | Claude genera los flujos de QA Wolf a partir de los casos de Katalon Recorder del proyecto | Aserciones `expect` de Playwright en cada flujo, ejecutadas con la CLI de QA Wolf |
| **Postman / Postbot** | `HomaraBackend/postman/` | Postbot | Postbot genera y amplía las pruebas de cada petición | Pruebas `pm.test` ejecutadas con Newman o el Runner |
| **Stagehand** | `stagehand/` | Claude Sonnet 5.5 | `act`, `observe` y `extract` desde lenguaje natural | API del backend y URL (ver [`stagehand/README.md`](stagehand/README.md)) |

Estas pruebas **no corren en ningún pipeline** (Jenkins, GitHub Actions, Sonar):
se ejecutan a mano, y `pruebas-ia/` está excluida del lint, del typecheck y de la
imagen Docker. Las carpetas `evidencias/` no se versionan; las evidencias se
entregan aparte.

## Configuración

1. Copiar `.env.example` como `.env` en esta carpeta y poner `ANTHROPIC_API_KEY`.
   El `.env` está en `.gitignore`; nunca se sube al repositorio.
2. Por defecto las pruebas apuntan al despliegue (`BASE_URL=https://homara.nodalix.tech`,
   `API_URL=https://homara-api.nodalix.tech/api/v1`). Para correrlas en local, levantar
   el stack con `docker compose up -d` y cambiar esas dos variables a
   `http://localhost:3000` y `http://localhost:5000/api/v1`.

## Resultados sobre la versión refactorizada (despliegue)

| Herramienta | Resultado |
|---|---|
| QA Wolf | **15/15** |
| Postman (Newman) | **34 peticiones, 52 aserciones, 0 fallidas** |
| Stagehand | **9/9** |
| Browser Use | **13/15** (TC07 y TC10: limitación del agente, ver abajo) |

## Browser Use

Requiere [uv](https://docs.astral.sh/uv/) y Google Chrome.

```bash
cd browser-use
uv sync
uv run pruebas.py            # los 15 casos
uv run pruebas.py TC07 TC10  # solo algunos
```

Cada caso prepara sus datos por API (por ejemplo, vacía el carrito), le da al
agente la tarea en español y al final verifica el estado real por API. Una
excepción del agente cuenta como fallo. La consola muestra en cada paso lo que
decide la IA (`Eval`, `Memory`, `Next goal`, acciones y `Final Result`).
Evidencia en `browser-use/evidencias/`: un GIF del recorrido por caso,
`resultados.json` y `salida.txt`.

| ID | Caso | Tarea para el agente | Verificación determinística | Resultado |
|---|---|---|---|---|
| TC01 | Login exitoso (ESC02) | Iniciar sesión como Juan | URL final termina en `/cuenta` | Aprobado |
| TC02 | Login inválido (ESC02) | Intentar con contraseña incorrecta y devolver el mensaje | Mensaje empieza por "Credenciales incorrectas" y sigue en `/login` | Aprobado |
| TC03 | Registro exitoso (ESC01) | Crear una cuenta nueva | La API acepta el login del usuario nuevo | Aprobado |
| TC04 | Contraseñas distintas (ESC01) | Registrar con confirmación distinta | La API rechaza el login (no se creó) y el mensaje dice "no coinciden" | Aprobado |
| TC05 | Búsqueda con resultados (ESC09) | Buscar "Porcelanato" y devolver los nombres | Los 8 nombres vistos son los 8 de la API | Aprobado |
| TC06 | Búsqueda sin resultados (ESC09) | Buscar un término inexistente | Lista vacía en pantalla y en la API | Aprobado |
| TC07 | Agregar al carrito (ESC13, ESC16) | Agregar la Pintura Koraza y abrir el carrito | Carrito por API: 1 ítem, subtotal 549.000, envío 0 | **Fallido** |
| TC08 | Eliminar del carrito (ESC15) | Eliminar el rodillo | Carrito vacío por API | Aprobado |
| TC09 | Checkout incompleto (ESC27) | Confirmar sin dirección ni ciudad | No se creó pedido y sigue en `/checkout` | Aprobado |
| TC10 | Checkout completo (ESC28) | Completar y confirmar el pedido | Un pedido más y carrito vacío por API | **Fallido** |
| TC11 | Ruta privada sin sesión (ESC07) | Abrir `/proyectos` sin sesión | URL final termina en `/login` | Aprobado |
| TC12 | Cliente en `/admin` (ESC07, ESC32) | Abrir `/admin` como cliente | URL final es de la app y no es `/admin` | Aprobado (reintento) |
| TC13 | Admin crea producto (ESC32) | Crear un producto desde el panel | El producto existe por API (luego se elimina) | Aprobado |
| TC14 | Crear proyecto (ESC17) | Crear un proyecto de piso 4 × 3 | El proyecto aparece en la API del cliente | Aprobado |
| TC15 | Cerrar sesión (ESC03) | Iniciar y cerrar sesión | URL final fuera de `/cuenta` | Aprobado |

**Análisis.**
- **TC07 y TC10:** el agente detecta que sus clics o lo que escribe no quedan
  registrados en la página e intenta rodeos con JavaScript, que no actualizan el
  estado de React. No es un defecto de la app: los mismos flujos pasan con
  QA Wolf, Stagehand, Cypress y Screenplay.
- **TC12:** en la corrida completa salió "aprobado" con URL final `about:blank`.
  El modelo había fallado al generar su salida y el agente nunca navegó, pero la
  verificación solo comprobaba "no está en `/admin`". Se endureció para exigir
  una URL de la app y el reintento pasó con URL final `/`
  (`salida-TC12-reintento.txt`). Es un ejemplo de por qué el oráculo debe ser
  estricto.
- **Ajustes para Claude Opus 5.5** (documentados en `pruebas.py`):
  `thinking={"type": "adaptive"}`, porque el modelo no acepta el `tool_choice`
  forzado que Browser Use envía sin *thinking*; `use_thinking=False`, porque la
  API rechaza que se le pida escribir su razonamiento (`refusal`,
  `reasoning_extraction`); y esperas de 1,5 s y 0,5 s por las animaciones de
  entrada.

## QA Wolf

QA Wolf ofrece la generación de pruebas con IA solo en su plataforma de pago;
su CLI de código abierto ejecuta flujos localmente sin cuenta. Aquí la parte de
IA la hace Claude: `generar.mjs` le envía cada caso de Katalon Recorder
(`casos-katalon/`, pasos y datos CSV) y escribe el flujo equivalente en
`src/flows/`. Los flujos se revisan y se ejecutan con la CLI, que no consume IA.

```bash
cd qawolf
npm install
npm run generar            # Claude genera los 15 flujos
npm run generar TC07       # o solo uno
npm test                   # ejecuta los flujos (JUnit, videos y capturas en evidencias/)
npm run test:headed        # igual, viendo el navegador
```

**Después de la refactorización.** La primera corrida contra el despliegue dio
10/15 (`evidencias/salida-antes-de-ajustar.txt`). Los 5 fallos eran cambios
intencionales de la app, no regresiones:
- La sesión pasó de `localStorage` a la cookie HttpOnly `homara_session`
  (DEF-SEG-FE-02). Los flujos ahora limpian y verifican la cookie.
- El conteo de resultados del catálogo pasó de `<p>` a `<h2>` (DEF-25).
- Tras pagar, el checkout redirige a `/cuenta` en lugar de `/proyectos`.

Se ajustaron esos flujos, y el prompt de `generar.mjs` ahora indica usar
`BASE_URL` y la cookie de sesión. TC01–TC06 se regeneraron con ese prompt.
Resultado final: **15/15** (`evidencias/junit-report.xml`).

## Postman / Postbot

Ver `HomaraBackend/postman/README.md`.
