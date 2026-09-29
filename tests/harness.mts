// ============================================================================
// Arnés sobre Vitest.
//
// Los archivos `tests/*.test.mts` siguen registrando casos con
// `test(id, desc, fn)`; acá eso se delega a `it()` de Vitest, que además provee
// el runner (paralelo por archivo), watch, filtros y cobertura.
//
//   npx vitest                      # watch
//   npm test                        # run completo
//   npm test -- tests/api.test.mts  # un archivo
//   npm test -- -t api-url-02       # un caso por id
//
// Las aserciones son fluidas (fluent assertions) con el `expect` de Vitest:
//
//   expect(url).toBe("http://localhost:5000/api/v1/products")
//   expect(error).toBeInstanceOf(Error)
//   expect(texto).toContain("38.900")
//
// Acá solo quedan `test` y los capturadores `grab`/`grabSync`, que se usan en
// el Act para que el Assert inspeccione el error con `expect`.
// ============================================================================

import { it } from "vitest";

export { expect, vi, describe, beforeEach, afterEach, beforeAll, afterAll } from "vitest";

export type TestFn = () => void | Promise<void>;

/** Registra un caso en Vitest. El `id` identifica el caso (api-url-02, mat-note-04…). */
export function test(id: string, desc: string, fn: TestFn): void {
  it(`${id}  ${desc}`, fn);
}

// --- Captura de errores ---------------------------------------------------

/** Espera que la promesa rechace y devuelve el error para inspeccionarlo. */
export async function grab(p: Promise<unknown>): Promise<any> {
  try {
    await p;
  } catch (e) {
    return e;
  }
  throw new Error("Se esperaba un error y la operación terminó bien.");
}

/** Espera que la función lance y devuelve el error para inspeccionarlo. */
export function grabSync(fn: () => unknown): any {
  try {
    fn();
  } catch (e) {
    return e;
  }
  throw new Error("Se esperaba un error y la función no lanzó.");
}
