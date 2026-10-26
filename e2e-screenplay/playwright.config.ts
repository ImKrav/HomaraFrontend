import { defineConfig } from '@playwright/test';
import { cucumberReporter, defineBddConfig } from 'playwright-bdd';
import type { SerenityFixtures, SerenityWorkerFixtures } from '@serenity-js/playwright-test';
import { ENTORNO } from './screenplay/datos/entorno';

/**
 * Configuración de Playwright Test integrada con Serenity/JS.
 *
 * - Los escenarios se escriben en Gherkin (features/*.feature) y playwright-bdd los convierte
 *   en pruebas de Playwright (.features-gen/) que ejecutan los pasos de pasos/*.pasos.ts.
 * - El elenco (Cast) "ElencoHomara" se inyecta como fixture en screenplay/actores/escenario.ts.
 * - Los reportes generados son: consola de Serenity/JS, HTML de Playwright, HTML de Cucumber y JUnit XML.
 * - El "Photographer" de Serenity/JS toma capturas cuando una interacción falla.
 */
export default defineConfig<SerenityFixtures, SerenityWorkerFixtures>({
    testDir: defineBddConfig({ features: 'features/*.feature', steps: 'pasos/*.ts' }),
    outputDir: './test-results',
    timeout: 90_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    workers: 3,
    retries: 0,
    forbidOnly: !!process.env.CI,

    reporter: [
        ['list'],
        ['@serenity-js/playwright-test', {
            crew: [
                '@serenity-js/console-reporter',
                ['@serenity-js/web:Photographer', { strategy: 'TakePhotosOfFailures' }],
            ],
        }],
        ['html', { outputFolder: 'evidencias/reporte-html', open: 'never' }],
        cucumberReporter('html', { outputFile: 'evidencias/reporte-cucumber.html' }),
        ['junit', { outputFile: 'evidencias/resultados-junit.xml' }],
    ],

    use: {
        baseURL: ENTORNO.urlFrontend,
        headless: true,
        viewport: { width: 1366, height: 900 },
        locale: 'es-CO',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',

        defaultActorName: 'Camila la clienta',
        cueTimeout: 15_000,
        interactionTimeout: 15_000,

    },

    projects: [
        { name: 'chromium' },
    ],
});
