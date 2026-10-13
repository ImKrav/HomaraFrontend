import { Ensure, equals, not } from '@serenity-js/assertions';
import { Wait } from '@serenity-js/core';
import { isVisible } from '@serenity-js/web';
import { ANDRES_EL_ADMINISTRADOR, CAMILA_LA_CLIENTA } from '../screenplay/actores/Actores';
import { afterEach, beforeEach, describe, it } from '../screenplay/actores/escenario';
import { PRODUCTO_DE_PRUEBA, REGLAS_DE_ENVIO } from '../screenplay/datos/productos';
import { ADMIN_SEMILLA, clienteNuevo } from '../screenplay/datos/usuarios';
import { GuardarEvidencia } from '../screenplay/interacciones';
import { CantidadEnCarrito, CarritoEnElBackend, TotalDelCarrito } from '../screenplay/preguntas';
import {
    AgregarAlCarrito,
    AsegurarProductoDePrueba,
    EliminarDelCarrito,
    IniciarSesion,
    IrAlCarrito,
    ModificarCantidad,
    ObtenerTokenPorApi,
    RegistrarClientePorApi,
    VaciarCarritoPorApi,
} from '../screenplay/tareas';
import { PaginaCarrito } from '../screenplay/ui';

const PRODUCTO = PRODUCTO_DE_PRUEBA.nombre;
const { precio } = PRODUCTO_DE_PRUEBA;
const { costoEnvio, umbralEnvioGratis } = REGLAS_DE_ENVIO;

