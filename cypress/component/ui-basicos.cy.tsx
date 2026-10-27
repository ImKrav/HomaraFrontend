// Componentes · Primitivas de UI (app/components/ui)
// Button · Input · Badge · Card · SearchInput

import React, { useState } from "react";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Badge from "@/app/components/ui/Badge";
import Card from "@/app/components/ui/Card";
import SearchInput from "@/app/components/ui/SearchInput";

describe("Componentes · Button", () => {
  it("CMP-BTN-01 renderiza el texto, es type=button por defecto y usa la variante primary", () => {
    cy.mount(<Button>Guardar</Button>);
    cy.contains("button", "Guardar")
      .should("have.attr", "type", "button")
      .and("have.class", "bg-primary")
      .and("have.class", "px-6");
  });

  it("CMP-BTN-02 invoca onClick una vez por clic", () => {
    const alHacerClic = cy.stub().as("clic");
    cy.mount(<Button onClick={alHacerClic}>Comprar</Button>);
    cy.contains("button", "Comprar").click().click();
    cy.get("@clic").should("have.been.calledTwice");
  });

  it("CMP-BTN-03 deshabilitado: atributo disabled, estilos y no dispara onClick", () => {
    const alHacerClic = cy.stub().as("clic");
    cy.mount(<Button onClick={alHacerClic} disabled>Pagar</Button>);
    cy.contains("button", "Pagar").should("be.disabled").and("have.class", "opacity-50");
    cy.contains("button", "Pagar").click({ force: true });
    cy.get("@clic").should("not.have.been.called");
  });

  it("CMP-BTN-04 con href se renderiza como enlace <a> y aplica tamaño y ancho completo", () => {
    cy.mount(<Button href="/catalogo" size="lg" fullWidth variant="outline" id="ir">Ver catálogo</Button>);
    cy.get("a#ir")
      .should("have.attr", "href", "/catalogo")
      .and("have.class", "w-full")
      .and("have.class", "px-8")
      .and("have.class", "border-border");
    cy.get("button").should("not.exist");
  });

  it("CMP-BTN-05 type=submit envía el formulario que lo contiene", () => {
    const alEnviar = cy.stub().as("enviar");
    cy.mount(
      <form onSubmit={(e) => { e.preventDefault(); alEnviar(); }}>
        <Button type="submit">Enviar</Button>
      </form>,
    );
    cy.contains("button", "Enviar").click();
    cy.get("@enviar").should("have.been.calledOnce");
  });

  (["primary", "secondary", "outline", "ghost", "danger", "white"] as const).forEach((variante) => {
    it(`CMP-BTN-06 la variante "${variante}" es visible y enfocable con teclado`, () => {
      cy.mount(<Button variant={variante}>{variante}</Button>);
      cy.contains("button", variante).should("be.visible").focus().should("have.focus");
    });
  });
});

/** Input controlado para observar los cambios como lo hace la app. */
function InputControlado(props: Partial<React.ComponentProps<typeof Input>> & { alCambiar?: (v: string) => void }) {
  const [valor, setValor] = useState("");
  const { alCambiar, ...resto } = props;
  return (
    <Input
      {...resto}
      value={valor}
      onChange={(e) => {
        setValor(e.target.value);
        alCambiar?.(e.target.value);
      }}
    />
  );
}

describe("Componentes · Input", () => {
  it("CMP-INP-01 con id, la etiqueta queda asociada: clic en el label enfoca el campo", () => {
    cy.mount(<InputControlado id="correo" label="Correo Electrónico" type="email" required />);
    cy.get('label[for="correo"]').should("contain.text", "Correo Electrónico").and("contain.text", "*");
    cy.get('label[for="correo"]').click();
    cy.get("#correo").should("have.focus").and("have.attr", "required");
  });

  it("CMP-INP-02 propaga onChange con el valor escrito", () => {
    const alCambiar = cy.stub().as("cambio");
    cy.mount(<InputControlado id="nombre" label="Nombre" alCambiar={alCambiar} />);
    cy.get("#nombre").type("Ana").should("have.value", "Ana");
    cy.get("@cambio").should("have.been.calledThrice").and("have.been.calledWith", "Ana");
  });

  it("CMP-INP-03 con error muestra el mensaje y pinta borde y etiqueta en rojo", () => {
    cy.mount(<Input id="precio" label="Precio" error="Debe ser positivo" />);
    cy.contains("p", "Debe ser positivo").should("be.visible").and("have.class", "text-error");
    cy.get("#precio").should("have.class", "border-error");
    cy.get('label[for="precio"]').should("have.class", "text-error");
  });

  it("CMP-INP-04 deshabilitado no permite escribir", () => {
    cy.mount(<Input id="bloqueado" label="Bloqueado" disabled value="fijo" onChange={() => undefined} />);
    cy.get("#bloqueado").should("be.disabled").and("have.value", "fijo");
  });

  it("CMP-INP-05 DEF-12 corregido: sin id explícito el label queda asociado con un id generado", () => {
    cy.mount(<InputControlado label="Nombre" placeholder="Juan" />);
    cy.contains("label", "Nombre").should("have.attr", "for");
    cy.contains("label", "Nombre").click();
    cy.get('input[placeholder="Juan"]').should("have.focus");
  });
});

