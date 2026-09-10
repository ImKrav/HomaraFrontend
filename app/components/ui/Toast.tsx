"use client";

import { useState, useEffect } from "react";
import { ToastItem } from "@/app/lib/toast";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const handleToastEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ToastItem>;
      if (customEvent.detail) {
        const newToast = customEvent.detail;
        setToasts((prev) => [...prev, newToast]);

        // Auto-remove after duration
        const duration = newToast.duration || 4000;
        setTimeout(() => {
          removeToast(newToast.id);
        }, duration);
      }
    };

    window.addEventListener("homara:toast", handleToastEvent);
    return () => window.removeEventListener("homara:toast", handleToastEvent);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let typeStyles = "";
        let IconComponent: React.ComponentType<{ size?: number; className?: string }> | null = null;
        let iconColor = "";

        switch (toast.type) {
          case "success":
            typeStyles = "border-l-4 border-l-success bg-bg-surface text-text-primary border border-border";
            IconComponent = CheckCircle2;
            iconColor = "text-success";
            break;
          case "error":
            typeStyles = "border-l-4 border-l-error bg-bg-surface text-text-primary border border-border";
            IconComponent = AlertCircle;
            iconColor = "text-error";
            break;
          case "warning":
            typeStyles = "border-l-4 border-l-warning bg-bg-surface text-text-primary border border-border";
            IconComponent = AlertTriangle;
            iconColor = "text-warning";
            break;
          default:
            typeStyles = "border-l-4 border-l-primary bg-bg-surface text-text-primary border border-border";
            IconComponent = Info;
            iconColor = "text-info";
            break;
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 shadow-2xl rounded-none pointer-events-auto transition-all duration-300 transform translate-x-0 animate-slide-in-left ${typeStyles}`}
            role="alert"
          >
            <span className="flex-shrink-0 mt-0.5">
              {IconComponent && <IconComponent size={18} className={iconColor} />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold tracking-wide leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-text-primary hover:bg-bg-surface-light p-1 rounded-none transition-colors mt-0.5 flex-shrink-0"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
