// ============================================
// Homara — Unified Frontend API Client
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

/**
 * Realiza una petición fetch unificada al backend de Homara.
 * La sesión viaja en la cookie HttpOnly `homara_session` que emite el backend (DEF-SEG-FE-02):
 * ningún script de la página puede leer el token.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  let cleanEndpoint = endpoint;

  let url: string;
  if (cleanEndpoint.startsWith("http")) {
    url = cleanEndpoint;
  } else {
    // Remover dinámicamente prefijos de versión obsoletos o hardcodeados en el frontend (ej. /api/v1/, /api/v2/, /api/)
    // de modo que todas las peticiones se vuelvan relativas al NEXT_PUBLIC_API_URL configurado en el .env
    cleanEndpoint = cleanEndpoint.replace(/^\/api\/v\d+\//, "/").replace(/^\/api\//, "/");

    if (!cleanEndpoint.startsWith("/")) {
      cleanEndpoint = "/" + cleanEndpoint;
    }
    
    const baseUrl = API_BASE_URL.replace(/\/$/, "");
    url = `${baseUrl}${cleanEndpoint}`;
  }
  
  // Clonar y preparar las cabeceras
  const headers = new Headers(options.headers || {});
  
  // Agregar Content-Type por defecto si es una petición con cuerpo y no está especificado
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    credentials: "include", // envía la cookie también si NEXT_PUBLIC_API_URL apunta a otro puerto del mismo sitio
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Error de API: ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.error || errorMessage;
    } catch {
      // Ignorar fallo de parseo de JSON
    }
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:401"));
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Atajos semánticos para peticiones HTTP
 */
export const api = {
  get: (endpoint: string, options?: RequestInit) => 
    apiFetch(endpoint, { method: "GET", ...options }),
    
  post: <T = unknown>(endpoint: string, body: T, options?: RequestInit) => 
    apiFetch(endpoint, { 
      method: "POST", 
      body: JSON.stringify(body), 
      ...options 
    }),
    
  put: <T = unknown>(endpoint: string, body: T, options?: RequestInit) => 
    apiFetch(endpoint, { 
      method: "PUT", 
      body: JSON.stringify(body), 
      ...options 
    }),
    
  delete: (endpoint: string, options?: RequestInit) => 
    apiFetch(endpoint, { method: "DELETE", ...options })
};
