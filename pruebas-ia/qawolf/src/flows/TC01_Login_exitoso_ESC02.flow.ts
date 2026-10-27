import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Datos de login_valido.csv
const filas = [
  {
    caso: "Cliente CUSTOMER",
    correo: "juan@email.com",
    clave: "123456",
    nombreEsperado: "Juan",
  },
  {
    caso: "Administrador ADMIN",
    correo: "admin@homara.co",
    clave: "123456",
    nombreEsperado: "Admin",
  },
];

export default flow(
  "TC01_Login_exitoso_ESC02",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    // TC01 - Login exitoso (ESC02). Datos: login_valido.csv
    for (const { caso, correo, clave, nombreEsperado } of filas) {
      await test(`Fila: ${caso} (${correo}) - login exitoso`, async () => {
        // Precondición: sesión limpia. La sesión vive en la cookie HttpOnly
        // "homara_session", que no es accesible desde JavaScript.
        await page.goto(`${BASE_URL}/`);
        await page.context().clearCookies();
        await page.evaluate(() => {
          window.localStorage.clear();
          window.sessionStorage.clear();
        });
        await page.reload();
        await expect(page.locator("nav a[href='/login']").first()).toBeAttached();

        // Verificar que no exista sesión activa
        const cookiesAntes = await page.context().cookies();
        expect(cookiesAntes.find((c) => c.name === "homara_session")).toBeUndefined();

        // Abrir el formulario de login
        await page.goto(`${BASE_URL}/login`);
        await expect(page.locator("#email")).toBeVisible();
        await expect(page.locator("#password")).toBeAttached();

        // Esperar a que terminen las animaciones finitas en curso
        await expect
          .poll(() =>
            page.evaluate(
              () =>
                document
                  .getAnimations()
                  .filter((a) => a.playState === "running")
                  .filter(
                    (a) => !a.effect || a.effect.getTiming().iterations !== Infinity,
                  ).length,
            ),
          )
          .toBe(0);

        // Completar credenciales
        await page.locator("#email").fill(correo);
        await expect(page.locator("#password")).toBeVisible();
        await page.locator("#password").fill(clave);
        await page.screenshot({ path: `TC01_${caso}_formulario.png`, fullPage: true });

        // Enviar el formulario
        const botonEnviar = page.locator("form button[type='submit']");
        await expect(botonEnviar).toBeVisible();
        await expect(botonEnviar).toBeEnabled();
        await botonEnviar.click();

        // Verificar redirección a Mi Cuenta
        await expect(page).toHaveURL(/\/cuenta$/);
        const titulo = page.locator("xpath=//h1[normalize-space()='Mi Cuenta']");
        await expect(titulo).toBeVisible();

        // Verificar nombre del usuario en la barra de navegación
        const nombreUsuario = page.locator(
          "xpath=//nav//button//span[contains(@class,'truncate')]",
        );
        await expect(nombreUsuario).toBeVisible();
        await expect(nombreUsuario).toHaveText(nombreEsperado);

        // Verificar que exista la sesión
        const cookiesDespues = await page.context().cookies();
        expect(cookiesDespues.find((c) => c.name === "homara_session")).toBeDefined();

        await page.screenshot({ path: `TC01_${caso}_cuenta.png`, fullPage: true });
      });
    }
  },
);
