import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interaction } from '@serenity-js/core';
import { Page } from '@serenity-js/web';

const CARPETA_CAPTURAS = join(__dirname, '..', '..', 'evidencias', 'capturas');

/**
 * Interacción de bajo nivel: guarda una captura de pantalla del navegador del
 * actor como evidencia en evidencias/capturas/<nombre>.png.
 * (Las capturas de los pasos fallidos las toma además el Photographer de Serenity/JS).
 */
export class GuardarEvidencia {
    static como(nombre: string) {
        return Interaction.where(`#actor guarda la captura "${ nombre }.png" como evidencia`, async actor => {
            const pagina = await actor.answer(Page.current());
            const base64 = await pagina.takeScreenshot();
            mkdirSync(CARPETA_CAPTURAS, { recursive: true });
            writeFileSync(join(CARPETA_CAPTURAS, `${ nombre }.png`), Buffer.from(base64, 'base64'));
        });
    }
}
