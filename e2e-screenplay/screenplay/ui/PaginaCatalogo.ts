import { By, PageElement, PageElements } from '@serenity-js/web';

/** Elementos de la página /catalogo */
export const PaginaCatalogo = {
    barraDeBusqueda: () => PageElement.located(By.id('search-bar')).describedAs('la barra de búsqueda'),
    /** Texto "N productos técnicos encontrados" (o "Actualizando..." mientras carga). */
    contadorDeResultados: () =>
        PageElement.located(By.xpath('//p[contains(normalize-space(.),"productos técnicos encontrados")]'))
            .describedAs('el contador de resultados'),
    tarjetasDeProducto: () => PageElements.located(By.css('main a[href^="/catalogo/"]')).describedAs('las tarjetas de producto'),
    nombresDeProductos: () => PageElements.located(By.css('main a[href^="/catalogo/"] h3')).describedAs('los nombres de productos'),
    tarjetaDelProducto: (nombre: string) =>
        PageElement.located(By.xpath(`//main//a[starts-with(@href,"/catalogo/")][.//h3[normalize-space(.)="${nombre}"]]`))
            .describedAs(`la tarjeta del producto "${nombre}"`),
    mensajeSinResultados: () =>
        PageElement.located(By.cssContainingText('main h3', 'No se encontraron productos coincidentes'))
            .describedAs('el mensaje "sin resultados"'),
};

/** Elementos de la página de detalle /catalogo/{id} */
export const PaginaDetalleProducto = {
    titulo: () => PageElement.located(By.css('main h1')).describedAs('el título del producto'),
    botonAgregarAlCarrito: () =>
        PageElement.located(By.role('button', { name: 'Agregar al Carrito' })).describedAs('el botón "Agregar al Carrito"'),
};
