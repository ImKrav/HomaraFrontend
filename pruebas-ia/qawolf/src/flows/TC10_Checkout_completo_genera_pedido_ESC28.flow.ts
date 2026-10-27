import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Desde DEF-SEG-FE-02 la sesión va en la cookie HttpOnly homara_session (ya no en localStorage).
const tokenDeSesion = async (page) =>
  (await page.context().cookies()).find((c) => c.name === "homara_session")?.value ?? null;

export default flow(
  "TC10_Checkout_completo_genera_pedido_ESC28",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    // TC10 - Checkout completo genera pedido (ESC28). Pago contra entrega (cash)

    const esperarAnimaciones = async () => {
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

    const producto = "Rodillo de Pintura Antigoteo 23cm";

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
      await esperarAnimaciones();
      await page.locator("#email").fill("juan@email.com");
      await expect(page.locator("#password")).toBeVisible();
      await page.locator("#password").fill("123456");
      const botonIngresar = page.locator("form button[type='submit']");
      await expect(botonIngresar).toBeVisible();
      await expect(botonIngresar).toBeEnabled();
      await botonIngresar.click();
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

      let itemsCarrito = await page
        .locator("xpath=//button[@aria-label='Eliminar']")
        .count();
      console.log(`Ítems en el carrito: ${itemsCarrito}`);

      while (itemsCarrito !== 0) {
        const itemsEsperados = itemsCarrito - 1;
        await expect(
          page.locator("button[aria-label='Eliminar']").first(),
        ).toBeVisible();
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

      const alertaAgregado = page.locator(
        "xpath=//div[@role='alert'][.//p[contains(normalize-space(.),'Producto agregado al carrito exitosamente')]]",
      );
      await expect(alertaAgregado).toBeVisible();
      await expect(alertaAgregado).toBeVisible();
    });

    await test("Ir al carrito y continuar al checkout", async () => {
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
      await expect(
        page.locator(`xpath=//h3[normalize-space()='${producto}']`),
      ).toBeVisible();

      const irAPagar = page.locator(
        "xpath=//a[@href='/checkout' and normalize-space()='Ir a Pagar']",
      );
      await expect(irAPagar).toBeVisible();
      await esperarAnimaciones();
      await irAPagar.click();
      await expect(page).toHaveURL(/\/checkout$/);
    });

    await test("Completar datos de envío y seleccionar pago contra entrega", async () => {
      await expect(
        page.locator("xpath=//h1[normalize-space()='Checkout']"),
      ).toBeVisible();
      await expect(page.locator("#first-name")).toBeVisible();
      await esperarAnimaciones();
      await page.locator("#first-name").fill("Juan");
      await page.locator("#last-name").fill("Pérez");
      await page.locator("#email").fill("juan@email.com");
      await page.locator("#phone").fill("3001234567");
      await page.locator("#address").fill("Calle 10 # 20-30");
      await page.locator("#city").fill("Medellín");
      await page.locator("#state").fill("Antioquia");
      await page.locator("#zip").fill("050001");

      const pagoEfectivo = page.locator(
        "xpath=//input[@name='payment' and @value='cash']",
      );
      await expect(pagoEfectivo).toBeVisible();
      await pagoEfectivo.click();
      await expect(pagoEfectivo).toBeChecked();

      await page.screenshot({ path: "TC10_datos_envio.png", fullPage: true });
    });

    await test("Pagar y verificar que el pedido se genera con éxito", async () => {
      const botonPagar = page.locator(
        "xpath=//form//button[@type='submit' and starts-with(normalize-space(),'Pagar')]",
      );
      await expect(botonPagar).toBeVisible();
      await expect(botonPagar).toBeEnabled();
      await esperarAnimaciones();
      await botonPagar.click();

      const alertaPedido = page.locator(
        "xpath=//div[@role='alert'][.//p[contains(normalize-space(.),'¡Pedido realizado con éxito!')]]",
      );
      await expect(alertaPedido).toBeVisible();
      await expect(alertaPedido).toBeVisible();

      await page.screenshot({ path: "TC10_pedido_exitoso.png", fullPage: true });

      // Tras la refactorización el pedido redirige a /cuenta (historial de pedidos).
      await expect(page).toHaveURL(/\/cuenta$/);
    });

    await test("Verificar que el carrito queda vacío tras el pedido", async () => {
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

      const carritoVacio = page.locator(
        "xpath=//h3[normalize-space()='Tu carrito está vacío']",
      );
      await expect(carritoVacio).toBeVisible();
      await expect(carritoVacio).toBeVisible();
    });
  },
);
