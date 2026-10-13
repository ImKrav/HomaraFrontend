import { type Activity, Task, Wait } from '@serenity-js/core';
import { Click, Enter, isVisible, Navigate } from '@serenity-js/web';
import { PaginaNuevoProyecto } from '../ui';

export interface DatosDeProyecto {
    nombre?: string;
    largo?: number;
    ancho?: number;
}

/**
 * Tarea de negocio: crear un proyecto de piso en el estimador (/proyectos/nuevo)
 * y pulsar "Guardar y Calcular Insumos". Los campos no indicados se dejan vacíos,
 * lo que permite reutilizar la tarea en los escenarios negativos.
 */
export class CrearProyecto {
    static deTipoPiso(datos: DatosDeProyecto) {
        const pasos: Activity[] = [
            Navigate.to('/proyectos/nuevo'),
            Wait.until(PaginaNuevoProyecto.campoNombre(), isVisible()),
            Click.on(PaginaNuevoProyecto.tipoDeSuperficie('Solo Piso')),
        ];
        if (datos.nombre !== undefined) {
            pasos.push(Enter.theValue(datos.nombre).into(PaginaNuevoProyecto.campoNombre()));
        }
        if (datos.largo !== undefined) {
            pasos.push(Enter.theValue(String(datos.largo)).into(PaginaNuevoProyecto.campoLargo()));
        }
        if (datos.ancho !== undefined) {
            pasos.push(Enter.theValue(String(datos.ancho)).into(PaginaNuevoProyecto.campoAncho()));
        }
        pasos.push(Click.on(PaginaNuevoProyecto.botonGuardar()));

        return Task.where(`#actor crea un proyecto de piso "${ datos.nombre ?? '(sin nombre)' }"`, ...pasos);
    }
}
