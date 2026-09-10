// app/lib/utils.ts · formateo de precios, estados y traducción de materiales

import { test, is, has } from "./harness.mjs";
import { tIdentidad, tDiccionario } from "./helpers.mjs";
import {
  formatPrice,
  getStatusLabel,
  getStatusColor,
  translateMaterialName,
  translateMaterialNote,
} from "../app/lib/utils.js";

const soloDigitos = (s: string) => s.replace(/[^\d]/g, "");

// --- formatPrice ---------------------------------------------------

test("fmt-01", "Formatea pesos enteros sin decimales", () => {
  is(soloDigitos(formatPrice(38900)), "38900");
  has(formatPrice(38900), "38.900"); // separador de miles es punto (es-CO)
});

test("fmt-02", "Cero se formatea como 0 sin decimales", () => {
  is(soloDigitos(formatPrice(0)), "0");
});

test("fmt-03", "Millones llevan separador de miles", () => {
  is(soloDigitos(formatPrice(1_234_567)), "1234567");
  has(formatPrice(1_234_567), "1.234.567");
});

// --- getStatusLabel ---------------------------------------------

test("status-label-01", "Traduce el estado normalizando mayúsculas", () => {
  is(getStatusLabel("EN_PROGRESO"), "En progreso");
  is(getStatusLabel("completado"), "Completado");
  is(getStatusLabel("pausado"), "Pausado");
  is(getStatusLabel("pendiente"), "Pendiente");
  is(getStatusLabel("Procesando"), "Procesando");
  is(getStatusLabel("enviado"), "Enviado");
  is(getStatusLabel("entregado"), "Entregado");
  is(getStatusLabel("cancelado"), "Cancelado");
});

test("status-label-02", "Devuelve el valor original si el estado no está en el diccionario", () => {
  is(getStatusLabel("estado_raro"), "estado_raro");
});

test("status-label-03", "Cadena vacía devuelve cadena vacía", () => {
  is(getStatusLabel(""), "");
  is(getStatusLabel(null as unknown as string), null as unknown as string);
});

// --- getStatusColor -------------------------------------------

test("status-color-01", "Devuelve las clases del estado conocido", () => {
  is(getStatusColor("en_progreso"), "bg-amber-500/20 text-amber-400");
  is(getStatusColor("completado"), "bg-emerald-500/20 text-emerald-400");
  is(getStatusColor("pausado"), "bg-slate-500/20 text-slate-400");
  is(getStatusColor("PENDIENTE"), "bg-amber-500/20 text-amber-400");
  is(getStatusColor("procesando"), "bg-blue-500/20 text-blue-400");
  is(getStatusColor("enviado"), "bg-purple-500/20 text-purple-400");
  is(getStatusColor("entregado"), "bg-emerald-500/20 text-emerald-400");
  is(getStatusColor("cancelado"), "bg-red-500/20 text-red-400");
});

test("status-color-02", "Cae al color slate por defecto para estados desconocidos o vacíos", () => {
  is(getStatusColor("xyz"), "bg-slate-500/20 text-slate-400");
  is(getStatusColor(""), "bg-slate-500/20 text-slate-400");
  is(getStatusColor(null as unknown as string), "bg-slate-500/20 text-slate-400");
});

// --- translateMaterialName -----------------------------------

test("mat-name-01", "Nombre fijo: usa el fallback en inglés cuando la clave no está traducida", () => {
  is(translateMaterialName("Boquilla", tIdentidad), "Grout");
  is(translateMaterialName("Crucetas 2mm", tIdentidad), "Spacers 2mm");
  is(translateMaterialName("Pegante cerámico flexible 25kg", tIdentidad), "Flexible Ceramic Adhesive 25kg");
  is(translateMaterialName("Cinta underlayment", tIdentidad), "Underlayment tape");
  is(translateMaterialName("Primer para vinilo", tIdentidad), "Primer for vinyl");
  is(translateMaterialName("Kit Rodillo Antigoteo Profesional 23cm", tIdentidad), "Professional Anti-Drip Roller Kit 23cm");
  is(translateMaterialName("Nivel de burbuja profesional 60cm", tIdentidad), "Professional Bubble Level 60cm");
  is(translateMaterialName("Llana metálica dentada 10x10mm", tIdentidad), "Notched steel trowel 10x10mm");
  is(translateMaterialName("Mazo de goma blanco anti-marca", tIdentidad), "White non-marking rubber mallet");
});

