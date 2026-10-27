import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Desde DEF-SEG-FE-02 la sesión va en la cookie HttpOnly homara_session (ya no en localStorage).
const tokenDeSesion = async (page) =>
  (await page.context().cookies()).find((c) => c.name === "homara_session")?.value ?? null;

export default flow(
  "TC08_Eliminar_del_carrito_ESC15",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    const esperarFinAnimaciones = async () => {
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
    };

    const nombreProducto = "Rodillo de Pintura Antigoteo 23cm";

    await test("Precondición: sesión limpia", async () => {
      console.log("TC08 - Eliminar del carrito (ESC15)");
      console.log(
        "Precondición: sesión limpia (se borran la cookie de sesión y el almacenamiento local)",
      );
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
      console.log("Iniciar sesión como juan@email.com");
      await page.goto(`${BASE_URL}/login`);
      await expect(page.locator("#email")).toBeVisible();
      await esperarFinAnimaciones();
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

    await test("Vaciar el carrito eliminando ítem por ítem", async () => {
      console.log("Vaciar el carrito: se elimina ítem por ítem hasta que no queden");
      await expect(
        page.locator("xpath=//nav//button//span[contains(@class,'truncate')]"),
      ).toBeVisible();
      await expect(page.locator("nav a[href='/carrito']")).toBeVisible();
      await esperarFinAnimaciones();
      await page.locator("nav a[href='/carrito']").click();
      await expect(page).toHaveURL(/\/carrito$/);
      await expect(
        page.locator("xpath=//h1[normalize-space()='Carrito de Compras']"),
      ).toBeAttached();

      let itemsCarrito = await page
        .locator("xpath=//button[@aria-label='Eliminar']")
        .count();
      console.log(`Ítems en el carrito: ${itemsCarrito}`);

      while (itemsCarrito !== 0) {
        const itemsEsperados = itemsCarrito - 1;
        const botonEliminar = page
          .locator("button[aria-label='Eliminar']")
          .first();
        await expect(botonEliminar).toBeVisible();
        await esperarFinAnimaciones();
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
                : document.querySelectorAll("button[aria-label='Eliminar']")
                    .length,
            ),
          )
          .toBe(itemsEsperados);
        itemsCarrito = await page
          .locator("xpath=//button[@aria-label='Eliminar']")
          .count();
      }

      await expect(
        page.locator("xpath=//h3[normalize-space()='Tu carrito está vacío']"),
      ).toBeVisible();
    });

    await test("Agregar al carrito: Rodillo de Pintura Antigoteo 23cm", async () => {
      console.log(`Agregar al carrito: ${nombreProducto}`);
      await page.goto(`${BASE_URL}/catalogo`);
      await expect(
        page.locator("xpath=(//a[starts-with(@href,'/catalogo/')][.//h3])[1]"),
      ).toBeVisible();
      await expect(page.locator("#search-bar")).toBeVisible();
      await esperarFinAnimaciones();
      await page.locator("#search-bar").fill(nombreProducto);
      await page.locator("#search-bar").press("Enter");

      const tarjetaProducto = page.locator(
        `xpath=//a[starts-with(@href,'/catalogo/')][.//h3[normalize-space()='${nombreProducto}']]`,
      );
      await expect(tarjetaProducto).toBeVisible();
      await esperarFinAnimaciones();
      await tarjetaProducto.click();

      await expect(
        page.locator(`xpath=//h1[normalize-space()='${nombreProducto}']`),
      ).toBeVisible();
      const botonAgregar = page.locator(
        "xpath=//button[normalize-space()='Agregar al Carrito']",
      );
      await expect(botonAgregar).toBeVisible();
      await expect(botonAgregar).toBeEnabled();
      await esperarFinAnimaciones();
      await botonAgregar.click();

      const alertaExito = page.locator(
        "xpath=//div[@role='alert'][.//p[contains(normalize-space(.),'Producto agregado al carrito exitosamente')]]",
      );
      await expect(alertaExito).toBeVisible();
      await expect(alertaExito).toBeVisible();
    });

    await test("Ir al carrito y verificar el producto agregado", async () => {
      await expect(
        page.locator("xpath=//nav//button//span[contains(@class,'truncate')]"),
      ).toBeVisible();
      await expect(page.locator("nav a[href='/carrito']")).toBeVisible();
      await esperarFinAnimaciones();
      await page.locator("nav a[href='/carrito']").click();
      await expect(page).toHaveURL(/\/carrito$/);
      await expect(
        page.locator("xpath=//h1[normalize-space()='Carrito de Compras']"),
      ).toBeAttached();
      await expect(
        page.locator(`xpath=//h3[normalize-space()='${nombreProducto}']`),
      ).toBeVisible();
      await page.screenshot({
        path: "TC08_antes_de_eliminar.png",
        fullPage: true,
      });
    });

    await test("Eliminar el producto del carrito y verificar carrito vacío", async () => {
      const botonEliminarProducto = page.locator(
        `xpath=//h3[normalize-space()='${nombreProducto}']/ancestor::div[contains(@class,'gap-4')][1]//button[@aria-label='Eliminar']`,
      );
      await expect(botonEliminarProducto).toBeVisible();
      await esperarFinAnimaciones();
      await botonEliminarProducto.click();

      const tituloProducto = page.locator(
        `xpath=//h3[normalize-space()='${nombreProducto}']`,
      );
      await expect(tituloProducto).not.toBeAttached();
      await expect(tituloProducto).not.toBeAttached();

      const mensajeVacio = page.locator(
        "xpath=//h3[normalize-space()='Tu carrito está vacío']",
      );
      await expect(mensajeVacio).toBeVisible();
      await expect(mensajeVacio).toHaveText("Tu carrito está vacío");
      await page.screenshot({
        path: "TC08_carrito_vacio.png",
        fullPage: true,
      });
    });
  },
);
