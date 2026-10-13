import { equals } from '@serenity-js/assertions';
import { type AnswersQuestions, type PerformsActivities, Task, Wait } from '@serenity-js/core';
import { Click, isEnabled, isVisible, Text } from '@serenity-js/web';
import { CantidadEnCarrito } from '../preguntas/CantidadEnCarrito';
import { PaginaCatalogo, PaginaDetalleProducto } from '../ui';
import { BuscarProducto } from './BuscarProducto';

/**
 * Tarea de negocio: agregar un producto al carrito desde su página de detalle.
 *
 * Pasos: buscarlo en el catálogo, abrir su detalle y pulsar "Agregar al Carrito"
 * tantas veces como unidades se pidan. Tras cada clic espera (sin pausas fijas) a
 * que el contador de la barra suba una unidad, lo que confirma que el backend
 * registró el ítem.
 */
export class AgregarAlCarrito extends Task {
    static elProducto(nombre: string) {
        return new AgregarAlCarrito(nombre, 1);
    }

    /** Variante fluida: AgregarAlCarrito.elProducto('X').unidades(2) */
    unidades(cantidad: number): AgregarAlCarrito {
        return new AgregarAlCarrito(this.nombre, cantidad);
    }

    protected constructor(private readonly nombre: string, private readonly cantidad: number) {
        super(`#actor agrega ${ cantidad } unidad(es) de "${ nombre }" al carrito`);
    }

    async performAs(actor: PerformsActivities & AnswersQuestions): Promise<void> {
        await actor.attemptsTo(
            BuscarProducto.llamado(this.nombre),
            Click.on(PaginaCatalogo.tarjetaDelProducto(this.nombre)),
            Wait.until(Text.of(PaginaDetalleProducto.titulo()), equals(this.nombre)),
        );

        for (let i = 0; i < this.cantidad; i++) {
            const antes = await actor.answer(CantidadEnCarrito.segunLaBarra());
            await actor.attemptsTo(
                Wait.until(PaginaDetalleProducto.botonAgregarAlCarrito(), isVisible()),
                Wait.until(PaginaDetalleProducto.botonAgregarAlCarrito(), isEnabled()),
                Click.on(PaginaDetalleProducto.botonAgregarAlCarrito()),
                Wait.until(CantidadEnCarrito.segunLaBarra(), equals(antes + 1)),
            );
        }
    }
}
