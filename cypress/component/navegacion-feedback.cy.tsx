// Componentes · Paginación, notificaciones y estados de autenticación
// Pagination · Toast (ToastContainer + showToast) · AuthCard · AuthRequiredState · SearchBar

import React, { useState } from "react";
import Pagination from "@/app/components/ui/Pagination";
import ToastContainer from "@/app/components/ui/Toast";
import { showToast } from "@/app/lib/toast";
import AuthCard from "@/app/components/AuthCard";
import AuthRequiredState from "@/app/components/AuthRequiredState";
import SearchBar from "@/app/components/SearchBar";
import { EfectosListos, esperarEfectos } from "./sincronizacion";

/** Monta el contenedor de toasts y espera a que registre su listener. */
function montarToasts() {
  cy.mount(
    <>
      <ToastContainer />
      <EfectosListos />
    </>,
  );
  esperarEfectos();
}

function PaginacionControlada({ total, alCambiar }: { total: number; alCambiar: (p: number) => void }) {
  const [pagina, setPagina] = useState(1);
  const porPagina = 25;
  return (
    <Pagination
      currentPage={pagina}
      totalPages={Math.ceil(total / porPagina)}
      totalItems={total}
      itemsPerPage={porPagina}
      itemTypeLabel="productos"
      onPageChange={(p) => {
        setPagina(p);
        alCambiar(p);
      }}
    />
  );
}

describe("Componentes · Pagination", () => {
  it("CMP-PAG-01 con una sola página no renderiza nada", () => {
    cy.montar(<Pagination currentPage={1} totalPages={1} totalItems={10} itemsPerPage={25} onPageChange={() => undefined} />);
    cy.get("button").should("not.exist");
  });

  it("CMP-PAG-02 muestra el rango, deshabilita 'Anterior' en la página 1 y marca la actual", () => {
    cy.montar(<PaginacionControlada total={68} alCambiar={() => undefined} />);
    cy.contains("p", "Mostrando").should("contain.text", "1–25").and("contain.text", "68").and("contain.text", "productos");
    cy.get('button[aria-label="Anterior"]').should("be.disabled");
    cy.get('button[aria-current="page"]').should("have.text", "1");
    cy.get('button[aria-label^="Ir a página"]').should("have.length", 3);
  });

  it("CMP-PAG-03 navegar a la última página llama onPageChange y deshabilita 'Siguiente'", () => {
    const alCambiar = cy.stub().as("cambio");
    cy.montar(<PaginacionControlada total={68} alCambiar={alCambiar} />);
    cy.get('button[aria-label="Ir a página 3"]').click();
    cy.get("@cambio").should("have.been.calledOnceWith", 3);
    cy.contains("p", "Mostrando").should("contain.text", "51–68");
    cy.get('button[aria-label="Siguiente"]').should("be.disabled");
    cy.get('button[aria-label="Anterior"]').click();
    cy.get("@cambio").should("have.been.calledWith", 2);
  });

  it("CMP-PAG-04 con muchas páginas resume con puntos suspensivos alrededor de la actual", () => {
    cy.montar(<Pagination currentPage={10} totalPages={20} totalItems={500} itemsPerPage={25} onPageChange={() => undefined} />);
    cy.get('button[aria-label^="Ir a página"]').then(($b) => {
      expect([...$b].map((b) => b.textContent)).to.deep.equal(["1", "9", "10", "11", "20"]);
    });
    cy.get("span").filter(":contains('···')").should("have.length", 2);
  });

  it("CMP-PAG-05 traduce sus textos al inglés con LanguageProvider", () => {
    cy.montar(<PaginacionControlada total={68} alCambiar={() => undefined} />, { idioma: "en" });
    cy.get('button[aria-label="Previous"]').should("exist");
    cy.contains("p", "Showing").should("contain.text", "of");
  });

  it("CMP-PAG-06 DEF-14 corregido: los botones de paginación dibujan ChevronLeft/Right (no el ícono de ayuda)", () => {
    cy.montar(<PaginacionControlada total={68} alCambiar={() => undefined} />);
    cy.get('button[aria-label="Anterior"] svg').should("have.class", "lucide-chevron-left");
    cy.get('button[aria-label="Siguiente"] svg').should("have.class", "lucide-chevron-right");
  });
});

