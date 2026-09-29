// REG-I18N · Regresión del contrato de traducción con el backend
// Protege: c492c7c feat(i18n) y la traducción por texto literal de
//          translateMaterialName / translateMaterialNote.
//
// El backend (`calculateMaterials`) genera nombres y notas en español y el
// frontend los traduce comparando el texto exacto o su prefijo. Los textos de
// abajo son copia literal de lo que emite el backend hoy; la contraparte que
// impide cambiarlos del otro lado es HomaraBackend/tests/regression/REG-MAT.ts.
//
// `tIdentidad` devuelve la clave tal cual, así que toda traducción cae al
// respaldo en inglés: si un texto sale igual que entró, no se reconoció.

import { test, expect } from "../harness.mjs";
import { tIdentidad } from "../helpers.mjs";
import { translateMaterialName, translateMaterialNote } from "../../app/lib/utils.js";

/** Comprueba que cada texto de la lista fue reconocido (salió distinto). */
function comprobarTraducidos(entradas: string[], salidas: Array<string | null>) {
  entradas.forEach((entrada, i) => expect(salidas[i], `sin traducir: ${JSON.stringify(entrada)}`).not.toBe(entrada));
}

test("REG-I18N-01", "Traduce los nombres fijos de insumos y herramientas", () => {
  // Arrange
  const nombres = [
    "Pegante cerámico flexible 25kg",
    "Boquilla",
    "Crucetas 2mm",
    "Cinta underlayment",
    "Primer para vinilo",
    "Kit Rodillo Antigoteo Profesional 23cm",
    "Nivel de burbuja profesional 60cm",
    "Llana metálica dentada 10x10mm",
    "Mazo de goma blanco anti-marca",
    "Pintura Premium de Interior/Exterior",
    'Brocha de cerda fina 2.5"',
    'Cinta de enmascarar premium 1"',
  ];

  // Act
  const traducidos = nombres.map((n) => translateMaterialName(n, tIdentidad));

  // Assert
  comprobarTraducidos(nombres, traducidos);
});

test("REG-I18N-02", "Traduce la superficie de los revestimientos generados, incluido el sufijo Pared", () => {
  // Arrange
  const nombres = ["Cerámica 60x60", "Porcelanato 60x60", "Madera laminada", "Vinilo", "Cerámica Pared 30x30"];

  // Act
  const traducidos = nombres.map((n) => translateMaterialName(n, tIdentidad));

  // Assert
  expect(traducidos).toStrictEqual([
    "Ceramic 60x60",
    "Porcelain 60x60",
    "Laminated wood",
    "Vinyl",
    "Ceramic Wall 30x30",
  ]);
});

test("REG-I18N-03", "Traduce las notas fijas de insumos y herramientas", () => {
  // Arrange
  const notas = [
    "25kg c/u (Rendimiento: 4m²/bulto)",
    "Rendimiento: 8m²/kg",
    "100 unidades c/u (Rendimiento: 15m²/bolsa)",
    "20m² c/u (Aislamiento acústico y de humedad)",
    "15m² c/u (Adherencia óptima)",
    "Incluye bandeja y felpa de microfibra",
    "Para retoques y esquinas",
    "Para protección de bordes y zócalos",
    "Para alineación exacta de la superficie",
    "Para distribución correcta del pegante",
    "Para asentamiento de baldosas sin fracturas",
  ];

  // Act
  const traducidas = notas.map((n) => translateMaterialNote(n, tIdentidad));

  // Assert
  comprobarTraducidos(notas, traducidas);
});

test("REG-I18N-04", "Traduce las notas con % de desperdicio conservando el porcentaje", () => {
  // Arrange
  const notas = [
    "+15% de desperdicio por colocación",
    "Cálculo exacto con +12% de desperdicio",
    "Cálculo exacto: 1 galón por cada 30m² (Incluye +5% de desperdicio)",
    "Rendimiento aproximado de 30m² c/u con 2 manos (Incluye +5% desperdicio)",
    "Paredes estimadas (+10% desperdicio)",
  ];

  // Act
  const traducidas = notas.map((n) => translateMaterialNote(n, tIdentidad));

  // Assert
  expect(traducidas).toStrictEqual([
    "+15% waste due to layout pattern",
    "Exact calculation with +12% waste",
    "Exact calculation: 1 gallon per 30m² (Includes +5% waste)",
    "Approximate yield of 30m² each with 2 coats (Includes +5% waste)",
    "Estimated walls (+10% waste)",
  ]);
});

// Defecto abierto F-1 (ver la tabla en tests/README.md): se espera que falle.
test.fails("REG-I18N-05", "Traduce las notas de pegante y boquilla vinculados a un producto real", () => {
  // Arrange — textos exactos que emite el backend (REG-MAT-01 / REG-MAT-02 y CP-F-PROY-02-07).
  const notas = [
    "Pegante real vinculado: 1 bulto por cada 4m²",
    "Pegante real vinculado: 1 unidad de 10kg por cada 1.6m²",
    "Boquilla real vinculada: 1 kg por cada 8m²",
    "Boquilla real vinculada: 1 unidad de 2kg por cada 16m²",
  ];

  // Act
  const traducidas = notas.map((n) => translateMaterialNote(n, tIdentidad));

  // Assert — DEFECTO: el diccionario usa "Pegante real vinculado" como clave exacta
  // y el backend siempre agrega ": <rendimiento>", así que nunca coincide.
  notas.forEach((nota, i) => expect.soft(traducidas[i], `sin traducir: ${nota}`).not.toBe(nota));
});
