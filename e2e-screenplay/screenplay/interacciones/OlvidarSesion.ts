import { Interaction } from '@serenity-js/core';
import { Page } from '@serenity-js/web';

/**
 * Interacción de bajo nivel: elimina el token `homara_token` del localStorage
 * para garantizar que el actor navega como visitante (sin sesión).
 */
export class OlvidarSesion {
    static delNavegador() {
        return Interaction.where('#actor borra el token de sesión del navegador', async actor => {
            const pagina = await actor.answer(Page.current());
            await pagina.executeScript(() => window.localStorage.removeItem('homara_token'));
        });
    }
}
