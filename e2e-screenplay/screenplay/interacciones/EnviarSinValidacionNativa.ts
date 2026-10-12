import type { Answerable } from '@serenity-js/core';
import { ExecuteScript, type PageElement } from '@serenity-js/web';

/**
 * Interacción de bajo nivel: envía un formulario saltándose la validación HTML5
 * del navegador (atributo `required`), activando `noValidate` y llamando a
 * `requestSubmit()`.
 *
 * ¿Por qué existe? En /checkout todos los campos obligatorios tienen `required`,
 * por lo que el navegador bloquea el envío antes de que React ejecute su propia
 * validación (la que muestra el toast de advertencia). Esta interacción permite
 * probar esa segunda barrera de validación de forma aislada, como ocurriría con un
 * navegador sin soporte de validación nativa.
 */
export class EnviarSinValidacionNativa {
    static elFormulario(formulario: Answerable<PageElement>) {
        return ExecuteScript.sync(function enviarSinValidar(form: HTMLFormElement) {
            form.noValidate = true;
            form.requestSubmit();
        })
            .withArguments(formulario);
    }
}
