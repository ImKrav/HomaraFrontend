import { Question } from '@serenity-js/core';
import { Page } from '@serenity-js/web';

/**
 * Pregunta: ¿en qué ruta de la aplicación está el actor?
 * Devuelve solo el "pathname" (p. ej. "/login"), sin dominio ni parámetros.
 */
export class UrlActual {
    static ruta() {
        return Question.about('la ruta actual del navegador', async actor => {
            const pagina = await actor.answer(Page.current());
            const url = await pagina.url();
            return url.pathname;
        });
    }

    static completa() {
        return Question.about('la URL actual del navegador', async actor => {
            const pagina = await actor.answer(Page.current());
            return (await pagina.url()).href;
        });
    }
}
