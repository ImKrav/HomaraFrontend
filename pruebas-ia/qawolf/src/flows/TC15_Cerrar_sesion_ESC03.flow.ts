import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Desde DEF-SEG-FE-02 la sesión va en la cookie HttpOnly homara_session (ya no en localStorage).
const tokenDeSesion = async (page) =>
  (await page.context().cookies()).find((c) => c.name === "homara_session")?.value ?? null;

export default flow(
  "TC15_Cerrar_sesion_ESC03",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    // TC15 - Cerrar sesión (ESC03)

    const animacionesFinitasEnCurso = () =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(function (a) {
              return a.playState === "running";
            })
            .filter(function (a) {
              return !a.effect || a.effect.getTiming().iterations !== Infinity;
            }).length,
      );

    await test("Precondición: sesión limpia (se borran la cookie de sesión y el almacenamiento local)", async () => {
      await page.goto(`${BASE_URL}/`);
      await page.context().clearCookies();
      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      await page.reload();
      await expect(page.locator("nav a[href='/login']").first()).toBeAttached();
      const token = await tokenDeSesion(page);
      expect(token).toBeNull();
    });

    await test("Iniciar sesión como juan@email.com", async () => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.locator("#email")).toBeVisible();
      await expect.poll(animacionesFinitasEnCurso).toBe(0);
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
      await page.screenshot({ path: "TC15_sesion_iniciada.png", fullPage: true });
    });

    await test("Abrir el menú de usuario y cerrar sesión", async () => {
      const botonUsuario = page.locator(
        "xpath=//nav//button[.//span[contains(@class,'truncate')]]",
      );
      await expect(botonUsuario).toBeVisible();
      await expect.poll(animacionesFinitasEnCurso).toBe(0);
      await botonUsuario.click();

      const botonCerrarSesion = page.locator(
        "xpath=//nav//button[normalize-space()='Cerrar Sesión']",
      );
      await expect(botonCerrarSesion).toBeVisible();
      await expect(botonCerrarSesion).toHaveText("Cerrar Sesión");
      await expect.poll(animacionesFinitasEnCurso).toBe(0);
      await botonCerrarSesion.click();
    });

    await test("Verificar que la sesión se cerró correctamente", async () => {
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.locator("nav a[href='/login']")).toBeVisible();
      await expect(
        page.locator("xpath=//nav//button//span[contains(@class,'truncate')]"),
      ).toHaveCount(0);
      const token = await tokenDeSesion(page);
      expect(token).toBeNull();
      await page.screenshot({ path: "TC15_sesion_cerrada.png", fullPage: true });
    });

    await test("Verificar que /cuenta redirige a /login sin sesión", async () => {
      await page.goto(`${BASE_URL}/cuenta`);
      await expect(page).toHaveURL(/\/login$/);
    });
  },
);
