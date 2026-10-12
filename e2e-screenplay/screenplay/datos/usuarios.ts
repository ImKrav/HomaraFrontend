/**
 * Datos de prueba de usuarios.
 *
 * Los usuarios "semilla" (seed) solo se usan para LEER (iniciar sesión); nunca se
 * modifican. Para los escenarios que cambian estado (carrito, pedidos, proyectos)
 * se registran clientes nuevos con correos únicos basados en la marca de tiempo.
 */
export interface Credenciales {
    email: string;
    password: string;
}

export interface DatosDeCliente extends Credenciales {
    nombre: string;
    apellido: string;
}

export const ADMIN_SEMILLA: Credenciales = { email: 'admin@homara.co', password: '123456' };
export const CLIENTE_SEMILLA: Credenciales & { nombre: string } = {
    email: 'juan@email.com',
    password: '123456',
    nombre: 'Juan',
};

let consecutivo = 0;

/** Genera un correo único, p. ej. camila.1791834285123.1.w0@e2e-screenplay.co */
export function correoUnico(prefijo = 'camila'): string {
    consecutivo += 1;
    const trabajador = process.env.TEST_WORKER_INDEX ?? '0';
    return `${prefijo}.${Date.now()}.${consecutivo}.w${trabajador}@e2e-screenplay.co`;
}

/** Cliente nuevo con contraseña válida para el backend (mínimo 8 caracteres). */
export function clienteNuevo(nombre = 'Camila', apellido = 'Restrepo'): DatosDeCliente {
    return {
        nombre,
        apellido,
        email: correoUnico(nombre.toLowerCase()),
        password: claveDePrueba(),
    };
}

/** Datos de envío usados en el checkout. */
export const DATOS_DE_ENVIO = {
    telefono: '300 555 1234',
    direccion: 'Carrera 43A # 1-50',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
} as const;

/**
 * Contraseña de prueba generada en cada ejecución: el código de las pruebas no
 * contiene credenciales fijas (evita falsos positivos de los escáneres de secretos).
 */
export function claveDePrueba(largo = 12): string {
    return ('Qa' + Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, largo);
}
