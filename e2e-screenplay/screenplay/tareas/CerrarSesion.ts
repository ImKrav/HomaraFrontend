import { Task, Wait } from '@serenity-js/core';
import { Click, isVisible } from '@serenity-js/web';
import { BarraDeNavegacion } from '../ui';

/**
 * Tarea de negocio: cerrar la sesión desde el menú de cuenta de la barra superior.
 */
export class CerrarSesion {
    static desdeElMenuDeCuenta() {
        return Task.where('#actor cierra su sesión desde el menú de cuenta',
            Wait.until(BarraDeNavegacion.botonCuenta(), isVisible()),
            Click.on(BarraDeNavegacion.botonCuenta()),
            Wait.until(BarraDeNavegacion.opcionCerrarSesion(), isVisible()),
            Click.on(BarraDeNavegacion.opcionCerrarSesion()),
        );
    }
}
