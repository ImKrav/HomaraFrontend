import { type Answerable, Interaction, notes } from '@serenity-js/core';
import { CallAnApi } from '@serenity-js/rest';
import type { NotasDelActor } from '../actores/NotasDelActor';

type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Interacción de bajo nivel: una petición HTTP a la API de Homara autenticada con
 * el token que el actor tiene anotado (`tokenApi`). La respuesta queda disponible
 * con la pregunta `LastResponse` de @serenity-js/rest.
 *
 * Se usa en las tareas de preparación y limpieza de datos (no en los pasos que el
 * usuario haría en la interfaz).
 */
export class LlamarALaApi {
    static conSesion(metodo: Metodo, ruta: Answerable<string>, cuerpo?: unknown) {
        return Interaction.where(`#actor llama ${ metodo } a la API con su sesión`, async actor => {
            const token = await actor.answer(notes<NotasDelActor>().get('tokenApi'));
            const url = await actor.answer(ruta);
            await CallAnApi.as(actor).request({
                method: metodo,
                url,
                data: cuerpo,
                headers: { Authorization: `Bearer ${ token }` },
                validateStatus: () => true,
            });
        });
    }

    static sinSesion(metodo: Metodo, ruta: Answerable<string>, cuerpo?: unknown) {
        return Interaction.where(`#actor llama ${ metodo } a la API sin sesión`, async actor => {
            const url = await actor.answer(ruta);
            await CallAnApi.as(actor).request({ method: metodo, url, data: cuerpo, validateStatus: () => true });
        });
    }
}
