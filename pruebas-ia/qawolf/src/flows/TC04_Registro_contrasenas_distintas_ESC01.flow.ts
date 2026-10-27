import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Desde DEF-SEG-FE-02 la sesión va en la cookie HttpOnly homara_session (ya no en localStorage).
const tokenDeSesion = async (page) =>
  (await page.context().cookies()).find((c) => c.name === "homara_session")?.value ?? null;

const registroContrasenasDistintas = [
  {
    nombre: "Carlos",
    apellido: "Ruiz",
    prefijoEmail: "kr.distintas",
    password: "Homara2024*",
    confirmacion: "Homara2025*",
    mensajeEsperado: "Las contraseñas no coinciden.",
  },
  {
    nombre: "Ana",
    apellido: "Torres",
    prefijoEmail: "kr.mayusculas",
    password: "ClaveSegura1",
    confirmacion: "clavesegura1",
    mensajeEsperado: "Las contraseñas no coinciden.",
  },
];

export default flow(
  "TC04_Registro_contrasenas_distintas_ESC01",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    console.log(
      "TC04 - Registro con contraseñas distintas (ESC01). Datos: registro_contrasenas_distintas.csv",
    );

    for (const fila of registroContrasenasDistintas) {
      const { nombre, apellido, prefijoEmail, password, confirmacion, mensajeEsperado } = fila;

      await test(`registro con contraseñas distintas para ${nombre} ${apellido}`, async () => {
        // Precondición: sesión limpia
        console.log("Precondición: sesión limpia (se borra la sesión y el almacenamiento local)");
        await page.goto(`${BASE_URL}/`);
        await page.context().clearCookies();
        await page.evaluate(() => {
          window.localStorage.clear();
          window.sessionStorage.clear();
        });
        await page.reload();
        await expect(page.locator("nav a[href='/login']").first()).toBeAttached();
        const tokenInicial = await tokenDeSesion(page);
        expect(tokenInicial).toBeNull();

        // Generar correo único
        const email = await page.evaluate(
          (prefijo) => prefijo + "." + Date.now() + "@homara.co",
          prefijoEmail,
        );
        console.log(`Correo usado: ${email}`);

        // Abrir formulario de registro y esperar fin de animaciones
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

        // Completar formulario con contraseñas distintas
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
        await inputConfirmacion.fill(confirmacion);

        // Enviar formulario
        const botonEnviar = page.locator("form button[type='submit']");
        await expect(botonEnviar).toBeVisible();
        await expect(botonEnviar).toBeEnabled();
        await botonEnviar.click();

        // Verificar mensaje de error y que no se creó sesión
        const mensajeError = page.locator("xpath=//div[contains(@class,'bg-error/10')]/span");
        await expect(mensajeError).toBeVisible();
        await expect(mensajeError).toHaveText(mensajeEsperado);

        await page.screenshot({ path: `TC04_${nombre}.png`, fullPage: true });

        await expect(page).toHaveURL(/\/register$/);
        const tokenFinal = await tokenDeSesion(page);
        expect(tokenFinal).toBeNull();
      });
    }
  },
);
