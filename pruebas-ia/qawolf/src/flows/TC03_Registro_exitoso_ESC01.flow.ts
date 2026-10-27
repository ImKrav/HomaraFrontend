import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Datos: registro_valido.csv
const registroValido = [
  {
    nombre: "Laura",
    apellido: "Gómez",
    prefijoEmail: "kr.registro",
    dominioEmail: "homara.co",
    password: "Homara2024*",
  },
  {
    nombre: "Andrés",
    apellido: "Martínez",
    prefijoEmail: "kr.cliente",
    dominioEmail: "homara.co",
    password: "ClaveSegura123",
  },
];

export default flow(
  "TC03_Registro_exitoso_ESC01",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    console.log("TC03 - Registro exitoso (ESC01). Datos: registro_valido.csv; correo único con Date.now()");

    for (const { nombre, apellido, prefijoEmail, dominioEmail, password } of registroValido) {
      await test(`Registro exitoso de ${nombre} ${apellido}`, async () => {
        // Precondición: sesión limpia
        // La sesión vive en la cookie HttpOnly "homara_session", por eso se borran las cookies
        console.log("Precondición: sesión limpia (se borra la cookie de sesión homara_session)");
        await page.goto(`${BASE_URL}/`);
        await page.context().clearCookies();
        await page.evaluate(() => {
          window.localStorage.clear();
          window.sessionStorage.clear();
        });
        await page.reload();
        await expect(page.locator("nav a[href='/login']").first()).toBeAttached();

        // Verificación equivalente a homara_token === null: no existe la cookie de sesión
        const cookiesAntes = await page.context().cookies();
        expect(cookiesAntes.find((c) => c.name === "homara_session")).toBeUndefined();

        // Generar correo único
        const email = await page.evaluate(
          ({ prefijo, dominio }) => `${prefijo}.` + Date.now() + `@${dominio}`,
          { prefijo: prefijoEmail, dominio: dominioEmail },
        );
        console.log(`Correo generado para el registro: ${email}`);

        // Abrir el formulario de registro
        await page.goto(`${BASE_URL}/register`);
        const inputNombre = page.locator("xpath=//form//input[@placeholder='Juan']");
        await expect(inputNombre).toBeVisible();
        await expect
          .poll(() =>
            page.evaluate(
              () =>
                document
                  .getAnimations()
                  .filter((a) => a.playState === "running")
                  .filter((a) => !a.effect || a.effect.getTiming().iterations !== Infinity).length,
            ),
          )
          .toBe(0);

        // Diligenciar el formulario
        await inputNombre.fill(nombre);

        const inputApellido = page.locator("xpath=//form//input[@placeholder='Pérez']");
        await expect(inputApellido).toBeVisible();
        await inputApellido.fill(apellido);

        const inputEmail = page.locator("xpath=//form//input[@placeholder='juan@email.com']");
        await expect(inputEmail).toBeVisible();
        await inputEmail.fill(email);

        const inputPassword = page.locator("xpath=(//form//input[@type='password'])[1]");
        await expect(inputPassword).toBeVisible();
        await inputPassword.fill(password);

        const inputConfirmacion = page.locator("xpath=(//form//input[@type='password'])[2]");
        await expect(inputConfirmacion).toBeVisible();
        await inputConfirmacion.fill(password);

        await page.screenshot({ path: `TC03_${nombre}_formulario.png`, fullPage: true });

        // Enviar el formulario
        const botonEnviar = page.locator("form button[type='submit']");
        await expect(botonEnviar).toBeVisible();
        await expect(botonEnviar).toBeEnabled();
        await botonEnviar.click();

        // Verificar el registro exitoso
        await expect(page).toHaveURL(/\/cuenta$/);

        const nombreUsuario = page.locator("xpath=//nav//button//span[contains(@class,'truncate')]");
        await expect(nombreUsuario).toBeVisible();
        await expect(nombreUsuario).toHaveText(nombre);

        await expect(page.locator("xpath=//div[contains(@class,'bg-error/10')]/span")).toHaveCount(0);

        // Verificación equivalente a homara_token !== null: existe la cookie de sesión
        const cookiesDespues = await page.context().cookies();
        expect(cookiesDespues.find((c) => c.name === "homara_session")).toBeDefined();

        await page.screenshot({ path: `TC03_${nombre}_registrado.png`, fullPage: true });
      });
    }
  },
);
