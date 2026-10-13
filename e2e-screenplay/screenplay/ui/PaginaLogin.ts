import { By, PageElement } from '@serenity-js/web';

/** Elementos de la página /login */
export const PaginaLogin = {
    campoCorreo: () => PageElement.located(By.id('email')).describedAs('el campo de correo'),
    campoContrasena: () => PageElement.located(By.id('password')).describedAs('el campo de contraseña'),
    botonIniciarSesion: () =>
        PageElement.located(By.css('form button[type="submit"]')).describedAs('el botón "Iniciar Sesión"'),
    /** Caja roja de error del componente AuthCard (aparece justo antes del formulario). */
    mensajeDeError: () =>
        PageElement.located(By.xpath('//form/preceding-sibling::div[contains(@class,"bg-error")]//span'))
            .describedAs('el mensaje de error del formulario'),
};
