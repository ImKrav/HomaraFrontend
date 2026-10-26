import { Ensure, equals, isFalse, isPresent, isTrue, not } from '@serenity-js/assertions';
import { type Actor, Duration, notes, Wait } from '@serenity-js/core';
import { isVisible } from '@serenity-js/web';
import type { NotasDelActor } from '../screenplay/actores/NotasDelActor';
import { MensajeDeError, ProductoEnElCatalogo } from '../screenplay/preguntas';
import { CrearProductoAdmin, EliminarProductoAdmin, FiltrarProductosDelPanel } from '../screenplay/tareas';
import { PaginaAdminProductos } from '../screenplay/ui';
import { Cuando, Entonces } from './fixtures';

/** Nombre real (con marca de tiempo) del producto que el actor creó en este escenario. */
const productoCreado = (actor: Actor) => actor.answer(notes<NotasDelActor>().get('nombreProductoCreado'));

Cuando('crea el producto {string} a {cop} con {int} unidades en stock', async ({ enEscena }, nombre: string, precio: number, stock: number) => {
    await enEscena().attemptsTo(CrearProductoAdmin.conDatos({
        nombre: `E2E Screenplay ${ nombre } ${ Date.now() }`,
        descripcion: 'Producto creado por la prueba automatizada ESC32 (se elimina al terminar).',
        categoria: 'Herramientas',
        unidad: 'unidad',
        precio: String(precio),
        stock: String(stock),
    }));
});

Cuando('elimina el producto desde el panel', async ({ enEscena }) => {
    await enEscena().attemptsTo(EliminarProductoAdmin.llamado(await productoCreado(enEscena())));
});

Entonces('ve el panel de administración de productos', async ({ enEscena }) => {
    await enEscena().attemptsTo(
        Wait.upTo(Duration.ofSeconds(30)).until(PaginaAdminProductos.botonAgregarProducto(), isVisible()),
    );
});

Entonces('no ve el panel de administración de productos', async ({ enEscena }) => {
    await enEscena().attemptsTo(Ensure.that(PaginaAdminProductos.botonAgregarProducto(), not(isPresent())));
});

Entonces('encuentra el producto en el listado del panel', async ({ enEscena }) => {
    const nombre = await productoCreado(enEscena());
    await enEscena().attemptsTo(
        FiltrarProductosDelPanel.porNombre(nombre),
        Wait.until(PaginaAdminProductos.filaDelProducto(nombre), isVisible()),
    );
});

Entonces('el listado del panel no muestra resultados', async ({ enEscena }) => {
    await enEscena().attemptsTo(Wait.until(PaginaAdminProductos.mensajeSinResultados(), isVisible()));
});

Entonces('el producto aparece en el catálogo', async ({ enEscena }) => {
    await enEscena().attemptsTo(Ensure.that(ProductoEnElCatalogo.llamado(await productoCreado(enEscena())), isTrue()));
});

Entonces('el producto (ya )no aparece en el catálogo', async ({ enEscena }) => {
    await enEscena().attemptsTo(Ensure.that(ProductoEnElCatalogo.llamado(await productoCreado(enEscena())), isFalse()));
});

Entonces('el formulario de producto muestra el error {string}', async ({ enEscena }, mensaje: string) => {
    await enEscena().attemptsTo(Wait.until(MensajeDeError.delFormularioDeProducto(), equals(mensaje)));
});

Entonces('el formulario de producto sigue abierto', async ({ enEscena }) => {
    await enEscena().attemptsTo(Ensure.that(PaginaAdminProductos.formulario.campoNombre(), isVisible()));
});
