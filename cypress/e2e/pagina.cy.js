describe("Index - Ellado Dulce", () => {
  beforeEach(() => {
    cy.visit("/index.html");
  });

  it("tiene el título correcto", () => {
    cy.title().should("eq", "Inicio | Ellado Dulce");
  });

  describe("Navbar", () => {
    it("muestra el logo y los enlaces principales", () => {
      cy.get(".logo-img").should("be.visible");
      cy.get(".menu").contains("a", "Inicio").should("be.visible");
      cy.get(".menu").contains("a", "Nosotros").should("have.attr", "href", "Nosotros.html");
      cy.get(".menu").contains("a", "Mi cuenta").should("have.attr", "href", "mi-cuenta.html");
    });

    it("el submenú de Boquitas apunta a las páginas correctas", () => {
      cy.get(".dropdown-menu a").should("have.length", 2);
      cy.get(".dropdown-menu").contains("a", "Boquitas Dulces")
        .should("have.attr", "href", "boquitas-dulces.html");
      cy.get(".dropdown-menu").contains("a", "Boquitas Saladas")
        .should("have.attr", "href", "boquitas-saladas.html");
    });

    it("navega a Nosotros", () => {
      cy.get(".menu").contains("a", "Nosotros").click();
      cy.url().should("include", "Nosotros.html");
    });
  });

  describe("Productos destacados", () => {
    it("muestra 4 productos con nombre y precio", () => {
      cy.get(".product-card").should("have.length", 4);
      cy.get(".product-card").each(($card) => {
        cy.wrap($card).find("h3").should("not.be.empty");
        cy.wrap($card).find(".price").should("contain", "$");
      });
    });

    it("el botón Ver más lleva a boquitas saladas", () => {
      cy.get(".product-card").first().contains("a", "Ver más").click();
      cy.url().should("include", "boquitas-saladas.html");
    });
  });

  describe("Reserva de local", () => {
    it("muestra los precios", () => {
      cy.get(".price-box").first().should("contain", "$60");
      cy.get(".price-box").last().should("contain", "$20");
    });

    it("el botón Reservar ahora lleva a reservas", () => {
      cy.contains("a", "Reservar ahora").click();
      cy.url().should("include", "reservas.html");
    });
  });

  describe("Noticias y footer", () => {
    it("muestra 3 noticias con enlace", () => {
      cy.get(".activity-card").should("have.length", 3);
      cy.get(".activity-card a").each(($a) => {
        cy.wrap($a).should("have.attr", "href").and("match", /^https?:\/\//);
      });
    });

    it("el footer tiene horarios y contacto", () => {
      cy.get(".footer").should("contain", "Horarios");
      cy.get(".footer").should("contain", "@elladodulce");
    });
  });
});