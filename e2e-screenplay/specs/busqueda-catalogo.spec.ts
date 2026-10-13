import { containAtLeastOneItemThat, Ensure, equals, includes, isGreaterThan } from '@serenity-js/assertions';
import { isVisible } from '@serenity-js/web';
import { VALENTINA_LA_VISITANTE } from '../screenplay/actores/Actores';
import { describe, it } from '../screenplay/actores/escenario';
import { ResultadosDeBusqueda } from '../screenplay/preguntas';
import { GuardarEvidencia } from '../screenplay/interacciones';
import { BuscarProducto } from '../screenplay/tareas';
import { PaginaCatalogo } from '../screenplay/ui';

describe('ESC09 - Búsqueda en el catálogo', { tag: '@ESC09' }, () => {

    it('SP-14 Valentina busca "Porcelanato" y obtiene resultados relacionados', async ({ actorCalled }) => {
        await actorCalled(VALENTINA_LA_VISITANTE).attemptsTo(
            BuscarProducto.llamado('Porcelanato'),
            GuardarEvidencia.como('SP-14-busqueda-con-resultados'),
            Ensure.that(ResultadosDeBusqueda.cantidadInformada(), isGreaterThan(0)),
            Ensure.that(ResultadosDeBusqueda.tarjetasMostradas(), equals(ResultadosDeBusqueda.cantidadInformada())),
            Ensure.that(ResultadosDeBusqueda.nombres(), containAtLeastOneItemThat(includes('Porcelanato'))),
        );
    });

    it('SP-15 la búsqueda no distingue mayúsculas ("TALADRO")', async ({ actorCalled }) => {
        await actorCalled(VALENTINA_LA_VISITANTE).attemptsTo(
            BuscarProducto.llamado('TALADRO'),
            Ensure.that(ResultadosDeBusqueda.cantidadInformada(), isGreaterThan(0)),
            Ensure.that(ResultadosDeBusqueda.nombres(), containAtLeastOneItemThat(includes('Taladro'))),
        );
    });

    it('SP-16 una búsqueda sin coincidencias muestra el estado vacío', async ({ actorCalled }) => {
        await actorCalled(VALENTINA_LA_VISITANTE).attemptsTo(
            BuscarProducto.llamado('zzqx producto inexistente 404'),
            GuardarEvidencia.como('SP-16-busqueda-sin-resultados'),
            Ensure.that(ResultadosDeBusqueda.cantidadInformada(), equals(0)),
            Ensure.that(ResultadosDeBusqueda.tarjetasMostradas(), equals(0)),
            Ensure.that(PaginaCatalogo.mensajeSinResultados(), isVisible()),
        );
    });
});
