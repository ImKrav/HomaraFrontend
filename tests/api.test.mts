// app/lib/api.ts · cliente HTTP unificado (apiFetch + api.{get,post,put,delete})

import { test, is, ok, eq, has, grab } from "./harness.mjs";
import { instalarNavegador, instalarFetch, type Entorno } from "./helpers.mjs";

// El módulo lee NEXT_PUBLIC_API_URL una sola vez al cargar: fijarlo antes.
process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000/api/v1";
const { apiFetch, api } = await import("../app/lib/api.js");

const BASE = "http://localhost:5000/api/v1";

/** Corre `fn` con navegador y fetch falsos instalados, y limpia al final. */
async function conEntorno(
  opciones: { token?: string; respuesta?: Parameters<typeof instalarFetch>[0] },
  fn: (ctx: { fetch: ReturnType<typeof instalarFetch>; env: Entorno }) => Promise<void> | void,
) {
  const env = instalarNavegador(opciones.token ? { homara_token: opciones.token } : {});
  const fetchFalso = instalarFetch(opciones.respuesta ?? (() => ({ body: { ok: true } })));
  try {
    await fn({ fetch: fetchFalso, env });
  } finally {
    env.restaurar();
  }
}

const urlLlamada = (f: ReturnType<typeof instalarFetch>) => f.calls[0][0] as string;
const optsLlamada = (f: ReturnType<typeof instalarFetch>) => f.calls[0][1] as RequestInit & { headers: Headers };

// --- Construcción de URL ---------------------------------------------

test("api-url-01", "Une el endpoint relativo con NEXT_PUBLIC_API_URL", async () => {
  await conEntorno({}, async ({ fetch }) => {
    await api.get("/products");
    is(urlLlamada(fetch), `${BASE}/products`);
  });
});

test("api-url-02", "Quita el prefijo de versión /api/v1/ hardcodeado en el llamador", async () => {
  await conEntorno({}, async ({ fetch }) => {
    await apiFetch("/api/v1/products");
    is(urlLlamada(fetch), `${BASE}/products`);
  });
});

test("api-url-03", "Quita cualquier /api/vN/ (ej. /api/v2/)", async () => {
  await conEntorno({}, async ({ fetch }) => {
    await apiFetch("/api/v2/orders/42");
    is(urlLlamada(fetch), `${BASE}/orders/42`);
  });
});

test("api-url-04", "Quita el prefijo /api/ sin versión", async () => {
  await conEntorno({}, async ({ fetch }) => {
    await apiFetch("/api/cart");
    is(urlLlamada(fetch), `${BASE}/cart`);
  });
});

test("api-url-05", "Agrega la barra inicial si el endpoint no la trae", async () => {
  await conEntorno({}, async ({ fetch }) => {
    await apiFetch("products");
    is(urlLlamada(fetch), `${BASE}/products`);
  });
});

test("api-url-06", "Deja pasar una URL absoluta sin tocarla", async () => {
  await conEntorno({}, async ({ fetch }) => {
    await apiFetch("https://cdn.ejemplo.com/data.json");
    is(urlLlamada(fetch), "https://cdn.ejemplo.com/data.json");
  });
});

// --- Cabeceras ------------------------------------------------------

test("api-hdr-01", "Pone Content-Type application/json cuando hay cuerpo", async () => {
  await conEntorno({}, async ({ fetch }) => {
    await api.post("/reviews", { rating: 5 });
    is(optsLlamada(fetch).headers.get("Content-Type"), "application/json");
    is(optsLlamada(fetch).body, JSON.stringify({ rating: 5 }));
  });
});

test("api-hdr-02", "No pone Content-Type en peticiones sin cuerpo", async () => {
  await conEntorno({}, async ({ fetch }) => {
    await api.get("/products");
    is(optsLlamada(fetch).headers.get("Content-Type"), null);
  });
});

test("api-hdr-03", "Respeta un Content-Type explícito del llamador", async () => {
  await conEntorno({}, async ({ fetch }) => {
    await apiFetch("/upload", { method: "POST", body: "x", headers: { "Content-Type": "text/plain" } });
    is(optsLlamada(fetch).headers.get("Content-Type"), "text/plain");
  });
});

test("api-hdr-04", "Adjunta el token JWT de localStorage como Bearer", async () => {
  await conEntorno({ token: "tok_123" }, async ({ fetch }) => {
    await api.get("/cuenta");
    is(optsLlamada(fetch).headers.get("Authorization"), "Bearer tok_123");
  });
});

test("api-hdr-05", "No manda Authorization si no hay token guardado", async () => {
  await conEntorno({}, async ({ fetch }) => {
    await api.get("/products");
    is(optsLlamada(fetch).headers.get("Authorization"), null);
  });
});

// --- Respuestas y errores -----------------------------------------

test("api-res-01", "Devuelve el JSON parseado cuando la respuesta es OK", async () => {
  await conEntorno({ respuesta: () => ({ body: { data: [1, 2, 3] } }) }, async () => {
    const r = await api.get("/products");
    eq(r, { data: [1, 2, 3] });
  });
});

test("api-res-02", "Lanza con el mensaje del campo `error` del cuerpo en respuesta no OK", async () => {
  await conEntorno({ respuesta: () => ({ status: 400, body: { error: "Carrito vacío" } }) }, async () => {
    const e = await grab(api.post("/orders", {}));
    is((e as Error).message, "Carrito vacío");
  });
});

test("api-res-03", "Lanza con mensaje genérico si el cuerpo de error no es JSON", async () => {
  await conEntorno(
    { respuesta: () => ({ status: 500, statusText: "Internal Server Error", bodyNoEsJson: true }) },
    async () => {
      const e = await grab(api.get("/products"));
      has((e as Error).message, "500");
      has((e as Error).message, "Internal Server Error");
    },
  );
});

test("api-res-04", "En 401 borra el token y despacha el evento auth:401", async () => {
  await conEntorno(
    { token: "tok_viejo", respuesta: () => ({ status: 401, body: { error: "no autorizado" } }) },
    async ({ env }) => {
      const e = await grab(api.get("/cuenta"));
      is((e as Error).message, "no autorizado");
      is(env.store.has("homara_token"), false);
      is(env.eventos.length, 1);
      is(env.eventos[0].type, "auth:401");
    },
  );
});

test("api-res-05", "En error que no es 401 no toca el token ni despacha evento", async () => {
  await conEntorno(
    { token: "tok_vivo", respuesta: () => ({ status: 500, body: { error: "boom" } }) },
    async ({ env }) => {
      await grab(api.get("/products"));
      is(env.store.get("homara_token"), "tok_vivo");
      is(env.eventos.length, 0);
    },
  );
});

// --- Verbos ------------------------------------------------------

test("api-verbo-01", "api.put manda método PUT y cuerpo serializado", async () => {
  await conEntorno({}, async ({ fetch }) => {
    await api.put("/projects/1", { name: "Cocina" });
    is(optsLlamada(fetch).method, "PUT");
    is(optsLlamada(fetch).body, JSON.stringify({ name: "Cocina" }));
  });
});

test("api-verbo-02", "api.delete manda método DELETE sin cuerpo", async () => {
  await conEntorno({}, async ({ fetch }) => {
    await api.delete("/cart/items/9");
    is(optsLlamada(fetch).method, "DELETE");
    ok(!optsLlamada(fetch).body);
  });
});
