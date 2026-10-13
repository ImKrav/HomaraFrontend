/**
 * Estructura de las notas que un actor puede tomar (habilidad TakeNotes) para
 * compartir información entre pasos de un mismo escenario.
 */
export interface NotasDelActor {
    email: string;
    password: string;
    nombre: string;
    tokenApi: string;
    idProductoDePrueba: string;
    nombreProductoCreado: string;
    idProyectoCreado: string;
}
