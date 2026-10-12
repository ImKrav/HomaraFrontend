# Rendimiento del frontend · Lighthouse

**Escenarios**: ESC38 (rendimiento, lado cliente) · ESC39 (experiencia en móvil) ·
complementa la accesibilidad de [INTERFAZ-ACCESIBILIDAD.md](INTERFAZ-ACCESIBILIDAD.md).

## Configuración

| Parámetro | Valor |
|---|---|
| Herramienta | Lighthouse 12.8.2 (devDependency), API programática + `chrome-launcher` |
| Navegador | Google Chrome 154 headless (`--headless=new`) |
| Script | [`scripts/lighthouse.mjs`](../../scripts/lighthouse.mjs) · `npm run test:lighthouse` |
| Páginas | `/` (inicio y vitrina), `/catalogo`, `/login` |
| Perfiles | **Escritorio** (`desktop-config`, sin throttling de CPU significativo) y **Móvil** (configuración por defecto: Moto G Power emulado, 4G lenta, CPU x4) |
| Corridas | `LH_RONDAS=3`: 3 corridas por página/perfil; se reporta la de rendimiento **mediano** |
| Categorías | Performance, Accessibility, Best Practices, SEO |
| Objetivo | Frontend en build de producción (`next start` en Docker) en `http://localhost:3000` |

> Las cifras son de un entorno local (Docker Desktop en Windows); sirven como
> línea base comparativa entre versiones, no como medida de producción.

## Resultados (ejecución 1, mediana de 3)

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|---|
| / | escritorio | 100 | 96 | 100 | 100 | 0.2 s | 0.6 s | 0 ms | 0 |
| /catalogo | escritorio | 100 | 90 | 100 | 100 | 0.2 s | 0.4 s | 10 ms | 0.059 |
| /login | escritorio | 100 | 94 | 100 | 100 | 0.2 s | 0.4 s | 60 ms | 0.024 |
| / | movil | 79 | 96 | 100 | 100 | 0.8 s | 2.0 s | 860 ms | 0 |
| /catalogo | movil | 73 | 90 | 100 | 100 | 0.8 s | 2.0 s | 640 ms | 0.22 |
| /login | movil | 90 | 94 | 100 | 100 | 0.8 s | 2.0 s | 350 ms | 0.07 |

## Resultados (ejecución 2, repetición para estabilidad)

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|---|
| / | escritorio | 100 | 96 | 100 | 100 | 0.2 s | 0.6 s | 0 ms | 0 |
| /catalogo | escritorio | 100 | 90 | 100 | 100 | 0.2 s | 0.4 s | 40 ms | 0.059 |
| /login | escritorio | 100 | 94 | 100 | 100 | 0.2 s | 0.6 s | 30 ms | 0.024 |
| / | movil | 79 | 96 | 100 | 100 | 0.8 s | 2.0 s | 890 ms | 0 |
| /catalogo | movil | 80 | 90 | 100 | 100 | 0.8 s | 2.1 s | 360 ms | 0.22 |
| /login | movil | 89 | 94 | 100 | 100 | 0.8 s | 1.7 s | 390 ms | 0.07 |

## Análisis

| Hallazgo | Evidencia | Severidad | Recomendación |
|---|---|---|---|
| **Escritorio excelente**: Performance 100 en las tres páginas, LCP 0,4-0,6 s, TBT ≤ 60 ms | resumen escritorio | — | Mantener como línea base de regresión |
| **Móvil: bloqueo del hilo principal** (DEF-26). TBT 350-890 ms y Performance 73-90; la evaluación y compilación de JavaScript domina el trabajo del hilo principal (≈ 2,2 s en catálogo móvil; *bootup-time* 1,0 s) | [catálogo móvil](evidencias/lighthouse/catalogo-movil.report.html) → *Minimize main-thread work*, *Reduce JavaScript execution time* | Media | Cargar de forma diferida las secciones de la vitrina y los componentes de administración; revisar dependencias del bundle cliente (todo el árbol es `"use client"`) |
| **Móvil: desplazamiento de diseño en /catalogo** (DEF-26). CLS 0,22 (umbral "bueno" ≤ 0,1): el esqueleto de carga de 8 tarjetas se reemplaza por 25 productos y empuja el `<footer>` | *layout-shifts* señala el `footer` | Media | Reservar altura para la grilla (min-height) o renderizar el mismo número de esqueletos que el tamaño de página |
| **JavaScript sin usar / legado**: ≈ 25 KiB de JS no usado y ≈ 13 KiB de polyfills para navegadores antiguos en todas las páginas | *Reduce unused JavaScript*, *Avoid serving legacy JavaScript* | Baja | Ajustar `browserslist` a navegadores modernos y dividir código por ruta |
| **Accessibility 90-96** (consistente con axe): *color-contrast* (todas), *select-name* (catálogo), *heading-order* (catálogo y login), *label-content-name-mismatch* (botón de tema) | sección Accessibility de cada reporte | ver DEF-19, DEF-22, DEF-25 | Ver [INTERFAZ-ACCESIBILIDAD.md](INTERFAZ-ACCESIBILIDAD.md) |
| **Best Practices 100 y SEO 100** en todas las páginas y perfiles (título y descripción definidos en `layout.tsx`, sin errores de consola, HTTPS no aplica en local) | — | — | — |

**Estabilidad entre ejecuciones**: escritorio idéntico (100/96·90·94/100/100);
en móvil la variación de Performance fue de ±1 en inicio y login y de 73 → 80 en
catálogo, explicada por el TBT (640 ms vs 360 ms), métrica sensible a la carga de
la máquina. Por eso se reporta la mediana de 3 corridas.

## Defecto registrado

| ID | Severidad | Descripción | Recomendación |
|---|---|---|---|
| DEF-26 | Media | En perfil móvil el inicio y el catálogo tienen TBT de 360-890 ms y el catálogo un CLS de 0,22 (> 0,1), con Performance 73-80 | Ver tabla de análisis: diferir JS no crítico y reservar espacio para la grilla |

## Evidencia

- Resumen: [`evidencias/lighthouse/resumen.md`](evidencias/lighthouse/resumen.md) · [`resumen.json`](evidencias/lighthouse/resumen.json)
- Resúmenes por ejecución: [run 1](evidencias/lighthouse/resumen-run1.md) · [run 2](evidencias/lighthouse/resumen-run2.md)
- Reportes completos de la ejecución 2 (abrir el HTML en el navegador):
  - Inicio: [escritorio](evidencias/lighthouse/inicio-escritorio.report.html) · [móvil](evidencias/lighthouse/inicio-movil.report.html)
  - Catálogo: [escritorio](evidencias/lighthouse/catalogo-escritorio.report.html) · [móvil](evidencias/lighthouse/catalogo-movil.report.html)
  - Login: [escritorio](evidencias/lighthouse/login-escritorio.report.html) · [móvil](evidencias/lighthouse/login-movil.report.html)
- Consola de cada ejecución: [`evidencias/lighthouse/consola-run1.txt`](evidencias/lighthouse/consola-run1.txt) · [`consola-run2.txt`](evidencias/lighthouse/consola-run2.txt)
