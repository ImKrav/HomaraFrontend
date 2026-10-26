import { join } from 'node:path';
import { mergeTests } from '@playwright/test';
import { notes, type Actor } from '@serenity-js/core';
import { createBdd, defineParameterType, test as pruebaBdd } from 'playwright-bdd';
import { ANDRES_EL_ADMINISTRADOR, CAMILA_LA_CLIENTA, VALENTINA_LA_VISITANTE } from '../screenplay/actores/Actores';
import { test as pruebaSerenity } from '../screenplay/actores/escenario';
import type { NotasDelActor } from '../screenplay/actores/NotasDelActor';
import { aNumero } from '../screenplay/datos/formato';
import { CARPETA_CAPTURAS, GuardarEvidencia } from '../screenplay/interacciones';
import { EliminarProductoPorApi, VaciarCarritoPorApi } from '../screenplay/tareas';

/**
 * Enlace entre Gherkin y Screenplay: los pasos de los .feature se ejecutan con el
 * mismo `test` de Serenity/JS que inyecta el elenco de Homara (ver escenario.ts).
 */
export const test = mergeTests(pruebaBdd, pruebaSerenity).extend<{ enEscena: () => Actor }>({
    /**
     * Los pasos que no nombran al actor ("Entonces llega a su cuenta") los ejecuta el
     * último actor que entró en escena (actor en el foco, patrón Screenplay).
     */
    enEscena: async ({ serenity }, usar) => {
        await usar(() => serenity.theActorInTheSpotlight());
    },
});
export const { Given: Dado, When: Cuando, Then: Entonces, After: Despues } = createBdd(test);

const ACTORES: Record<string, string> = {
    Camila: CAMILA_LA_CLIENTA,
    Andrés: ANDRES_EL_ADMINISTRADOR,
    Valentina: VALENTINA_LA_VISITANTE,
};

/** {actor}: "Camila", "Andrés" o "Valentina" -> nombre completo del actor en el elenco. */
defineParameterType({
    name: 'actor',
    regexp: /Camila|Andrés|Valentina/,
    transformer: (nombre: string) => ACTORES[nombre],
});

/** {cop}: precio en formato colombiano ("$ 275.000") -> 275000. */
defineParameterType({
    name: 'cop',
    regexp: /\$ ?\d{1,3}(?:\.\d{3})*/,
    transformer: aNumero,
});

// Evidencia: captura final de cada escenario (pase o falle), adjunta también a los reportes.
Despues(async ({ enEscena }) => {
    const nombre = test.info().title
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
    await enEscena().attemptsTo(GuardarEvidencia.como(nombre));
    await test.info().attach(nombre, { path: join(CARPETA_CAPTURAS, `${ nombre }.png`), contentType: 'image/png' });
});

// Limpieza: libera el stock que el carrito de la clienta de prueba deja reservado.
Despues('@carrito or @checkout', async ({ actorCalled }) => {
    await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(VaciarCarritoPorApi.delActor());
});

// Limpieza defensiva: si el escenario falló a mitad de camino, el producto no queda en el catálogo.
Despues('@admin-productos', async ({ actorCalled }) => {
    const andres = actorCalled(ANDRES_EL_ADMINISTRADOR);
    if (await andres.answer(notes<NotasDelActor>().get('nombreProductoCreado').isPresent())) {
        await andres.attemptsTo(EliminarProductoPorApi.llamado(await andres.answer(notes<NotasDelActor>().get('nombreProductoCreado'))));
    }
});
