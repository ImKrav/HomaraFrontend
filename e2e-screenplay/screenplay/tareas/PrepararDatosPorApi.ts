import {
    type AnswersQuestions,
    notes,
    type PerformsActivities,
    Task,
    type UsesAbilities,
} from '@serenity-js/core';
import { CallAnApi, LastResponse } from '@serenity-js/rest';
import type { NotasDelActor } from '../actores/NotasDelActor';
import { PRODUCTO_DE_PRUEBA } from '../datos/productos';
import type { Credenciales, DatosDeCliente } from '../datos/usuarios';
import { LlamarALaApi } from '../interacciones/LlamarALaApi';

/*
 * Tareas de PREPARACIÓN y LIMPIEZA de datos que usan la habilidad CallAnApi.
 * No representan pasos del usuario en la interfaz: dejan el sistema en el estado
 * que el escenario necesita (Arrange) o lo limpian al final (Cleanup).
 */

interface RespuestaSesion { success: boolean; error?: string; data: { token: string; user: { firstName: string } } }
interface Producto { id: string; name: string }

/** Registra un cliente nuevo por API y anota su correo, clave, nombre y token. */
export class RegistrarClientePorApi {
    static con(datos: DatosDeCliente) {
        return Task.where(`#actor se registra por API como ${ datos.email }`,
            LlamarALaApi.sinSesion('POST', 'users/register', {
                email: datos.email,
                password: datos.password,
                firstName: datos.nombre,
                lastName: datos.apellido,
            }),
            notes<NotasDelActor>().set('email', datos.email),
            notes<NotasDelActor>().set('password', datos.password),
            notes<NotasDelActor>().set('nombre', datos.nombre),
            notes<NotasDelActor>().set('tokenApi', LastResponse.body<RespuestaSesion>().data.token),
        );
    }
}

/** Inicia sesión por API (sin interfaz) y anota el token para llamadas posteriores. */
export class ObtenerTokenPorApi {
    static con(credenciales: Credenciales) {
        return Task.where(`#actor obtiene un token de API como ${ credenciales.email }`,
            LlamarALaApi.sinSesion('POST', 'users/login', credenciales),
            notes<NotasDelActor>().set('email', credenciales.email),
            notes<NotasDelActor>().set('password', credenciales.password),
            notes<NotasDelActor>().set('tokenApi', LastResponse.body<RespuestaSesion>().data.token),
        );
    }
}

/**
 * El administrador garantiza que exista el producto de apoyo de las pruebas con
 * stock suficiente: lo crea si no existe, o repone su stock/precio si ya existe.
 * Anota su id en `idProductoDePrueba`. Requiere haber ejecutado ObtenerTokenPorApi.
 */
export class AsegurarProductoDePrueba extends Task {
    static existente() {
        return new AsegurarProductoDePrueba();
    }

    protected constructor() {
        super(`#actor asegura que existe el producto "${ PRODUCTO_DE_PRUEBA.nombre }" con stock`);
    }

    async performAs(actor: PerformsActivities & AnswersQuestions & UsesAbilities): Promise<void> {
        const api = CallAnApi.as(actor);
        const token = await actor.answer(notes<NotasDelActor>().get('tokenApi'));
        const cabeceras = { Authorization: `Bearer ${ token }` };

        const productos = (await api.request({ method: 'GET', url: 'products' })).data.data as Producto[];
        const categorias = (await api.request({ method: 'GET', url: 'categories' })).data.data as Array<{ id: string; name: string }>;
        const categoria = categorias.find(c => c.name === PRODUCTO_DE_PRUEBA.categoria) ?? categorias[0];

        const cuerpo = {
            name: PRODUCTO_DE_PRUEBA.nombre,
            description: PRODUCTO_DE_PRUEBA.descripcion,
            price: PRODUCTO_DE_PRUEBA.precio,
            originalPrice: null,
            stockQuantity: PRODUCTO_DE_PRUEBA.stock,
            unit: PRODUCTO_DE_PRUEBA.unidad,
            categoryId: categoria.id,
            image: '/products/placeholder.jpg',
            tags: [],
        };

        const existente = productos.find(p => p.name === PRODUCTO_DE_PRUEBA.nombre);
        const respuesta = existente
            ? await api.request({ method: 'PUT', url: `products/${ existente.id }`, data: cuerpo, headers: cabeceras })
            : await api.request({ method: 'POST', url: 'products', data: cuerpo, headers: cabeceras });

        await actor.attemptsTo(
            notes<NotasDelActor>().set('idProductoDePrueba', respuesta.data.data.id as string),
        );
    }
}

/** Vacía el carrito del actor por API (libera el stock reservado por las pruebas). */
export class VaciarCarritoPorApi extends Task {
    static delActor() {
        return new VaciarCarritoPorApi();
    }

    protected constructor() {
        super('#actor vacía su carrito por API');
    }

    async performAs(actor: PerformsActivities & AnswersQuestions & UsesAbilities): Promise<void> {
        const token = await actor.answer(notes<NotasDelActor>().get('tokenApi'));
        const api = CallAnApi.as(actor);
        const cabeceras = { Authorization: `Bearer ${ token }` };
        const carrito = await api.request({ method: 'GET', url: 'cart', headers: cabeceras, validateStatus: () => true });
        const items = (carrito.data?.data?.items ?? []) as Array<{ id: string }>;
        for (const item of items) {
            await api.request({ method: 'DELETE', url: `cart/items/${ item.id }`, headers: cabeceras, validateStatus: () => true });
        }
    }
}

/** Elimina por API (como administrador) los productos con el nombre indicado. */
export class EliminarProductoPorApi extends Task {
    static llamado(nombre: string) {
        return new EliminarProductoPorApi(nombre);
    }

    protected constructor(private readonly nombre: string) {
        super(`#actor elimina por API el producto "${ nombre }" si aún existe`);
    }

    async performAs(actor: PerformsActivities & AnswersQuestions & UsesAbilities): Promise<void> {
        const token = await actor.answer(notes<NotasDelActor>().get('tokenApi'));
        const api = CallAnApi.as(actor);
        const productos = (await api.request({ method: 'GET', url: 'products' })).data.data as Producto[];
        for (const producto of productos.filter(p => p.name === this.nombre)) {
            await api.request({
                method: 'DELETE',
                url: `products/${ producto.id }`,
                headers: { Authorization: `Bearer ${ token }` },
                validateStatus: () => true,
            });
        }
    }
}
