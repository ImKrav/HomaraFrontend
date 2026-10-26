import { Question } from '@serenity-js/core';
import { Page } from '@serenity-js/web';

/**
 * Pregunta: ¿el navegador del actor tiene una sesión iniciada?
 * El backend emite el JWT en la cookie `homara_session`, que debe ser HttpOnly
 * (DEF-SEG-FE-02): la página nunca lo guarda en localStorage.
 */
export class SesionDelNavegador {
    static tieneToken() {
        return Question.about('si el navegador tiene la cookie HttpOnly "homara_session"', async actor => {
            const pagina = await actor.answer(Page.current());
            const cookie = await pagina.cookie('homara_session');
            return (await cookie.isPresent()) && (await cookie.isHttpOnly());
        });
    }
}
