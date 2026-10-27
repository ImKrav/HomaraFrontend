import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Desde DEF-SEG-FE-02 la sesión va en la cookie HttpOnly homara_session (ya no en localStorage).
const tokenDeSesion = async (page) =>
  (await page.context().cookies()).find((c) => c.name === "homara_session")?.value ?? null;

export default flow(
  "TC14_Crear_proyecto_valido_ESC17",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    // TC14 - Crear proyecto válido de piso (ESC17)

    const contarAnimacionesActivas = () =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((a) => a.playState === "running")
            .filter(
              (a) => !a.effect || a.effect.getTiming().iterations !== Infinity,
            ).length,
      );

    let nombreProyecto = "";

    await test("Precondición: sesión limpia (se borran la cookie de sesión y el almacenamiento local)", async () => {
      await page.goto(`${BASE_URL}/`);
      await page.context().clearCookies();
      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      await page.reload();
      await expect(page.locator("nav a[href='/login']")).toBeAttached();
      const token = await tokenDeSesion(page);
      expect(token).toBeNull();
    });

    await test("Iniciar sesión como juan@email.com", async () => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.locator("#email")).toBeVisible();
      await expect.poll(contarAnimacionesActivas).toBe(0);
      await page.locator("#email").fill("juan@email.com");
      await expect(page.locator("#password")).toBeVisible();
      await page.locator("#password").fill("123456");
      const botonEnviar = page.locator("form button[type='submit']");
      await expect(botonEnviar).toBeVisible();
      await expect(botonEnviar).toBeEnabled();
      await botonEnviar.click();
      await expect(page).toHaveURL(/\/cuenta$/);
      await expect(
        page.locator("xpath=//nav//button//span[contains(@class,'truncate')]"),
      ).toBeVisible();
    });

    await test("Completar el formulario de nuevo proyecto", async () => {
      nombreProyecto = await page.evaluate(
        () => "Proyecto Katalon " + Date.now(),
      );
      console.log(`Proyecto de prueba: ${nombreProyecto}`);
      await page.goto(`${BASE_URL}/proyectos/nuevo`);
      await expect(page.locator("#project-name")).toBeVisible();
      await expect.poll(contarAnimacionesActivas).toBe(0);
      await page.locator("#project-name").fill(nombreProyecto);
      await expect(page.locator("#length")).toBeVisible();
      await page.locator("#length").fill("4.5");
      await expect(page.locator("#width")).toBeVisible();
      await page.locator("#width").fill("3.2");
      await expect(page.locator("#length")).toHaveValue("4.5");
      await expect(page.locator("#width")).toHaveValue("3.2");
      await expect(page.locator("#height")).toBeAttached();
      await page.screenshot({
        path: "TC14_formulario_proyecto.png",
        fullPage: true,
      });
    });

    await test("Guardar el proyecto y verificar que fue creado", async () => {
      const botonGuardar = page.locator(
        "xpath=//button[normalize-space()='Guardar y Calcular Insumos']",
      );
      await expect(botonGuardar).toBeVisible();
      await expect(botonGuardar).toBeEnabled();
      await botonGuardar.click();
      await expect(page).toHaveURL(/\/proyectos\/(?!nuevo)[A-Za-z0-9_-]+$/);
      const titulo = page.locator(
        `xpath=//h1[normalize-space()='${nombreProyecto}']`,
      );
      await expect(titulo).toBeVisible();
      await expect(titulo).toHaveText(nombreProyecto);
      await page.screenshot({
        path: "TC14_proyecto_creado.png",
        fullPage: true,
      });
    });
  },
);
