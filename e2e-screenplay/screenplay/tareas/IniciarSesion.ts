import { equals } from '@serenity-js/assertions';
import { type Answerable, d, Duration, notes, Task, Wait } from '@serenity-js/core';
import { Click, Enter, isVisible, Navigate } from '@serenity-js/web';
import type { NotasDelActor } from '../actores/NotasDelActor';
import type { Credenciales } from '../datos/usuarios';
import { UrlActual } from '../preguntas/UrlActual';
import { PaginaLogin } from '../ui';

/**
 * Tarea de negocio: iniciar sesión desde la página /login.
 *
 * Solo envía el formulario; cada escenario decide qué verificar después
 * (redirección a /cuenta o mensaje de error).
 */
export class IniciarSesion {
    static con(credenciales: Credenciales) {
        return IniciarSesion.conCorreoYClave(credenciales.email, credenciales.password);
    }

    /** Usa el correo y la contraseña que el actor anotó al registrarse. */
    static conSusCredenciales() {
        return IniciarSesion.conCorreoYClave(
            notes<NotasDelActor>().get('email'),
            notes<NotasDelActor>().get('password'),
        );
    }

    /** Inicia sesión y espera a que la app lo lleve a /cuenta (precondición de otros escenarios). */
    static exitosamenteCon(credenciales: Credenciales) {
        return Task.where(`#actor inicia sesión como ${ credenciales.email } y llega a su cuenta`,
            IniciarSesion.con(credenciales),
            Wait.upTo(Duration.ofSeconds(30)).until(UrlActual.ruta(), equals('/cuenta')),
        );
    }

    static exitosamenteConSusCredenciales() {
        return Task.where('#actor inicia sesión con sus credenciales y llega a su cuenta',
            IniciarSesion.conSusCredenciales(),
            Wait.upTo(Duration.ofSeconds(30)).until(UrlActual.ruta(), equals('/cuenta')),
        );
    }

    static conCorreoYClave(email: Answerable<string>, password: Answerable<string>) {
        return Task.where(d`#actor inicia sesión con el correo ${ email }`,
            Navigate.to('/login'),
            // El formulario solo aparece cuando AuthContext terminó de cargar (React ya hidratado).
            Wait.until(PaginaLogin.campoCorreo(), isVisible()),
            Enter.theValue(email).into(PaginaLogin.campoCorreo()),
            Enter.theValue(password).into(PaginaLogin.campoContrasena()),
            Click.on(PaginaLogin.botonIniciarSesion()),
        );
    }
}
