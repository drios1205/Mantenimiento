const DB_KEY = "ellado_dulce_v1"; // clave de localStorage donde app.js guarda las cuentas

// Usuario nuevo 
const valido = {
  nombre: "Juan",
  apellido: "Prueba",
  usuario: "juan_prueba",
  correo: "juan_prueba@correo.com",
  telefono: "61234567",
  contrasena: "Clave123",
};

// Escribe en el formulario; un campo con "" se deja vacío
function llenarFormulario(datos) {
  Object.entries(datos).forEach(([campo, valor]) => {
    if (valor !== "") cy.get(`#${campo}`).type(valor);
  });
}

function enviar() {
  cy.get("#registroForm .register-btn").click();
}

// true/false según exista una cuenta con ese usuario guardada
function cuentaExiste(usuario) {
  return cy.window().then((win) => {
    const raw = win.localStorage.getItem(DB_KEY);
    const db = raw ? JSON.parse(raw) : { usuarios: [] };
    return db.usuarios.some((u) => u.usuario === usuario);
  });
}

describe("CU-01 Registrar cliente", () => {
  beforeEach(() => {
    cy.clearLocalStorage(); // empezar sin cuentas guardadas
    cy.visit("/registro.html");
  });

  it("CU-01.1 registra un cliente con datos válidos", () => {
    llenarFormulario(valido);
    enviar();
    cy.url().should("include", "login.html?registro=ok");
    cy.contains("Cuenta creada. Ya puedes iniciar sesión.").should("be.visible");
    cuentaExiste(valido.usuario).should("eq", true);
  });

  it("CU-01.1b no guarda la contraseña en texto plano", () => {
    llenarFormulario(valido);
    enviar();
    cy.url().should("include", "login.html"); // esperar a que termine el registro
    cy.window().then((win) => {
      expect(win.localStorage.getItem(DB_KEY)).to.not.include(valido.contrasena);
    });
  });

  // CU-01.2: un campo vacío a la vez (lo frena el atributo required del navegador)
  ["nombre", "apellido", "usuario", "correo", "telefono", "contrasena"].forEach((campo) => {
    it(`CU-01.2 no permite registrar con "${campo}" vacío`, () => {
      llenarFormulario({ ...valido, [campo]: "" });
      enviar();
      cy.get(`#${campo}:invalid`).should("exist");
      cy.url().should("include", "registro.html");
      cuentaExiste(valido.usuario).should("eq", false);
    });
  });

  it("CU-01.2b rechaza un campo con solo espacios", () => {
    // "   " cumple required, así que lo detiene app.js
    llenarFormulario({ ...valido, nombre: "   " });
    enviar();
    cy.get(".app-message.app-error").should("contain", "Completa todos los campos.");
    cuentaExiste(valido.usuario).should("eq", false);
  });

  it("CU-01.3a un correo sin arroba lo bloquea el navegador", () => {
    llenarFormulario({ ...valido, correo: "juan_prueba" });
    enviar();
    cy.get("#correo:invalid").should("exist");
    cuentaExiste(valido.usuario).should("eq", false);
  });

  it("CU-01.3b un correo sin punto en el dominio lo rechaza la app", () => {
    // "juan@correo" pasa la validación del navegador pero no la de app.js
    llenarFormulario({ ...valido, correo: "juan@correo" });
    enviar();
    cy.get(".app-message.app-error").should("contain", "Escribe un correo válido.");
    cuentaExiste(valido.usuario).should("eq", false);
  });

  // CU-01.4: datos de las cuentas demo que app.js crea en el navegador
  [
    { campo: "usuario", valor: "cliente_demo" },
    { campo: "correo", valor: "cliente_demo@elladodulce.test" },
    { campo: "telefono", valor: "60001001" },
  ].forEach(({ campo, valor }) => {
    it(`CU-01.4 rechaza ${campo} ya registrado`, () => {
      llenarFormulario({ ...valido, [campo]: valor });
      enviar();
      cy.get(".app-message.app-error").should("contain", "ya está registrado");
      cuentaExiste(valido.usuario).should("eq", false);
    });
  });

  it("CU-01.5 el enlace Iniciar sesión abre el acceso", () => {
    cy.contains("#registroForm a", "Iniciar sesión").click();
    cy.url().should("include", "login.html");
  });
});