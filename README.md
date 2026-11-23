# El Lado Dulce

Tienda de boquitas dulces y saladas. Abre `index.html` o inicia el servidor local:

```sh
npm install
npm start
```

Visita http://127.0.0.1:8000.

## Funciones

Catálogo, bandejas con precio fijo, calendario de entrega desde pasado mañana, carrito, cuentas de cliente y administración, historial con fechas y estados, pago con tarjetas ficticias y factura con vista previa y descarga PDF.

El pago y las cuentas usan almacenamiento local del navegador. No se realizan cobros reales. No hay un servidor de autenticación o una base de datos compartida.

## Cuentas locales de demostración

- Cliente: `cliente_demo` / `Cliente123!`
- Administración: `admin_demo` / `Admin123!`

## Pago de prueba

El selector de tarjetas vinculadas completa los datos automáticamente. Los saldos iniciales son B/.100.00, B/.1.00 y B/.250.00; disminuyen al pagar y no se reinician al recargar. La confirmación permite ver y descargar la factura o ir al inicio.

## Cypress

Se conserva la configuración y los comandos `npm run test:e2e` y `npm run test:e2e:open`. Los archivos de pruebas se retiraron para que otra integrante del equipo los prepare en `cypress/e2e`.
