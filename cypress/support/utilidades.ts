// Utilidades compartidas por las pruebas E2E y de componentes.

/**
 * Formatea un valor en pesos colombianos igual que `formatPrice` de la app
 * (Intl es-CO, sin decimales). Se reimplementa aquí a propósito: la prueba no
 * debe depender del código que verifica.
 */
export function formatoCOP(valor: number): string {
  return normalizar(
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor),
  );
}

/** Colapsa espacios (incluido el espacio duro U+00A0 que usa Intl) para comparar textos. */
export function normalizar(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

/** Convierte "$ 1.250.000" en 1250000. */
export function aNumero(textoPrecio: string): number {
  return Number(textoPrecio.replace(/[^\d-]/g, ""));
}

/** Correo único por ejecución para no chocar con datos existentes ni con otros agentes/equipos. */
export function correoUnico(prefijo: string): string {
  const azar = Math.random().toString(36).slice(2, 7);
  return `cy-${prefijo}-${Date.now()}-${azar}@pruebas.homara.co`;
}

/** Viewports usados en las pruebas de interfaz (ESC39). */
export const VIEWPORTS = {
  movil: { ancho: 375, alto: 667 },
  tablet: { ancho: 768, alto: 1024 },
  escritorio: { ancho: 1440, alto: 900 },
} as const;

/** Etiquetas WCAG 2.1 A/AA que se evalúan con axe. */
export const ETIQUETAS_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/**
 * Contraseña de prueba generada en cada ejecución: el código de las pruebas no
 * contiene credenciales fijas (evita falsos positivos de los escáneres de secretos).
 */
export function claveDePrueba(largo = 12): string {
  return ("Qa" + Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, largo);
}