describe("Componentes · Badge", () => {
  const casos: [React.ComponentProps<typeof Badge>["variant"], string][] = [
    ["default", "bg-bg-surface-light"],
    ["success", "bg-emerald-50"],
    ["warning", "bg-amber-50"],
    ["error", "bg-rose-50"],
    ["info", "bg-sky-50"],
  ];
  casos.forEach(([variante, clase]) => {
    it(`CMP-BDG-01 la variante "${variante}" aplica la clase ${clase}`, () => {
      cy.mount(<Badge variant={variante}>Etiqueta</Badge>);
      cy.contains("span", "Etiqueta").should("have.class", clase).and("have.class", "uppercase");
    });
  });

  it("CMP-BDG-02 el tamaño sm usa menos relleno que md", () => {
    cy.mount(
      <div>
        <Badge size="sm">Pequeño</Badge>
        <Badge size="md">Mediano</Badge>
      </div>,
    );
    cy.contains("span", "Pequeño").should("have.class", "px-2");
    cy.contains("span", "Mediano").should("have.class", "px-2.5");
  });
});

describe("Componentes · Card", () => {
  it("CMP-CRD-01 sin onClick es un <div>; con onClick es un <button> que dispara el evento", () => {
    const alHacerClic = cy.stub().as("clic");
    cy.mount(
      <div>
        <Card>Estática</Card>
        <Card onClick={alHacerClic}>Clicable</Card>
      </div>,
    );
    cy.contains("div", "Estática").should("exist");
    cy.contains("button", "Clicable").should("have.attr", "type", "button").click();
    cy.get("@clic").should("have.been.calledOnce");
  });
});

function BuscadorControlado({ alCambiar }: { alCambiar: (v: string) => void }) {
  const [valor, setValor] = useState("");
  return (
    <SearchInput
      placeholder="Buscar productos..."
      value={valor}
      onChange={(v) => {
        setValor(v);
        alCambiar(v);
      }}
    />
  );
}

describe("Componentes · SearchInput", () => {
  it("CMP-SRC-01 escribe, notifica cada cambio y muestra el botón de limpiar solo con texto", () => {
    const alCambiar = cy.stub().as("cambio");
    cy.mount(<BuscadorControlado alCambiar={alCambiar} />);
    cy.get("button").should("not.exist");
    cy.get('input[placeholder="Buscar productos..."]').type("cinta");
    cy.get("@cambio").should("have.callCount", 5).and("have.been.calledWith", "cinta");
    cy.get("button").should("be.visible");
  });

  it("CMP-SRC-02 el botón de limpiar vacía el campo (onChange con cadena vacía)", () => {
    const alCambiar = cy.stub().as("cambio");
    cy.mount(<BuscadorControlado alCambiar={alCambiar} />);
    cy.get("input").type("pintura");
    cy.get("button").click();
    cy.get("input").should("have.value", "");
    cy.get("@cambio").should("have.been.calledWith", "");
    cy.get("button").should("not.exist");
  });

  it("CMP-SRC-03 DEF-13/DEF-14 corregidos: el campo y el botón de limpiar tienen nombre accesible y el botón dibuja el ícono X", () => {
    cy.mount(<SearchInput placeholder="Buscar" value="algo" onChange={() => undefined} />);
    cy.get("button").should("have.attr", "aria-label", "Limpiar búsqueda");
    cy.get("button svg").should("have.class", "lucide-x");
    cy.get("button").invoke("text").should("eq", "");
    cy.get("input").should("have.attr", "aria-label", "Buscar");
  });
});
