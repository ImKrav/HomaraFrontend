import { type Cast } from '@serenity-js/core';
// Se renombra useFixtures para que el linter de React del frontend no lo confunda con un Hook.
import { useFixtures as extenderFixtures } from '@serenity-js/playwright-test';
import { ENTORNO } from '../datos/entorno';
import { ElencoHomara } from './ElencoHomara';

/**
 * API de pruebas (describe / it / beforeEach / afterEach) con el elenco de Homara
 * ya inyectado. Todos los specs importan desde aquí en lugar de importar
 * directamente desde @serenity-js/playwright-test.
 *
 * Se reemplaza el fixture `actors` para que cada actor tenga su propio contexto de
 * navegador (sesión independiente): así Camila y Andrés pueden actuar en el mismo
 * escenario sin compartir el `homara_token`.
 */
export const { describe, it, test, beforeEach, afterEach, beforeAll, afterAll } = extenderFixtures<{ actors: Cast }>({
    actors: async ({ browser }, entregar) => {
        await entregar(new ElencoHomara(browser, ENTORNO.urlFrontend, ENTORNO.urlApi));
    },
});
