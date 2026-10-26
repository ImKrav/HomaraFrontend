import { equals, matches } from '@serenity-js/assertions';
import { Duration, Wait } from '@serenity-js/core';
import { NombreDelProyecto, UrlActual } from '../screenplay/preguntas';
import { CrearProyecto } from '../screenplay/tareas';
import { Cuando, Entonces } from './fixtures';

Cuando('crea un proyecto de piso {string} de {float} m de largo por {float} m de ancho', async ({ enEscena }, nombre: string, largo: number, ancho: number) => {
    await enEscena().attemptsTo(CrearProyecto.deTipoPiso({ nombre, largo, ancho }));
});

Cuando('crea un proyecto de piso sin nombre de {float} m de largo por {float} m de ancho', async ({ enEscena }, largo: number, ancho: number) => {
    await enEscena().attemptsTo(CrearProyecto.deTipoPiso({ largo, ancho }));
});

Cuando('crea un proyecto de piso {string} de {float} m de largo sin indicar el ancho', async ({ enEscena }, nombre: string, largo: number) => {
    await enEscena().attemptsTo(CrearProyecto.deTipoPiso({ nombre, largo }));
});

Entonces('ve el detalle del proyecto {string}', async ({ enEscena }, nombre: string) => {
    await enEscena().attemptsTo(
        Wait.upTo(Duration.ofSeconds(30)).until(UrlActual.ruta(), matches(/^\/proyectos\/(?!nuevo$)[\w-]+$/)),
        Wait.upTo(Duration.ofSeconds(20)).until(NombreDelProyecto.enElDetalle(), equals(nombre)),
    );
});
