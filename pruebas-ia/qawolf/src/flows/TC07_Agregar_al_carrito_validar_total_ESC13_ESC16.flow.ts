import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Desde DEF-SEG-FE-02 la sesión va en la cookie HttpOnly homara_session (ya no en localStorage).
const tokenDeSesion = async (page) =>
  (await page.context().cookies()).find((c) => c.name === "homara_session")?.value ?? null;

// TC07 - Agregar al carrito y validar el total (ESC13, ESC16). Producto de 549.000 COP: envío gratis
export default flow(
  "TC07_Agregar_al_carrito_validar_total_ESC13_ESC16",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    const esperarAnimaciones = async () => {
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
    };

    const producto = "Pintura Koraza Caneca 5 Galones";

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
      expect.soft(token).toBeNull();
    });

    await test("Iniciar sesión como juan@email.com", async () => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.locator("#email")).toBeVisible();
      await esperarAnimaciones();
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

    await test("Vaciar el carrito: se elimina ítem por ítem hasta que no queden", async () => {
      await expect(
        page.locator("xpath=//nav//button//span[contains(@class,'truncate')]"),
      ).toBeVisible();
      await expect(page.locator("nav a[href='/carrito']")).toBeVisible();
      await esperarAnimaciones();
      await page.locator("nav a[href='/carrito']").click();
      await expect(page).toHaveURL(/\/carrito$/);
      await expect(
        page.locator("xpath=//h1[normalize-space()='Carrito de Compras']"),
      ).toBeAttached();

      const botonesEliminar = page.locator("xpath=//button[@aria-label='Eliminar']");
      let itemsCarrito = await botonesEliminar.count();
      console.log(`Ítems en el carrito: ${itemsCarrito}`);

      while (itemsCarrito !== 0) {
        const itemsEsperados = itemsCarrito - 1;
        const botonEliminar = page.locator("button[aria-label='Eliminar']").first();
        await expect(botonEliminar).toBeVisible();
        await esperarAnimaciones();
        await botonEliminar.click();
        await expect
          .poll(() =>
            page.evaluate(() =>
              document.evaluate(
                "//h1[normalize-space()='Carrito de Compras']",
                document,
                null,
                9,
                null,
              ).singleNodeValue === null
                ? -1
                : document.querySelectorAll("button[aria-label='Eliminar']").length,
            ),
          )
          .toBe(itemsEsperados);
        itemsCarrito = await botonesEliminar.count();
      }

      await expect(
        page.locator("xpath=//h3[normalize-space()='Tu carrito está vacío']"),
      ).toBeVisible();
    });

    await test("Agregar al carrito: Pintura Koraza Caneca 5 Galones", async () => {
      await page.goto(`${BASE_URL}/catalogo`);
      await expect(
        page.locator("xpath=(//a[starts-with(@href,'/catalogo/')][.//h3])[1]"),
      ).toBeVisible();
      await expect(page.locator("#search-bar")).toBeVisible();
      await esperarAnimaciones();
      await page.locator("#search-bar").fill(producto);
      await page.locator("#search-bar").press("Enter");

      const tarjetaProducto = page.locator(
        `xpath=//a[starts-with(@href,'/catalogo/')][.//h3[normalize-space()='${producto}']]`,
      );
      await expect(tarjetaProducto).toBeVisible();
      await esperarAnimaciones();
      await tarjetaProducto.click();

      await expect(
        page.locator(`xpath=//h1[normalize-space()='${producto}']`),
      ).toBeVisible();
      const botonAgregar = page.locator(
        "xpath=//button[normalize-space()='Agregar al Carrito']",
      );
      await expect(botonAgregar).toBeVisible();
      await expect(botonAgregar).toBeEnabled();
      await esperarAnimaciones();
      await botonAgregar.click();

      const alertaExito = page.locator(
        "xpath=//div[@role='alert'][.//p[contains(normalize-space(.),'Producto agregado al carrito exitosamente')]]",
      );
      await expect(alertaExito).toBeVisible();
      await expect.soft(alertaExito).toBeVisible();
      await page.screenshot({ path: "TC07_producto_agregado.png", fullPage: true });
    });

    await test("Validar el total en el carrito: subtotal 549.000, envío gratis (ESC13, ESC16)", async () => {
      await expect(
        page.locator("xpath=//nav//button//span[contains(@class,'truncate')]"),
      ).toBeVisible();
      await expect(page.locator("nav a[href='/carrito']")).toBeVisible();
      await esperarAnimaciones();
      await page.locator("nav a[href='/carrito']").click();
      await expect(page).toHaveURL(/\/carrito$/);

      const tituloCarrito = page.locator(
        "xpath=//h1[normalize-space()='Carrito de Compras']",
      );
      await expect(tituloCarrito).toBeAttached();
      await expect(tituloCarrito).toBeVisible();
      await expect(
        page.locator(`xpath=//h3[normalize-space()='${producto}']`),
      ).toBeVisible();
      await expect
        .soft(page.locator("button[aria-label='Eliminar']").first())
        .toBeAttached();

      const total = page.locator(
        "xpath=//span[normalize-space()='Total']/following-sibling::span",
      );
      await expect(total).toBeVisible();
      await expect
        .soft(
          page.locator(
            "xpath=//span[starts-with(normalize-space(),'Subtotal')]/following-sibling::span",
          ),
        )
        .toHaveText(/^\$\s?549\.000$/);
      await expect
        .soft(
          page.locator(
            "xpath=//span[normalize-space()='Envío']/following-sibling::span",
          ),
        )
        .toHaveText("Gratis");
      await expect.soft(total).toHaveText(/^\$\s?549\.000$/);
      await expect
        .soft(
          page.locator(
            "xpath=//a[@href='/checkout' and normalize-space()='Ir a Pagar']",
          ),
        )
        .toBeVisible();
      await page.screenshot({ path: "TC07_carrito_totales.png", fullPage: true });
    });
  },
);
