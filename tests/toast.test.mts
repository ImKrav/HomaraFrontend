// app/lib/toast.ts · helper de toasts basado en un CustomEvent global

import { test, is, ok } from "./harness.mjs";
import { instalarNavegador } from "./helpers.mjs";
import { showToast } from "../app/lib/toast.js";

test("toast-01", "Despacha homara:toast con el detalle completo", () => {
  const env = instalarNavegador();
  try {
    showToast("Guardado", "success", 1000);

    is(env.eventos.length, 1);
    const ev = env.eventos[0];
    is(ev.type, "homara:toast");
    is(ev.detail.message, "Guardado");
    is(ev.detail.type, "success");
    is(ev.detail.duration, 1000);
    is(typeof ev.detail.id, "string");
    ok(ev.detail.id.length > 0);
  } finally {
    env.restaurar();
  }
});

test("toast-02", "Usa tipo 'info' y duración 4000 por defecto", () => {
  const env = instalarNavegador();
  try {
    showToast("Solo mensaje");

    const ev = env.eventos[0];
    is(ev.detail.type, "info");
    is(ev.detail.duration, 4000);
  } finally {
    env.restaurar();
  }
});

test("toast-03", "Genera ids distintos en llamados sucesivos", () => {
  const env = instalarNavegador();
  try {
    showToast("a");
    showToast("b");
    is(env.eventos.length, 2);
    ok(env.eventos[0].detail.id !== env.eventos[1].detail.id);
  } finally {
    env.restaurar();
  }
});

test("toast-04", "Sin window (SSR) no hace nada y no lanza", () => {
  // No se instala navegador: window queda undefined.
  is(typeof (globalThis as any).window, "undefined");
  showToast("nada", "error");
  ok(true); // llegó hasta acá sin excepción
});
