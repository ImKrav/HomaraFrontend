import { Text } from '@serenity-js/web';
import { PaginaAdminProductos, PaginaLogin, PaginaRegistro } from '../ui';

/**
 * Pregunta: ¿qué mensaje de error muestra el formulario?
 */
export class MensajeDeError {
    /** Error mostrado en la tarjeta de inicio de sesión. */
    static delInicioDeSesion() {
        return Text.of(PaginaLogin.mensajeDeError()).describedAs('el mensaje de error del inicio de sesión');
    }

    /** Error mostrado en la tarjeta de registro. */
    static delRegistro() {
        return Text.of(PaginaRegistro.mensajeDeError()).describedAs('el mensaje de error del registro');
    }

    /** Error mostrado dentro del modal de producto del panel de administración. */
    static delFormularioDeProducto() {
        return Text.of(PaginaAdminProductos.formulario.mensajeDeError())
            .describedAs('el mensaje de error del formulario de producto');
    }
}
