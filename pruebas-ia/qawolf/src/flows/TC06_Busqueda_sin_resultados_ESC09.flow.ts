import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Datos de busqueda_sin_resultados.csv
const filas: { termino: string; mensajeEsperado: string }[] = [
  {
    termino: "xyzproductoinexistente",
    mensajeEsperado: "No se encontraron productos coincidentes",
  },
  {
    termino: "zzz-sin-coincidencias-999",
    mensajeEsperado: "No se encontraron productos coincidentes",
  },
];

const escaparRegex = (texto: string): string =>
  texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default flow(
  "TC06_Busqueda_sin_resultados_ESC09",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    console.log(
      "TC06 - Búsqueda sin resultados (ESC09). Datos: busqueda_sin_resultados.csv",
    );

    for (const { termino, mensajeEsperado } of filas) {
      await test(`Búsqueda sin resultados con el término "${termino}"`, async () => {
        console.log(`Término: ${termino}`);

        const primerProducto = page.locator(
          "xpath=(//a[starts-with(@href,'/catalogo/')][.//h3])[1]",
        );
        const barraBusqueda = page.locator("#search-bar");
        const mensajeSinResultados = page.locator(
          "xpath=//h3[normalize-space()='No se encontraron productos coincidentes']",
        );
        const contadorResultados = page.locator(
          "xpath=//h2[contains(normalize-space(),'productos técnicos encontrados')]",
        );

        // Abrir el catálogo y esperar a que cargue
        await page.goto(`${BASE_URL}/catalogo`);
        await expect(primerProducto).toBeVisible();
        await expect(barraBusqueda).toBeVisible();

        // Esperar a que terminen las animaciones finitas en curso
        await expect
          .poll(() =>
            page.evaluate(
              () =>
                document
                  .getAnimations()
                  .filter((a) => a.playState === "running")
                  .filter(
                    (a) =>
                      !a.effect || a.effect.getTiming().iterations !== Infinity,
                  ).length,
            ),
          )
          .toBe(0);

        // Buscar el término
        await barraBusqueda.fill(termino);
        await barraBusqueda.press("Enter");

        // Verificar el mensaje de "sin resultados"
        await expect(mensajeSinResultados).toBeVisible();
        await expect
          .soft(mensajeSinResultados)
          .toHaveText(new RegExp(`^${escaparRegex(mensajeEsperado)}$`, "i"));

        // Verificar el contador en cero
        await expect
          .soft(contadorResultados)
          .toHaveText("0 productos técnicos encontrados");

        // Verificar que no se muestra ningún producto
        await expect.soft(primerProducto).toHaveCount(0);

        // Captura de pantalla completa
        await page.screenshot({ path: `TC06_${termino}.png`, fullPage: true });
      });
    }
  },
);
