import { Ensure, equals, includes } from '@serenity-js/assertions';
import { Duration, Wait } from '@serenity-js/core';
import { Attribute } from '@serenity-js/web';
import { CLIENTE_SEMILLA, claveDePrueba, clienteNuevo, correoUnico } from '../screenplay/datos/usuarios';
import { MensajeDeError, NombreDelUsuario, UrlActual } from '../screenplay/preguntas';
import { CerrarSesion, IniciarSesion, Registrarse } from '../screenplay/tareas';
import { PaginaRegistro } from '../screenplay/ui';
import { Cuando, Entonces } from './fixtures';

const nuevaCliente = (actor: string) => clienteNuevo(actor.split(' ')[0], 'Restrepo');

// ── Registro ──

Cuando('{actor} se registra con datos válidos', async ({ actorCalled }, actor: string) => {
    await actorCalled(actor).attemptsTo(Registrarse.con(nuevaCliente(actor)));
});

Cuando('{actor} intenta registrarse con el correo {string}', async ({ actorCalled }, actor: string, email: string) => {
    await actorCalled(actor).attemptsTo(Registrarse.con({ ...nuevaCliente(actor), email }));
});

Cuando('{actor} intenta registrarse con una confirmación de contraseña distinta', async ({ actorCalled }, actor: string) => {
    await actorCalled(actor).attemptsTo(Registrarse.conConfirmacionDistinta(nuevaCliente(actor), claveDePrueba()));
});

Cuando('{actor} intenta registrarse con una contraseña de {int} caracteres', async ({ actorCalled }, actor: string, largo: number) => {
    await actorCalled(actor).attemptsTo(Registrarse.con({ ...nuevaCliente(actor), password: claveDePrueba(largo) }));
});

Entonces('el registro muestra el error {string}', async ({ enEscena }, mensaje: string) => {
    await enEscena().attemptsTo(Wait.until(MensajeDeError.delRegistro(), equals(mensaje)));
});

Entonces('el registro muestra un error que contiene {string}', async ({ enEscena }, texto: string) => {
    await enEscena().attemptsTo(Wait.until(MensajeDeError.delRegistro(), includes(texto)));
});

Entonces('el campo de contraseña sigue indicando {string}', async ({ enEscena }, texto: string) => {
    await enEscena().attemptsTo(
        Ensure.that(Attribute.called('placeholder').of(PaginaRegistro.campoContrasena()), equals(texto)),
    );
});

// ── Inicio y cierre de sesión ──

Cuando('{actor} inicia sesión con la cuenta de cliente de demostración', async ({ actorCalled }, actor: string) => {
    await actorCalled(actor).attemptsTo(IniciarSesion.con(CLIENTE_SEMILLA));
});

Cuando('{actor} inicia sesión con la cuenta de cliente de demostración y una contraseña incorrecta', async ({ actorCalled }, actor: string) => {
    await actorCalled(actor).attemptsTo(IniciarSesion.con({ email: CLIENTE_SEMILLA.email, password: claveDePrueba() }));
});

Cuando('{actor} inicia sesión con un correo que no está registrado', async ({ actorCalled }, actor: string) => {
    await actorCalled(actor).attemptsTo(IniciarSesion.con({ email: correoUnico('noexiste'), password: claveDePrueba() }));
});

Cuando('cierra sesión desde el menú de su cuenta', async ({ enEscena }) => {
    await enEscena().attemptsTo(CerrarSesion.desdeElMenuDeCuenta());
});

Entonces('el inicio de sesión muestra el error {string}', async ({ enEscena }, mensaje: string) => {
    await enEscena().attemptsTo(Wait.until(MensajeDeError.delInicioDeSesion(), equals(mensaje)));
});

Entonces('llega a su cuenta', async ({ enEscena }) => {
    await enEscena().attemptsTo(Wait.upTo(Duration.ofSeconds(30)).until(UrlActual.ruta(), equals('/cuenta')));
});

Entonces('la barra de navegación muestra el nombre {string}', async ({ enEscena }, nombre: string) => {
    await enEscena().attemptsTo(Wait.until(NombreDelUsuario.enLaBarra(), equals(nombre)));
});