describe('Carrito de compras', () => {

    beforeEach(async ({ actorCalled }) => {
        // Arrange: Andrés asegura el producto de apoyo; Camila es una clienta nueva con sesión iniciada.
        await actorCalled(ANDRES_EL_ADMINISTRADOR).attemptsTo(
            ObtenerTokenPorApi.con(ADMIN_SEMILLA),
            AsegurarProductoDePrueba.existente(),
        );
        await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
            RegistrarClientePorApi.con(clienteNuevo('Camila', 'Restrepo')),
            IniciarSesion.exitosamenteConSusCredenciales(),
        );
    });

    afterEach(async ({ actorCalled }) => {
        // Cleanup: libera el stock reservado por el carrito de la clienta de prueba.
        await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(VaciarCarritoPorApi.delActor());
    });

    describe('ESC13 - Agregar producto al carrito', { tag: '@ESC13' }, () => {

        it('SP-17 Camila agrega un producto y lo ve en su carrito', async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                AgregarAlCarrito.elProducto(PRODUCTO),
                Ensure.that(CantidadEnCarrito.segunLaBarra(), equals(1)),
                IrAlCarrito.desdeLaBarra(),
                Wait.until(PaginaCarrito.item(PRODUCTO), isVisible()),
                Ensure.that(CantidadEnCarrito.delProducto(PRODUCTO), equals(1)),
                Ensure.that(CarritoEnElBackend.unidades(), equals(1)),
            );
        });

        it('SP-18 agregar dos veces el mismo producto acumula la cantidad en una sola línea', async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                AgregarAlCarrito.elProducto(PRODUCTO).unidades(2),
                Ensure.that(CantidadEnCarrito.segunLaBarra(), equals(2)),
                IrAlCarrito.desdeLaBarra(),
                Wait.until(PaginaCarrito.item(PRODUCTO), isVisible()),
                Ensure.that(CantidadEnCarrito.deLineas(), equals(1)),
                Ensure.that(CantidadEnCarrito.delProducto(PRODUCTO), equals(2)),
            );
        });
    });

    describe('ESC14 - Modificar cantidad en el carrito', { tag: '@ESC14' }, () => {

        it('SP-19 aumentar con "+" sube la cantidad y recalcula el subtotal', { tag: '@ESC16' }, async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                AgregarAlCarrito.elProducto(PRODUCTO),
                IrAlCarrito.desdeLaBarra(),
                Wait.until(PaginaCarrito.item(PRODUCTO), isVisible()),
                ModificarCantidad.delProducto(PRODUCTO).aumentandoUnaUnidad(),
                Ensure.that(CantidadEnCarrito.delProducto(PRODUCTO), equals(2)),
                Wait.until(TotalDelCarrito.subtotal(), equals(precio * 2)),
                Wait.until(CantidadEnCarrito.segunLaBarra(), equals(2)),
                Ensure.that(CarritoEnElBackend.unidades(), equals(2)),
            );
        });

        it('SP-20 disminuir con "-" baja la cantidad y vuelve a cobrar el envío', { tag: '@ESC16' }, async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                AgregarAlCarrito.elProducto(PRODUCTO).unidades(2),
                IrAlCarrito.desdeLaBarra(),
                Wait.until(PaginaCarrito.item(PRODUCTO), isVisible()),
                Ensure.that(TotalDelCarrito.subtotal(), equals(precio * 2)),

                ModificarCantidad.delProducto(PRODUCTO).disminuyendoUnaUnidad(),
                Wait.until(TotalDelCarrito.subtotal(), equals(precio)),
                Ensure.that(TotalDelCarrito.envioMostrado(), not(equals('Gratis'))),
                Ensure.that(TotalDelCarrito.total(), equals(precio + costoEnvio)),
                Wait.until(CantidadEnCarrito.segunLaBarra(), equals(1)),
            );
        });
    });

    describe('ESC15 - Eliminar ítem del carrito', { tag: '@ESC15' }, () => {

        it('SP-21 Camila elimina el producto y el carrito queda vacío', async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                AgregarAlCarrito.elProducto(PRODUCTO),
                IrAlCarrito.desdeLaBarra(),
                Wait.until(PaginaCarrito.item(PRODUCTO), isVisible()),
                Ensure.that(CantidadEnCarrito.deLineas(), equals(1)),

                EliminarDelCarrito.elProducto(PRODUCTO),
                Wait.until(PaginaCarrito.mensajeCarritoVacio(), isVisible()),
                GuardarEvidencia.como('SP-21-carrito-vacio'),
                Wait.until(CantidadEnCarrito.segunLaBarra(), equals(0)),
                Ensure.that(CarritoEnElBackend.unidades(), equals(0)),
                Ensure.that(PaginaCarrito.nombresDeItems().count(), equals(0)),
            );
        });
    });

    describe('ESC16 - Calcular totales del carrito', { tag: '@ESC16' }, () => {

        it('SP-22 con subtotal menor a 500.000 COP se cobra el envío (25.000 COP)', async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                AgregarAlCarrito.elProducto(PRODUCTO),
                IrAlCarrito.desdeLaBarra(),
                Wait.until(PaginaCarrito.item(PRODUCTO), isVisible()),
                Ensure.that(TotalDelCarrito.subtotal(), equals(precio)),
                GuardarEvidencia.como('SP-22-envio-cobrado'),
                Ensure.that(TotalDelCarrito.envio(), equals(costoEnvio)),
                Ensure.that(TotalDelCarrito.total(), equals(precio + costoEnvio)),
            );
        });

        it('SP-23 con subtotal mayor a 500.000 COP el envío es gratis', async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                AgregarAlCarrito.elProducto(PRODUCTO).unidades(3),
                IrAlCarrito.desdeLaBarra(),
                Wait.until(PaginaCarrito.item(PRODUCTO), isVisible()),
                Ensure.that(TotalDelCarrito.subtotal(), equals(precio * 3)),
                GuardarEvidencia.como('SP-23-envio-gratis'),
                Ensure.that(TotalDelCarrito.envioMostrado(), equals('Gratis')),
                Ensure.that(TotalDelCarrito.total(), equals(precio * 3)),
            );
        });

        // Valor límite. RN-031 ("REGLAS DE NEGOCIO.xlsx") y el alcance de esta suite dicen que el envío
        // es gratis con subtotal IGUAL o mayor a 500.000 COP; el backend usa "subtotal > 500000".
        // Se marca como fallo esperado (defecto conocido DEF-02): si se corrige, Playwright lo avisará.
        it.fail('SP-24 con subtotal exactamente igual a 500.000 COP el envío debería ser gratis (DEF-02)', {
            annotation: { type: 'defecto', description: 'DEF-02: el umbral de envío gratis excluye el valor 500.000 (RN-031 dice "igual o mayor")' },
        }, async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                AgregarAlCarrito.elProducto(PRODUCTO).unidades(2),
                IrAlCarrito.desdeLaBarra(),
                Wait.until(PaginaCarrito.item(PRODUCTO), isVisible()),
                Ensure.that(TotalDelCarrito.subtotal(), equals(umbralEnvioGratis)),
                GuardarEvidencia.como('SP-24-DEF-02-umbral-500000'),
                Ensure.that(TotalDelCarrito.envioMostrado(), equals('Gratis')),
                Ensure.that(TotalDelCarrito.total(), equals(umbralEnvioGratis)),
            );
        });
    });
});
