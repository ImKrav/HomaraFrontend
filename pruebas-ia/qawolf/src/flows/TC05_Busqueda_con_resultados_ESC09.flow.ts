import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const busquedaConResultados = [
  { termino: "Porcelanato", minimoResultados: 1 },
  { termino: "Taladro", minimoResultados: 1 },
  { termino: "pintura", minimoResultados: 1 },
];

export default flow(
  "TC05_Busqueda_con_resultados_ESC09",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    console.log(
      "TC05 - Búsqueda con resultados (ESC09). Datos: busqueda_con_resultados.csv",
    );

    for (const { termino, minimoResultados } of busquedaConResultados) {
      await test(`Búsqueda con resultados para "${termino}"`, async () => {
        console.log(`Término: ${termino} (mínimo ${minimoResultados})`);

        await page.goto(`${BASE_URL}/catalogo`);

        const primerProducto = page.locator(
          "xpath=(//a[starts-with(@href,'/catalogo/')][.//h3])[1]",
        );
        await expect(primerProducto).toBeVisible();

        await expect(page.locator("#min-rating")).toBeAttached();
        await expect(page.locator("#sort-by")).toBeAttached();

        const barraBusqueda = page.locator("#search-bar");
        await expect(barraBusqueda).toBeVisible();

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

        await barraBusqueda.fill(termino);
        await barraBusqueda.press("Enter");

        const resultadosPara = page.locator(
          "xpath=//span[starts-with(normalize-space(),'Resultados para:')]",
        );
        await expect(resultadosPara).toBeVisible();
        await expect(resultadosPara).toContainText(`"${termino}"`);
        await expect(resultadosPara).toContainText(`"${termino}"`);

        const conteoProductos = page.locator(
          "xpath=//h2[contains(normalize-space(),'productos técnicos encontrados')]",
        );
        await expect(conteoProductos).toBeVisible();
        await expect(conteoProductos).toHaveText(
          /^\d+ productos técnicos encontrados$/,
        );

        const conteo = (await conteoProductos.innerText()).trim();
        const encontrados = await page.evaluate(
          (texto) => parseInt(texto, 10),
          conteo,
        );
        console.log(`Productos encontrados para ${termino}: ${encontrados}`);

        const cumpleMinimo = await page.evaluate(
          ({ encontrados, minimoResultados }) =>
            Math.max(encontrados, minimoResultados) === encontrados,
          { encontrados, minimoResultados },
        );
        expect(cumpleMinimo).toBe(true);

        await expect(primerProducto).toBeVisible();
        await expect(
          page.locator(
            "xpath=//h3[normalize-space()='No se encontraron productos coincidentes']",
          ),
        ).toHaveCount(0);

        await page.screenshot({ path: `TC05_${termino}.png`, fullPage: true });
      });
    }
  },
);
