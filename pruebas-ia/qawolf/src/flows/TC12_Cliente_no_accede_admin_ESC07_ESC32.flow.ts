import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Desde DEF-SEG-FE-02 la sesión va en la cookie HttpOnly homara_session (ya no en localStorage).
const tokenDeSesion = async (page) =>
  (await page.context().cookies()).find((c) => c.name === "homara_session")?.value ?? null;

export default flow(
  "TC12_Cliente_no_accede_admin_ESC07_ESC32",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    // TC12 - Un cliente (CUSTOMER) no accede a /admin (ESC07, ESC32)

    const contarAnimacionesActivas = () =>
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

    await test("El cliente es redirigido al inicio al intentar acceder a /admin", async () => {
      await page.goto(`${BASE_URL}/admin`);
      await expect(page).toHaveURL(`${BASE_URL}/`);
      expect(new URL(page.url()).pathname).toBe("/");
      await expect(page.locator("a[href='/admin/productos']")).toHaveCount(0);
      await expect(page.locator("#btn-add-product")).toHaveCount(0);
    });

    await test("El menú de usuario no muestra el enlace al panel de administración", async () => {
      const botonUsuario = page.locator(
        "xpath=//nav//button[.//span[contains(@class,'truncate')]]",
      );
      await expect(botonUsuario).toBeVisible();
      await expect.poll(contarAnimacionesActivas).toBe(0);
      await botonUsuario.click();
      await expect(
        page.locator("xpath=//nav//button[normalize-space()='Cerrar Sesión']"),
      ).toBeVisible();
      await expect(page.locator("xpath=//nav//a[@href='/admin']")).toHaveCount(0);
      await page.screenshot({ path: "TC12_sin_panel_admin.png", fullPage: true });
    });
  },
);
