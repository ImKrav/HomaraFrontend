import { equals, isPresent, not } from '@serenity-js/assertions';
import { type AnswersQuestions, type PerformsActivities, Task, Wait } from '@serenity-js/core';
import { Click, isVisible, Navigate } from '@serenity-js/web';
import { CantidadEnCarrito } from '../preguntas/CantidadEnCarrito';
import { PaginaCarrito } from '../ui';

/** Tarea de negocio: abrir la página del carrito y esperar a que cargue. */
export class IrAlCarrito {
    static desdeLaBarra() {
        return Task.where('#actor abre su carrito',
            Navigate.to('/carrito'),
            Wait.until(PaginaCarrito.titulo(), isVisible()),
        );
    }
}

/**
 * Tarea de negocio: cambiar la cantidad de un producto en el carrito con los
 * botones "+" y "-". Espera a que la cantidad mostrada refleje el cambio.
 */
export class ModificarCantidad extends Task {
    static delProducto(nombre: string) {
        return {
            aumentandoUnaUnidad: () => new ModificarCantidad(nombre, +1),
            disminuyendoUnaUnidad: () => new ModificarCantidad(nombre, -1),
        };
    }

    protected constructor(private readonly nombre: string, private readonly delta: 1 | -1) {
        super(`#actor ${ delta > 0 ? 'aumenta' : 'disminuye' } en una unidad "${ nombre }" en el carrito`);
    }

    async performAs(actor: PerformsActivities & AnswersQuestions): Promise<void> {
        const item = PaginaCarrito.item(this.nombre);
        const antes = await actor.answer(CantidadEnCarrito.delProducto(this.nombre));
        const boton = this.delta > 0 ? PaginaCarrito.botonAumentar() : PaginaCarrito.botonDisminuir();
        await actor.attemptsTo(
            Click.on(boton.of(item)),
            Wait.until(CantidadEnCarrito.delProducto(this.nombre), equals(Math.max(1, antes + this.delta))),
        );
    }
}

/** Tarea de negocio: quitar un producto del carrito con el botón "Eliminar". */
export class EliminarDelCarrito {
    static elProducto(nombre: string) {
        return Task.where(`#actor elimina "${ nombre }" de su carrito`,
            Click.on(PaginaCarrito.botonEliminar().of(PaginaCarrito.item(nombre))),
            Wait.until(PaginaCarrito.item(nombre), not(isPresent())),
        );
    }
}
