"use client";

import { useState, useEffect, useCallback } from "react";
import { ToastItem, ToastType } from "@/app/lib/toast";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

const ESTILOS: Record<ToastType, { borde: string; Icono: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  success: { borde: "border-l-4 border-l-success", Icono: CheckCircle2, color: "text-success" },
  error: { borde: "border-l-4 border-l-error", Icono: AlertCircle, color: "text-error" },
  warning: { borde: "border-l-4 border-l-warning", Icono: AlertTriangle, color: "text-warning" },
  info: { borde: "border-l-4 border-l-primary", Icono: Info, color: "text-info" },
};

const SALIDA_MS = 180; // = --animate-toast-out en globals.css

function ToastCard({ toast, onRemove }: Readonly<{ toast: ToastItem; onRemove: (id: string) => void }>) {
  const [saliendo, setSaliendo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const { borde, Icono, color } = ESTILOS[toast.type] ?? ESTILOS.info;

  // Cierre automático. Pasar el ratón o enfocar el aviso lo pausa: hay tiempo para leerlo (WCAG 2.2.1).
  useEffect(() => {
    if (pausado || saliendo) return;
    const id = setTimeout(() => setSaliendo(true), toast.duration || 4000);
    return () => clearTimeout(id);
  }, [pausado, saliendo, toast.duration]);

  // La salida se anima y luego se desmonta; el temporizador no depende de `animationend` (no dispara sin animación).
  useEffect(() => {
    if (!saliendo) return;
    const id = setTimeout(() => onRemove(toast.id), SALIDA_MS);
    return () => clearTimeout(id);
  }, [saliendo, onRemove, toast.id]);

  return (
    <div
      className={`flex items-start gap-3 p-4 shadow-2xl rounded-none pointer-events-auto bg-bg-surface text-text-primary border border-border ${borde} ${
        saliendo ? "animate-toast-out" : "animate-slide-in-left"
      }`}
      role="alert"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <span className="flex-shrink-0 mt-0.5">
        <Icono size={18} className={color} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold tracking-wide leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => setSaliendo(true)}
        className="text-text-muted hover:text-text-primary hover:bg-bg-surface-light p-2 -m-1 rounded-none transition-colors duration-150 flex-shrink-0 cursor-pointer"
        aria-label="Cerrar"
      >
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToastEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ToastItem>;
      if (customEvent.detail) {
        const newToast = customEvent.detail;
        setToasts((prev) => [...prev, newToast]);
      }
    };

    window.addEventListener("homara:toast", handleToastEvent);
    return () => window.removeEventListener("homara:toast", handleToastEvent);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
