# Interfaz (responsive, idioma, tema, navegadores) y accesibilidad

Escenarios: **ESC39** usabilidad responsiva · **ESC40** idioma y tema ·
**ESC44** compatibilidad de navegadores · accesibilidad WCAG 2.1 A/AA
(complemento técnico; las heurísticas de Nielsen ya las evaluó el equipo y no se
repiten aquí).

## Resumen de resultados

| Suite | Pruebas | Electron 130 (run 1) | Electron 130 (run 2) | Chrome 154 | Edge 155 | Evidencia |
|---|---|---|---|---|---|---|
| Interfaz (`cypress/e2e/interfaz`) | 32 | 32/32 ✅ | 32/32 ✅ | 32/32 ✅ | 32/32 ✅ | [run1](evidencias/interfaz/consola-electron-run1.txt) · [run2](evidencias/interfaz/consola-electron-run2.txt) · [chrome](evidencias/interfaz/consola-chrome.txt) · [edge](evidencias/interfaz/consola-edge.txt) · [capturas](evidencias/interfaz/capturas/) |
| Accesibilidad (`cypress/e2e/accesibilidad`) | 22 | 22/22 ✅ | 22/22 ✅ | — | — | [run1](evidencias/accesibilidad/consola-electron-run1.txt) · [run2](evidencias/accesibilidad/consola-electron-run2.txt) · [JSON axe run1](evidencias/accesibilidad/a11y-violaciones-run1.json) · [run2](evidencias/accesibilidad/a11y-violaciones-run2.json) |

La suite de accesibilidad **no falla por las violaciones existentes**: las
registra y solo falla si aparece una violación *critical* que no esté en la línea
base documentada ([`cypress/fixtures/a11y-linea-base.json`](../../cypress/fixtures/a11y-linea-base.json)).

## 1. Responsive (ESC39) y navegadores (ESC44)

**Objetivo**: verificar que las páginas principales se adaptan a móvil (375×667),
tablet (768×1024) y escritorio (1440×900) sin desbordamiento horizontal, y que la
navegación móvil funciona, en Electron, Chrome y Edge.

**Método** ([responsive.cy.ts](../../cypress/e2e/interfaz/responsive.cy.ts)):
por cada página × viewport se espera a que el contenido real cargue y se compara
`document.documentElement.scrollWidth <= clientWidth` (si falla, el mensaje lista
los elementos que sobresalen); se toma una captura del viewport. Además se mide la
grilla del catálogo (`grid-template-columns`) y se recorre el menú móvil.

**Resultado obtenido**: 18 combinaciones página×viewport sin scroll horizontal en
los 3 navegadores; la grilla pasa de 1 → 2 → 4 columnas; el menú móvil se abre,
navega y se cierra. Las listas de categorías del catálogo en móvil hacen scroll
horizontal **dentro de su contenedor** (comportamiento intencional, no desborda la
página).

| Viewport | Capturas (Electron · Chrome · Edge) |
|---|---|
| Móvil 375×667 | [inicio](evidencias/interfaz/capturas/responsive.cy.ts/electron/movil-inicio.png) · [catálogo](evidencias/interfaz/capturas/responsive.cy.ts/chrome/movil-catalogo.png) · [detalle](evidencias/interfaz/capturas/responsive.cy.ts/edge/movil-detalle-producto.png) · [login](evidencias/interfaz/capturas/responsive.cy.ts/electron/movil-login.png) · [registro](evidencias/interfaz/capturas/responsive.cy.ts/electron/movil-registro.png) · [menú abierto](evidencias/interfaz/capturas/responsive.cy.ts/movil-menu-abierto.png) |
| Tablet 768×1024 | [inicio](evidencias/interfaz/capturas/responsive.cy.ts/electron/tablet-inicio.png) · [catálogo](evidencias/interfaz/capturas/responsive.cy.ts/chrome/tablet-catalogo.png) · [carrito](evidencias/interfaz/capturas/responsive.cy.ts/edge/tablet-carrito-sin-sesion.png) |
| Escritorio 1440×900 | [inicio](evidencias/interfaz/capturas/responsive.cy.ts/electron/escritorio-inicio.png) · [catálogo](evidencias/interfaz/capturas/responsive.cy.ts/chrome/escritorio-catalogo.png) · [detalle](evidencias/interfaz/capturas/responsive.cy.ts/edge/escritorio-detalle-producto.png) |