test("mat-name-02", "Nombre fijo: usa la traducción del diccionario cuando existe", () => {
  const t = tDiccionario({
    "projects.supply_grout_title": "Lechada",
    "projects.supply_adhesive_flexible": "Pegante Flexible",
    "projects.supply_paint_premium": "Pintura Pro",
  });
  is(translateMaterialName("Boquilla", t), "Lechada");
  is(translateMaterialName("Pegante cerámico flexible 25kg", t), "Pegante Flexible");
  is(translateMaterialName("Pintura Premium de Interior/Exterior Mate", t), "Pintura Pro");
});

test("mat-name-03", "Nombre fijo por prefijo (startsWith)", () => {
  is(
    translateMaterialName("Pintura Premium de Interior/Exterior Blanco Mate", tIdentidad),
    "Premium Interior/Exterior Paint",
  );
  is(
    translateMaterialName("Brocha de cerda fina 2.5 pulg", tIdentidad),
    'Fine bristle brush 2.5"',
  );
  is(
    translateMaterialName("Cinta de enmascarar azul", tIdentidad),
    'Premium masking tape 1"',
  );
});

test("mat-name-04", "Revestimiento dinámico: reemplaza el nombre de superficie", () => {
  const t = tDiccionario({
    "projects.surface_ceramica": "Ceramic",
    "projects.surface_porcelanato": "Porcelain Tile",
    "projects.surface_madera": "Laminate Wood",
    "projects.surface_vinilo": "Vinyl Floor",
  });
  is(translateMaterialName("Cerámica 60x60 cm", t), "Ceramic 60x60 cm");
  is(translateMaterialName("Porcelanato 80x80 cm", t), "Porcelain Tile 80x80 cm");
  is(translateMaterialName("Madera laminada Roble", t), "Laminate Wood Roble");
  is(translateMaterialName("Vinilo Autoadhesivo", t), "Vinyl Floor Autoadhesivo");
});

test("mat-name-05", "Revestimiento dinámico: reemplaza superficie y sufijo Pared", () => {
  const t = tDiccionario({
    "projects.surface_ceramica": "Ceramic",
    "projects.surface_wall_suffix": "Wall",
  });
  is(translateMaterialName("Cerámica Pared 80x80 cm", t), "Ceramic Wall 80x80 cm");
  // Fallbacks en inglés cuando no hay traducción
  is(translateMaterialName("Porcelanato Pared 60x60", tIdentidad), "Porcelain Wall 60x60");
});

test("mat-name-06", "Nombre no reconocido pasa sin cambios", () => {
  is(translateMaterialName("Tornillos autoperforantes surtidos", tIdentidad), "Tornillos autoperforantes surtidos");
});

// --- translateMaterialNote ---------------------------------

test("mat-note-01", "Nota nula devuelve null", () => {
  is(translateMaterialNote(null, tIdentidad), null);
});

