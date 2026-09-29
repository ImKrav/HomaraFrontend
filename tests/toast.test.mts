// app/lib/toast.ts · helper de toasts basado en un CustomEvent global
//
// Patrón AAA en cada caso. El Arrange instala el navegador falso; el Act y el
// Assert viven dentro del try para que el finally siempre restaure los globales.

import { test, expect } from "./harness.mjs";
import { instalarNavegador } from "./helpers.mjs";
import { showToast } from "../app/lib/toast.js";

test("toast-01", "Despacha homara:toast con el detalle completo", () => {
  // Arrange
  const env = instalarNavegador();

  try {
    // Act
    showToast("Guardado", "success", 1000);

    // Assert
    expect(env.eventos.length).toBe(1);
    const ev = env.eventos[0];
    expect(ev.type).toBe("homara:toast");
    expect(ev.detail.message).toBe("Guardado");
    expect(ev.detail.type).toBe("success");
    expect(ev.detail.duration).toBe(1000);
    expect(typeof ev.detail.id).toBe("string");
    expect(ev.detail.id.length).toBeGreaterThan(0);
  } finally {
    env.restaurar();
  }
});

test("toast-02", "Usa tipo 'info' y duración 4000 por defecto", () => {
  // Arrange
  const env = instalarNavegador();

  try {
    // Act
    showToast("Solo mensaje");

    // Assert
    const ev = env.eventos[0];
    expect(ev.detail.type).toBe("info");
    expect(ev.detail.duration).toBe(4000);
  } finally {
    env.restaurar();
  }
});

test("toast-03", "Genera ids distintos en llamados sucesivos", () => {
  // Arrange
  const env = instalarNavegador();

  try {
    // Act
    showToast("a");
    showToast("b");

    // Assert
    expect(env.eventos.length).toBe(2);
    expect(env.eventos[0].detail.id).not.toBe(env.eventos[1].detail.id);
  } finally {
    env.restaurar();
  }
});

test("toast-04", "Sin window (SSR) no hace nada y no lanza", () => {
  // Arrange — no se instala navegador: window queda undefined.
  const hayWindow = typeof (globalThis as any).window;

  // Act
  showToast("nada", "error");

  // Assert
  expect(hayWindow).toBe("undefined");
  // (si showToast lanzara, el caso ya habría fallado en el Act)
});