## 2. Idioma y tema (ESC40)

**Objetivo**: cambiar idioma ES/EN y tema claro/oscuro desde el pie de página y
comprobar que se guardan (`localStorage` `homara_lang` / `homara_theme`) y
persisten al recargar y navegar ([idioma-tema.cy.ts](../../cypress/e2e/interfaz/idioma-tema.cy.ts)).

**Resultado obtenido**: sin preferencia, el tema sigue `prefers-color-scheme`; el
botón "Alternar tema" alterna la clase `dark` en `<html>`, cambia el fondo y
persiste en ambos sentidos; EN traduce navegación y contenido y persiste; volver a
ES restaura los textos. Capturas: [tema oscuro](evidencias/interfaz/capturas/idioma-tema.cy.ts/tema-oscuro.png) ·
[tema claro](evidencias/interfaz/capturas/idioma-tema.cy.ts/tema-claro.png) ·
[catálogo en inglés](evidencias/interfaz/capturas/idioma-tema.cy.ts/idioma-en-catalogo.png).
Defectos: el atributo `lang` no cambia (DEF-15) y un mensaje del registro no se
traduce (DEF-17).

### Detalle por prueba · Interfaz

| ID | ESC | Resultado esperado (título de la prueba) | Resultado obtenido | electron-run1 | electron-run2 | chrome | edge | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| [INT-IDI-01](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | cambiar a EN traduce la navegación y la página, y se guarda en localStorage | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-IDI-02](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | el idioma inglés persiste al recargar y al navegar | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-IDI-03](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | volver a ES restaura los textos en español | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-IDI-04](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | DEF-15: en inglés el atributo <html lang> sigue en 'es' | Se reproduce DEF-15 (comportamiento observado) | ✅ | ✅ | ✅ | ✅ | Pasa · defecto abierto | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-IDI-05](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | DEF-17: el error de contraseñas no coincidentes del registro no se traduce | Se reproduce DEF-17 (comportamiento observado) | ✅ | ✅ | ✅ | ✅ | Pasa · defecto abierto | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-MOV-01](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | en móvil se oculta la navegación de escritorio y aparece el botón Menú | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-MOV-02](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | el menú móvil se abre, navega al catálogo y se cierra | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-MOV-03](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | DEF-16: el botón Menú no expone aria-expanded ni aria-controls | Se reproduce DEF-16 (comportamiento observado) | ✅ | ✅ | ✅ | ✅ | Pasa · defecto abierto | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-MOV-04](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | en escritorio el botón Menú no se muestra | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | / se adapta a movil sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /catalogo se adapta a movil sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /login se adapta a movil sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /register se adapta a movil sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /carrito se adapta a movil sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | detalle de producto se adapta a movil | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | / se adapta a tablet sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /catalogo se adapta a tablet sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /login se adapta a tablet sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /register se adapta a tablet sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /carrito se adapta a tablet sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | detalle de producto se adapta a tablet | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | / se adapta a escritorio sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /catalogo se adapta a escritorio sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /login se adapta a escritorio sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /register se adapta a escritorio sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39/ESC44 | /carrito se adapta a escritorio sin scroll horizontal | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | detalle de producto se adapta a escritorio | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-RSP-GRID](../../cypress/e2e/interfaz/responsive.cy.ts) | ESC39 | la grilla del catálogo pasa de 1 a 2 y 4 columnas según el ancho | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-TEM-01](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | sin preferencia guardada, el tema sigue a prefers-color-scheme del sistema | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-TEM-02](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | 'Alternar tema' pasa de claro a oscuro, lo guarda y persiste al recargar y navegar | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-TEM-03](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | el tema guardado se aplica al cargar y el fondo cambia de color | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |
| [INT-TEM-04](../../cypress/e2e/interfaz/idioma-tema.cy.ts) | ESC40 | 'Alternar tema' pasa de oscuro a claro y también persiste | Conforme a lo esperado | ✅ | ✅ | ✅ | ✅ | Pasa | [consola](evidencias/interfaz/consola-electron-run1.txt) · [junit](evidencias/interfaz/junit-electron-run1/) |

## 3. Accesibilidad automática con axe-core (WCAG 2.1 A/AA)

**Configuración**: `cypress-axe` 1.7 + `axe-core` 4.11, `runOnly` con las
etiquetas `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`. Se analizan 14 vistas
(públicas, de cliente autenticado y de administrador, más inicio y login en tema
oscuro), en tema claro salvo indicación. Cada resultado se escribe con `cy.task`
en `cypress/results/a11y-violaciones.json` (copiado a evidencias) y se imprime en
consola (`[axe] ...`).

**Resultado obtenido** (idéntico en las dos ejecuciones; entre paréntesis, nodos
afectados):

| Vista | Ruta | Tema | Reglas violadas | Critical | Serious | Detalle |
|---|---|---|---|---|---|---|
| inicio | `/` | claro | 1 | 0 | 1 | color-contrast (3) |
| inicio-oscuro | `/` | oscuro | 1 | 0 | 1 | color-contrast (56) |
| catalogo | `/catalogo` | claro | 2 | **1** | 1 | color-contrast (3), **select-name (2)** |
| detalle-producto | `/catalogo/:id` | claro | 1 | 0 | 1 | color-contrast (4) |
| login | `/login` | claro | 1 | 0 | 1 | color-contrast (3) |
| login-oscuro | `/login` | oscuro | 1 | 0 | 1 | color-contrast (6) |
| registro | `/register` | claro | 1 | 0 | 1 | color-contrast (3) |
| carrito-invitado | `/carrito` | claro | 1 | 0 | 1 | color-contrast (3) |
| cuenta | `/cuenta` | claro | 2 | 0 | 2 | color-contrast (3), nested-interactive (5-6) |
| proyectos | `/proyectos` | claro | 1 | 0 | 1 | color-contrast (3) |
| proyecto-nuevo | `/proyectos/nuevo` | claro | 1 | 0 | 1 | color-contrast (4) |
| checkout | `/checkout` | claro | 1 | 0 | 1 | color-contrast (3) |
| admin-dashboard | `/admin` | claro | 2 | 0 | 2 | aria-prohibited-attr (12), color-contrast (1) |
| admin-productos | `/admin/productos` | claro | 2 | **1** | 1 | color-contrast (1), **select-name (2)** |

**Violaciones principales**

1. **color-contrast** (serious, WCAG 1.4.3) — en todas las vistas. En tema claro:
   las etiquetas `IDIOMA` / `TEMA` del pie (`text-text-muted`, 10 px, `#71717A`
   sobre gris claro) y el botón de idioma inactivo. En tema oscuro el problema
   crece a 56 nodos en el inicio (`text-zinc-400`, `border-zinc-700`, textos
   secundarios de las tarjetas). → DEF-22.
2. **select-name** (critical, WCAG 4.1.2) — los `<select>` `#min-rating` y
   `#sort-by` del catálogo y los filtros de categoría/stock de
   `/admin/productos` no tienen etiqueta (el texto "Calificación" / "Ordenar por"
   es un `<span>`, no un `<label for>`). Es la única violación crítica y está en
   la línea base. → DEF-19.
3. **nested-interactive** (serious, WCAG 4.1.2) — en `/cuenta` cada pedido es un
   `<button>` (Card con `onClick`) que contiene otro `<button>` "Ver detalles de
   entrega". → DEF-23.
4. **aria-prohibited-attr** (serious, WCAG 4.1.2) — barras del gráfico de ventas
   del dashboard: `div` con `aria-label` sin rol. → DEF-24.

> axe **no** marca los campos de `/register` como "sin etiqueta" porque el
> `placeholder` aporta un nombre accesible; sin embargo la etiqueta visible no
> está asociada (`<label>` sin `for`, `<input>` sin `id`), lo que sí se detecta
> con las pruebas manuales de la sección 4 (DEF-12).

## 4. Teclado, foco y etiquetas

[teclado-etiquetas.cy.ts](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts)
usa `cy.press(Tab)` (Cypress 14.3+, eventos reales de teclado).

| ID | Objetivo | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| A11Y-TEC-01 | Llegar al formulario de login con Tab | Orden lógico: correo → contraseña → "Recordarme" | Se requieren **8** pulsaciones (toda la barra de navegación primero); el orden dentro del formulario es correcto | Pasa |
| A11Y-TEC-02 | Indicador de foco visible | El campo enfocado cambia de estilo | Tras la transición de 200 ms el borde pasa a `primary`; el anillo `ring-primary/10` es casi imperceptible (10 % de opacidad), el indicador depende solo del color del borde | Pasa (mejorable) |
| A11Y-TEC-03 | Login solo con teclado | Enter envía el formulario | Login correcto y redirección a `/cuenta` | Pasa |
| A11Y-TEC-04 | Enlace "Saltar al contenido" | Primer elemento enfocable | No existe → DEF-18 | Pasa · defecto abierto |
| A11Y-LBL-01 | Etiquetas en `/login` | Todos los campos con `<label for>` | Correcto | Pasa |
| A11Y-LBL-02 | Etiquetas en `/register` | Todos los campos con etiqueta asociada | **10 de 10** campos sin etiqueta asociada (solo placeholder) → DEF-12 | Pasa · defecto abierto |
| A11Y-LBL-03 | Etiquetas en `/catalogo` | Buscador y selects etiquetados | `#search-bar`, `#min-rating`, `#sort-by` sin etiqueta → DEF-19 | Pasa · defecto abierto |
| A11Y-LBL-04 | Etiquetas en `/checkout` | Campos de contacto/envío etiquetados | Correcto (todos con `id` + `label for`) | Pasa |

Captura del foco: [foco-login-email.png](evidencias/accesibilidad/capturas/foco-login-email.png).

### Detalle por prueba · Accesibilidad

| ID | ESC | Resultado esperado (título de la prueba) | Resultado obtenido | electron-run1 | electron-run2 | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | inicio (/) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | inicio-oscuro (/) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | catalogo (/catalogo) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | detalle-producto (/catalogo/:primero) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | login (/login) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | login-oscuro (/login) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | registro (/register) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | carrito-invitado (/carrito) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | cuenta (/cuenta) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | proyectos (/proyectos) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | proyecto-nuevo (/proyectos/nuevo) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | checkout (/checkout) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | admin-dashboard (/admin) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-AXE](../../cypress/e2e/accesibilidad/axe-paginas.cy.ts) | ESC39/ESC40 | admin-productos (/admin/productos) no agrega violaciones críticas nuevas | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-LBL-01](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | /login: todos los campos tienen etiqueta asociada | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-LBL-02](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | DEF-12: /register tiene campos SIN etiqueta asociada (labels sin for / inputs sin id) | Se reproduce DEF-12 (comportamiento observado) | ✅ | ✅ | Pasa · defecto abierto | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-LBL-03](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | DEF-19: en /catalogo los selects de calificación y orden no tienen etiqueta | Se reproduce DEF-19 (comportamiento observado) | ✅ | ✅ | Pasa · defecto abierto | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-LBL-04](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | /checkout: los campos de contacto y envío están etiquetados | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-TEC-01](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | con Tab se llega al formulario de login (correo → contraseña) en orden lógico | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-TEC-02](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | el campo enfocado tiene un indicador de foco visible distinto al estado normal | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-TEC-03](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | el login se completa solo con teclado (Enter envía el formulario) | Conforme a lo esperado | ✅ | ✅ | Pasa | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |
| [A11Y-TEC-04](../../cypress/e2e/accesibilidad/teclado-etiquetas.cy.ts) | — | DEF-18: no existe un enlace 'Saltar al contenido' como primer elemento enfocable | Se reproduce DEF-18 (comportamiento observado) | ✅ | ✅ | Pasa · defecto abierto | [consola](evidencias/accesibilidad/consola-electron-run1.txt) · [junit](evidencias/accesibilidad/junit-electron-run1/) |

## Defectos de interfaz y accesibilidad

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
