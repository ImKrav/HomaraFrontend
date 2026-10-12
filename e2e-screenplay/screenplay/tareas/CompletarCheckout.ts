import { Duration, Task, Wait } from '@serenity-js/core';
import { Click, Enter, isVisible, Navigate } from '@serenity-js/web';
import { DATOS_DE_ENVIO } from '../datos/usuarios';
import { PaginaCheckout } from '../ui';

interface DatosDeEnvio { telefono: string; direccion: string; ciudad: string; departamento: string }

/** Tarea de negocio: abrir /checkout y esperar a que cargue el formulario. */
export class IrAlCheckout {
    static paraPagarSuCarrito() {
        return Task.where('#actor va al checkout',
            Navigate.to('/checkout'),
            Wait.upTo(Duration.ofSeconds(20)).until(PaginaCheckout.titulo(), isVisible()),
            Wait.until(PaginaCheckout.botonPagar(), isVisible()),
        );
    }
}

/**
 * Tarea de negocio: completar el checkout con los datos de envío y pagar.
 * Nombre, apellido y correo ya vienen prellenados desde el perfil del cliente.
 */
export class CompletarCheckout {
    static conDatosDeEnvio(datos: DatosDeEnvio = DATOS_DE_ENVIO) {
        return Task.where('#actor completa sus datos de envío y paga el pedido',
            IrAlCheckout.paraPagarSuCarrito(),
            Enter.theValue(datos.telefono).into(PaginaCheckout.campoTelefono()),
            Enter.theValue(datos.direccion).into(PaginaCheckout.campoDireccion()),
            Enter.theValue(datos.ciudad).into(PaginaCheckout.campoCiudad()),
            Enter.theValue(datos.departamento).into(PaginaCheckout.campoDepartamento()),
            Click.on(PaginaCheckout.botonPagar()),
        );
    }

    /** Variante negativa: intenta pagar dejando vacíos los datos de envío. */
    static sinDatosDeEnvio() {
        return Task.where('#actor intenta pagar sin completar sus datos de envío',
            IrAlCheckout.paraPagarSuCarrito(),
            Click.on(PaginaCheckout.botonPagar()),
        );
    }
}
