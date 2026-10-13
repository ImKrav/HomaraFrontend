import { Attribute, By, PageElements } from '@serenity-js/web';

/**
 * Pregunta: ¿qué campos del formulario no superan la validación nativa del
 * navegador (atributo `required`, pseudo-clase CSS `:invalid`)?
 * Devuelve la lista de ids de esos campos.
 */
export class CamposInvalidos {
    static delFormularioPrincipal() {
        return PageElements.located(By.css('main form input:invalid'))
            .eachMappedTo(Attribute.called('id'))
            .describedAs('los campos inválidos del formulario');
    }
}
