import { By, PageElement } from '@serenity-js/web';

/** Elementos de la página /checkout (ids confirmados en app/(shop)/checkout/page.tsx) */
export const PaginaCheckout = {
    titulo: () => PageElement.located(By.cssContainingText('main h1', 'Checkout')).describedAs('el título del checkout'),
    formulario: () => PageElement.located(By.css('main form')).describedAs('el formulario de checkout'),
    campoNombre: () => PageElement.located(By.id('first-name')).describedAs('el campo Nombre'),
    campoApellido: () => PageElement.located(By.id('last-name')).describedAs('el campo Apellido'),
    campoCorreo: () => PageElement.located(By.id('email')).describedAs('el campo Correo'),
    campoTelefono: () => PageElement.located(By.id('phone')).describedAs('el campo Teléfono'),
    campoDireccion: () => PageElement.located(By.id('address')).describedAs('el campo Dirección'),
    campoCiudad: () => PageElement.located(By.id('city')).describedAs('el campo Ciudad'),
    campoDepartamento: () => PageElement.located(By.id('state')).describedAs('el campo Departamento'),
    botonPagar: () => PageElement.located(By.css('main form button[type="submit"]')).describedAs('el botón "Pagar"'),
};
