// REG-QTY · Regresión del parseo de cantidades del editor de materiales
// Protege: 20f4880 fix: update regex for quantity parsing (Sonar S5852)
//
// La regex anterior, /^([\d.,]+)(?:\s+(.*))?$/, hacía backtracking cuadrático:
// una cantidad de 50 000 caracteres tardaba ~5 s en fallar y congelaba la
// pestaña. `\S.*` lo deja lineal sin cambiar ningún resultado. Estos casos
// fijan los resultados y ponen un tope de tiempo holgado (la versión segura
// tarda < 1 ms; la vulnerable, segundos).

import { test, expect } from "../harness.mjs";
import { parseQuantity } from "../../app/lib/utils.js";

test("REG-QTY-01", "Separa número y unidad en las cantidades que emite el backend", () => {
  // Arrange
  const casos: Array<[string, { num: number; unit: string }]> = [
    ["7 bultos", { num: 7, unit: "bultos" }],
    ["27.5 m²", { num: 27.5, unit: "m²" }],
    ["1 unidad", { num: 1, unit: "unidad" }],
    ["4 galón(es)", { num: 4, unit: "galón(es)" }],
    ["3   unidades", { num: 3, unit: "unidades" }],
    ["  12 kg  ", { num: 12, unit: "kg" }],
  ];

  // Act
  const obtenidos = casos.map(([entrada]) => parseQuantity(entrada));

  // Assert
  casos.forEach(([entrada, esperado], i) =>
    expect(obtenidos[i], `entrada: ${JSON.stringify(entrada)}`).toStrictEqual(esperado),
  );
});

test("REG-QTY-02", "Acepta coma decimal y cantidades sin unidad", () => {
  // Arrange
  const conComa = "2,5 galón";
  const sinUnidad = "10";

  // Act
  const coma = parseQuantity(conComa);
  const soloNumero = parseQuantity(sinUnidad);

  // Assert
  expect(coma).toStrictEqual({ num: 2.5, unit: "galón" });
  expect(soloNumero).toStrictEqual({ num: 10, unit: "" });
});

test("REG-QTY-03", "Lo que no empieza por número vuelve como 1 unidad del texto original", () => {
  // Arrange
  const texto = "a granel";

  // Act
  const resultado = parseQuantity(texto);

  // Assert
  expect(resultado).toStrictEqual({ num: 1, unit: "a granel" });
});

test("REG-QTY-04", "Una cantidad de cero se trata como 1 para no anular el precio", () => {
  // Arrange
  const cero = "0 kg";

  // Act
  const resultado = parseQuantity(cero);

  // Assert
  expect(resultado).toStrictEqual({ num: 1, unit: "kg" });
});

test("REG-QTY-05", "Una entrada patológica de 50 000 caracteres se resuelve en tiempo lineal", () => {
  // Arrange — espacios internos y un salto de línea obligan a la regex a fallar.
  const patologica = "1" + " ".repeat(50_000) + "x\ny";

  // Act
  const inicio = performance.now();
  const resultado = parseQuantity(patologica);
  const milisegundos = performance.now() - inicio;

  // Assert
  expect(resultado).toStrictEqual({ num: 1, unit: patologica });
  expect(milisegundos).toBeLessThan(250);
});
