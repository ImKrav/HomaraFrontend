import { expect, flow } from "@qawolf/flows/web";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// Desde DEF-SEG-FE-02 la sesión va en la cookie HttpOnly homara_session (ya no en localStorage).
const tokenDeSesion = async (page) =>
  (await page.context().cookies()).find((c) => c.name === "homara_session")?.value ?? null;

export default flow(
  "TC13_Admin_crea_y_elimina_producto_ESC32",
  { launch: true, target: "Web - Chrome" },
  async ({ page, test }) => {
    // TC13 - El administrador crea y elimina un producto (ESC32)

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

    let productoAdmin = "";

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

    await test("Iniciar sesión como admin@homara.co", async () => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.locator("#email")).toBeVisible();
      await esperarAnimaciones();
      await page.locator("#email").fill("admin@homara.co");
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

    await test("Generar el nombre del producto de prueba", async () => {
      productoAdmin = await page.evaluate(
        () => "Producto Katalon " + Date.now(),
      );
      // Producto de prueba: ${productoAdmin}
      console.log(`Producto de prueba: ${productoAdmin}`);
    });

    await test("Navegar a la administración de productos", async () => {
      const menuUsuario = page.locator(
        "xpath=//nav//button[.//span[contains(@class,'truncate')]]",
      );
      await expect(menuUsuario).toBeVisible();
      await esperarAnimaciones();
      await menuUsuario.click();

      const enlaceAdmin = page.locator("xpath=//nav//a[@href='/admin']");
      await expect(enlaceAdmin).toBeVisible();
      await esperarAnimaciones();
      await enlaceAdmin.click();
      await expect(page).toHaveURL(/\/admin$/);

      const enlaceProductos = page.locator("a[href='/admin/productos']");
      await expect(enlaceProductos).toBeVisible();
      await esperarAnimaciones();
      await enlaceProductos.click();
      await expect(page).toHaveURL(/\/admin\/productos$/);
      await expect(
        page.locator("xpath=//h1[normalize-space()='Productos']"),
      ).toBeVisible();
    });

    await test("Crear el producto de prueba", async () => {
      const botonAgregar = page.locator("#btn-add-product");
      await expect(botonAgregar).toBeVisible();
      await expect(botonAgregar).toBeEnabled();
      await esperarAnimaciones();
      await botonAgregar.click();

      await expect(page.locator("#input-name")).toBeVisible();
      await esperarAnimaciones();
      await page.locator("#input-name").fill(productoAdmin);
      await expect(page.locator("#input-description")).toBeVisible();
      await page
        .locator("#input-description")
        .fill("Producto de prueba creado por la suite de Katalon Recorder");
      await expect(
        page.locator("xpath=//select[@id='select-category']/option[2]"),
      ).toBeAttached();
      await page.locator("#select-category").selectOption({ index: 1 });
      await page.locator("#select-unit").selectOption({ value: "unidad" });
      await page.locator("#input-price").fill("15000");
      await page.locator("#input-stock").fill("10");
      await page.screenshot({
        path: "TC13_formulario_producto.png",
        fullPage: true,
      });

      const botonGuardar = page.locator("#btn-submit-product");
      await expect(botonGuardar).toBeVisible();
      await expect(botonGuardar).toBeEnabled();
      await botonGuardar.click();

      const alertaGuardado = page.locator(
        "xpath=//div[@role='alert'][.//p[contains(normalize-space(.),'Producto guardado correctamente')]]",
      );
      await expect(alertaGuardado).toBeVisible();
    });

    await test("Buscar y verificar el producto creado", async () => {
      const buscador = page.locator(
        "xpath=//main//input[@placeholder='Buscar herramientas, cerámicas, pinturas o materiales...']",
      );
      await expect(buscador).toBeVisible();
      await esperarAnimaciones();
      await buscador.fill(productoAdmin);

      const celdaProducto = page.locator(
        `xpath=//tbody//span[normalize-space()='${productoAdmin}']`,
      );
      await expect(celdaProducto).toBeVisible();
      await expect(celdaProducto).toHaveText(productoAdmin);
      await page.screenshot({
        path: "TC13_producto_creado.png",
        fullPage: true,
      });
    });

    await test("Eliminar el producto y verificar que ya no aparece", async () => {
      const botonEliminar = page.locator(
        `xpath=//tr[.//span[normalize-space()='${productoAdmin}']]//button[starts-with(@id,'btn-delete-product-')]`,
      );
      await expect(botonEliminar).toBeVisible();
      await botonEliminar.click();

      const botonConfirmar = page.locator("#btn-confirm-delete");
      await expect(botonConfirmar).toBeVisible();
      await expect(botonConfirmar).toBeEnabled();
      await esperarAnimaciones();
      await botonConfirmar.click();

      await expect(
        page.locator(
          "xpath=//div[@role='alert'][.//p[contains(normalize-space(.),'Producto eliminado correctamente')]]",
        ),
      ).toBeVisible();

      const celdaProducto = page.locator(
        `xpath=//tbody//span[normalize-space()='${productoAdmin}']`,
      );
      await expect(celdaProducto).toHaveCount(0);
      await page.screenshot({
        path: "TC13_producto_eliminado.png",
        fullPage: true,
      });
    });
  },
);
