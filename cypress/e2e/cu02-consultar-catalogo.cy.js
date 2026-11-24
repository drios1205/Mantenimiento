const DB_KEY = "ellado_dulce_v1"; // clave de localStorage donde app.js guarda el estado

// Datos de prueba
const productoSalado = {
  id: 16,
  nombre: "Tequeños Venezolanos",
  categoria: "Boquitas Saladas",
  precio: "B/.16.80",
  unidades: "Bandeja de 24 unidades",
  descripcion: "Tequeños de queso, ideales para compartir.",
};

const productoDulce = {
  id: 13,
  nombre: "Brownies de Fudge",
  categoria: "Boquitas Dulces",
  precio: "B/.10.80",
  unidades: "Bandeja de 12 unidades",
  descripcion: "Brownies de chocolate de textura suave.",
};

// Marca un producto como no disponible (simulando acción de admin)
function marcarNoDisponible(id) {
  cy.window().then((win) => {
    const raw = win.localStorage.getItem(DB_KEY);
    const db = raw ? JSON.parse(raw) : { usuarios: [], registros: [], carritos: {} };
    db.noDisponibles = [id];
    win.localStorage.setItem(DB_KEY, JSON.stringify(db));
  });
}

describe("CU-02 Consultar catálogo", () => {
  beforeEach(() => {
    cy.clearLocalStorage(); // empezar con disponibilidad por defecto
  });

  it("CU-02.1 muestra los productos de Boquitas Saladas con nombre, imagen y precio", () => {
    cy.visit("/boquitas-saladas.html");

    cy.get('.cakes-grid[data-catalogo="Boquitas Saladas"] .cake-card')
      .should("have.length", 4);

    cy.contains(
      '.cakes-grid[data-catalogo="Boquitas Saladas"] .cake-card',
      productoSalado.nombre
    ).within(() => {
      cy.get("img").should("have.attr", "src").and("include", "Tequeños Venezolanos-16.png");
      cy.get(".cake-price").should("contain", productoSalado.precio);
      cy.get(".pack-description").should("contain", productoSalado.unidades);
    });
  });

  it("CU-02.1b abre el detalle de una boquita con su precio unitario y controles", () => {
    cy.visit("/boquitas-saladas.html");
    cy.contains(".cake-card a.catalog-product-link", productoSalado.nombre).click();

    cy.url().should("include", `detalle-boquita.html?id=${productoSalado.id}`);
    cy.get("h1").should("have.text", productoSalado.nombre);
    cy.get(".product-price").should("contain", productoSalado.precio);
    cy.get(".product-description").should("contain", productoSalado.descripcion);
    cy.get("#cantidad").should("have.text", "1");
    cy.get("#subtotalPrice").should("have.text", productoSalado.precio);
    cy.get("#btnRestar").should("be.visible");
    cy.get("#btnSumar").should("be.visible");
    cy.get("#btnAgregarCarrito").should("be.visible");
  });

  it("CU-02.2 cambia de categoría desde el menú Boquitas", () => {
    cy.visit("/boquitas-dulces.html");
    cy.get('.cakes-grid[data-catalogo="Boquitas Dulces"] .cake-card')
      .should("have.length", 4);

    // El submenú se despliega por hover CSS, por eso force: true
    cy.get('.navbar .dropdown-menu a[href="boquitas-saladas.html"]').click({ force: true });

    cy.url().should("include", "boquitas-saladas.html");
    cy.get('.cakes-grid[data-catalogo="Boquitas Saladas"] .cake-card')
      .should("have.length", 4);
  });

  it("CU-02.3 vuelve al listado de la categoría desde el detalle del producto", () => {
    cy.visit(`/detalle-boquita.html?id=${productoDulce.id}`);

    cy.get("a.back-link")
      .should("contain", `Volver a ${productoDulce.categoria}`)
      .click();

    cy.url().should("include", "boquitas-dulces.html");
    cy.get('.cakes-grid[data-catalogo="Boquitas Dulces"] .cake-card')
      .should("have.length", 4);
  });

  // CU-02.4: identificador inválido o inexistente 
  ["9999", "abc", ""].forEach((idInvalido) => {
    it(`CU-02.4 redirige a boquitas-dulces.html con id="${idInvalido}"`, () => {
      cy.visit(`/detalle-boquita.html?id=${idInvalido}`);
      cy.url().should("include", "boquitas-dulces.html");
    });
  });

  it("CU-02.5 deshabilita el enlace y muestra etiqueta cuando un producto no está disponible", () => {
    cy.visit("/boquitas-dulces.html");
    marcarNoDisponible(productoDulce.id);
    cy.reload();

    cy.contains(".cake-card", productoDulce.nombre)
      .should("have.class", "is-unavailable")
      .within(() => {
        cy.get(".unavailable-pill").should("contain", "No disponible");
        cy.get("a.catalog-product-link").should("not.exist");
        cy.get('[aria-disabled="true"]').should("exist");
      });
  });
});