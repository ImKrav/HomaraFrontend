import { Ensure, equals } from '@serenity-js/assertions';
import { Wait } from '@serenity-js/core';
import { isVisible } from '@serenity-js/web';
import { PRODUCTO_DE_PRUEBA } from '../screenplay/datos/productos';
import { ADMIN_SEMILLA } from '../screenplay/datos/usuarios';
import { CantidadEnCarrito, CarritoEnElBackend, TotalDelCarrito } from '../screenplay/preguntas';
import {
    AgregarAlCarrito,
    AsegurarProductoDePrueba,
    EliminarDelCarrito,
    IrAlCarrito,
    ModificarCantidad,
    ObtenerTokenPorApi,
} from '../screenplay/tareas';
import { PaginaCarrito } from '../screenplay/ui';
import { Cuando, Dado, Entonces } from './fixtures';

const PRODUCTO = PRODUCTO_DE_PRUEBA.nombre;

Dado('que {actor} mantiene disponible el producto de apoyo a {cop} la unidad', async ({ actorCalled }, actor: string, precio: number) => {
    await actorCalled(actor).attemptsTo(
        // El precio del .feature debe coincidir con el del producto de apoyo (datos/productos.ts).
        Ensure.that(precio, equals(PRODUCTO_DE_PRUEBA.precio)),
        ObtenerTokenPorApi.con(ADMIN_SEMILLA),
        AsegurarProductoDePrueba.existente(),
    );
});

Cuando('(que ){actor} agrega {int} unidad(es) del producto de apoyo al carrito', async ({ actorCalled }, actor: string, unidades: number) => {
    await actorCalled(actor).attemptsTo(AgregarAlCarrito.elProducto(PRODUCTO).unidades(unidades));
});

Cuando('abre su carrito', async ({ enEscena }) => {
    await enEscena().attemptsTo(
        IrAlCarrito.desdeLaBarra(),
        Wait.until(PaginaCarrito.item(PRODUCTO), isVisible()),
    );
});

Cuando('aumenta en una unidad la cantidad del producto de apoyo', async ({ enEscena }) => {
    await enEscena().attemptsTo(ModificarCantidad.delProducto(PRODUCTO).aumentandoUnaUnidad());
});

Cuando('disminuye en una unidad la cantidad del producto de apoyo', async ({ enEscena }) => {
    await enEscena().attemptsTo(ModificarCantidad.delProducto(PRODUCTO).disminuyendoUnaUnidad());
});

Cuando('elimina el producto de apoyo del carrito', async ({ enEscena }) => {
    await enEscena().attemptsTo(EliminarDelCarrito.elProducto(PRODUCTO));
});

Entonces('el contador del carrito marca {int}', async ({ enEscena }, cantidad: number) => {
    await enEscena().attemptsTo(Wait.until(CantidadEnCarrito.segunLaBarra(), equals(cantidad)));
});

Entonces('el producto de apoyo aparece con {int} unidad(es)', async ({ enEscena }, cantidad: number) => {
    await enEscena().attemptsTo(Wait.until(CantidadEnCarrito.delProducto(PRODUCTO), equals(cantidad)));
});

Entonces('el carrito tiene {int} línea(s)', async ({ enEscena }, lineas: number) => {
    await enEscena().attemptsTo(Ensure.that(CantidadEnCarrito.deLineas(), equals(lineas)));
});

Entonces('el carrito guardado en el servidor tiene {int} unidad(es)', async ({ enEscena }, unidades: number) => {
    await enEscena().attemptsTo(Ensure.that(CarritoEnElBackend.unidades(), equals(unidades)));
});

Entonces('el carrito se muestra vacío', async ({ enEscena }) => {
    await enEscena().attemptsTo(
        Wait.until(PaginaCarrito.mensajeCarritoVacio(), isVisible()),
        Ensure.that(PaginaCarrito.nombresDeItems().count(), equals(0)),
    );
});

Entonces('el subtotal es {cop}', async ({ enEscena }, valor: number) => {
    await enEscena().attemptsTo(Wait.until(TotalDelCarrito.subtotal(), equals(valor)));
});

Entonces('el envío cuesta {cop}', async ({ enEscena }, valor: number) => {
    await enEscena().attemptsTo(Ensure.that(TotalDelCarrito.envio(), equals(valor)));
});

Entonces('el envío es gratis', async ({ enEscena }) => {
    await enEscena().attemptsTo(Ensure.that(TotalDelCarrito.envioMostrado(), equals('Gratis')));
});

Entonces('el total es {cop}', async ({ enEscena }, valor: number) => {
    await enEscena().attemptsTo(Ensure.that(TotalDelCarrito.total(), equals(valor)));
});
