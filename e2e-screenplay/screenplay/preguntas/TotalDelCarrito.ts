import { Text } from '@serenity-js/web';
import { aNumero } from '../datos/formato';
import { PaginaCarrito } from '../ui';

/**
 * Preguntas sobre el bloque "Resumen del Pedido" de /carrito.
 * Los montos se convierten de "$ 275.000" (formato es-CO) a número.
 */
export class TotalDelCarrito {
    static total() {
        return Text.of(PaginaCarrito.total()).as(aNumero).describedAs('el total del carrito (COP)');
    }

    static subtotal() {
        return Text.of(PaginaCarrito.subtotal()).as(aNumero).describedAs('el subtotal del carrito (COP)');
    }

    /** Texto tal como se muestra: "Gratis" o "$ 25.000". */
    static envioMostrado() {
        return Text.of(PaginaCarrito.envio()).describedAs('el costo de envío mostrado');
    }

    /** Costo de envío en pesos (0 cuando se muestra "Gratis"). */
    static envio() {
        return Text.of(PaginaCarrito.envio()).as(aNumero).describedAs('el costo de envío (COP)');
    }
}
