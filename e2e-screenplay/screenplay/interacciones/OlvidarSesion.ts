import { Interaction } from '@serenity-js/core';
import { Page } from '@serenity-js/web';

/**
 * Interacción de bajo nivel: borra las cookies del navegador (incluida la de
 * sesión `homara_session`) para garantizar que el actor navega como visitante.
 */
export class OlvidarSesion {
    static delNavegador() {
        return Interaction.where('#actor borra la cookie de sesión del navegador', async actor => {
            const pagina = await actor.answer(Page.current());
            await pagina.deleteAllCookies();
        });
    }
}
