import { Ensure, equals, isPresent, not } from '@serenity-js/assertions';
import { Duration, Wait } from '@serenity-js/core';
import { isVisible, Navigate } from '@serenity-js/web';
import { ANDRES_EL_ADMINISTRADOR, CAMILA_LA_CLIENTA, VALENTINA_LA_VISITANTE } from '../screenplay/actores/Actores';
import { describe, it } from '../screenplay/actores/escenario';
import { ADMIN_SEMILLA, CLIENTE_SEMILLA } from '../screenplay/datos/usuarios';
import { GuardarEvidencia } from '../screenplay/interacciones';
import { SesionDelNavegador, UrlActual } from '../screenplay/preguntas';
import { IniciarSesion } from '../screenplay/tareas';
import { PaginaAdminProductos } from '../screenplay/ui';

describe('ESC07 - Protección de rutas privadas', { tag: '@ESC07' }, () => {

    for (const [id, ruta] of [['SP-09', '/proyectos'], ['SP-10', '/cuenta'], ['SP-11', '/checkout']] as const) {
        it(`${ id } Valentina, sin sesión, es enviada a /login al abrir ${ ruta }`, async ({ actorCalled }) => {
            await actorCalled(VALENTINA_LA_VISITANTE).attemptsTo(
                Navigate.to(ruta),
                Wait.upTo(Duration.ofSeconds(30)).until(UrlActual.ruta(), equals('/login')),
                Ensure.that(SesionDelNavegador.tieneToken(), equals(false)),
            );
        });
    }

    it('SP-12 Camila (cliente) intenta entrar a /admin y es redirigida al inicio', { tag: '@ESC06' }, async ({ actorCalled }) => {
        await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
            IniciarSesion.exitosamenteCon(CLIENTE_SEMILLA),
            Navigate.to('/admin/productos'),
            Wait.upTo(Duration.ofSeconds(30)).until(UrlActual.ruta(), equals('/')),
            GuardarEvidencia.como('SP-12-cliente-redirigido-desde-admin'),
            Ensure.that(PaginaAdminProductos.botonAgregarProducto(), not(isPresent())),
        );
    });

    it('SP-13 Andrés (administrador) sí puede entrar al panel /admin/productos', { tag: '@ESC06' }, async ({ actorCalled }) => {
        await actorCalled(ANDRES_EL_ADMINISTRADOR).attemptsTo(
            IniciarSesion.exitosamenteCon(ADMIN_SEMILLA),
            Navigate.to('/admin/productos'),
            Wait.upTo(Duration.ofSeconds(30)).until(PaginaAdminProductos.botonAgregarProducto(), isVisible()),
            Ensure.that(UrlActual.ruta(), equals('/admin/productos')),
        );
    });
});
