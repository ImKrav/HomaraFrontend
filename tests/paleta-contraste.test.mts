// tests/paleta-contraste.test.mts · los tokens de color de app/globals.css cumplen WCAG 2.2 AA
//
// Lee la hoja real (no una copia): si alguien cambia un token y rompe el contraste, falla aquí.
// Patrón AAA en cada caso: Arrange / Act / Assert.

import { readFileSync } from "node:fs";
import { test, expect } from "./harness.mjs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** Extrae `--token: #RRGGBB;` de un bloque de nivel superior (`:root {…}` o `.dark {…}`). */
function tokens(selector: string): Record<string, string> {
  const bloque = new RegExp(String.raw`^${selector.replace(".", "\\.")} \{([\s\S]*?)^\}`, "m").exec(css)?.[1] ?? "";
  return Object.fromEntries([...bloque.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\b/g)].map((m) => [m[1], m[2]]));
}

const claro = tokens(":root");
const oscuro = { ...claro, ...tokens(".dark") };

const luminancia = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const razon = (a: string, b: string) => {
  const [claroL, oscuroL] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claroL + 0.05) / (oscuroL + 0.05);
};

/** Mezcla `fg` con opacidad `alfa` sobre `bg` (lo que hace `text-x/85` de Tailwind sobre un relleno). */
const mezcla = (fg: string, bg: string, alfa: number) =>
  "#" +
  [1, 3, 5]
    .map((i) => Math.round(Number.parseInt(fg.slice(i, i + 2), 16) * alfa + Number.parseInt(bg.slice(i, i + 2), 16) * (1 - alfa)))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");

const temas = { claro, oscuro } as const;
const superficies = ["bg-base", "bg-surface", "bg-surface-light", "bg-surface-hover"] as const;

test("pal-01", "el parser encuentra los tokens clave en ambos temas", () => {
  // Arrange
  const claves = ["primary", "secondary", "bg-base", "text-primary", "border-strong", "error"];

  // Act / Assert
  for (const [nombre, tema] of Object.entries(temas)) {
    for (const k of claves) expect(tema[k], `${nombre}: falta --${k}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
  }
});

for (const [nombre, tema] of Object.entries(temas)) {
  test(`pal-02-${nombre}`, `${nombre}: texto sobre cada superficie ≥ AA (principal ≥ 7, secundario y atenuado ≥ 4.5)`, () => {
    // Arrange
    const reglas = [["text-primary", 7], ["text-secondary", 4.5], ["text-muted", 4.5]] as const;

    // Act
    const fallos = superficies.flatMap((s) =>
      reglas.filter(([t, min]) => razon(tema[t], tema[s]) < min).map(([t, min]) => `${t} sobre ${s} (${razon(tema[t], tema[s]).toFixed(2)} < ${min})`),
    );

    // Assert
    expect(fallos).toEqual([]);
  });

  test(`pal-03-${nombre}`, `${nombre}: marca y estados legibles como texto (≥ 4.5) sobre base, tarjeta y arena`, () => {
    // Arrange
    const colores = ["primary", "success", "error", "warning", "info"] as const;

    // Act
    const fallos = colores.flatMap((c) =>
      (["bg-base", "bg-surface", "bg-surface-light"] as const)
        .filter((s) => razon(tema[c], tema[s]) < 4.5)
        .map((s) => `${c} sobre ${s} (${razon(tema[c], tema[s]).toFixed(2)})`),
    );

    // Assert
    expect(fallos).toEqual([]);
  });

  test(`pal-04-${nombre}`, `${nombre}: el patrón "bg-primary text-bg-base" y su hover cumplen ≥ 4.5`, () => {
    // Arrange / Act
    const normal = razon(tema["bg-base"], tema["primary"]);
    const hover = razon(tema["bg-base"], tema["primary-dark"]);

    // Assert
    expect(normal).toBeGreaterThanOrEqual(4.5);
    expect(hover).toBeGreaterThanOrEqual(4.5);
  });

  test(`pal-05-${nombre}`, `${nombre}: la banda de abeto lleva texto ≥ 7 y subtexto al 85 % ≥ 4.5`, () => {
    // Arrange / Act
    const titulo = razon(tema["on-secondary"], tema["secondary"]);
    const subtexto = razon(mezcla(tema["on-secondary"], tema["secondary"], 0.85), tema["secondary"]);

    // Assert
    expect(titulo).toBeGreaterThanOrEqual(7);
    expect(subtexto).toBeGreaterThanOrEqual(4.5);
  });

  test(`pal-06-${nombre}`, `${nombre}: foco, borde de campo y estrellas cumplen ≥ 3 (WCAG 1.4.11)`, () => {
    // Arrange
    const pares = [
      ["primary", "bg-base"], ["primary", "bg-surface"],
      ["border-strong", "bg-base"], ["border-strong", "bg-surface"],
      ["accent", "bg-surface"], ["accent", "bg-surface-light"],
    ] as const;

    // Act
    const fallos = pares.filter(([a, b]) => razon(tema[a], tema[b]) < 3).map(([a, b]) => `${a} sobre ${b} (${razon(tema[a], tema[b]).toFixed(2)})`);

    // Assert
    expect(fallos).toEqual([]);
  });
}
