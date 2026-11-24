const DB_KEY = "ellado_dulce_v1"; // clave de localStorage donde app.js guarda el estado
const SESSION_KEY = "ellado_sesion"; // clave de sessionStorage para la sesión activa
const CHECKOUT_KEY = "ellado_pago"; // clave de sessionStorage para la compra pendiente
const DEMO_CLIENT_ID = "demo-cliente"; // cuenta cliente demo incluida en app.js

// Producto de prueba (1 bandeja = B/.30.00 + 7% ITBMS B/.2.10 = B/.32.10)
const productoPago = {
  id: 15,
  nombre: "Mini Empanaditas",
  precio: 30,
  precioTexto: "B/.30.00",
  itbmsTexto: "B/.2.10",
  totalTexto: "B/.32.10",
};

// Prepara sesión activa, producto en el carrito y pedido pendiente para llegar a pago.html
function prepararPedidoPendiente(cantidad = 1) {
  cy.visit("/boquitas-saladas.html");
  cy.window().then((win) => {
    win.sessionStorage.setItem(SESSION_KEY, DEMO_CLIENT_ID);
    const raw = win.localStorage.getItem(DB_KEY);
    const db = raw ? JSON.parse(raw) : { usuarios: [], registros: [], carritos: {} };
    db.carritos[DEMO_CLIENT_ID] = [
      {
        id: productoPago.id,
        nombre: productoPago.nombre,
        precio: productoPago.precio,
        cantidad,
        clave: `2099-12-31|${productoPago.id}|||`,
      },
    ];
    win.localStorage.setItem(DB_KEY, JSON.stringify(db));
  });
  cy.visit("/pantalla-de-carrito.html");
  cy.get("#checkoutBtn").click();
  cy.url().should("include", "pago.html");
}

function llenarPago(datos) {
  if (datos.nombre !== undefined && datos.nombre !== "") {
    cy.get("#nombreTarjeta").clear().type(datos.nombre);
  }
  if (datos.numero !== undefined && datos.numero !== "") {
    cy.get("#numeroTarjeta").clear().type(datos.numero);
  }
  if (datos.vencimiento !== undefined && datos.vencimiento !== "") {
    cy.get("#fechaTarjeta").clear().type(datos.vencimiento);
  }
  if (datos.cvv !== undefined && datos.cvv !== "") {
    cy.get("#cvv").clear().type(datos.cvv);
  }
}

function confirmarPago() {
  cy.get('[data-cy="confirmar-pago"]').click();
}

describe("CU-04 Realizar pago", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => win.sessionStorage.clear());
  });

  it("CU-04.1 confirma el pago simulado con tarjeta válida, limpia el carrito y muestra confirmación", () => {
    prepararPedidoPendiente(1);

    cy.get("#pago-subtotal").should("have.text", productoPago.precioTexto);
    cy.get("#pago-itbms").should("have.text", productoPago.itbmsTexto);
    cy.get("#pago-total").should("have.text", productoPago.totalTexto);

    cy.get('[data-cy="tarjeta"]').select("demo-credito");
    cy.get('[data-cy="saldo"]').should("contain", "B/.100.00");

    confirmarPago();

    cy.get('[data-cy="compra-exitosa"]').should("be.visible");
    cy.get('[data-cy="numero-pedido"]').should("contain", "Confirmación del pedido: PED-");

    cy.window().then((win) => {
      const db = JSON.parse(win.localStorage.getItem(DB_KEY));
      expect(db.carritos[DEMO_CLIENT_ID]).to.have.length(0);
      expect(db.registros.some((r) => r.userId === DEMO_CLIENT_ID && r.tipo === "Pedido")).to.be.true;
      expect(win.sessionStorage.getItem(CHECKOUT_KEY)).to.be.null;
    });
  });

  it("CU-04.2 permite volver al carrito conservando el pedido", () => {
    prepararPedidoPendiente(1);

    cy.get("a.back-cart").should("contain", "Volver").click();
    cy.url().should("include", "pantalla-de-carrito.html");
    cy.get("#cartItems .cart-item").should("have.length", 1);
  });

  it("CU-04.3 redirige si se accede a pago.html sin pedido pendiente válido", () => {
    cy.visit("/boquitas-dulces.html");
    cy.window().then((win) => {
      win.sessionStorage.setItem(SESSION_KEY, DEMO_CLIENT_ID);
    });
    cy.visit("/pago.html");

    cy.url().should("include", "index.html");
  });

  it("CU-04.4 rechaza datos de tarjeta incompletos o inválidos", () => {
    prepararPedidoPendiente(1);

    llenarPago({
      nombre: "Cliente Demo",
      numero: "4111111111111111",
      vencimiento: "12/35",
      cvv: "999",
    });
    confirmarPago();

    cy.get(".app-message.app-error").should("contain", "El CVV de prueba es 123.");
    cy.get('[data-cy="compra-exitosa"]').should("not.be.visible");
  });

  it("CU-04.5 rechaza el pago cuando el saldo de la tarjeta es insuficiente", () => {
    // demo-debito tiene saldo de B/.1.00; el total es B/.32.10
    prepararPedidoPendiente(1);

    cy.get('[data-cy="tarjeta"]').select("demo-debito");
    cy.get('[data-cy="saldo"]').should("contain", "B/.1.00");

    confirmarPago();

    cy.get(".app-message.app-error").should("contain", "Pago rechazado: saldo insuficiente.");
    cy.get('[data-cy="compra-exitosa"]').should("not.be.visible");
  });

  it("CU-04.6 detiene la confirmación si cambia el resumen antes de pagar", () => {
    prepararPedidoPendiente(1);

    cy.get('[data-cy="tarjeta"]').select("demo-credito");

    // Modifica la cantidad en el carrito mientras se está en pago.html
    cy.window().then((win) => {
      const db = JSON.parse(win.localStorage.getItem(DB_KEY));
      db.carritos[DEMO_CLIENT_ID][0].cantidad = 2;
      win.localStorage.setItem(DB_KEY, JSON.stringify(db));
    });

    confirmarPago();

    cy.get(".app-message.app-error").should(
      "contain",
      "La compra cambió. Recarga la página para revisar el resumen actualizado."
    );
    cy.get('[data-cy="compra-exitosa"]').should("not.be.visible");
  });
});