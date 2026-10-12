import { By, PageElement } from '@serenity-js/web';

/** Elementos de la barra de navegación superior (vista de escritorio). */
export const BarraDeNavegacion = {
    enlaceCarrito: () => PageElement.located(By.css('nav a[aria-label="Carrito"]')).describedAs('el enlace al carrito'),
    /** Contador (badge) de unidades en el carrito; solo existe si hay unidades. */
    contadorCarrito: () =>
        PageElement.located(By.css('nav a[aria-label="Carrito"] span')).describedAs('el contador del carrito'),
    enlaceIniciarSesion: () =>
        PageElement.located(By.css('nav a[aria-label="Iniciar Sesión"]')).describedAs('el enlace "Iniciar Sesión"'),
    /** Botón de cuenta que muestra el nombre del usuario autenticado. */
    nombreDelUsuario: () =>
        PageElement.located(By.css('nav button span.truncate')).describedAs('el nombre del usuario en la barra'),
    botonCuenta: () =>
        PageElement.located(By.xpath('//nav//button[.//span[contains(@class,"truncate")]]')).describedAs('el menú de cuenta'),
    /** Opción del menú desplegable (la página /cuenta tiene otro botón con el mismo texto). */
    opcionCerrarSesion: () =>
        PageElement.located(By.role('button', { name: 'Cerrar Sesión' }))
            .of(PageElement.located(By.css('nav')))
            .describedAs('la opción "Cerrar Sesión" del menú de cuenta'),
};
