import { useEffect, useRef } from "react";

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Teclado y foco de un diálogo modal (WCAG 2.1.2 / 2.4.3): al abrir lleva el foco adentro (al primer campo,
 * o al primer control), mantiene Tab dentro, Escape cierra y al cerrar devuelve el foco a quien lo abrió.
 * Va junto a role="dialog" aria-modal="true" aria-labelledby en el contenedor que recibe `ref`.
 */
export function useDialog<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  const cerrar = useRef(onClose);
  useEffect(() => {
    cerrar.current = onClose;
  });

  useEffect(() => {
    const dialogo = ref.current;
    if (!open || !dialogo) return;
    const disparador = document.activeElement as HTMLElement | null;
    const enfocables = () => [...dialogo.querySelectorAll<HTMLElement>(ENFOCABLES)];

    const campo = dialogo.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select');
    (campo ?? enfocables()[0] ?? dialogo).focus();

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cerrar.current();
        return;
      }
      if (e.key !== "Tab") return;
      const lista = enfocables();
      if (lista.length === 0) {
        e.preventDefault();
        return;
      }
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const dentro = dialogo.contains(document.activeElement);
      if (e.shiftKey && (!dentro || document.activeElement === primero)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (!dentro || document.activeElement === ultimo)) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      if (disparador?.isConnected) disparador.focus();
    };
  }, [open]);

  return ref;
}
