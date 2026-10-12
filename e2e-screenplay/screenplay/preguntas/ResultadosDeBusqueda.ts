import { Text } from '@serenity-js/web';
import { PaginaCatalogo } from '../ui';

/**
 * Preguntas sobre los resultados del catálogo.
 */
export class ResultadosDeBusqueda {
    /** Número que indica el texto "N productos técnicos encontrados". */
    static cantidadInformada() {
        return Text.of(PaginaCatalogo.contadorDeResultados())
            .as(texto => Number.parseInt(texto, 10))
            .describedAs('la cantidad de resultados informada');
    }

    /** Número de tarjetas de producto realmente pintadas en la página. */
    static tarjetasMostradas() {
        return PaginaCatalogo.tarjetasDeProducto().count().describedAs('el número de tarjetas de producto mostradas');
    }

    /** Nombres de los productos mostrados. */
    static nombres() {
        return Text.ofAll(PaginaCatalogo.nombresDeProductos()).describedAs('los nombres de los productos mostrados');
    }
}
