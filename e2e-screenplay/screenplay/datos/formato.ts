/**
 * Convierte un precio en formato es-CO (p. ej. "$ 275.000") a número (275000).
 */
export function aNumero(textoPrecio: string): number {
    const digitos = textoPrecio.replace(/[^\d]/g, '');
    return digitos === '' ? 0 : Number(digitos);
}
