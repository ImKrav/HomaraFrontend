import { contain, Ensure, equals, isFalse, isTrue } from '@serenity-js/assertions';
import { Duration, notes, Wait } from '@serenity-js/core';
import { isVisible } from '@serenity-js/web';
import { ANDRES_EL_ADMINISTRADOR } from '../screenplay/actores/Actores';
import { afterEach, beforeEach, describe, it } from '../screenplay/actores/escenario';
import type { NotasDelActor } from '../screenplay/actores/NotasDelActor';
import { ADMIN_SEMILLA } from '../screenplay/datos/usuarios';
import { GuardarEvidencia } from '../screenplay/interacciones';
import { MensajeDeError, Notificacion, ProductoEnElCatalogo } from '../screenplay/preguntas';
import {
    CrearProductoAdmin,
    EliminarProductoAdmin,
    EliminarProductoPorApi,
    FiltrarProductosDelPanel,
    IniciarSesion,
    ObtenerTokenPorApi,
} from '../screenplay/tareas';
import { PaginaAdminProductos } from '../screenplay/ui';

const productoNuevo = (precio = '189900') => ({
    nombre: `E2E Screenplay Nivel Láser ${ Date.now() }`,
    descripcion: 'Producto creado por la prueba automatizada ESC32 (se elimina al terminar).',
    categoria: 'Herramientas',
    unidad: 'unidad',
    precio,
    stock: '15',
});

describe('ESC32 - Administración de productos', { tag: '@ESC32' }, () => {

    beforeEach(async ({ actorCalled }) => {
        await actorCalled(ANDRES_EL_ADMINISTRADOR).attemptsTo(
            ObtenerTokenPorApi.con(ADMIN_SEMILLA),
            IniciarSesion.exitosamenteCon(ADMIN_SEMILLA),
        );
    });

    afterEach(async ({ actorCalled }) => {
        // Limpieza defensiva: si el escenario falló a mitad de camino, el producto no queda en el catálogo.
        const andres = actorCalled(ANDRES_EL_ADMINISTRADOR);
        const nombre = await andres.answer(notes<NotasDelActor>().get('nombreProductoCreado').isPresent());
        if (nombre) {
            await andres.attemptsTo(
                EliminarProductoPorApi.llamado(await andres.answer(notes<NotasDelActor>().get('nombreProductoCreado'))),
            );
        }
    });

    it('SP-32 Andrés crea un producto y luego lo elimina', async ({ actorCalled }) => {
        const producto = productoNuevo();

        await actorCalled(ANDRES_EL_ADMINISTRADOR).attemptsTo(
            CrearProductoAdmin.conDatos(producto),
            Wait.upTo(Duration.ofSeconds(20)).until(Notificacion.visibles(), contain('Producto guardado correctamente')),
            FiltrarProductosDelPanel.porNombre(producto.nombre),
            Wait.until(PaginaAdminProductos.filaDelProducto(producto.nombre), isVisible()),
            GuardarEvidencia.como('SP-32-producto-creado'),
            Ensure.that(ProductoEnElCatalogo.llamado(producto.nombre), isTrue()),

            EliminarProductoAdmin.llamado(producto.nombre),
            Wait.upTo(Duration.ofSeconds(20)).until(Notificacion.visibles(), contain('Producto eliminado correctamente')),
            Wait.until(PaginaAdminProductos.mensajeSinResultados(), isVisible()),
            Ensure.that(ProductoEnElCatalogo.llamado(producto.nombre), isFalse()),
        );
    });

    it('SP-33 no permite crear un producto con precio 0', async ({ actorCalled }) => {
        const producto = productoNuevo('0');

        await actorCalled(ANDRES_EL_ADMINISTRADOR).attemptsTo(
            CrearProductoAdmin.conDatos(producto),
            Wait.until(MensajeDeError.delFormularioDeProducto(), equals('El precio normal debe ser un número positivo válido.')),
            GuardarEvidencia.como('SP-33-precio-cero'),
            Ensure.that(PaginaAdminProductos.formulario.campoNombre(), isVisible()),
            Ensure.that(ProductoEnElCatalogo.llamado(producto.nombre), isFalse()),
        );
    });
});
