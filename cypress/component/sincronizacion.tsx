// Sincronización con los efectos de React en Component Testing.
//
// En el iframe de Cypress los efectos pasivos (useEffect) pueden ejecutarse
// varios cientos de ms después del primer render. Los componentes que registran
// listeners o temporizadores en un efecto (Toast, CartItem) necesitan que ese
// efecto ya haya corrido antes de que la prueba actúe. Este marcador se monta
// como último hermano: React ejecuta los efectos del mismo commit en orden, así
// que cuando aparece `[data-efectos-listos]` los efectos anteriores ya corrieron.
// Así se evita cualquier cy.wait(ms).
import React, { useEffect, useRef } from "react";

export function EfectosListos() {
  const ref = useRef<HTMLSpanElement>(null);
  // Se marca el DOM directamente desde el efecto (sin setState dentro del efecto).
  useEffect(() => {
    ref.current?.setAttribute("data-efectos-listos", "");
  }, []);
  return <span ref={ref} hidden />;
}

export const esperarEfectos = () => cy.get("[data-efectos-listos]", { timeout: 10000 }).should("exist");
