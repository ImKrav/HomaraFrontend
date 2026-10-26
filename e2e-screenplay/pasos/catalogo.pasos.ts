import { containAtLeastOneItemThat, Ensure, equals, includes, isGreaterThan } from '@serenity-js/assertions';
import { isVisible } from '@serenity-js/web';
import { ResultadosDeBusqueda } from '../screenplay/preguntas';
import { BuscarProducto } from '../screenplay/tareas';
import { PaginaCatalogo } from '../screenplay/ui';
import { Cuando, Entonces } from './fixtures';

Cuando('busca {string}', async ({ enEscena }, termino: string) => {
    await enEscena().attemptsTo(BuscarProducto.llamado(termino));
});

Entonces('el catálogo informa al menos un resultado', async ({ enEscena }) => {
    await enEscena().attemptsTo(Ensure.that(ResultadosDeBusqueda.cantidadInformada(), isGreaterThan(0)));
});

Entonces('el catálogo informa {int} resultados', async ({ enEscena }, cantidad: number) => {
    await enEscena().attemptsTo(Ensure.that(ResultadosDeBusqueda.cantidadInformada(), equals(cantidad)));
});

Entonces('la cantidad informada coincide con las tarjetas mostradas', async ({ enEscena }) => {
    await enEscena().attemptsTo(
        Ensure.that(ResultadosDeBusqueda.tarjetasMostradas(), equals(ResultadosDeBusqueda.cantidadInformada())),
    );
});

Entonces('algún resultado contiene {string} en su nombre', async ({ enEscena }, texto: string) => {
    await enEscena().attemptsTo(Ensure.that(ResultadosDeBusqueda.nombres(), containAtLeastOneItemThat(includes(texto))));
});

Entonces('no se muestra ninguna tarjeta de producto', async ({ enEscena }) => {
    await enEscena().attemptsTo(Ensure.that(ResultadosDeBusqueda.tarjetasMostradas(), equals(0)));
});

Entonces('se indica que no hay productos coincidentes', async ({ enEscena }) => {
    await enEscena().attemptsTo(Ensure.that(PaginaCatalogo.mensajeSinResultados(), isVisible()));
});
