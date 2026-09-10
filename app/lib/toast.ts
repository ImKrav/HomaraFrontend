// ============================================
// Homara — Lightweight Event-Based Toast Helper
// ============================================

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

/**
 * Dispara un evento personalizado global para mostrar un Toast.
 * Esto funciona en cualquier Client Component de React sin necesidad de hooks ni context.
 */
let toastCounter = 0;

export function showToast(message: string, type: ToastType = "info", duration = 4000) {
  if (typeof window !== "undefined") {
    const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `toast-${Date.now()}-${++toastCounter}`;
    const detail: ToastItem = {
      id,
      message,
      type,
      duration
    };
    const event = new CustomEvent("homara:toast", { detail });
    window.dispatchEvent(event);
  }
}
