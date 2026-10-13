import { Question } from '@serenity-js/core';
import { Page } from '@serenity-js/web';

/**
 * Pregunta: ¿el navegador del actor tiene guardado el token de sesión?
 * La aplicación guarda el JWT en localStorage bajo la clave `homara_token`.
 */
export class SesionDelNavegador {
    static tieneToken() {
        return Question.about('si el navegador tiene el token "homara_token"', async actor => {
            const pagina = await actor.answer(Page.current());
            const token = await pagina.executeScript(() => window.localStorage.getItem('homara_token'));
            return typeof token === 'string' && token.length > 0;
        });
    }
}
