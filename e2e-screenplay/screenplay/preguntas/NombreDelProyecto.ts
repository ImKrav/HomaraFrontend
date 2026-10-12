import { Text } from '@serenity-js/web';
import { PaginaDetalleProyecto } from '../ui';

/** Pregunta: ¿qué nombre muestra la página de detalle del proyecto? */
export class NombreDelProyecto {
    static enElDetalle() {
        return Text.of(PaginaDetalleProyecto.titulo()).describedAs('el nombre del proyecto en su detalle');
    }
}
