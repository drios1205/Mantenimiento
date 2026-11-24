const DB_KEY = "ellado_dulce_v1"; // clave de localStorage donde app.js guarda el estado
const SESSION_KEY = "ellado_sesion"; // clave de sessionStorage para la sesión activa
const DEMO_CLIENT_ID = "demo-cliente"; // cuenta cliente demo incluida en app.js

// Producto de prueba 
const productoPedido = {
  id: 15,
  nombre: "Mini Empanaditas",
  precio: 30,
  precioTexto: "B/.30.00",
  itbmsTexto: "B/.2.10",
  totalTexto: "B/.32.10",
};

// Inicia sesión como cliente demo en el navegador actual
function iniciarSesionClienteDemo(rutaDestino) {
  cy.window().then((win) => {
    win.sessionStorage.setItem(SESSION_KEY, DEMO_CLIENT_ID);
  });
  if (rutaDestino) {
    cy.visit(rutaDestino);
  } else {
    cy.reload();
  }
}

// Lee los ítems del carrito del cliente demo en localStorage
function obtenerCarritoCliente() {
  return cy.window().then((win) => {
    const raw = win.localStorage.getItem(DB_KEY);
    const db = raw ? JSON.parse(raw) : { carritos: {} };
    return db.carritos?.[DEMO_CLIENT_ID] || [];
  });
}

describe("CU-03 Realizar pedido", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => win.sessionStorage.clear());
  });

  it("CU-03.1 agrega un producto con cantidad y nota, revisa el carrito y va a pago", () => {
    cy.visit(`/detalle-boquita.html?id=${productoPedido.id}`);
    iniciarSesionClienteDemo();

    cy.get("#btnSumar").click();
    cy.get("#cantidad").should("have.text", "2");
    cy.get("#subtotalPrice").should("have.text", "B/.60.00");

    cy.contains("summary", "Añadir una nota (opcional)").click();
    cy.get("#notasEspecificas").type("Sin picante por favor");

    cy.get("#btnAgregarCarrito").click();

    cy.url().should("include", "pantalla-de-carrito.html");
    cy.get("#cartItems .cart-item").should("have.length", 1);
    cy.get("#cartItems .cart-item").first().within(() => {
      cy.contains("h3", productoPedido.nombre).should("be.visible");
      cy.contains(".item-meta", "Sin picante por favor").should("be.visible");
      cy.get('input[aria-label="Cantidad de bandejas"]').should("have.value", "2");
      cy.get(".item-total").should("have.text", "B/.60.00");
    });

    cy.get("#subtotalAmount").should("have.text", "B/.60.00");
    cy.get("#itbmsAmount").should("have.text", "B/.4.20");
    cy.get("#totalAmount").should("have.text", "B/.64.20");
    obtenerCarritoCliente().should("have.length", 1);

    cy.get("#checkoutBtn").should("not.be.disabled").click();
    cy.url().should("include", "pago.html");
  });

  it("CU-03.2 recalcula subtotal, ITBMS y total al modificar cantidad o eliminar", () => {
    cy.visit(`/detalle-boquita.html?id=${productoPedido.id}`);
    iniciarSesionClienteDemo();
    cy.get("#btnAgregarCarrito").click();

    cy.url().should("include", "pantalla-de-carrito.html");
    cy.get("#subtotalAmount").should("have.text", productoPedido.precioTexto);
    cy.get("#itbmsAmount").should("have.text", productoPedido.itbmsTexto);
    cy.get("#totalAmount").should("have.text", productoPedido.totalTexto);

    // Sumar una bandeja: 2 x B/.30.00 = B/.60.00 + ITBMS B/.4.20 = B/.64.20
    cy.get('#cartItems .cart-item button[data-action="add"]').click();
    cy.get('input[aria-label="Cantidad de bandejas"]').should("have.value", "2");
    cy.get("#subtotalAmount").should("have.text", "B/.60.00");
    cy.get("#itbmsAmount").should("have.text", "B/.4.20");
    cy.get("#totalAmount").should("have.text", "B/.64.20");

    // Restar una bandeja: vuelve a B/.30.00
    cy.get('#cartItems .cart-item button[data-action="subtract"]').click();
    cy.get('input[aria-label="Cantidad de bandejas"]').should("have.value", "1");
    cy.get("#subtotalAmount").should("have.text", productoPedido.precioTexto);

    // Eliminar producto: carrito vacío y resumen en B/.0.00
    cy.get('#cartItems .cart-item button[data-action="remove"]').click();
    cy.get("#emptyCartMessage").should("be.visible");
    cy.get("#subtotalAmount").should("have.text", "B/.0.00");
    cy.get("#itbmsAmount").should("have.text", "B/.0.00");
    cy.get("#totalAmount").should("have.text", "B/.0.00");
    cy.get("#checkoutBtn").should("be.disabled");
    obtenerCarritoCliente().should("have.length", 0);
  });

  it("CU-03.3 redirige a login cuando se intenta agregar sin sesión activa", () => {
    cy.visit(`/detalle-boquita.html?id=${productoPedido.id}`);
    cy.get(".signin-notice").should("contain", "inicia sesión");

    cy.get("#btnAgregarCarrito").click();
    cy.url().should("include", "login.html");
    cy.url().should("include", "reason=compra");
  });

  it("CU-03.4 impide continuar al pago cuando el carrito está vacío", () => {
    cy.visit("/pantalla-de-carrito.html");
    cy.url().should("include", "login.html");

    iniciarSesionClienteDemo("/pantalla-de-carrito.html");

    cy.url().should("include", "pantalla-de-carrito.html");
    cy.get("#emptyCartMessage").should("be.visible");
    cy.get("#checkoutBtn").should("be.disabled");
    obtenerCarritoCliente().should("have.length", 0);
  });
});