describe("Componentes · Toast", () => {
  it("CMP-TST-01 showToast muestra una alerta con el mensaje y el estilo del tipo", () => {
    montarToasts();
    cy.get('[role="alert"]').should("not.exist");
    cy.window().then(() => showToast("Producto agregado", "success"));
    cy.get('[role="alert"]').should("contain.text", "Producto agregado").and("have.class", "border-l-success");
  });

  it("CMP-TST-02 apila varias notificaciones y cada tipo usa su color", () => {
    montarToasts();
    cy.window().then(() => {
      showToast("Uno", "error");
      showToast("Dos", "warning");
      showToast("Tres");
    });
    cy.get('[role="alert"]').should("have.length", 3);
    cy.contains('[role="alert"]', "Uno").should("have.class", "border-l-error");
    cy.contains('[role="alert"]', "Dos").should("have.class", "border-l-warning");
    cy.contains('[role="alert"]', "Tres").should("have.class", "border-l-primary");
  });

  it("CMP-TST-03 el botón Cerrar descarta la notificación", () => {
    montarToasts();
    cy.window().then(() => showToast("Cerrarme", "info", 60000));
    cy.get('button[aria-label="Cerrar"]').click();
    cy.get('[role="alert"]').should("not.exist");
  });

  it("CMP-TST-04 se oculta sola al cumplirse la duración (reloj controlado)", () => {
    cy.clock();
    montarToasts();
    cy.window().then(() => showToast("Temporal", "info", 4000));
    cy.get('[role="alert"]').should("exist");
    cy.tick(3999);
    cy.get('[role="alert"]').should("exist");
    cy.tick(2);
    cy.get('[role="alert"]').should("not.exist");
  });
});

describe("Componentes · AuthCard y AuthRequiredState", () => {
  it("CMP-AUT-01 AuthCard muestra subtítulo y contenido; sin error no muestra el aviso", () => {
    cy.mount(<AuthCard subtitle="Ingresa a tu cuenta"><p>Formulario</p></AuthCard>);
    cy.contains("h1", "Homara").should("be.visible");
    cy.contains("Ingresa a tu cuenta").should("be.visible");
    cy.contains("p", "Formulario").should("be.visible");
    cy.get(".text-error").should("not.exist");
  });

  it("CMP-AUT-02 AuthCard con errorMsg muestra el error y respeta maxWidth=2xl", () => {
    cy.mount(<AuthCard subtitle="Registro" errorMsg="Las contraseñas no coinciden." maxWidth="2xl"><span /></AuthCard>);
    cy.contains("Las contraseñas no coinciden.").should("be.visible").parent().should("have.class", "text-error");
    cy.get(".max-w-2xl").should("exist");
  });

  it("CMP-AUT-03 AuthRequiredState ofrece enlaces a /login y /register", () => {
    cy.mount(
      <AuthRequiredState
        icon="ShoppingCart"
        title="Inicia sesión"
        description="Necesitas una cuenta"
        loginButtonLabel="Entrar"
        registerButtonLabel="Crear cuenta"
      />,
    );
    cy.contains("h3", "Inicia sesión").should("be.visible");
    cy.contains("a", "Entrar").should("have.attr", "href", "/login");
    cy.contains("a", "Crear cuenta").should("have.attr", "href", "/register");
  });
});

describe("Componentes · SearchBar", () => {
  it("CMP-SBR-01 al presionar Enter invoca onSearch con el texto escrito", () => {
    const alBuscar = cy.stub().as("buscar");
    cy.montar(<SearchBar onSearch={alBuscar} />);
    cy.get("#search-bar")
      .should("have.attr", "placeholder", "Buscar herramientas, cerámicas, pinturas o materiales...")
      .type("brocha{enter}");
    cy.get("@buscar").should("have.been.calledOnceWith", "brocha");
  });

  it("CMP-SBR-02 sincroniza el valor inicial y usa el placeholder en inglés", () => {
    cy.montar(<SearchBar initialValue="cemento" />, { idioma: "en" });
    cy.get("#search-bar").should("have.value", "cemento").invoke("attr", "placeholder").should("match", /^Search/);
  });
});
