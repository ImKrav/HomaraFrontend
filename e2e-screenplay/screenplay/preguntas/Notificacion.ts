import { Text } from '@serenity-js/web';
import { Notificaciones } from '../ui';

/**
 * Pregunta: ¿qué notificaciones emergentes (toasts, role="alert") están visibles?
 * Devuelve la lista de textos; se usa con `contain('...')`.
 */
export class Notificacion {
    static visibles() {
        return Text.ofAll(Notificaciones.todas()).describedAs('los textos de las notificaciones visibles');
    }

    /** Cuántas notificaciones hay en pantalla. */
    static cantidad() {
        return Notificaciones.todas().count().describedAs('la cantidad de notificaciones visibles');
    }
}
