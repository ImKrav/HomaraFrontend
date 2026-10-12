import { type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import { CallAnApi } from '@serenity-js/rest';
import type { NotasDelActor } from '../actores/NotasDelActor';

/**
 * Preguntas que consultan directamente la API REST (habilidad CallAnApi) para
 * verificar efectos que la interfaz no muestra o que deben persistir en el backend.
 * Usan el token que el actor anotó previamente (nota `tokenApi`).
 */
async function consultar<T>(actor: AnswersQuestions & UsesAbilities, ruta: string): Promise<T> {
    const token = await actor.answer(notes<NotasDelActor>().get('tokenApi'));
    const respuesta = await CallAnApi.as(actor).request({
        method: 'GET',
        url: ruta,
        headers: { Authorization: `Bearer ${ token }` },
        validateStatus: () => true,
    });
    return respuesta.data as T;
}

interface Respuesta<T> { success: boolean; data: T }
interface PedidoResumen { id: string; total: number; status: string }
interface ProductoResumen { id: string; name: string }
interface Carrito { items: Array<{ id: string; quantity: number }>; subtotal: number; shipping: number; total: number }

export class PedidosDelCliente {
    /** Pedidos que el backend tiene registrados para el actor. */
    static registrados() {
        return Question.about('los pedidos del cliente en el backend', async actor => {
            const respuesta = await consultar<Respuesta<PedidoResumen[]>>(actor, 'orders');
            return respuesta.data ?? [];
        });
    }

    /** Total (COP) del pedido más reciente del actor. */
    static totalDelMasReciente() {
        return Question.about('el total del pedido más reciente', async actor => {
            const respuesta = await consultar<Respuesta<PedidoResumen[]>>(actor, 'orders');
            return (respuesta.data ?? [])[0]?.total ?? 0;
        });
    }

    static cantidad() {
        return Question.about('la cantidad de pedidos del cliente en el backend', async actor => {
            const respuesta = await consultar<Respuesta<PedidoResumen[]>>(actor, 'orders');
            return (respuesta.data ?? []).length;
        });
    }
}

export class CarritoEnElBackend {
    static unidades() {
        return Question.about('las unidades del carrito según el backend', async actor => {
            const respuesta = await consultar<Respuesta<Carrito>>(actor, 'cart');
            return (respuesta.data?.items ?? []).reduce((suma, item) => suma + item.quantity, 0);
        });
    }
}

export class ProductoEnElCatalogo {
    /** ¿Existe en el backend un producto con exactamente este nombre? */
    static llamado(nombre: string) {
        return Question.about(`si el producto "${ nombre }" existe en el backend`, async actor => {
            const respuesta = await CallAnApi.as(actor).request({ method: 'GET', url: 'products', validateStatus: () => true });
            const productos = (respuesta.data as Respuesta<ProductoResumen[]>).data ?? [];
            return productos.some(p => p.name === nombre);
        });
    }
}
