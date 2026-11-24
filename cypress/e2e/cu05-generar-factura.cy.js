const DB_KEY = "ellado_dulce_v1"; // clave de localStorage donde app.js guarda el estado
const SESSION_KEY = "ellado_sesion"; // clave de sessionStorage para la sesión activa
const LAST_CONF_KEY = "ellado_ultima_confirmacion"; // clave de sessionStorage del último pago confirmado
const DEMO_CLIENT_ID = "demo-cliente"; // cuenta cliente demo incluida en app.js

// Productos de prueba (2 bandejas = B/.30.00 + 7% ITBMS B/.2.10 = B/.32.10)
const productoFactura = {
  id: 12,
  nombre: "Cupcakes Tradicionales",
  precio: 15,
  cantidad: 2,
  subtotalTexto: "B/.30.00",
  itbmsTexto: "B/.2.10",
  totalTexto: "B/.32.10",
};

// Completa el flujo previo hasta dejar el pedido pagado y el modal de confirmación abierto
function completarPagoYMostrarModal() {
  cy.visit("/boquitas-dulces.html");
  cy.window().then((win) => {
    win.sessionStorage.setItem(SESSION_KEY, DEMO_CLIENT_ID);
    const raw = win.localStorage.getItem(DB_KEY);
    const db = raw ? JSON.parse(raw) : { usuarios: [], registros: [], carritos: {} };
    db.carritos[DEMO_CLIENT_ID] = [
      {
        id: productoFactura.id,
        nombre: productoFactura.nombre,
        precio: productoFactura.precio,
        cantidad: productoFactura.cantidad,
        clave: `2099-12-31|${productoFactura.id}|||`,
      },
    ];
    win.localStorage.setItem(DB_KEY, JSON.stringify(db));
  });

  cy.visit("/pantalla-de-carrito.html");
  cy.get("#checkoutBtn").click();
  cy.url().should("include", "pago.html");

  cy.get('[data-cy="tarjeta"]').select("demo-credito");
  cy.get('[data-cy="confirmar-pago"]').click();
  cy.get('[data-cy="compra-exitosa"]').should("be.visible");
}

describe("CU-05 Generar factura", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => win.sessionStorage.clear());
  });

  it("CU-05.1 genera y muestra la factura con número único, fecha, cliente, detalle e importes", () => {
    completarPagoYMostrarModal();

    cy.window().then((win) => {
      const checkoutId = win.sessionStorage.getItem(LAST_CONF_KEY);
      expect(checkoutId).to.be.a("string").and.not.be.empty;

      cy.get('[data-cy="ver-factura"]').click();

      cy.get("#confirmacionCompra").should("not.be.visible");
      cy.get('[data-cy="ver-factura"]').should("not.be.visible");
      cy.get("#vistaFactura").should("be.visible");

      cy.get("#facturaContenido .receipt-heading").within(() => {
        cy.contains("h3", "El Lado Dulce").should("be.visible");
        cy.contains("p", `Factura ${checkoutId}`).should("be.visible");
        cy.contains("p", "Cliente: Cliente").should("be.visible");
      });

      cy.get("#facturaContenido .receipt-table tbody tr").should("have.length", 1);
      cy.get("#facturaContenido .receipt-table tbody tr").first().within(() => {
        cy.contains("td", productoFactura.nombre).should("be.visible");
        cy.contains("td", "12 unidades por bandeja").should("be.visible");
        cy.contains("td", String(productoFactura.cantidad)).should("be.visible");
        cy.contains("td", "B/.15.00").should("be.visible");
        cy.contains("td", productoFactura.subtotalTexto).should("be.visible");
      });

      cy.get("#facturaContenido .receipt-totals").within(() => {
        cy.contains("div", "Subtotal").should("contain", productoFactura.subtotalTexto);
        cy.contains("div", "ITBMS").should("contain", productoFactura.itbmsTexto);
        cy.contains("div", "Total pagado").should("contain", productoFactura.totalTexto);
      });
    });
  });

  it("CU-05.1b permite descargar la factura en PDF con el identificador del pedido", () => {
    completarPagoYMostrarModal();

    cy.window().then((win) => {
      const checkoutId = win.sessionStorage.getItem(LAST_CONF_KEY);
      cy.spy(win.URL, "createObjectURL").as("crearBlobPdf");

      cy.get('[data-cy="ver-factura"]').click();
      cy.get("#descargarFactura").should("be.visible").click();

      cy.get("@crearBlobPdf").should("have.been.calledOnce");
      cy.readFile(`cypress/downloads/Factura_${checkoutId}.pdf`).should("contain", "%PDF-1.4");
    });
  });

  it("CU-05.2 conserva una única factura por pedido con sus datos originales", () => {
    completarPagoYMostrarModal();

    cy.window().then((win) => {
      const checkoutId = win.sessionStorage.getItem(LAST_CONF_KEY);

      cy.get('[data-cy="ver-factura"]').click();
      cy.get("#facturaContenido .receipt-heading").should("contain", `Factura ${checkoutId}`);

      // Verifica que no se duplicaron registros del pedido al generar/descargar la factura
      cy.get("#descargarFactura").click();
      const db = JSON.parse(win.localStorage.getItem(DB_KEY));
      const registrosPedido = db.registros.filter((r) => r.checkoutId === checkoutId);
      expect(registrosPedido).to.have.length(1);
      expect(registrosPedido[0].total).to.eq(32.1);
    });
  });

  it("CU-05.3 impide acceder a la facturación sin un pedido confirmado", () => {
    cy.visit("/boquitas-dulces.html");
    cy.window().then((win) => {
      win.sessionStorage.setItem(SESSION_KEY, DEMO_CLIENT_ID);
    });

    cy.visit("/pago.html");
    cy.url().should("include", "index.html");
    cy.get("#vistaFactura").should("not.exist");
  });
});