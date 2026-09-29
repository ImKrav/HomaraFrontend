// app/lib/utils.ts · formateo de precios, estados y traducción de materiales
//
// Cada caso sigue el patrón AAA: Arrange (entradas y esperados), Act (una
// invocación de la función bajo prueba por entrada), Assert (comprobaciones).
// Los casos de tabla comparan por índice para que el mensaje de fallo diga
// cuál entrada falló.

import { test, expect } from "./harness.mjs";
import { tIdentidad, tDiccionario } from "./helpers.mjs";
import {
  formatPrice,
  getStatusLabel,
  getStatusColor,
  translateMaterialName,
  translateMaterialNote,
} from "../app/lib/utils.js";

const soloDigitos = (s: string) => s.replace(/[^\d]/g, "");

/** Comprueba una tabla de [entrada, esperado] contra los valores obtenidos. */
function comprobarTabla(casos: Array<[unknown, unknown]>, obtenidos: unknown[]) {
  casos.forEach(([entrada, esperado], i) => expect(obtenidos[i], `entrada: ${JSON.stringify(entrada)}`).toBe(esperado));
}

// --- formatPrice ---------------------------------------------------

test("fmt-01", "Formatea pesos enteros sin decimales", () => {
  // Arrange
  const precio = 38900;

  // Act
  const formateado = formatPrice(precio);

  // Assert
  expect(soloDigitos(formateado)).toBe("38900");
  expect(formateado).toContain("38.900"); // separador de miles es punto (es-CO)
});

test("fmt-02", "Cero se formatea como 0 sin decimales", () => {
  // Arrange
  const precio = 0;

  // Act
  const formateado = formatPrice(precio);

  // Assert
  expect(soloDigitos(formateado)).toBe("0");
});

test("fmt-03", "Millones llevan separador de miles", () => {
  // Arrange
  const precio = 1_234_567;

  // Act
  const formateado = formatPrice(precio);

  // Assert
  expect(soloDigitos(formateado)).toBe("1234567");
  expect(formateado).toContain("1.234.567");
});

// --- getStatusLabel ---------------------------------------------

test("status-label-01", "Traduce el estado normalizando mayúsculas", () => {
  // Arrange
  const casos: Array<[unknown, unknown]> = [
    ["EN_PROGRESO", "En progreso"],
    ["completado", "Completado"],
    ["pausado", "Pausado"],
    ["pendiente", "Pendiente"],
    ["Procesando", "Procesando"],
    ["enviado", "Enviado"],
    ["entregado", "Entregado"],
    ["cancelado", "Cancelado"],
  ];

  // Act
  const obtenidos = casos.map(([estado]) => getStatusLabel(estado as string));

  // Assert
  comprobarTabla(casos, obtenidos);
});

test("status-label-02", "Devuelve el valor original si el estado no está en el diccionario", () => {
  // Arrange
  const estado = "estado_raro";

  // Act
  const etiqueta = getStatusLabel(estado);

  // Assert
  expect(etiqueta).toBe("estado_raro");
});

test("status-label-03", "Cadena vacía devuelve cadena vacía", () => {
  // Arrange
  const vacia = "";
  const nula = null as unknown as string;

  // Act
  const deVacia = getStatusLabel(vacia);
  const deNula = getStatusLabel(nula);

  // Assert
  expect(deVacia).toBe("");
  expect(deNula).toBe(null as unknown as string);
});

// --- getStatusColor -------------------------------------------

test("status-color-01", "Devuelve las clases del estado conocido", () => {
  // Arrange
  const casos: Array<[unknown, unknown]> = [
    ["en_progreso", "bg-amber-500/20 text-amber-400"],
    ["completado", "bg-emerald-500/20 text-emerald-400"],
    ["pausado", "bg-slate-500/20 text-slate-400"],
    ["PENDIENTE", "bg-amber-500/20 text-amber-400"],
    ["procesando", "bg-blue-500/20 text-blue-400"],
    ["enviado", "bg-purple-500/20 text-purple-400"],
    ["entregado", "bg-emerald-500/20 text-emerald-400"],
    ["cancelado", "bg-red-500/20 text-red-400"],
  ];

  // Act
  const obtenidos = casos.map(([estado]) => getStatusColor(estado as string));

  // Assert
  comprobarTabla(casos, obtenidos);
});

test("status-color-02", "Cae al color slate por defecto para estados desconocidos o vacíos", () => {
  // Arrange
  const POR_DEFECTO = "bg-slate-500/20 text-slate-400";
  const casos: Array<[unknown, unknown]> = [
    ["xyz", POR_DEFECTO],
    ["", POR_DEFECTO],
    [null, POR_DEFECTO],
  ];

  // Act
  const obtenidos = casos.map(([estado]) => getStatusColor(estado as string));

  // Assert
  comprobarTabla(casos, obtenidos);
});

