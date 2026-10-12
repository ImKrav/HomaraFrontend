/**
 * Producto de apoyo para los escenarios de carrito y checkout.
 *
 * Se usa un producto propio de las pruebas (y no uno del catálogo semilla) porque
 * un pedido descuenta stock de forma permanente. El administrador lo crea por API
 * si no existe y repone su stock antes de cada ejecución (ver AsegurarProductoDePrueba).
 *
 * Precio 250.000 COP: 1 unidad -> se cobra envío; 2 unidades -> 500.000 COP, que es
 * exactamente el umbral de envío gratis (valor límite).
 */
export const PRODUCTO_DE_PRUEBA = {
    nombre: 'Insumo de Prueba E2E Screenplay',
    descripcion: 'Producto de apoyo para las pruebas E2E automatizadas (Screenplay). No es parte del catálogo real.',
    precio: 250_000,
    stock: 500,
    unidad: 'unidad',
    categoria: 'Herramientas',
} as const;

/** Reglas de negocio de envío observadas en el backend. */
export const REGLAS_DE_ENVIO = {
    umbralEnvioGratis: 500_000,
    costoEnvio: 25_000,
} as const;
