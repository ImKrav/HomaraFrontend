import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Desde DEF-SEG-FE-02 la sesión va en la cookie HttpOnly homara_session (ya no en localStorage).
const tokenDeSesion = async (page) =>
  (await page.context().cookies()).find((c) => c.name === "homara_session")?.value ?? null;

// Datos: rutas_privadas.csv
const rutasPrivadas: { ruta: string }[] = [
  { ruta: "/proyectos" },
  { ruta: "/cuenta" },
  { ruta: "/checkout" },
];

export default flow(
  "TC11_Ruta_privada_sin_sesion_ESC07",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    // TC11 - Ruta privada sin sesión redirige a /login (ESC07). Datos: rutas_privadas.csv
    for (const { ruta } of rutasPrivadas) {
      await test(`Ruta privada ${ruta} sin sesión redirige a /login`, async () => {
        // Ruta privada: ${ruta}
        // Precondición: sesión limpia (se borran la cookie de sesión y el almacenamiento local)
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

        await page.goto(`${BASE_URL}${ruta}`);
        await expect(page).toHaveURL(/\/login(\?.*)?$/);
        await expect(page.locator("#email")).toBeVisible();
        await expect(page.locator("form button[type='submit']")).toBeVisible();

        await page.screenshot({
          path: `TC11_${ruta.replace(/\//g, "_")}.png`,
          fullPage: true,
        });
      });
    }
  },
);