// --- translateMaterialName -----------------------------------

test("mat-name-01", "Nombre fijo: usa el fallback en inglés cuando la clave no está traducida", () => {
  // Arrange
  const casos: Array<[unknown, unknown]> = [
    ["Boquilla", "Grout"],
    ["Crucetas 2mm", "Spacers 2mm"],
    ["Pegante cerámico flexible 25kg", "Flexible Ceramic Adhesive 25kg"],
    ["Cinta underlayment", "Underlayment tape"],
    ["Primer para vinilo", "Primer for vinyl"],
    ["Kit Rodillo Antigoteo Profesional 23cm", "Professional Anti-Drip Roller Kit 23cm"],
    ["Nivel de burbuja profesional 60cm", "Professional Bubble Level 60cm"],
    ["Llana metálica dentada 10x10mm", "Notched steel trowel 10x10mm"],
    ["Mazo de goma blanco anti-marca", "White non-marking rubber mallet"],
  ];

  // Act
  const obtenidos = casos.map(([nombre]) => translateMaterialName(nombre as string, tIdentidad));

  // Assert
  comprobarTabla(casos, obtenidos);
});

test("mat-name-02", "Nombre fijo: usa la traducción del diccionario cuando existe", () => {
  // Arrange
  const t = tDiccionario({
    "projects.supply_grout_title": "Lechada",
    "projects.supply_adhesive_flexible": "Pegante Flexible",
    "projects.supply_paint_premium": "Pintura Pro",
  });
  const casos: Array<[unknown, unknown]> = [
    ["Boquilla", "Lechada"],
    ["Pegante cerámico flexible 25kg", "Pegante Flexible"],
    ["Pintura Premium de Interior/Exterior Mate", "Pintura Pro"],
  ];

  // Act
  const obtenidos = casos.map(([nombre]) => translateMaterialName(nombre as string, t));

  // Assert
  comprobarTabla(casos, obtenidos);
});

test("mat-name-03", "Nombre fijo por prefijo (startsWith)", () => {
  // Arrange
  const casos: Array<[unknown, unknown]> = [
    ["Pintura Premium de Interior/Exterior Blanco Mate", "Premium Interior/Exterior Paint"],
    ["Brocha de cerda fina 2.5 pulg", 'Fine bristle brush 2.5"'],
    ["Cinta de enmascarar azul", 'Premium masking tape 1"'],
  ];

  // Act
  const obtenidos = casos.map(([nombre]) => translateMaterialName(nombre as string, tIdentidad));

  // Assert
  comprobarTabla(casos, obtenidos);
});

test("mat-name-04", "Revestimiento dinámico: reemplaza el nombre de superficie", () => {
  // Arrange
  const t = tDiccionario({
    "projects.surface_ceramica": "Ceramic",
    "projects.surface_porcelanato": "Porcelain Tile",
    "projects.surface_madera": "Laminate Wood",
    "projects.surface_vinilo": "Vinyl Floor",
  });
  const casos: Array<[unknown, unknown]> = [
    ["Cerámica 60x60 cm", "Ceramic 60x60 cm"],
    ["Porcelanato 80x80 cm", "Porcelain Tile 80x80 cm"],
    ["Madera laminada Roble", "Laminate Wood Roble"],
    ["Vinilo Autoadhesivo", "Vinyl Floor Autoadhesivo"],
  ];

  // Act
  const obtenidos = casos.map(([nombre]) => translateMaterialName(nombre as string, t));

  // Assert
  comprobarTabla(casos, obtenidos);
});

test("mat-name-05", "Revestimiento dinámico: reemplaza superficie y sufijo Pared", () => {
  // Arrange
  const t = tDiccionario({
    "projects.surface_ceramica": "Ceramic",
    "projects.surface_wall_suffix": "Wall",
  });

  // Act
  const conDiccionario = translateMaterialName("Cerámica Pared 80x80 cm", t);
  const conFallback = translateMaterialName("Porcelanato Pared 60x60", tIdentidad);

  // Assert
  expect(conDiccionario).toBe("Ceramic Wall 80x80 cm");
  expect(conFallback).toBe("Porcelain Wall 60x60"); // fallback en inglés cuando no hay traducción
});

test("mat-name-06", "Nombre no reconocido pasa sin cambios", () => {
  // Arrange
  const nombre = "Tornillos autoperforantes surtidos";

  // Act
  const traducido = translateMaterialName(nombre, tIdentidad);

  // Assert
  expect(traducido).toBe("Tornillos autoperforantes surtidos");
});

// --- translateMaterialNote ---------------------------------

