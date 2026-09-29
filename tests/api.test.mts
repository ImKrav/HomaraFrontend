// app/lib/api.ts · cliente HTTP unificado (apiFetch + api.{get,post,put,delete})
//
// Patrón AAA en cada caso. El Arrange es `conEntorno`, que instala el navegador
// y el `fetch` falsos y los restaura al terminar; dentro del callback van el
// Act (la llamada al cliente) y el Assert.

import { test, expect, grab, vi } from "./harness.mjs";
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
    vi.unstubAllGlobals();
  }
}

const urlLlamada = (f: ReturnType<typeof instalarFetch>) => f.mock.calls[0][0] as string;
const optsLlamada = (f: ReturnType<typeof instalarFetch>) => f.mock.calls[0][1] as RequestInit & { headers: Headers };

// --- Construcción de URL ---------------------------------------------

test("api-url-01", "Une el endpoint relativo con NEXT_PUBLIC_API_URL", async () => {
  // Arrange
  await conEntorno({}, async ({ fetch }) => {
    // Act
    await api.get("/products");

    // Assert
    expect(urlLlamada(fetch)).toBe(`${BASE}/products`);
  });
});

test("api-url-02", "Quita el prefijo de versión /api/v1/ hardcodeado en el llamador", async () => {
  // Arrange
  await conEntorno({}, async ({ fetch }) => {
    // Act
    await apiFetch("/api/v1/products");

    // Assert
    expect(urlLlamada(fetch)).toBe(`${BASE}/products`);
  });
});

test("api-url-03", "Quita cualquier /api/vN/ (ej. /api/v2/)", async () => {
  // Arrange
  await conEntorno({}, async ({ fetch }) => {
    // Act
    await apiFetch("/api/v2/orders/42");

    // Assert
    expect(urlLlamada(fetch)).toBe(`${BASE}/orders/42`);
  });
});

test("api-url-04", "Quita el prefijo /api/ sin versión", async () => {
  // Arrange
  await conEntorno({}, async ({ fetch }) => {
    // Act
    await apiFetch("/api/cart");

    // Assert
    expect(urlLlamada(fetch)).toBe(`${BASE}/cart`);
  });
});

test("api-url-05", "Agrega la barra inicial si el endpoint no la trae", async () => {
  // Arrange
  await conEntorno({}, async ({ fetch }) => {
    // Act
    await apiFetch("products");

    // Assert
    expect(urlLlamada(fetch)).toBe(`${BASE}/products`);
  });
});

test("api-url-06", "Deja pasar una URL absoluta sin tocarla", async () => {
  // Arrange
  await conEntorno({}, async ({ fetch }) => {
    // Act
    await apiFetch("https://cdn.ejemplo.com/data.json");

    // Assert
    expect(urlLlamada(fetch)).toBe("https://cdn.ejemplo.com/data.json");
  });
});

// --- Cabeceras ------------------------------------------------------

test("api-hdr-01", "Pone Content-Type application/json cuando hay cuerpo", async () => {
  // Arrange
  await conEntorno({}, async ({ fetch }) => {
    // Act
    await api.post("/reviews", { rating: 5 });

    // Assert
    expect(optsLlamada(fetch).headers.get("Content-Type")).toBe("application/json");
    expect(optsLlamada(fetch).body).toBe(JSON.stringify({ rating: 5 }));
  });
});

test("api-hdr-02", "No pone Content-Type en peticiones sin cuerpo", async () => {
  // Arrange
  await conEntorno({}, async ({ fetch }) => {
    // Act
    await api.get("/products");

    // Assert
    expect(optsLlamada(fetch).headers.get("Content-Type")).toBe(null);
  });
});

test("api-hdr-03", "Respeta un Content-Type explícito del llamador", async () => {
  // Arrange
  await conEntorno({}, async ({ fetch }) => {
    // Act
    await apiFetch("/upload", { method: "POST", body: "x", headers: { "Content-Type": "text/plain" } });

    // Assert
    expect(optsLlamada(fetch).headers.get("Content-Type")).toBe("text/plain");
  });
});

