// Componentes · Tarjetas de comercio
// ProductCard · CartItem · OrderSummaryBreakdown

import React from "react";
import ProductCard from "@/app/components/ProductCard";
import CartItemCard from "@/app/components/CartItem";
import OrderSummaryBreakdown from "@/app/components/OrderSummaryBreakdown";
import { productoBase, productoSinStock } from "./datos";
import { formatoCOP, normalizar } from "../support/utilidades";
import { EfectosListos, esperarEfectos } from "./sincronizacion";

describe("Componentes · ProductCard", () => {
  it("CMP-PRD-01 muestra nombre, categoría traducida, precio, precio original y unidad", () => {
    cy.montar(<ProductCard product={productoBase} />);
    cy.contains("h3", productoBase.name).should("be.visible");
    cy.contains("p", "Pisos y Cerámicas").should("be.visible");
    cy.get("span.text-base.font-bold").invoke("text").then((t) => {
      expect(normalizar(t)).to.eq(formatoCOP(75000));
    });
    cy.get("span.line-through").invoke("text").then((t) => expect(normalizar(t)).to.eq(formatoCOP(100000)));
    cy.contains("p", "por m²").should("be.visible");
  });

  it("CMP-PRD-02 calcula el descuento (-25%) y muestra la insignia 'Nuevo'", () => {
    cy.montar(<ProductCard product={productoBase} />);
    cy.contains("span", "-25%").should("have.class", "bg-rose-50");
    cy.contains("span", "Nuevo").should("have.class", "bg-sky-50");
  });

  it("CMP-PRD-03 pinta tantas estrellas como la parte entera del rating y el número de reseñas", () => {
    cy.montar(<ProductCard product={productoBase} />);
    cy.get("svg.text-amber-500").should("have.length", 4);
    cy.contains("(12)").should("be.visible");
  });

  it("CMP-PRD-04 sin stock muestra 'Envío Diferido' y sin precio original no muestra descuento", () => {
    cy.montar(<ProductCard product={productoSinStock} />);
    cy.contains("span", "Envío Diferido").should("have.class", "bg-amber-50");
    cy.get("span.line-through").should("not.exist");
    cy.contains("span", /^-\d+%$/).should("not.exist");
    cy.get("svg.text-amber-500").should("have.length", 2);
  });

  it("CMP-PRD-05 toda la tarjeta enlaza al detalle /catalogo/:id", () => {
    cy.montar(<ProductCard product={productoBase} />);
    cy.get("a").should("have.attr", "href", `/catalogo/${productoBase.id}`);
  });

  it("CMP-PRD-06 en inglés traduce la categoría y la insignia", () => {
    cy.montar(<ProductCard product={productoBase} />, { idioma: "en" });
    cy.contains("p", "Floors & Tiles").should("be.visible");
    cy.contains("span", "New").should("be.visible");
  });
});

describe("Componentes · CartItem", () => {
  it("CMP-CIT-01 muestra nombre, precio unitario, cantidad y subtotal (precio × cantidad)", () => {
    cy.montar(<CartItemCard product={productoBase} quantity={3} />);
    cy.contains("h3", productoBase.name).should("be.visible");
    cy.contains("p", "/ m²").invoke("text").then((t) => expect(normalizar(t)).to.eq(`${formatoCOP(75000)} / m²`));
    cy.get('button[aria-label="+"]').siblings("span").should("have.text", "3");
    cy.contains("span.font-bold", "225").invoke("text").then((t) => expect(normalizar(t)).to.eq(formatoCOP(225000)));
  });

  it("CMP-CIT-02 + incrementa y − decrementa (nunca por debajo de 1) vía onQuantityChange", () => {
    const alCambiar = cy.stub().as("cantidad");
    cy.montar(
      <div>
        <CartItemCard product={productoBase} quantity={2} onQuantityChange={alCambiar} />
        <CartItemCard product={productoSinStock} quantity={1} onQuantityChange={alCambiar} />
      </div>,
    );
    cy.get('button[aria-label="+"]').first().click();
    cy.get("@cantidad").should("have.been.calledWith", 3);
    cy.get('button[aria-label="-"]').first().click();
    cy.get("@cantidad").should("have.been.calledWith", 1);
    cy.get('button[aria-label="-"]').last().click();
    cy.get("@cantidad").its("lastCall.args.0").should("eq", 1);
  });

  it("CMP-CIT-03 el botón Eliminar invoca onRemove", () => {
    const alEliminar = cy.stub().as("eliminar");
    cy.montar(<CartItemCard product={productoBase} quantity={1} onRemove={alEliminar} />);
    cy.get('button[aria-label="Eliminar"]').click();
    cy.get("@eliminar").should("have.been.calledOnce");
  });

  it("CMP-CIT-04 con updatedAt reciente muestra la cuenta regresiva de la reserva (15 min)", () => {
    const ahora = new Date("2026-10-12T15:00:00Z").getTime();
    cy.clock(ahora);
    cy.montar(
      <>
        <CartItemCard product={productoBase} quantity={1} updatedAt={new Date(ahora - 60_000).toISOString()} />
        <EfectosListos />
      </>,
    );
    esperarEfectos();
    cy.tick(10);
    cy.contains("span", "Stock reservado por:").should("contain.text", "14:00");
    cy.tick(1000);
    cy.contains("span", "Stock reservado por:").should("contain.text", "13:59");
    cy.contains("Reservado de stock disponible").should("be.visible");
  });

  it("CMP-CIT-05 con updatedAt de hace más de 15 minutos indica que la reserva expiró", () => {
    cy.montar(
      <CartItemCard product={productoBase} quantity={1} updatedAt={new Date(Date.now() - 20 * 60_000).toISOString()} />,
    );
    cy.contains("Reserva expirada. El stock está libre.").should("be.visible");
  });

  it("CMP-CIT-06 en backorder muestra la cantidad diferida", () => {
    cy.montar(<CartItemCard product={productoSinStock} quantity={5} isBackorder backorderQuantity={3} />);
    cy.contains("span", "Envío diferido: 3 ud").should("be.visible");
  });
});

describe("Componentes · OrderSummaryBreakdown", () => {
  const etiquetas = { subtotal: "Subtotal", shipping: "Envío", freeShipping: "Gratis", total: "Total" };

  it("CMP-OSB-01 muestra subtotal, envío y total con formato COP", () => {
    cy.mount(<OrderSummaryBreakdown subtotal={150000} shippingCost={25000} total={175000} labels={etiquetas} />);
    const filas: [string, number][] = [["Subtotal", 150000], ["Envío", 25000], ["Total", 175000]];
    filas.forEach(([etiqueta, valor]) => {
      cy.contains("span", etiqueta).next().invoke("text").then((t) => expect(normalizar(t)).to.eq(formatoCOP(valor)));
    });
  });

  it("CMP-OSB-02 con envío 0 muestra la etiqueta de envío gratis", () => {
    cy.mount(<OrderSummaryBreakdown subtotal={600000} shippingCost={0} total={600000} labels={etiquetas} />);
    cy.contains("span", "Envío").next().should("have.text", "Gratis");
  });
});
