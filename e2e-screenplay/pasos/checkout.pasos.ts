import { contain, Ensure, equals } from '@serenity-js/assertions';
import { EnviarSinValidacionNativa } from '../screenplay/interacciones';
import { CamposInvalidos, PedidosDelCliente } from '../screenplay/preguntas';
import { CompletarCheckout, IrAlCheckout } from '../screenplay/tareas';
import { PaginaCheckout } from '../screenplay/ui';
import { Cuando, Entonces } from './fixtures';

Cuando('intenta pagar sin completar sus datos de envío', async ({ enEscena }) => {
    await enEscena().attemptsTo(CompletarCheckout.sinDatosDeEnvio());
});

Cuando('envía el formulario de pago vacío saltándose la validación del navegador', async ({ enEscena }) => {
    await enEscena().attemptsTo(
        IrAlCheckout.paraPagarSuCarrito(),
        EnviarSinValidacionNativa.elFormulario(PaginaCheckout.formulario()),
    );
});

Cuando('paga con teléfono, dirección, ciudad y departamento formados solo por espacios', async ({ enEscena }) => {
    await enEscena().attemptsTo(
        CompletarCheckout.conDatosDeEnvio({ telefono: '   ', direccion: '   ', ciudad: '   ', departamento: '   ' }),
    );
});

Cuando('completa sus datos de envío y paga', async ({ enEscena }) => {
    await enEscena().attemptsTo(CompletarCheckout.conDatosDeEnvio());
});

Entonces('el navegador marca como obligatorios el teléfono, la dirección, la ciudad y el departamento', async ({ enEscena }) => {
    await enEscena().attemptsTo(
        ...['phone', 'address', 'city', 'state'].map(id => Ensure.that(CamposInvalidos.delFormularioPrincipal(), contain(id))),
    );
});

Entonces('no tiene ningún pedido registrado', async ({ enEscena }) => {
    await enEscena().attemptsTo(Ensure.that(PedidosDelCliente.cantidad(), equals(0)));
});

Entonces('tiene {int} pedido(s) registrado(s) por un total de {cop}', async ({ enEscena }, cantidad: number, total: number) => {
    await enEscena().attemptsTo(
        Ensure.that(PedidosDelCliente.cantidad(), equals(cantidad)),
        Ensure.that(PedidosDelCliente.totalDelMasReciente(), equals(total)),
    );
});
