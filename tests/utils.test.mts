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
  is(getStatusLabel("entregado"), "Entregado");
  is(getStatusLabel("Procesando"), "Procesando");
});

test("status-label-02", "Devuelve el valor original si el estado no está en el diccionario", () => {
  is(getStatusLabel("estado_raro"), "estado_raro");
});

test("status-label-03", "Cadena vacía devuelve cadena vacía", () => {
  is(getStatusLabel(""), "");
});

// --- getStatusColor -------------------------------------------

test("status-color-01", "Devuelve las clases del estado conocido", () => {
  is(getStatusColor("PENDIENTE"), "bg-amber-500/20 text-amber-400");
  is(getStatusColor("entregado"), "bg-emerald-500/20 text-emerald-400");
});

test("status-color-02", "Cae al color slate por defecto para estados desconocidos", () => {
  is(getStatusColor("xyz"), "bg-slate-500/20 text-slate-400");
});

// --- translateMaterialName -----------------------------------

test("mat-name-01", "Nombre fijo: usa el fallback en inglés cuando la clave no está traducida", () => {
  is(translateMaterialName("Boquilla", tIdentidad), "Grout");
  is(translateMaterialName("Crucetas 2mm", tIdentidad), "Spacers 2mm");
});

test("mat-name-02", "Nombre fijo: usa la traducción del diccionario cuando existe", () => {
  const t = tDiccionario({ "projects.supply_grout_title": "Lechada" });
  is(translateMaterialName("Boquilla", t), "Lechada");
});

test("mat-name-03", "Nombre fijo por prefijo (startsWith)", () => {
  is(
    translateMaterialName("Pintura Premium de Interior/Exterior Blanco Mate", tIdentidad),
    "Premium Interior/Exterior Paint",
  );
});

test("mat-name-04", "Revestimiento dinámico: reemplaza el nombre de superficie", () => {
  const t = tDiccionario({ "projects.surface_ceramica": "Ceramic" });
  is(translateMaterialName("Cerámica 60x60 cm", t), "Ceramic 60x60 cm");
});

test("mat-name-05", "Revestimiento dinámico: reemplaza superficie y sufijo Pared", () => {
  const t = tDiccionario({
    "projects.surface_ceramica": "Ceramic",
    "projects.surface_wall_suffix": "Wall",
  });
  is(translateMaterialName("Cerámica Pared 80x80 cm", t), "Ceramic Wall 80x80 cm");
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
    translateMaterialNote("Cálculo exacto con +15% de desperdicio", tIdentidad),
    "Exact calculation with +15% waste",
  );
  is(
    translateMaterialNote("+12% desperdicio por colocación", tIdentidad),
    "+12% waste due to layout pattern",
  );
  is(
    translateMaterialNote("Paredes estimadas (+10% desperdicio)", tIdentidad),
    "Estimated walls (+10% waste)",
  );
});

test("mat-note-03", "Nota fija exacta", () => {
  is(translateMaterialNote("Rendimiento: 8m²/kg", tIdentidad), "Yield: 8m²/kg");
});

test("mat-note-04", "Interpola {waste} en la traducción del diccionario", () => {
  const t = tDiccionario({ "projects.note_exact_waste": "Cálculo +{waste}% desp." });
  is(translateMaterialNote("Cálculo exacto con +20% de desperdicio", t), "Cálculo +20% desp.");
});

test("mat-note-05", "Nota sin patrón conocido pasa sin cambios", () => {
  is(translateMaterialNote("Nota totalmente inventada", tIdentidad), "Nota totalmente inventada");
});
