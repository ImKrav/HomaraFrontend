import { d, Duration, Task, Wait } from '@serenity-js/core';
import { includes } from '@serenity-js/assertions';
import { Enter, Navigate, Press, Text } from '@serenity-js/web';
import { PaginaCatalogo } from '../ui';

/**
 * Tarea de negocio: buscar productos en el catálogo con la barra de búsqueda.
 */
export class BuscarProducto {
    static llamado(termino: string) {
        return Task.where(d`#actor busca "${ termino }" en el catálogo`,
            Navigate.to('/catalogo'),
            // Se espera a que termine la carga inicial de productos (texto "N productos ... encontrados").
            Wait.upTo(Duration.ofSeconds(30))
                .until(Text.of(PaginaCatalogo.contadorDeResultados()), includes('encontrados')),
            Enter.theValue(termino).into(PaginaCatalogo.barraDeBusqueda()),
            Press.the('Enter').in(PaginaCatalogo.barraDeBusqueda()),
            Wait.until(Text.of(PaginaCatalogo.contadorDeResultados()), includes('encontrados')),
        );
    }
}
