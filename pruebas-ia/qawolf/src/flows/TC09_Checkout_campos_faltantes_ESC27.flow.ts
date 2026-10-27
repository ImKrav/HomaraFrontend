import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Desde DEF-SEG-FE-02 la sesión va en la cookie HttpOnly homara_session (ya no en localStorage).
const tokenDeSesion = async (page) =>
  (await page.context().cookies()).find((c) => c.name === "homara_session")?.value ?? null;

export default flow(
  "TC09_Checkout_campos_faltantes_ESC27",
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

    const vaciarCarrito = async () => {
      console.log("Vaciar el carrito: se elimina ítem por ítem hasta que no queden");
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

      let itemsCarrito = await page
        .locator("xpath=//button[@aria-label='Eliminar']")
        .count();
      console.log(`Ítems en el carrito: ${itemsCarrito}`);

      while (itemsCarrito !== 0) {
        const itemsEsperados = itemsCarrito - 1;
        await expect(page.locator("button[aria-label='Eliminar']").first()).toBeVisible();
        await esperarAnimaciones();
        await page.locator("button[aria-label='Eliminar']").first().click();
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
        itemsCarrito = await page
          .locator("xpath=//button[@aria-label='Eliminar']")
          .count();
      }

      await expect(
        page.locator("xpath=//h3[normalize-space()='Tu carrito está vacío']"),
      ).toBeVisible();
    };

    const producto = "Rodillo de Pintura Antigoteo 23cm";
    const botonPagar =
      "xpath=//form//button[@type='submit' and starts-with(normalize-space(),'Pagar')]";
    const alertaAgregado =
      "xpath=//div[@role='alert'][.//p[contains(normalize-space(.),'Producto agregado al carrito exitosamente')]]";
    const alertaPedido =
      "xpath=//div[@role='alert'][.//p[contains(normalize-space(.),'Pedido realizado con éxito')]]";

    console.log("TC09 - Checkout con campos faltantes (ESC27). Se borran Dirección y Ciudad");

    await test("Precondición: sesión limpia", async () => {
      console.log("Precondición: sesión limpia (se borran la cookie de sesión y el almacenamiento local)");
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
      await esperarAnimaciones();
      await page.locator("#email").fill("juan@email.com");
      await expect(page.locator("#password")).toBeVisible();
      await page.locator("#password").fill("123456");
      await expect(page.locator("form button[type='submit']")).toBeVisible();
      await expect(page.locator("form button[type='submit']")).toBeEnabled();
      await page.locator("form button[type='submit']").click();
      await expect(page).toHaveURL(/\/cuenta$/);
      await expect(
        page.locator("xpath=//nav//button//span[contains(@class,'truncate')]"),
      ).toBeVisible();
    });

    await test("Vaciar el carrito", async () => {
      await vaciarCarrito();
    });

    await test(`Agregar al carrito: ${producto}`, async () => {
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

      await expect(page.locator(alertaAgregado)).toBeVisible();
      await expect(page.locator(alertaAgregado)).toBeVisible();
    });

    await test("Intentar pagar con Dirección y Ciudad vacías", async () => {
      await page.goto(`${BASE_URL}/checkout`);
      await expect(page.locator("xpath=//h1[normalize-space()='Checkout']")).toBeVisible();
      await expect(page.locator("#address")).toBeVisible();
      await esperarAnimaciones();
      await page.locator("#address").fill("");
      await expect(page.locator("#city")).toBeVisible();
      await page.locator("#city").fill("");
      await expect(page.locator("#address")).toHaveValue("");
      await expect(page.locator("#city")).toHaveValue("");

      await expect(page.locator(botonPagar)).toBeVisible();
      await expect(page.locator(botonPagar)).toBeEnabled();
      await page.locator(botonPagar).click();
      await page.screenshot({ path: "TC09_campos_faltantes.png", fullPage: true });
    });

    await test("Verificar la validación de campos faltantes", async () => {
      const direccionFaltante = await page.evaluate(
        () => (document.querySelector("#address") as HTMLInputElement).validity.valueMissing,
      );
      expect(direccionFaltante).toBe(true);

      const ciudadFaltante = await page.evaluate(
        () => (document.querySelector("#city") as HTMLInputElement).validity.valueMissing,
      );
      expect(ciudadFaltante).toBe(true);

      const mensajeNavegador = await page.evaluate(
        () => (document.querySelector("#address") as HTMLInputElement).validationMessage,
      );
      console.log(`Mensaje de validación del navegador: ${mensajeNavegador}`);
      expect(mensajeNavegador).not.toBe("");

      await expect(page.locator(alertaPedido)).toHaveCount(0);
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(page.locator("xpath=//h1[normalize-space()='Checkout']")).toBeVisible();
    });

    await test("Dejar el carrito limpio para los siguientes casos", async () => {
      await vaciarCarrito();
    });
  },
);