test("mat-note-02", "Extrae el % de desperdicio y usa el fallback en inglés", () => {
  is(
    translateMaterialNote("Cálculo exacto: 1 galón por cada 30m² (+12% desperdicio)", tIdentidad),
    "Exact calculation: 1 gallon per 30m² (Includes +12% waste)",
  );
  is(
    translateMaterialNote("Cálculo exacto: 1 galón por cada 30m²", tIdentidad),
    "Exact calculation: 1 gallon per 30m² (Includes +10% waste)",
  );
  is(
    translateMaterialNote("Cálculo exacto con +15% de desperdicio", tIdentidad),
    "Exact calculation with +15% waste",
  );
  is(
    translateMaterialNote("Cálculo exacto con + desperdicio", tIdentidad),
    "Exact calculation with +10% waste",
  );
  is(
    translateMaterialNote("Rendimiento aproximado de 30m² (+8% desperdicio)", tIdentidad),
    "Approximate yield of 30m² each with 2 coats (Includes +8% waste)",
  );
  is(
    translateMaterialNote("Rendimiento aproximado de 30m²", tIdentidad),
    "Approximate yield of 30m² each with 2 coats (Includes +5% waste)",
  );
  is(
    translateMaterialNote("+12% desperdicio por colocación", tIdentidad),
    "+12% waste due to layout pattern",
  );
  is(
    translateMaterialNote("+ desperdicio por colocación", tIdentidad),
    "+10% waste due to layout pattern",
  );
  is(
    translateMaterialNote("Paredes estimadas (+15% desperdicio)", tIdentidad),
    "Estimated walls (+15% waste)",
  );
  is(
    translateMaterialNote("Paredes estimadas", tIdentidad),
    "Estimated walls (+10% waste)",
  );
});

test("mat-note-03", "Notas fijas exactas con fallback", () => {
  is(translateMaterialNote("Pegante real vinculado", tIdentidad), "Linked real adhesive: 1 bag per 4m²");
  is(translateMaterialNote("25kg c/u (Rendimiento: 4m²/bulto)", tIdentidad), "25kg each (Yield: 4m²/bag)");
  is(translateMaterialNote("Boquilla real vinculada", tIdentidad), "Linked real grout: 1 kg per 8m²");
  is(translateMaterialNote("Rendimiento: 8m²/kg", tIdentidad), "Yield: 8m²/kg");
  is(translateMaterialNote("100 unidades c/u (Rendimiento: 15m²/bolsa)", tIdentidad), "100 units each (Yield: 15m²/bag)");
  is(translateMaterialNote("20m² c/u (Aislamiento acústico y de humedad)", tIdentidad), "20m² each (Acoustic and moisture barrier)");
  is(translateMaterialNote("15m² c/u (Adherencia óptima)", tIdentidad), "15m² each (Optimal adhesion)");
  is(translateMaterialNote("Incluye bandeja y felpa de microfibra", tIdentidad), "Includes tray and microfiber roller sleeve");
  is(translateMaterialNote("Para retoques y esquinas", tIdentidad), "For touch-ups and corners");
  is(translateMaterialNote("Para protección de bordes y zócalos", tIdentidad), "For edge and baseboard protection");
  is(translateMaterialNote("Para alineación exacta de la superficie", tIdentidad), "For precise surface alignment");
  is(translateMaterialNote("Para distribución correcta del pegante", tIdentidad), "For correct adhesive distribution");
  is(translateMaterialNote("Para asentamiento de baldosas sin fracturas", tIdentidad), "For tile settlement without cracks");
});

test("mat-note-04", "Interpola {waste} en la traducción del diccionario", () => {
  const t = tDiccionario({
    "projects.note_paint_exact": "Cálculo galón exacto +{waste}%",
    "projects.note_exact_waste": "Cálculo +{waste}% desp.",
    "projects.note_paint_approx": "Rendimiento aprox +{waste}%",
    "projects.note_waste_laying": "+{waste}% colocación",
    "projects.note_walls_estimated": "Paredes +{waste}%",
    "projects.note_adhesive_linked": "Pegante vinculado real",
  });
  is(translateMaterialNote("Cálculo exacto: 1 galón por cada 30m² (+10%)", t), "Cálculo galón exacto +10%");
  is(translateMaterialNote("Cálculo exacto con +20% de desperdicio", t), "Cálculo +20% desp.");
  is(translateMaterialNote("Rendimiento aproximado de 30m² (+5%)", t), "Rendimiento aprox +5%");
  is(translateMaterialNote("+15% desperdicio por colocación", t), "+15% colocación");
  is(translateMaterialNote("Paredes estimadas (+12%)", t), "Paredes +12%");
  is(translateMaterialNote("Pegante real vinculado", t), "Pegante vinculado real");
});

test("mat-note-05", "Nota sin patrón conocido pasa sin cambios", () => {
  is(translateMaterialNote("Nota totalmente inventada", tIdentidad), "Nota totalmente inventada");
});
