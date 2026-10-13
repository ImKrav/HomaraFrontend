import { d, Task, Wait } from '@serenity-js/core';
import { Click, Enter, isVisible, Navigate } from '@serenity-js/web';
import type { DatosDeCliente } from '../datos/usuarios';
import { PaginaRegistro } from '../ui';

/**
 * Tarea de negocio: crear una cuenta desde la página /register
 * (solo con la información básica obligatoria).
 */
export class Registrarse {
    static con(datos: DatosDeCliente) {
        return Registrarse.llenandoFormulario(datos, datos.password);
    }

    /** Variante negativa: la confirmación no coincide con la contraseña. */
    static conConfirmacionDistinta(datos: DatosDeCliente, confirmacion: string) {
        return Registrarse.llenandoFormulario(datos, confirmacion);
    }

    private static llenandoFormulario(datos: DatosDeCliente, confirmacion: string) {
        return Task.where(d`#actor se registra con el correo ${ datos.email }`,
            Navigate.to('/register'),
            Wait.until(PaginaRegistro.campoNombre(), isVisible()),
            Enter.theValue(datos.nombre).into(PaginaRegistro.campoNombre()),
            Enter.theValue(datos.apellido).into(PaginaRegistro.campoApellido()),
            Enter.theValue(datos.email).into(PaginaRegistro.campoCorreo()),
            Enter.theValue(datos.password).into(PaginaRegistro.campoContrasena()),
            Enter.theValue(confirmacion).into(PaginaRegistro.campoConfirmarContrasena()),
            Click.on(PaginaRegistro.botonRegistrarme()),
        );
    }
}
