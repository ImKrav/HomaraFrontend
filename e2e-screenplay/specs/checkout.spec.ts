import { contain, Ensure, equals, isGreaterThan, isPresent, not } from '@serenity-js/assertions';
import { Duration, Wait } from '@serenity-js/core';
import { ANDRES_EL_ADMINISTRADOR, CAMILA_LA_CLIENTA } from '../screenplay/actores/Actores';
import { afterEach, beforeEach, describe, it } from '../screenplay/actores/escenario';
import { PRODUCTO_DE_PRUEBA, REGLAS_DE_ENVIO } from '../screenplay/datos/productos';
import { ADMIN_SEMILLA, clienteNuevo } from '../screenplay/datos/usuarios';
import { EnviarSinValidacionNativa, GuardarEvidencia } from '../screenplay/interacciones';
import {
    CamposInvalidos,
    CantidadEnCarrito,
    CarritoEnElBackend,
    Notificacion,
    PedidosDelCliente,
    UrlActual,
} from '../screenplay/preguntas';
import {
    AgregarAlCarrito,
    AsegurarProductoDePrueba,
    CompletarCheckout,
    IniciarSesion,
    IrAlCheckout,
    ObtenerTokenPorApi,
    RegistrarClientePorApi,
    VaciarCarritoPorApi,
} from '../screenplay/tareas';
import { PaginaCheckout } from '../screenplay/ui';

const PRODUCTO = PRODUCTO_DE_PRUEBA.nombre;
const MENSAJE_CAMPOS_REQUERIDOS = 'Por favor completa todos los campos requeridos.';

describe('Checkout', () => {

    beforeEach(async ({ actorCalled }) => {
        await actorCalled(ANDRES_EL_ADMINISTRADOR).attemptsTo(
            ObtenerTokenPorApi.con(ADMIN_SEMILLA),
            AsegurarProductoDePrueba.existente(),
        );
        // Camila es una clienta nueva: su perfil NO tiene teléfono ni dirección.
        await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
            RegistrarClientePorApi.con(clienteNuevo('Camila', 'Restrepo')),
            IniciarSesion.exitosamenteConSusCredenciales(),
            AgregarAlCarrito.elProducto(PRODUCTO),
        );
    });

    afterEach(async ({ actorCalled }) => {
        await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(VaciarCarritoPorApi.delActor());
    });

    describe('ESC27 - Registrar datos de envío', { tag: '@ESC27' }, () => {

        it('SP-25 el navegador bloquea el pago si faltan los datos de envío obligatorios', async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                CompletarCheckout.sinDatosDeEnvio(),
                GuardarEvidencia.como('SP-25-validacion-nativa'),
                Ensure.that(CamposInvalidos.delFormularioPrincipal(), contain('phone')),
                Ensure.that(CamposInvalidos.delFormularioPrincipal(), contain('address')),
                Ensure.that(CamposInvalidos.delFormularioPrincipal(), contain('city')),
                Ensure.that(CamposInvalidos.delFormularioPrincipal(), contain('state')),
                Ensure.that(UrlActual.ruta(), equals('/checkout')),
                Ensure.that(PedidosDelCliente.cantidad(), equals(0)),
                Ensure.that(CarritoEnElBackend.unidades(), equals(1)),
            );
        });

        it('SP-26 la validación de la aplicación muestra un aviso (toast) si faltan datos', async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                IrAlCheckout.paraPagarSuCarrito(),
                EnviarSinValidacionNativa.elFormulario(PaginaCheckout.formulario()),
                Wait.until(Notificacion.visibles(), contain(MENSAJE_CAMPOS_REQUERIDOS)),
                GuardarEvidencia.como('SP-26-toast-campos-requeridos'),
                Ensure.that(UrlActual.ruta(), equals('/checkout')),
                Ensure.that(PedidosDelCliente.cantidad(), equals(0)),
            );
        });

        // Condición de la matriz de trazabilidad (ESC27): "Campos con solo espacios en blanco se consideran vacíos".
        it.fail('SP-27 datos de envío con solo espacios deberían tratarse como vacíos (DEF-03)', {
            annotation: { type: 'defecto', description: 'DEF-03: el checkout acepta teléfono/dirección/ciudad/departamento con solo espacios y crea el pedido' },
        }, async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                CompletarCheckout.conDatosDeEnvio({ telefono: '   ', direccion: '   ', ciudad: '   ', departamento: '   ' }),
                // Se espera a que la aplicación responda con cualquier aviso y luego se verifica cuál fue.
                Wait.upTo(Duration.ofSeconds(20)).until(Notificacion.cantidad(), isGreaterThan(0)),
                GuardarEvidencia.como('SP-27-DEF-03-espacios-en-blanco'),
                Ensure.that(Notificacion.visibles(), contain(MENSAJE_CAMPOS_REQUERIDOS)),
                Ensure.that(PedidosDelCliente.cantidad(), equals(0)),
            );
        });
    });

    describe('ESC28 - Generar pedido', { tag: ['@ESC28', '@ESC27'] }, () => {

        it('SP-28 Camila completa sus datos, paga y se crea el pedido', async ({ actorCalled }) => {
            const totalEsperado = PRODUCTO_DE_PRUEBA.precio + REGLAS_DE_ENVIO.costoEnvio;

            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                CompletarCheckout.conDatosDeEnvio(),
                Wait.upTo(Duration.ofSeconds(20)).until(Notificacion.visibles(), contain('¡Pedido realizado con éxito!')),
                GuardarEvidencia.como('SP-28-pedido-creado'),
                Wait.upTo(Duration.ofSeconds(20)).until(UrlActual.ruta(), equals('/proyectos')),

                // Efectos persistidos en el backend
                Ensure.that(PedidosDelCliente.cantidad(), equals(1)),
                Ensure.that(PedidosDelCliente.totalDelMasReciente(), equals(totalEsperado)),
                Ensure.that(CarritoEnElBackend.unidades(), equals(0)),
                Wait.until(CantidadEnCarrito.segunLaBarra(), equals(0)),
                Ensure.that(PaginaCheckout.botonPagar(), not(isPresent())),
            );
        });
    });
});
