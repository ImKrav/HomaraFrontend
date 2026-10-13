import { By, PageElement, PageElements } from '@serenity-js/web';

/** Elementos de la página /admin/productos (ids confirmados en app/(admin)/admin/productos/page.tsx) */
export const PaginaAdminProductos = {
    titulo: () => PageElement.located(By.cssContainingText('main h1', 'Productos')).describedAs('el título de productos'),
    botonAgregarProducto: () => PageElement.located(By.id('btn-add-product')).describedAs('el botón "Agregar producto"'),
    campoBuscar: () =>
        PageElement.located(By.css('main input[placeholder="Buscar herramientas, cerámicas, pinturas o materiales..."]'))
            .describedAs('el buscador de productos del panel'),
    filaDelProducto: (nombre: string) =>
        PageElement.located(By.xpath(`//main//table//tr[.//span[normalize-space(.)="${ nombre }"]]`))
            .describedAs(`la fila del producto "${ nombre }"`),
    /** Relativo a una fila: .of(PaginaAdminProductos.filaDelProducto(nombre)) */
    botonEliminarDeLaFila: () =>
        PageElement.located(By.css('button[title="Eliminar Producto"]')).describedAs('el botón "Eliminar Producto"'),
    mensajeSinResultados: () =>
        PageElement.located(By.cssContainingText('main table td', 'No se encontraron productos coincidentes'))
            .describedAs('el mensaje de tabla sin resultados'),
    nombresEnLaTabla: () =>
        PageElements.located(By.css('main table tbody tr td:first-child span.font-semibold'))
            .describedAs('los nombres de producto de la tabla'),

    /** Modal de creación / edición de producto */
    formulario: {
        campoNombre: () => PageElement.located(By.id('input-name')).describedAs('el campo Nombre del producto'),
        campoDescripcion: () => PageElement.located(By.id('input-description')).describedAs('el campo Descripción'),
        selectorCategoria: () => PageElement.located(By.id('select-category')).describedAs('el selector de Categoría'),
        selectorUnidad: () => PageElement.located(By.id('select-unit')).describedAs('el selector de Unidad'),
        campoPrecio: () => PageElement.located(By.id('input-price')).describedAs('el campo Precio'),
        campoStock: () => PageElement.located(By.id('input-stock')).describedAs('el campo Stock'),
        botonGuardar: () => PageElement.located(By.id('btn-submit-product')).describedAs('el botón "Guardar Producto"'),
        mensajeDeError: () =>
            PageElement.located(By.xpath('//form/preceding-sibling::div[contains(@class,"bg-error")]'))
                .describedAs('el error del formulario de producto'),
    },

    /** Modal de confirmación de borrado */
    botonConfirmarEliminar: () =>
        PageElement.located(By.id('btn-confirm-delete')).describedAs('el botón "Eliminar de Por Vida"'),
};
