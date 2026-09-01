// ============================================================================
// Dobles de prueba para el frontend — sin framework, sin jsdom.
//
// El código de `app/lib/` toca globales del navegador (`window`,
// `localStorage`, `fetch`). Acá hay fakes mínimos hechos a mano que se
// instalan en `globalThis` para el caso que los necesita.
// ============================================================================

import { deepStrictEqual } from "node:assert/strict";

// --- Spy artesanal (igual que en el backend) ---------------------------

export interface Spy {
  (...args: any[]): any;
  calls: any[][];
  returns(v: any): Spy;
  resolves(v: any): Spy;
  rejects(e: any): Spy;
  does(f: (...a: any[]) => any): Spy;
  reset(): Spy;
}

export function spy(impl?: (...a: any[]) => any): Spy {
  let base = impl;
  const s = ((...args: any[]) => {
    s.calls.push(args);
    return base ? base(...args) : undefined;
  }) as Spy;
  s.calls = [];
  s.returns = (v) => ((base = () => v), s);
  s.resolves = (v) => ((base = async () => v), s);
  s.rejects = (e) => ((base = async () => { throw e; }), s);
  s.does = (f) => ((base = f), s);
  s.reset = () => ((s.calls = []), (base = impl), s);
  return s;
}

export const calledWith = (s: Spy, ...esperados: any[]): boolean =>
  s.calls.some((c) => {
    try {
      deepStrictEqual(c, esperados);
      return true;
    } catch {
      return false;
    }
  });

// --- localStorage falso ----------------------------------------------

export function fakeLocalStorage(inicial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(inicial));
  return {
    store,
    ls: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() {
        return store.size;
      },
    },
  };
}

// --- window falso + instalación de globales -------------------------

export interface Entorno {
  store: Map<string, string>;
  eventos: any[]; // eventos despachados por window.dispatchEvent
  restaurar(): void;
}

/**
 * Instala `window` y `localStorage` en `globalThis`. Devuelve el store y la
 * lista de eventos despachados. Llamar `restaurar()` al terminar el caso.
 */
export function instalarNavegador(lsInicial: Record<string, string> = {}): Entorno {
  const { store, ls } = fakeLocalStorage(lsInicial);
  const eventos: any[] = [];
  const listeners = new Map<string, Array<(e: any) => void>>();

  const win: any = {
    localStorage: ls,
    addEventListener(tipo: string, cb: (e: any) => void) {
      const arr = listeners.get(tipo) ?? [];
      arr.push(cb);
      listeners.set(tipo, arr);
    },
    removeEventListener(tipo: string, cb: (e: any) => void) {
      listeners.set(tipo, (listeners.get(tipo) ?? []).filter((f) => f !== cb));
    },
    dispatchEvent(ev: any) {
      eventos.push(ev);
      for (const cb of listeners.get(ev.type) ?? []) cb(ev);
      return true;
    },
  };

  const g = globalThis as any;
  const previo = { window: g.window, localStorage: g.localStorage };
  g.window = win;
  g.localStorage = ls;

  return {
    store,
    eventos,
    restaurar() {
      g.window = previo.window;
      g.localStorage = previo.localStorage;
    },
  };
}

// --- fetch falso ---------------------------------------------------

export interface RespuestaFalsa {
  status?: number;
  ok?: boolean;
  statusText?: string;
  body?: unknown;
  /** Si es true, `.json()` lanza (simula respuesta no-JSON). */
  bodyNoEsJson?: boolean;
}

/**
 * Reemplaza `globalThis.fetch` por un doble. `handler` recibe (url, opts) y
 * decide la respuesta. Devuelve el spy con `.calls` para inspeccionar.
 */
export function instalarFetch(handler: (url: string, opts: any) => RespuestaFalsa = () => ({})): Spy {
  const fn = spy(async (url: string, opts: any) => {
    const r = handler(url, opts) ?? {};
    const status = r.status ?? 200;
    return {
      ok: r.ok ?? (status >= 200 && status < 300),
      status,
      statusText: r.statusText ?? "",
      json: async () => {
        if (r.bodyNoEsJson) throw new SyntaxError("respuesta no es JSON");
        return r.body;
      },
    };
  });
  (globalThis as any).fetch = fn;
  return fn;
}

/** Traductor identidad: devuelve la clave tal cual (simula "clave no encontrada"). */
export const tIdentidad = (k: string) => k;

/** Traductor de diccionario: devuelve el valor si existe, si no la clave. */
export const tDiccionario =
  (dict: Record<string, string>) =>
  (k: string): string =>
    k in dict ? dict[k] : k;
