import { By, PageElement } from '@serenity-js/web';

/** Elementos de la página /proyectos/nuevo (estimador de proyectos) */
export const PaginaNuevoProyecto = {
    titulo: () =>
        PageElement.located(By.cssContainingText('main h1', 'Nuevo Proyecto Inteligente')).describedAs('el título del estimador'),
    campoNombre: () => PageElement.located(By.id('project-name')).describedAs('el campo Nombre descriptivo'),
    campoLargo: () => PageElement.located(By.id('length')).describedAs('el campo Largo'),
    campoAncho: () => PageElement.located(By.id('width')).describedAs('el campo Ancho'),
    campoAlto: () => PageElement.located(By.id('height')).describedAs('el campo Alto'),
    /** Tarjeta seleccionable del tipo de superficie ("Solo Piso", "Solo Paredes", "Solo Techo", ...). */
    tipoDeSuperficie: (etiqueta: string) =>
        PageElement.located(
            By.xpath(`//label[.//input[@name="project-type"]][.//span[normalize-space(.)="${ etiqueta }"]]`),
        ).describedAs(`la superficie "${ etiqueta }"`),
    /** Hay dos botones "Guardar y Calcular Insumos" (cabecera y resumen); se usa el de la cabecera. */
    botonGuardar: () =>
        PageElement.located(By.xpath('(//main//button[normalize-space(.)="Guardar y Calcular Insumos"])[1]'))
            .describedAs('el botón "Guardar y Calcular Insumos"'),
};

/** Elementos de la página de detalle /proyectos/{id} */
export const PaginaDetalleProyecto = {
    titulo: () => PageElement.located(By.css('main h1')).describedAs('el nombre del proyecto'),
};
