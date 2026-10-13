import { contain, Ensure, equals, matches } from '@serenity-js/assertions';
import { Duration, Wait } from '@serenity-js/core';
import { CAMILA_LA_CLIENTA } from '../screenplay/actores/Actores';
import { beforeEach, describe, it } from '../screenplay/actores/escenario';
import { clienteNuevo } from '../screenplay/datos/usuarios';
import { GuardarEvidencia } from '../screenplay/interacciones';
import { NombreDelProyecto, Notificacion, UrlActual } from '../screenplay/preguntas';
import { CrearProyecto, IniciarSesion, RegistrarClientePorApi } from '../screenplay/tareas';

describe('ESC17 - Crear proyecto', { tag: '@ESC17' }, () => {

    beforeEach(async ({ actorCalled }) => {
        await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
            RegistrarClientePorApi.con(clienteNuevo('Camila', 'Restrepo')),
            IniciarSesion.exitosamenteConSusCredenciales(),
        );
    });

    it('SP-29 Camila crea un proyecto de piso con datos válidos y ve su detalle', async ({ actorCalled }) => {
        const nombre = `Remodelación cocina ${ Date.now() }`;

        await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
            CrearProyecto.deTipoPiso({ nombre, largo: 4.5, ancho: 3.2 }),
            Wait.upTo(Duration.ofSeconds(30)).until(UrlActual.ruta(), matches(/^\/proyectos\/(?!nuevo$)[\w-]+$/)),
            Wait.upTo(Duration.ofSeconds(20)).until(NombreDelProyecto.enElDetalle(), equals(nombre)),
            GuardarEvidencia.como('SP-29-proyecto-creado'),
        );
    });

    it('SP-30 no permite guardar un proyecto sin nombre', async ({ actorCalled }) => {
        await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
            CrearProyecto.deTipoPiso({ largo: 4.5, ancho: 3.2 }),
            Wait.until(Notificacion.visibles(), contain('Por favor, ingresa el campo obligatorio: Nombre descriptivo.')),
            GuardarEvidencia.como('SP-30-proyecto-sin-nombre'),
            Ensure.that(UrlActual.ruta(), equals('/proyectos/nuevo')),
        );
    });

    it('SP-31 no permite guardar un proyecto de piso sin el ancho', async ({ actorCalled }) => {
        await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
            CrearProyecto.deTipoPiso({ nombre: `Baño social ${ Date.now() }`, largo: 2.5 }),
            Wait.until(Notificacion.visibles(), contain('Por favor, ingresa el campo obligatorio: Ancho (Habitación).')),
            Ensure.that(UrlActual.ruta(), equals('/proyectos/nuevo')),
        );
    });
});
