import { By, PageElement, PageElements } from '@serenity-js/web';

/** Bloque "Resumen del Pedido" de la página del carrito. */
const RESUMEN = '//h2[normalize-space(.)="Resumen del Pedido"]/following-sibling::div[1]';

/** Elementos de la página /carrito */
export const PaginaCarrito = {
    titulo: () =>
        PageElement.located(By.cssContainingText('main h1', 'Carrito de Compras')).describedAs('el título del carrito'),
    mensajeCarritoVacio: () =>
        PageElement.located(By.cssContainingText('main h3', 'Tu carrito está vacío')).describedAs('el mensaje de carrito vacío'),

    /** Tarjeta de un ítem: el contenedor más cercano del nombre que además tiene el botón "Eliminar". */
    item: (nombre: string) =>
        PageElement.located(
            By.xpath(`//main//h3[normalize-space(.)="${ nombre }"]/ancestor::div[.//button[@aria-label="Eliminar"]][1]`),
        ).describedAs(`el ítem "${ nombre }" del carrito`),
    nombresDeItems: () =>
        PageElements.located(By.xpath('//main//div[.//button[@aria-label="Eliminar"]]/div/h3'))
            .describedAs('los nombres de los ítems del carrito'),

    // Elementos relativos a un ítem (se usan con .of(PaginaCarrito.item(nombre)))
    botonAumentar: () => PageElement.located(By.css('button[aria-label="+"]')).describedAs('el botón "+"'),
    botonDisminuir: () => PageElement.located(By.css('button[aria-label="-"]')).describedAs('el botón "-"'),
    cantidad: () =>
        PageElement.located(By.xpath('.//button[@aria-label="-"]/following-sibling::span[1]')).describedAs('la cantidad'),
    botonEliminar: () => PageElement.located(By.css('button[aria-label="Eliminar"]')).describedAs('el botón "Eliminar"'),

    // Resumen del pedido
    subtotal: () =>
        PageElement.located(By.xpath(`${ RESUMEN }//span[starts-with(normalize-space(.),"Subtotal")]/following-sibling::span`))
            .describedAs('el subtotal del carrito'),
    envio: () =>
        PageElement.located(By.xpath(`${ RESUMEN }//span[normalize-space(.)="Envío"]/following-sibling::span`))
            .describedAs('el costo de envío del carrito'),
    total: () =>
        PageElement.located(By.xpath(`${ RESUMEN }//span[normalize-space(.)="Total"]/following-sibling::span`))
            .describedAs('el total del carrito'),
    botonIrAPagar: () =>
        PageElement.located(By.cssContainingText('main a', 'Ir a Pagar')).describedAs('el botón "Ir a Pagar"'),
};
