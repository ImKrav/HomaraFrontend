import { isPresent, not } from '@serenity-js/assertions';
import { Duration, notes, Task, Wait } from '@serenity-js/core';
import { Click, Enter, isVisible, Navigate, Select } from '@serenity-js/web';
import type { NotasDelActor } from '../actores/NotasDelActor';
import { PaginaAdminProductos } from '../ui';

export interface DatosDeProducto {
    nombre: string;
    descripcion: string;
    categoria: string;
    unidad: string;
    precio: string;
    stock: string;
}

/** Tarea de negocio: abrir el panel de productos del administrador. */
export class AbrirPanelDeProductos {
    static delAdministrador() {
        return Task.where('#actor abre el panel de productos',
            Navigate.to('/admin/productos'),
            Wait.upTo(Duration.ofSeconds(30)).until(PaginaAdminProductos.botonAgregarProducto(), isVisible()),
        );
    }
}

/**
 * Tarea de negocio: el administrador registra un producto nuevo desde el modal
 * "Agregar Nuevo Producto". Anota el nombre para poder limpiarlo después.
 */
export class CrearProductoAdmin {
    static conDatos(datos: DatosDeProducto) {
        const f = PaginaAdminProductos.formulario;
        return Task.where(`#actor crea el producto "${ datos.nombre }"`,
            AbrirPanelDeProductos.delAdministrador(),
            Click.on(PaginaAdminProductos.botonAgregarProducto()),
            Wait.until(f.campoNombre(), isVisible()),
            Enter.theValue(datos.nombre).into(f.campoNombre()),
            Enter.theValue(datos.descripcion).into(f.campoDescripcion()),
            Select.option(datos.categoria).from(f.selectorCategoria()),
            Select.value(datos.unidad).from(f.selectorUnidad()),
            Enter.theValue(datos.precio).into(f.campoPrecio()),
            Enter.theValue(datos.stock).into(f.campoStock()),
            notes<NotasDelActor>().set('nombreProductoCreado', datos.nombre),
            Click.on(f.botonGuardar()),
        );
    }
}

/** Tarea de negocio: localizar un producto en la tabla usando el buscador del panel. */
export class FiltrarProductosDelPanel {
    static porNombre(nombre: string) {
        return Task.where(`#actor filtra la tabla de productos por "${ nombre }"`,
            Enter.theValue(nombre).into(PaginaAdminProductos.campoBuscar()),
        );
    }
}

/** Tarea de negocio: eliminar un producto confirmando en el modal de borrado. */
export class EliminarProductoAdmin {
    static llamado(nombre: string) {
        return Task.where(`#actor elimina el producto "${ nombre }"`,
            FiltrarProductosDelPanel.porNombre(nombre),
            Wait.until(PaginaAdminProductos.filaDelProducto(nombre), isVisible()),
            Click.on(PaginaAdminProductos.botonEliminarDeLaFila().of(PaginaAdminProductos.filaDelProducto(nombre))),
            Wait.until(PaginaAdminProductos.botonConfirmarEliminar(), isVisible()),
            Click.on(PaginaAdminProductos.botonConfirmarEliminar()),
            Wait.until(PaginaAdminProductos.botonConfirmarEliminar(), not(isPresent())),
        );
    }
}
