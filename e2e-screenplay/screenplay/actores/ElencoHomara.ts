import type { Browser } from '@playwright/test';
import { Actor, Cast, Notepad, TakeNotes } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { CallAnApi } from '@serenity-js/rest';
import type { NotasDelActor } from './NotasDelActor';

/**
 * Elenco (Cast) de Homara.
 *
 * Define QUÉ PUEDE HACER cada actor (sus habilidades / Abilities):
 *  - BrowseTheWebWithPlaywright: usar un navegador propio (contexto aislado, con su
 *    propio localStorage y por lo tanto su propia sesión `homara_token`).
 *  - CallAnApi: hablar directamente con la API REST del backend (preparar datos,
 *    limpiar estado y verificar efectos que no se ven en la UI).
 *  - TakeNotes: recordar datos entre pasos (correo registrado, token, ids creados).
 *
 * Cada actor empieza cada escenario con una libreta de notas vacía.
 */
export class ElencoHomara extends Cast {
    constructor(
        private readonly navegador: Browser,
        private readonly urlFrontend: string,
        private readonly urlApi: string,
    ) {
        super();
    }

    prepare(actor: Actor): Actor {
        return actor.whoCan(
            BrowseTheWebWithPlaywright.using(
                this.navegador,
                { baseURL: this.urlFrontend, viewport: { width: 1366, height: 900 }, locale: 'es-CO' },
                { defaultNavigationWaitUntil: 'domcontentloaded', defaultTimeout: 15_000, defaultNavigationTimeout: 45_000 },
            ),
            CallAnApi.at(this.urlApi),
            TakeNotes.using(Notepad.empty<NotasDelActor>()),
        );
    }
}
