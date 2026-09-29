// Doble de `next/navigation` compartido entre el setup y las pruebas de interfaz.
// El setup mockea el módulo con estas funciones; las pruebas leen `router.push`
// y fijan la ruta actual con `irA()`.

import { vi } from "vitest";

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

let rutaActual = "/";
let busqueda = new URLSearchParams();
let parametros: Record<string, string> = {};

/** Fija la ruta, la query y los parámetros dinámicos (`useParams()`) de la pantalla. */
export function irA(ruta: string, params: Record<string, string> = {}) {
  const [path, query = ""] = ruta.split("?");
  rutaActual = path;
  busqueda = new URLSearchParams(query);
  parametros = params;
}

export function reiniciarNavegacion() {
  for (const fn of Object.values(router)) fn.mockReset();
  irA("/");
}

export const moduloNavegacion = {
  useRouter: () => router,
  usePathname: () => rutaActual,
  useSearchParams: () => busqueda,
  useParams: () => parametros,
  redirect: vi.fn(),
  notFound: vi.fn(),
};
