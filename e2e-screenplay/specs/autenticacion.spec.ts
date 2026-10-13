import { endsWith, Ensure, equals, includes, isFalse, isTrue } from '@serenity-js/assertions';
import { Duration, Wait } from '@serenity-js/core';
import { Attribute, Navigate } from '@serenity-js/web';
import { CAMILA_LA_CLIENTA } from '../screenplay/actores/Actores';
import { describe, it } from '../screenplay/actores/escenario';
import { CLIENTE_SEMILLA, claveDePrueba, clienteNuevo, correoUnico } from '../screenplay/datos/usuarios';
import { GuardarEvidencia } from '../screenplay/interacciones';
import { MensajeDeError, NombreDelUsuario, SesionDelNavegador, UrlActual } from '../screenplay/preguntas';
import { CerrarSesion, IniciarSesion, Registrarse, RegistrarClientePorApi } from '../screenplay/tareas';
import { PaginaRegistro } from '../screenplay/ui';

describe('Autenticación de clientes', () => {

    describe('ESC01 - Registro de usuario', { tag: '@ESC01' }, () => {

        it('SP-01 Camila se registra con datos válidos y queda autenticada', async ({ actorCalled }) => {
            const camila = clienteNuevo('Camila', 'Restrepo');

            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                Registrarse.con(camila),
                Wait.upTo(Duration.ofSeconds(30)).until(UrlActual.ruta(), equals('/cuenta')),
                Wait.until(NombreDelUsuario.enLaBarra(), equals('Camila')),
                GuardarEvidencia.como('SP-01-registro-exitoso'),
                Ensure.that(SesionDelNavegador.tieneToken(), isTrue()),
            );
        });

        it('SP-02 no permite registrar un correo que ya existe', async ({ actorCalled }) => {
            const duplicado = { ...clienteNuevo('Camila', 'Restrepo'), email: CLIENTE_SEMILLA.email };

            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                Registrarse.con(duplicado),
                Wait.until(MensajeDeError.delRegistro(), equals('El correo electrónico ya está registrado.')),
                GuardarEvidencia.como('SP-02-correo-duplicado'),
                Ensure.that(UrlActual.ruta(), equals('/register')),
                Ensure.that(SesionDelNavegador.tieneToken(), isFalse()),
            );
        });

        it('SP-03 no permite registrarse si las contraseñas no coinciden', async ({ actorCalled }) => {
            const camila = clienteNuevo('Camila', 'Restrepo');

            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                Registrarse.conConfirmacionDistinta(camila, claveDePrueba()),
                Wait.until(MensajeDeError.delRegistro(), equals('Las contraseñas no coinciden.')),
                Ensure.that(UrlActual.ruta(), equals('/register')),
                Ensure.that(SesionDelNavegador.tieneToken(), isFalse()),
            );
        });

        it('SP-04 contraseña de 7 caracteres: el formulario pide mínimo 6 pero el backend exige 8 (DEF-01)', {
            annotation: { type: 'defecto', description: 'DEF-01: el registro indica "Mínimo 6 caracteres" pero el backend exige 8' },
        }, async ({ actorCalled }) => {
            const camila = { ...clienteNuevo('Camila', 'Restrepo'), password: claveDePrueba(7) };

            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                Registrarse.con(camila),
                // Comportamiento observado: el frontend deja pasar la clave (>= 6) y el backend la rechaza.
                Wait.until(MensajeDeError.delRegistro(), includes('al menos 8 caracteres')),
                GuardarEvidencia.como('SP-04-DEF-01-clave-7-caracteres'),
                Ensure.that(UrlActual.ruta(), equals('/register')),
                // Inconsistencia documentada como DEF-01: el placeholder sigue indicando "Mínimo 6 caracteres".
                Ensure.that(Attribute.called('placeholder').of(PaginaRegistro.campoContrasena()), equals('Mínimo 6 caracteres')),
            );
        });
    });

    describe('ESC02 - Inicio de sesión', { tag: '@ESC02' }, () => {

        it('SP-05 Camila inicia sesión con credenciales válidas y llega a su cuenta', async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                IniciarSesion.con(CLIENTE_SEMILLA),
                Wait.upTo(Duration.ofSeconds(30)).until(UrlActual.ruta(), equals('/cuenta')),
                Wait.until(NombreDelUsuario.enLaBarra(), equals(CLIENTE_SEMILLA.nombre)),
                Ensure.that(SesionDelNavegador.tieneToken(), isTrue()),
            );
        });

        it('SP-06 rechaza una contraseña incorrecta', async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                IniciarSesion.con({ email: CLIENTE_SEMILLA.email, password: claveDePrueba() }),
                Wait.until(MensajeDeError.delInicioDeSesion(), equals('Credenciales incorrectas. Verifique correo y contraseña.')),
                GuardarEvidencia.como('SP-06-login-invalido'),
                Ensure.that(UrlActual.ruta(), equals('/login')),
                Ensure.that(SesionDelNavegador.tieneToken(), isFalse()),
            );
        });

        it('SP-07 rechaza un correo que no está registrado con el mismo mensaje genérico', async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                IniciarSesion.con({ email: correoUnico('noexiste'), password: claveDePrueba() }),
                Wait.until(MensajeDeError.delInicioDeSesion(), equals('Credenciales incorrectas. Verifique correo y contraseña.')),
                Ensure.that(UrlActual.ruta(), equals('/login')),
            );
        });
    });

    describe('ESC03 - Cierre de sesión', { tag: '@ESC03' }, () => {

        it('SP-08 Camila cierra sesión, pierde el token y ya no puede ver su cuenta', async ({ actorCalled }) => {
            await actorCalled(CAMILA_LA_CLIENTA).attemptsTo(
                RegistrarClientePorApi.con(clienteNuevo('Camila', 'Restrepo')),
                IniciarSesion.exitosamenteConSusCredenciales(),
                CerrarSesion.desdeElMenuDeCuenta(),
                Wait.until(UrlActual.ruta(), equals('/login')),
                Ensure.that(SesionDelNavegador.tieneToken(), isFalse()),
                Navigate.to('/cuenta'),
                Wait.until(UrlActual.completa(), endsWith('/login')),
            );
        });
    });
});
