import { Text } from '@serenity-js/web';
import { BarraDeNavegacion } from '../ui';

/**
 * Pregunta: ¿qué nombre de usuario muestra la barra de navegación?
 * (solo aparece cuando hay una sesión activa).
 */
export class NombreDelUsuario {
    static enLaBarra() {
        return Text.of(BarraDeNavegacion.nombreDelUsuario()).describedAs('el nombre del usuario en la barra de navegación');
    }
}
