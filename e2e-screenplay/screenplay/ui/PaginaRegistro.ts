import { By, PageElement } from '@serenity-js/web';

/**
 * Elementos de la página /register.
 * El formulario de registro no tiene ids, por eso se ubican por placeholder
 * (textos confirmados en app/(shop)/register/page.tsx y app/lib/locales/es.json).
 */
const porPlaceholder = (texto: string, descripcion: string) =>
    PageElement.located(By.css(`form input[placeholder="${texto}"]`)).describedAs(descripcion);

export const PaginaRegistro = {
    campoNombre: () => porPlaceholder('Juan', 'el campo Nombre'),
    campoApellido: () => porPlaceholder('Pérez', 'el campo Apellido'),
    campoCorreo: () => porPlaceholder('juan@email.com', 'el campo Correo Electrónico'),
    campoContrasena: () => porPlaceholder('Mínimo 8 caracteres', 'el campo Contraseña'),
    campoConfirmarContrasena: () => porPlaceholder('Repite la contraseña', 'el campo Confirmar Contraseña'),
    botonRegistrarme: () =>
        PageElement.located(By.css('form button[type="submit"]')).describedAs('el botón "Registrarme y Comenzar"'),
    mensajeDeError: () =>
        PageElement.located(By.xpath('//form/preceding-sibling::div[contains(@class,"bg-error")]//span'))
            .describedAs('el mensaje de error del registro'),
};