test("mat-note-01", "Nota nula devuelve null", () => {
  // Arrange
  const nota = null;

  // Act
  const traducida = translateMaterialNote(nota, tIdentidad);

  // Assert
  expect(traducida).toBe(null);
});

test("mat-note-02", "Extrae el % de desperdicio y usa el fallback en inglés", () => {
  // Arrange
  const casos: Array<[unknown, unknown]> = [
    ["Cálculo exacto: 1 galón por cada 30m² (+12% desperdicio)", "Exact calculation: 1 gallon per 30m² (Includes +12% waste)"],
    ["Cálculo exacto: 1 galón por cada 30m²", "Exact calculation: 1 gallon per 30m² (Includes +10% waste)"],
    ["Cálculo exacto con +15% de desperdicio", "Exact calculation with +15% waste"],
    ["Cálculo exacto con + desperdicio", "Exact calculation with +10% waste"],
    ["Rendimiento aproximado de 30m² (+8% desperdicio)", "Approximate yield of 30m² each with 2 coats (Includes +8% waste)"],
    ["Rendimiento aproximado de 30m²", "Approximate yield of 30m² each with 2 coats (Includes +5% waste)"],
    ["+12% desperdicio por colocación", "+12% waste due to layout pattern"],
    ["+ desperdicio por colocación", "+10% waste due to layout pattern"],
    ["Paredes estimadas (+15% desperdicio)", "Estimated walls (+15% waste)"],
    ["Paredes estimadas", "Estimated walls (+10% waste)"],
  ];

  // Act
  const obtenidos = casos.map(([nota]) => translateMaterialNote(nota as string, tIdentidad));

  // Assert
  comprobarTabla(casos, obtenidos);
});

test("mat-note-03", "Notas fijas exactas con fallback", () => {
  // Arrange
  const casos: Array<[unknown, unknown]> = [
    ["Pegante real vinculado", "Linked real adhesive: 1 bag per 4m²"],
    ["25kg c/u (Rendimiento: 4m²/bulto)", "25kg each (Yield: 4m²/bag)"],
    ["Boquilla real vinculada", "Linked real grout: 1 kg per 8m²"],
    ["Rendimiento: 8m²/kg", "Yield: 8m²/kg"],
    ["100 unidades c/u (Rendimiento: 15m²/bolsa)", "100 units each (Yield: 15m²/bag)"],
    ["20m² c/u (Aislamiento acústico y de humedad)", "20m² each (Acoustic and moisture barrier)"],
    ["15m² c/u (Adherencia óptima)", "15m² each (Optimal adhesion)"],
    ["Incluye bandeja y felpa de microfibra", "Includes tray and microfiber roller sleeve"],
    ["Para retoques y esquinas", "For touch-ups and corners"],
    ["Para protección de bordes y zócalos", "For edge and baseboard protection"],
    ["Para alineación exacta de la superficie", "For precise surface alignment"],
    ["Para distribución correcta del pegante", "For correct adhesive distribution"],
    ["Para asentamiento de baldosas sin fracturas", "For tile settlement without cracks"],
  ];

  // Act
  const obtenidos = casos.map(([nota]) => translateMaterialNote(nota as string, tIdentidad));

  // Assert
  comprobarTabla(casos, obtenidos);
});

test("mat-note-04", "Interpola {waste} en la traducción del diccionario", () => {
  // Arrange
  const t = tDiccionario({
    "projects.note_paint_exact": "Cálculo galón exacto +{waste}%",
    "projects.note_exact_waste": "Cálculo +{waste}% desp.",
    "projects.note_paint_approx": "Rendimiento aprox +{waste}%",
    "projects.note_waste_laying": "+{waste}% colocación",
    "projects.note_walls_estimated": "Paredes +{waste}%",
    "projects.note_adhesive_linked": "Pegante vinculado real",
  });
  const casos: Array<[unknown, unknown]> = [
    ["Cálculo exacto: 1 galón por cada 30m² (+10%)", "Cálculo galón exacto +10%"],
    ["Cálculo exacto con +20% de desperdicio", "Cálculo +20% desp."],
    ["Rendimiento aproximado de 30m² (+5%)", "Rendimiento aprox +5%"],
    ["+15% desperdicio por colocación", "+15% colocación"],
    ["Paredes estimadas (+12%)", "Paredes +12%"],
    ["Pegante real vinculado", "Pegante vinculado real"],
  ];

  // Act
  const obtenidos = casos.map(([nota]) => translateMaterialNote(nota as string, t));

  // Assert
  comprobarTabla(casos, obtenidos);
});

test("mat-note-05", "Nota sin patrón conocido pasa sin cambios", () => {
  // Arrange
  const nota = "Nota totalmente inventada";

  // Act
  const traducida = translateMaterialNote(nota, tIdentidad);

  // Assert
  expect(traducida).toBe("Nota totalmente inventada");
});
