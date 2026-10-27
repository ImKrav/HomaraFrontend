import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Desde DEF-SEG-FE-02 la sesión va en la cookie HttpOnly homara_session (ya no en localStorage).
const tokenDeSesion = async (page) =>
  (await page.context().cookies()).find((c) => c.name === "homara_session")?.value ?? null;

// TC02 - Login inválido, data-driven (ESC02). Datos: login_invalido.csv
const loginInvalido = [
  {
    caso: "Contraseña incorrecta (cliente)",
    correo: "juan@email.com",
    clave: "claveIncorrecta1",
    mensajeEsperado: "Credenciales incorrectas. Verifique correo y contraseña.",
  },
  {
    caso: "Correo no registrado",
    correo: "noexiste.recorder@homara.co",
    clave: "123456",
    mensajeEsperado: "Credenciales incorrectas. Verifique correo y contraseña.",
  },
  {
    caso: "Contraseña incorrecta (admin)",
    correo: "admin@homara.co",
    clave: "admin999",
    mensajeEsperado: "Credenciales incorrectas. Verifique correo y contraseña.",
  },
];

export default flow(
  "TC02_Login_invalido_ESC02",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    for (const { caso, correo, clave, mensajeEsperado } of loginInvalido) {
      await test(`Login inválido - Fila: ${caso} (${correo})`, async () => {
        // Precondición: sesión limpia
        await page.goto(`${BASE_URL}/`);
        await page.context().clearCookies();
        await page.evaluate(() => {
          window.localStorage.clear();
          window.sessionStorage.clear();
        });
        await page.reload();
        await expect(page.locator("nav a[href='/login']")).toBeAttached();
        expect(
          await tokenDeSesion(page),
        ).toBeNull();

        // Abrir login y esperar a que terminen las animaciones
        await page.goto(`${BASE_URL}/login`);
        await expect(page.locator("#email")).toBeVisible();
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

        // Ingresar credenciales inválidas
        await page.locator("#email").fill(correo);
        await expect(page.locator("#password")).toBeVisible();
        await page.locator("#password").fill(clave);

        // Enviar formulario
        const submit = page.locator("form button[type='submit']");
        await expect(submit).toBeVisible();
        await expect(submit).toBeEnabled();
        await submit.click();

        // Verificar mensaje de error
        const mensajeError = page.locator(
          "xpath=//div[contains(@class,'bg-error/10')]/span",
        );
        await expect(mensajeError).toBeVisible();
        await expect(mensajeError).toHaveText(mensajeEsperado);

        await page.screenshot({ path: `TC02_${caso}.png`, fullPage: true });

        // Verificar que no se inició sesión
        await expect(page).toHaveURL(/\/login$/);
        await expect(page.locator("nav a[href='/login']")).toBeAttached();
        expect(
          await tokenDeSesion(page),
        ).toBeNull();
      });
    }
  },
);