test("api-hdr-04", "Adjunta el token JWT de localStorage como Bearer", async () => {
  // Arrange
  await conEntorno({ token: "tok_123" }, async ({ fetch }) => {
    // Act
    await api.get("/cuenta");

    // Assert
    expect(optsLlamada(fetch).headers.get("Authorization")).toBe("Bearer tok_123");
  });
});

test("api-hdr-05", "No manda Authorization si no hay token guardado", async () => {
  // Arrange
  await conEntorno({}, async ({ fetch }) => {
    // Act
    await api.get("/products");

    // Assert
    expect(optsLlamada(fetch).headers.get("Authorization")).toBe(null);
  });
});

// --- Respuestas y errores -----------------------------------------

test("api-res-01", "Devuelve el JSON parseado cuando la respuesta es OK", async () => {
  // Arrange
  await conEntorno({ respuesta: () => ({ body: { data: [1, 2, 3] } }) }, async () => {
    // Act
    const r = await api.get("/products");

    // Assert
    expect(r).toStrictEqual({ data: [1, 2, 3] });
  });
});

test("api-res-02", "Lanza con el mensaje del campo `error` del cuerpo en respuesta no OK", async () => {
  // Arrange
  await conEntorno({ respuesta: () => ({ status: 400, body: { error: "Carrito vacío" } }) }, async () => {
    // Act
    const e = await grab(api.post("/orders", {}));

    // Assert
    expect((e as Error).message).toBe("Carrito vacío");
  });
});

test("api-res-03", "Lanza con mensaje genérico si el cuerpo de error no es JSON", async () => {
  // Arrange
  await conEntorno(
    { respuesta: () => ({ status: 500, statusText: "Internal Server Error", bodyNoEsJson: true }) },
    async () => {
      // Act
      const e = await grab(api.get("/products"));

      // Assert
      expect((e as Error).message).toContain("500");
      expect((e as Error).message).toContain("Internal Server Error");
    },
  );
});

test("api-res-04", "En 401 borra el token y despacha el evento auth:401", async () => {
  // Arrange
  await conEntorno(
    { token: "tok_viejo", respuesta: () => ({ status: 401, body: { error: "no autorizado" } }) },
    async ({ env }) => {
      // Act
      const e = await grab(api.get("/cuenta"));

      // Assert
      expect((e as Error).message).toBe("no autorizado");
      expect(env.store.has("homara_token")).toBe(false);
      expect(env.eventos.length).toBe(1);
      expect(env.eventos[0].type).toBe("auth:401");
    },
  );
});

test("api-res-05", "En error que no es 401 no toca el token ni despacha evento", async () => {
  // Arrange
  await conEntorno(
    { token: "tok_vivo", respuesta: () => ({ status: 500, body: { error: "boom" } }) },
    async ({ env }) => {
      // Act
      await grab(api.get("/products"));

      // Assert
      expect(env.store.get("homara_token")).toBe("tok_vivo");
      expect(env.eventos.length).toBe(0);
    },
  );
});

// --- Verbos ------------------------------------------------------

test("api-verbo-01", "api.put manda método PUT y cuerpo serializado", async () => {
  // Arrange
  await conEntorno({}, async ({ fetch }) => {
    // Act
    await api.put("/projects/1", { name: "Cocina" });

    // Assert
    expect(optsLlamada(fetch).method).toBe("PUT");
    expect(optsLlamada(fetch).body).toBe(JSON.stringify({ name: "Cocina" }));
  });
});

test("api-verbo-02", "api.delete manda método DELETE sin cuerpo", async () => {
  // Arrange
  await conEntorno({}, async ({ fetch }) => {
    // Act
    await api.delete("/cart/items/9");

    // Assert
    expect(optsLlamada(fetch).method).toBe("DELETE");
    expect(optsLlamada(fetch).body).toBeUndefined();
  });
});
