/**
 * URLs del entorno bajo prueba. Se pueden sobrescribir con variables de entorno
 * (útil para ejecutar la suite contra otra máquina o un contenedor).
 */
export const ENTORNO = {
    urlFrontend: process.env.HOMARA_URL_FRONTEND ?? 'http://localhost:3000',
    urlApi: process.env.HOMARA_URL_API ?? 'http://localhost:5000/api/v1/',
} as const;
