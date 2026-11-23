/* Estado local de la demostración. No sustituye autenticación ni pagos de servidor. */
window.App = (() => {
    "use strict";
    const DB_KEY = "ellado_dulce_v1";
    const SESSION_KEY = "ellado_sesion";
    const CHECKOUT_KEY = "ellado_pago";
    const emptyDB = () => ({ usuarios: [], registros: [], carritos: {} });
    const uid = () => crypto.randomUUID();
    const money = value => "B/." + Number(value).toFixed(2);
    const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const dateText = value => value ? value.split("-").reverse().join("/") : "";
    const today = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const tomorrow = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const demoAccounts = [{"id": "demo-cliente", "nombre": "Cliente", "apellido": "Demo", "usuario": "cliente_demo", "correo": "cliente_demo@elladodulce.test", "telefono": "60001001", "rol": "cliente", "salt": "f279001f-cf9c-4367-b05e-fd8a2cb15b97", "hash": "3c372bd11860addad475156ca356794400b2fa343d394f8b2fd7f19f619199a1"}, {"id": "demo-admin", "nombre": "Administrador", "apellido": "Demo", "usuario": "admin_demo", "correo": "admin_demo@elladodulce.test", "telefono": "60001002", "rol": "admin", "salt": "bfebcad0-e862-449d-8c6b-edef4679cbd1", "hash": "48704eeaa1fccc804a19e6b7774ac623c509ead84d41418ad0d67381bc99a750"}];
    function deliveryMin() {
        const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Panama", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).filter(p => p.type !== "literal").map(p => [p.type, p.value]));
        return new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day + 2)).toISOString().slice(0, 10);
    }
    function validateDeliveryDate(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "") || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value || value < deliveryMin()) throw new Error("Elige una fecha de entrega a partir de pasado mañana (" + dateText(deliveryMin()) + ").");
        return value;
    }
    function db() {
        const raw = localStorage.getItem(DB_KEY);
        const data = raw ? JSON.parse(raw) : emptyDB();
        if (!Array.isArray(data.usuarios) || !Array.isArray(data.registros) || !data.carritos || typeof data.carritos !== "object") {
            throw new Error("No se pueden leer los datos locales de esta demostración.");
        }
        if (data.demoAccountsVersion !== 1) {
            for (const account of demoAccounts) {
                if (!data.usuarios.some(u => String(u.usuario || "").toLowerCase() === account.usuario || u.correo === account.correo)) data.usuarios.push({ ...account });
            }
            data.demoAccountsVersion = 1;
            save(data);
        }
        if (data.usuarios.some(u => Object.hasOwn(u, "puntos"))) {
            data.usuarios.forEach(u => { delete u.puntos; });
            save(data);
        }
        return data;
    }
    function save(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    }
    function user() {
        return db().usuarios.find(u => u.id === sessionStorage.getItem(SESSION_KEY)) || null;
    }
    function safeNext(next) {
        return /^[a-zA-Z0-9-]+\.html(?:\?[^#]*)?$/.test(next || "") ? next : "mi-cuenta.html";
    }
    function requireUser() {
        const current = user();
        if (!current) {
            const next = location.pathname.split("/").pop() + location.search;
            const purchase = ["pantalla-de-carrito.html", "pago.html", "detalle-boquita.html"].includes(location.pathname.split("/").pop());
            location.replace("login.html?next=" + encodeURIComponent(safeNext(next)) + (purchase ? "&reason=compra" : ""));
        }
        return current;
    }
    function requireAdmin() {
        const current = requireUser();
        if (!current) return null;
        if (current.rol !== "admin") { location.replace("mi-cuenta.html"); return null; }
        return current;
    }
    function message(text, error = false, parent = document.querySelector("main") || document.body) {
        let box = parent.querySelector(".app-message");
        if (!box) {
            box = document.createElement("p");
            box.className = "app-message";
            box.setAttribute("role", "status");
            parent.prepend(box);
        }
        box.classList.toggle("app-error", error);
        box.textContent = text;
    }
    async function passwordHash(password, salt) {
        const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
        const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 100000, hash: "SHA-256" }, key, 256);
        return Array.from(new Uint8Array(bits), n => n.toString(16).padStart(2, "0")).join("");
    }
    async function register(fields) {
        const normalized = {};
        ["nombre", "apellido", "usuario", "correo", "telefono"].forEach(key => { normalized[key] = String(fields[key] || "").trim(); });
        normalized.correo = normalized.correo.toLowerCase();
        if (Object.values(normalized).some(value => !value) || !String(fields.contrasena || "").trim()) throw new Error("Completa todos los campos.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.correo)) throw new Error("Escribe un correo válido.");
        const salt = uid();
        const hash = await passwordHash(fields.contrasena, salt);
        const data = db();
        if (data.usuarios.some(u => String(u.usuario || "").toLowerCase() === normalized.usuario.toLowerCase() || u.correo === normalized.correo || u.telefono === normalized.telefono)) {
            throw new Error("El usuario, correo o teléfono ya está registrado en este navegador.");
        }
        data.usuarios.push({ ...normalized, id: uid(), salt, hash, rol: "cliente" });
        save(data);
    }
    async function login(name, password) {
        const normalized = name.trim().toLowerCase();
        const current = db().usuarios.find(u => String(u.usuario || "").toLowerCase() === normalized || u.correo === normalized);
        if (!current || await passwordHash(password, current.salt) !== current.hash) throw new Error("Usuario o contraseña incorrectos.");
        sessionStorage.setItem(SESSION_KEY, current.id);
        return current;
    }
    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(CHECKOUT_KEY);
        sessionStorage.removeItem("ellado_ultima_confirmacion");
        location.replace("login.html");
    }
    function cart() {
        const current = user();
        if (!current || current.rol === "admin") return [];
        const items = db().carritos[current.id] || [];
        return items.map(item => {
            const product = Catalogo.productos.find(p => p.id === item.id);
            return product ? { ...item, precio: product.precio, unidadesPorBandeja: product.unidadesPorBandeja, fechaEntrega: item.fechaEntrega || deliveryMin() } : item;
        });
    }
    function saveCart(items) {
        const current = user();
        if (!current) throw new Error("Inicia sesión para usar el carrito.");
        if (current.rol === "admin") throw new Error("El administrador no puede usar el carrito ni realizar compras.");
        const data = db();
        data.carritos[current.id] = items;
        save(data);
    }
    function isAvailable(productId) {
        const list = db().noDisponibles;
        return !Array.isArray(list) || !list.map(Number).includes(Number(productId));
    }
    function setProductAvailability(productId, available) {
        if (user()?.rol !== "admin") throw new Error("Solo el administrador puede modificar la disponibilidad de los productos.");
        const id = Number(productId);
        if (!Catalogo.productos.some(p => p.id === id)) throw new Error("No se encontró el producto.");
        const data = db();
        const unavailable = new Set(Array.isArray(data.noDisponibles) ? data.noDisponibles.map(Number) : []);
        if (available) unavailable.delete(id);
        else unavailable.add(id);
        data.noDisponibles = [...unavailable];
        save(data);
        return Boolean(available);
    }
    function addProduct(product) {
        const current = requireUser();
        if (!current) return false;
        if (current.rol === "admin") throw new Error("El administrador no puede usar el carrito ni realizar compras.");
        if (!isAvailable(product.id)) throw new Error("Este producto no está disponible en este momento.");
        product = { ...product, fechaEntrega: validateDeliveryDate(product.fechaEntrega || deliveryMin()) };
        const items = cart();
        const key = [product.fechaEntrega, product.id, product.sabor || "", product.toppings || "", product.notas || ""].join("|");
        const existing = items.find(item => item.clave === key);
        if (existing) existing.cantidad += product.cantidad;
        else items.push({ ...product, clave: key });
        saveCart(items);
        return true;
    }
    function beginCheckout(details) {
        const current = requireUser();
        if (!current) return;
        if (current.rol === "admin") throw new Error("El administrador no puede realizar compras.");
        const pending = { ...details, id: uid(), userId: current.id };
        quote(pending);
        sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(pending));
        location.href = "pago.html";
    }
    function pendingCheckout() {
        const raw = sessionStorage.getItem(CHECKOUT_KEY);
        return raw ? JSON.parse(raw) : null;
    }
    // Totales calculados a partir del catálogo; los datos de tarjeta nunca se guardan.
    function quote(pending) {
        const current = user();
        if (current?.rol === "admin") throw new Error("El administrador no puede realizar compras.");
        if (!pending || !current || pending.userId !== current.id) throw new Error("Selecciona una compra antes de continuar al pago.");
        let items;
        if (pending.tipo === "pedido") {
            items = cart().map(item => {
                const product = Catalogo.productos.find(p => p.id === item.id);
                if (!product || !Number.isInteger(item.cantidad) || item.cantidad < 1) throw new Error("Revisa los productos de tu carrito.");
                if (!isAvailable(product.id)) throw new Error(`El producto "${product.nombre}" no está disponible en este momento.`);
                validateDeliveryDate(item.fechaEntrega);
                return { ...item, nombre: product.nombre, precio: product.precio, unidadesPorBandeja: product.unidadesPorBandeja };
            });
            if (!items.length) throw new Error("Tu carrito está vacío.");
        } else throw new Error("Selecciona un pedido válido.");
        const cents = items.reduce((sum, item) => sum + Math.round(item.precio * 100) * item.cantidad, 0);
        const taxCents = Math.round(cents * 0.07);
        return { items, subtotal: cents / 100, itbms: taxCents / 100, total: (cents + taxCents) / 100 };
    }
    // Exclusivamente tarjetas ficticias del simulador; nunca introducir tarjetas reales.
    function paymentCards() {
        const current = user();
        if (!current) throw new Error("Inicia sesión para pagar.");
        const data = db();
        data.tarjetas ||= {};
        if (!data.tarjetas[current.id]) {
            data.tarjetas[current.id] = [
                { id: "demo-credito", nombre: "Crédito de prueba", numero: "4111111111111111", vencimiento: "12/35", saldoCentavos: 10000 },
                { id: "demo-debito", nombre: "Débito de prueba", numero: "4000000000000002", vencimiento: "12/35", saldoCentavos: 100 }
            ];
            save(data);
        }
        if (!data.tarjetas[current.id].some(card => card.id === "demo-respaldo")) {
            data.tarjetas[current.id].push({ id: "demo-respaldo", nombre: "Tarjeta de respaldo", numero: "5555555555554444", vencimiento: "12/35", saldoCentavos: 25000 });
            save(data);
        }
        return data.tarjetas[current.id];
    }
    function validateCard(fields) {
        if (!fields || !fields.nombre?.trim() || !fields.numero || !fields.vencimiento || !fields.cvv) throw new Error("Completa todos los campos de la tarjeta.");
        const number = fields.numero.replace(/ /g, "");
        let sum = 0;
        if (!/^\d{16}$/.test(number)) throw new Error("Revisa el número de tu tarjeta.");
        [...number].reverse().forEach((n, i) => { let v = Number(n); if (i % 2) v = v * 2 > 9 ? v * 2 - 9 : v * 2; sum += v; });
        if (sum % 10) throw new Error("Revisa el número de tu tarjeta.");
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fields.vencimiento)) throw new Error("Revisa la fecha de tu tarjeta.");
        const [month, year] = fields.vencimiento.split("/").map(Number);
        if (new Date(2000 + year, month, 1) <= new Date()) throw new Error("La tarjeta está vencida. Utiliza otra tarjeta.");
        if (!/^\d{3,4}$/.test(fields.cvv)) throw new Error("Revisa el CVV de tu tarjeta.");
        const card = paymentCards().find(c => c.numero === number);
        if (!card) throw new Error("Utiliza una de las tarjetas ficticias indicadas en esta página.");
        if (card.vencimiento !== fields.vencimiento || fields.cvv !== "123") throw new Error("Revisa los datos de tu tarjeta. El CVV de prueba es 123.");
        return card;
    }
    function confirmCheckout(fields) {
        const pending = pendingCheckout();
        const current = user();
        if (!pending || !current || pending.userId !== current.id) throw new Error("No hay una compra pendiente para esta cuenta.");
        const data = db();
        let records = data.registros.filter(r => r.checkoutId === pending.id);
        if (!records.length) {
            const totals = quote(pending);
            const card = validateCard(fields);
            const amount = Math.round(totals.total * 100);
            // Volver a leer tras inicializar las tarjetas de cuentas existentes.
            data.tarjetas = db().tarjetas;
            const storedCard = data.tarjetas[current.id].find(c => c.id === card.id);
            if (!Number.isSafeInteger(storedCard.saldoCentavos) || storedCard.saldoCentavos < amount) throw new Error("Pago rechazado: saldo insuficiente.");
            storedCard.saldoCentavos -= amount;
            data.pagos ||= [];
            data.pagos.push({ id: pending.id, userId: current.id, tarjetaId: card.id, totalCentavos: amount, estado: "Pagado", fecha: new Date().toISOString() });
            const type = { pedido: "Pedido", actividad: "Actividad", reserva: "Reserva" }[pending.tipo];
            let remainingTax = Math.round(totals.itbms * 100);
            records = totals.items.map((item, index) => {
                const cents = Math.round(item.precio * 100) * item.cantidad;
                const tax = index === totals.items.length - 1 ? remainingTax : Math.min(remainingTax, Math.round(cents * 0.07));
                remainingTax -= tax;
                return { id: uid(), checkoutId: pending.id, pagoEstado: "Pagado", userId: current.id, itemId: item.id, fechaEntrega: item.fechaEntrega, precioBandeja: item.precio, unidadesPorBandeja: item.unidadesPorBandeja, tipo: type, nombre: item.nombre, cantidad: item.cantidad, total: (cents + tax) / 100, estado: type === "Pedido" ? "En proceso" : "Confirmada", fecha: today(), fechaEvento: pending.tipo === "reserva" ? pending.fechaReserva : item.fecha || "", hora: pending.horaReserva || item.hora || "", notas: item.notas || pending.decoracionDescripcion || "", nombrePrincipal: pending.nombrePrincipal || "", confirmacion: `${type.slice(0, 3).toUpperCase()}-${uid().slice(0, 8).toUpperCase()}` };
            });
            data.registros.push(...records);
            if (pending.tipo === "pedido") data.carritos[current.id] = [];
            save(data);
        }
        sessionStorage.setItem("ellado_ultima_confirmacion", records[0].checkoutId);
        sessionStorage.removeItem(CHECKOUT_KEY);
        return records;
    }
    function adminRecords() {
        if (user()?.rol !== "admin") throw new Error("Solo el administrador puede consultar los pedidos.");
        const data = db();
        return data.registros.filter(r => r.tipo === "Pedido").slice().reverse().map(record => {
            const owner = data.usuarios.find(u => u.id === record.userId) || {};
            const estadoActual = record.estado === "Pendiente" ? "En proceso" : record.estado;
            return { ...record, estado: estadoActual, cliente: `${owner.nombre || ""} ${owner.apellido || ""}`.trim(), cedula: "", celular: owner.telefono || "", correo: owner.correo || "", fecha: dateText(record.fechaEntrega || record.fechaEvento || record.fecha) + " " + record.hora, detalle: `${record.confirmacion}\nEntrega: ${dateText(record.fechaEntrega)}\n${record.nombre}\nBandejas: ${record.cantidad} (${record.unidadesPorBandeja || ""} unidades por bandeja)\nTotal: ${money(record.total)}\n${record.nombrePrincipal}\n${record.notas}` };
        });
    }
    function updateStatus(id, status) {
        if (user()?.rol !== "admin") throw new Error("Solo el administrador puede modificar los pedidos.");
        if (!["En proceso", "Listo", "Entregado"].includes(status)) throw new Error("Estado no válido.");
        const data = db();
        const record = data.registros.find(r => r.id === id && r.tipo === "Pedido");
        if (!record) throw new Error("No se encontró el pedido.");
        record.estado = status;
        save(data);
    }
    return { deliveryMin, validateDeliveryDate, db, user, uid, money, escapeHTML, dateText, today, tomorrow, safeNext, requireUser, requireAdmin, message, register, login, logout, isAvailable, setProductAvailability, cart, saveCart, addProduct, beginCheckout, pendingCheckout, quote, paymentCards, validateCard, confirmCheckout, adminRecords, updateStatus };
})();
