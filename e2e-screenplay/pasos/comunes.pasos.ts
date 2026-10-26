import { contain, endsWith, Ensure, equals, isFalse, isTrue } from '@serenity-js/assertions';
import { Duration, Wait } from '@serenity-js/core';
import { Navigate } from '@serenity-js/web';
import { ADMIN_SEMILLA, CLIENTE_SEMILLA, clienteNuevo } from '../screenplay/datos/usuarios';
import { Notificacion, SesionDelNavegador, UrlActual } from '../screenplay/preguntas';
import { IniciarSesion, ObtenerTokenPorApi, RegistrarClientePorApi } from '../screenplay/tareas';
import { Cuando, Dado, Entonces } from './fixtures';

// ── Quién es el actor y en qué estado empieza ──

Dado('que {actor} no tiene cuenta en Homara', ({ actorCalled }, actor: string) => {
    actorCalled(actor);
});

Dado('que {actor} no ha iniciado sesión', ({ actorCalled }, actor: string) => {
    actorCalled(actor);
});

Dado('que {actor} es una clienta nueva con sesión iniciada', async ({ actorCalled }, actor: string) => {
    await actorCalled(actor).attemptsTo(
        RegistrarClientePorApi.con(clienteNuevo(actor.split(' ')[0], 'Restrepo')),
        IniciarSesion.exitosamenteConSusCredenciales(),
    );
});

Dado('que {actor} inició sesión con la cuenta de cliente de demostración', async ({ actorCalled }, actor: string) => {
    await actorCalled(actor).attemptsTo(IniciarSesion.exitosamenteCon(CLIENTE_SEMILLA));
});

Dado('que {actor} inició sesión como administrador', async ({ actorCalled }, actor: string) => {
    await actorCalled(actor).attemptsTo(
        ObtenerTokenPorApi.con(ADMIN_SEMILLA),
        IniciarSesion.exitosamenteCon(ADMIN_SEMILLA),
    );
});

// ── Navegación ──

Cuando('abre la página {string}', async ({ enEscena }, ruta: string) => {
    await enEscena().attemptsTo(Navigate.to(ruta));
});

Entonces('termina en la página {string}', async ({ enEscena }, ruta: string) => {
    await enEscena().attemptsTo(Wait.upTo(Duration.ofSeconds(30)).until(UrlActual.ruta(), equals(ruta)));
});

Entonces('sigue en la página {string}', async ({ enEscena }, ruta: string) => {
    await enEscena().attemptsTo(Ensure.that(UrlActual.ruta(), equals(ruta)));
});

Entonces('al abrir de nuevo {string} termina en la página {string}', async ({ enEscena }, ruta: string, destino: string) => {
    await enEscena().attemptsTo(
        Navigate.to(ruta),
        Wait.until(UrlActual.completa(), endsWith(destino)),
    );
});

// ── Sesión y avisos ──

Entonces('su sesión queda guardada en el navegador', async ({ enEscena }) => {
    await enEscena().attemptsTo(Ensure.that(SesionDelNavegador.tieneToken(), isTrue()));
});

Entonces('no queda ninguna sesión en el navegador', async ({ enEscena }) => {
    await enEscena().attemptsTo(Ensure.that(SesionDelNavegador.tieneToken(), isFalse()));
});

Entonces('ve el aviso {string}', async ({ enEscena }, mensaje: string) => {
    await enEscena().attemptsTo(Wait.upTo(Duration.ofSeconds(20)).until(Notificacion.visibles(), contain(mensaje)));
});
