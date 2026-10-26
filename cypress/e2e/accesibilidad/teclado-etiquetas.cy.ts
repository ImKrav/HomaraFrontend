// Accesibilidad · Navegación por teclado, foco visible y etiquetas de formularios

/** Etiqueta accesible de un control de formulario (o null si no tiene). */
function nombreAccesible(el: HTMLElement): string | null {
  const doc = el.ownerDocument;
  const aria = el.getAttribute("aria-label");
  if (aria?.trim()) return aria.trim();
  const ids = el.getAttribute("aria-labelledby");
  if (ids) return ids.split(" ").map((i) => doc.getElementById(i)?.textContent ?? "").join(" ").trim() || null;
  if (el.id) {
    const lbl = doc.querySelector(`label[for="${el.id}"]`);
    if (lbl?.textContent?.trim()) return lbl.textContent.trim();
  }
  const envolvente = el.closest("label");
  if (envolvente?.textContent?.trim()) return envolvente.textContent.trim();
  const titulo = el.getAttribute("title");
  return titulo?.trim() || null;
}

/** Lista de controles visibles de la página sin etiqueta accesible. */
function controlesSinEtiqueta(): Cypress.Chainable<string[]> {
  return cy.document().then((doc) =>
    [...doc.querySelectorAll<HTMLElement>("input, select, textarea")]
      .filter((el) => (el as HTMLInputElement).type !== "hidden" && !el.classList.contains("sr-only"))
      .filter((el) => nombreAccesible(el) === null)
      .map((el) => `${el.tagName.toLowerCase()}[placeholder="${el.getAttribute("placeholder") ?? ""}"]${el.id ? "#" + el.id : ""}`),
  );
}

/** Presiona Tab hasta que el foco llegue a `selector`; devuelve cuántas pulsaciones hicieron falta. */
function tabularHasta(selector: string, maximo = 30): Cypress.Chainable<number> {
  const intentar = (n: number): Cypress.Chainable<number> =>
    cy.document({ log: false }).then((doc) => {
      // Se lee document.activeElement: cy.focused() reintenta si aún no hay foco.
      if (doc.activeElement?.matches(selector)) return cy.wrap(n, { log: false });
      if (n >= maximo) throw new Error(`No se alcanzó ${selector} con ${maximo} pulsaciones de Tab`);
      cy.press(Cypress.Keyboard.Keys.TAB);
      return intentar(n + 1);
    });
  return intentar(0);
}

describe("Accesibilidad · Teclado y foco", () => {
  beforeEach(() => {
    cy.visit("/login", { onBeforeLoad: (win) => win.localStorage.setItem("homara_theme", "light") });
    cy.get("#email").should("be.visible");
  });

  it("A11Y-TEC-01 con Tab se llega al formulario de login (correo → contraseña) en orden lógico", () => {
    tabularHasta("#email").then((pulsaciones) => {
      cy.task("log", `[teclado] Tabs hasta #email en /login: ${pulsaciones}`);
      // Primero se recorre la barra de navegación (no hay enlace "saltar al contenido").
      expect(pulsaciones).to.be.greaterThan(1);
    });
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused().should("have.id", "password");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused().should("have.attr", "type", "checkbox");
  });

  it("A11Y-TEC-02 el campo enfocado tiene un indicador de foco visible distinto al estado normal", () => {
    cy.get("#password").then(($p) => {
      const normal = getComputedStyle($p[0]);
      const bordeNormal = normal.borderColor;
      tabularHasta("#email");
      // should() reintenta: el input tiene transition-all de 200 ms.
      cy.focused().should("have.id", "email").should(($e) => {
        const st = getComputedStyle($e[0]);
        // Una sombra solo cuenta si algún color tiene alfa > 0.
        const colores = st.boxShadow.match(/(rgba?|oklab|oklch)\([^)]*\)/g) ?? [];
        const sombraVisible = colores.some((c) => !/(\/\s*0|,\s*0)\)$/.test(c));
        const visible = st.borderColor !== bordeNormal || sombraVisible || st.outlineStyle !== "none";
        expect(visible, `indicador de foco visible (borde ${bordeNormal} -> ${st.borderColor}, sombra ${st.boxShadow})`).to.eq(true);
      });
      cy.screenshot("foco-login-email", { capture: "viewport", overwrite: true });
    });
  });

  it("A11Y-TEC-03 el login se completa solo con teclado (Enter envía el formulario)", () => {
    cy.intercept("POST", "**/api/v1/users/login").as("login");
    tabularHasta("#email");
    cy.focused().type(Cypress.env("clienteEmail"));
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused().type(`${Cypress.env("clientePassword")}{enter}`, { log: false });
    cy.wait("@login").its("response.statusCode").should("eq", 200);
    cy.location("pathname").should("eq", "/cuenta");
  });

  it("A11Y-TEC-04 DEF-18: no existe un enlace 'Saltar al contenido' como primer elemento enfocable", () => {
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.document().then((doc) => {
      expect(doc.activeElement?.textContent?.trim() ?? "").not.to.match(/saltar|skip/i);
    });
    cy.get('a[href^="#"]').filter(':contains("contenido")').should("not.exist");
  });
});

describe("Accesibilidad · Etiquetas de formularios", () => {
  it("A11Y-LBL-01 /login: todos los campos tienen etiqueta asociada", () => {
    cy.visit("/login");
    cy.get("#email").should("be.visible");
    controlesSinEtiqueta().should("deep.equal", []);
    cy.get('label[for="email"]').should("contain.text", "Correo Electrónico");
    cy.get('label[for="password"]').should("contain.text", "Contraseña");
  });

  it("A11Y-LBL-02 DEF-12: /register tiene campos SIN etiqueta asociada (labels sin for / inputs sin id)", () => {
    cy.visit("/register");
    cy.get('input[placeholder="Juan"]').should("be.visible");
    controlesSinEtiqueta().then((sinEtiqueta) => {
      cy.task("log", `[etiquetas] /register sin etiqueta (${sinEtiqueta.length}): ${sinEtiqueta.join(", ")}`);
      // Los 10 campos del formulario dependen solo del placeholder.
      expect(sinEtiqueta).to.have.length(10);
    });
    cy.contains("label", "Nombre").should("not.have.attr", "for");
  });

  it("A11Y-LBL-03 DEF-19: en /catalogo los selects de calificación y orden no tienen etiqueta", () => {
    cy.visit("/catalogo");
    cy.contains("productos técnicos encontrados").should("be.visible");
    controlesSinEtiqueta().then((sinEtiqueta) => {
      cy.task("log", `[etiquetas] /catalogo sin etiqueta: ${sinEtiqueta.join(", ")}`);
      expect(sinEtiqueta).to.include.members(["select[placeholder=\"\"]#min-rating", "select[placeholder=\"\"]#sort-by"]);
    });
  });

  it("A11Y-LBL-04 /checkout: los campos de contacto y envío están etiquetados", () => {
    cy.iniciarSesion(Cypress.env("clienteEmail"), Cypress.env("clientePassword"));
    cy.visit("/checkout");
    cy.get("#first-name").should("be.visible");
    ["first-name", "last-name", "email", "phone", "address", "city", "state", "zip"].forEach((id) => {
      cy.get(`label[for="${id}"]`).should("exist");
    });
  });
});
