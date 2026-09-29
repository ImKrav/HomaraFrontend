// Soporte de las pruebas de interfaz (no contiene casos; no coincide con el include).
//
// `backendFalso()` reemplaza `fetch` por un backend en memoria: la app usa su
// `api.ts` real y cada ruta responde lo que la prueba programó. `renderizar()`
// monta la pantalla dentro de los mismos proveedores que `app/layout.tsx`.

import React from "react";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "@/app/context/AuthContext";
import { ThemeProvider } from "@/app/context/ThemeContext";
import { LanguageProvider } from "@/app/context/LanguageContext";
import ToastContainer from "@/app/components/ui/Toast";
import { translations } from "@/app/lib/translations";
import { irA } from "./navegacion.mjs";

export interface Llamada {
  metodo: string;
  ruta: string; // sin el prefijo /api/v1 ni la query
  query: URLSearchParams;
  cuerpo: any;
}

/** Respuesta programada: datos (se envuelven en { success, data }) o una función. */
type Programada = unknown | ((l: Llamada) => { status?: number; body: unknown } | unknown);

export interface BackendFalso {
  llamadas: Llamada[];
  /** Llamadas que coinciden con "METODO /ruta". */
  de(clave: string): Llamada[];
  responder(clave: string, respuesta: Programada): void;
  fallar(clave: string, status: number, error: string): void;
}

const CRUDO = Symbol("cuerpo-crudo");

/** Respuesta con el cuerpo tal cual (para endpoints que devuelven campos fuera de `data`). */
export const crudo = (body: unknown) => ({ [CRUDO]: body });

const patron = (clave: string) => {
  const [metodo, ruta] = clave.split(" ");
  return { metodo, re: new RegExp(`^${ruta.replaceAll(/:[^/]+/g, "[^/]+")}$`) };
};

/**
 * Instala un `fetch` falso. Las claves son "METODO /ruta" relativas a /api/v1
 * (por ejemplo "GET /products" o "PUT /cart/items/:id"). Lo no programado
 * responde 404.
 */
export function backendFalso(rutas: Record<string, Programada> = {}): BackendFalso {
  const tabla = new Map<string, Programada>(Object.entries(rutas));
  const fallos = new Map<string, { status: number; error: string }>();
  const llamadas: Llamada[] = [];

  const buscar = (metodo: string, ruta: string) => {
    for (const clave of [...fallos.keys(), ...tabla.keys()]) {
      const p = patron(clave);
      if (p.metodo === metodo && p.re.test(ruta)) return clave;
    }
    return null;
  };

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, opts: RequestInit = {}) => {
      const u = new URL(url, "http://localhost");
      const llamada: Llamada = {
        metodo: (opts.method ?? "GET").toUpperCase(),
        ruta: u.pathname.replace(/^\/api\/v\d+/, ""),
        query: u.searchParams,
        cuerpo: typeof opts.body === "string" ? JSON.parse(opts.body) : undefined,
      };
      llamadas.push(llamada);

      const clave = buscar(llamada.metodo, llamada.ruta);
      let status = 200;
      let body: unknown;
      if (clave === null) {
        status = 404;
        body = { success: false, error: `Sin respuesta programada para ${llamada.metodo} ${llamada.ruta}` };
      } else if (fallos.has(clave)) {
        const f = fallos.get(clave)!;
        status = f.status;
        body = { success: false, error: f.error };
      } else {
        const valor = tabla.get(clave);
        const data = typeof valor === "function" ? (valor as (l: Llamada) => unknown)(llamada) : valor;
        body = data && typeof data === "object" && CRUDO in data ? (data as Record<symbol, unknown>)[CRUDO] : { success: true, data };
      }
      return { ok: status < 400, status, statusText: String(status), json: async () => body } as Response;
    }),
  );

  return {
    llamadas,
    de: (clave) => {
      const p = patron(clave);
      return llamadas.filter((l) => l.metodo === p.metodo && p.re.test(l.ruta));
    },
    responder: (clave, respuesta) => {
      fallos.delete(clave);
      tabla.set(clave, respuesta);
    },
    fallar: (clave, status, error) => fallos.set(clave, { status, error }),
  };
}

export const CLIENTE = {
  id: "usr_001",
  email: "ana@homara.com",
  firstName: "Ana",
  lastName: "Rojas",
  role: "CUSTOMER",
  phone: "3001234567",
  address: "Calle 1 #2-3",
  city: "Bogotá",
  state: "Cundinamarca",
  zipCode: "110111",
  projectCount: 1,
  orderCount: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
};

export const ADMIN = { ...CLIENTE, id: "usr_admin", email: "admin@homara.co", firstName: "Admin", role: "ADMIN" };

/** Deja una sesión iniciada: token guardado y `/users/me` devolviendo al usuario. */
export function conSesion(backend: BackendFalso, usuario: Record<string, unknown> = CLIENTE) {
  localStorage.setItem("homara_token", "token-de-prueba");
  backend.responder("GET /users/me", usuario);
}

/** Texto en español de la interfaz para una clave del diccionario (`"catalog.add_to_cart"`). */
export function es(clave: string): string {
  const valor = clave.split(".").reduce<any>((d, k) => d?.[k], translations.es);
  if (typeof valor !== "string") throw new Error(`Clave de traducción inexistente: ${clave}`);
  return valor;
}

/** Renderiza la pantalla con los proveedores de la app, en la ruta indicada. */
export function renderizar(
  ui: React.ReactElement,
  { ruta = "/", params = {} }: { ruta?: string; params?: Record<string, string> } = {},
) {
  irA(ruta, params);
  const usuario = userEvent.setup();
  const resultado = render(
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          {ui}
          <ToastContainer />
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>,
  );
  return { ...resultado, usuario };
}
