import { Question } from '@serenity-js/core';
import { Text } from '@serenity-js/web';
import { BarraDeNavegacion, PaginaCarrito } from '../ui';

/**
 * Pregunta: ¿cuántas unidades hay en el carrito?
 */
export class CantidadEnCarrito {
    /**
     * Unidades que indica el contador de la barra de navegación.
     * Si el contador no se muestra (carrito vacío) la respuesta es 0.
     */
    static segunLaBarra() {
        return Question.about('las unidades en el contador del carrito', async actor => {
            const contador = await actor.answer(BarraDeNavegacion.contadorCarrito());
            if (! await contador.isPresent()) {
                return 0;
            }
            return Number((await contador.text()).trim());
        });
    }

    /** Cantidad mostrada en la tarjeta de un producto dentro de /carrito. */
    static delProducto(nombre: string) {
        return Text.of(PaginaCarrito.cantidad().of(PaginaCarrito.item(nombre)))
            .as(Number)
            .describedAs(`la cantidad de "${ nombre }" en el carrito`);
    }

    /** Número de líneas (productos distintos) listadas en /carrito. */
    static deLineas() {
        return PaginaCarrito.nombresDeItems().count().describedAs('el número de productos distintos en el carrito');
    }
}
