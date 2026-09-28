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
    function db() {
        const raw = localStorage.getItem(DB_KEY);
        if (!raw) return emptyDB();
        const data = JSON.parse(raw);
        if (!Array.isArray(data.usuarios) || !Array.isArray(data.registros) || !data.carritos || typeof data.carritos !== "object") {
            throw new Error("No se pueden leer los datos locales de esta demostración.");
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
            location.replace("login.html?next=" + encodeURIComponent(safeNext(next)));
        }
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
        if (data.usuarios.some(u => u.usuario.toLowerCase() === normalized.usuario.toLowerCase() || u.correo === normalized.correo || u.telefono === normalized.telefono)) {
            throw new Error("El usuario, correo o teléfono ya está registrado en este navegador.");
        }
        data.usuarios.push({ ...normalized, id: uid(), salt, hash, puntos: 0 });
        save(data);
    }
    async function login(name, password) {
        const normalized = name.trim().toLowerCase();
        const current = db().usuarios.find(u => u.usuario.toLowerCase() === normalized || u.correo === normalized);
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
        const items = current ? db().carritos[current.id] || [] : [];
        return items.map(item => {
            const product = Catalogo.productos.find(p => p.id === item.id);
            return product ? { ...item, precio: product.precio } : item;
        });
    }
    function saveCart(items) {
        const current = user();
        if (!current) throw new Error("Inicia sesión para usar el carrito.");
        const data = db();
        data.carritos[current.id] = items;
        save(data);
    }
    function addProduct(product) {
        if (!requireUser()) return false;
        const items = cart();
        const key = [product.id, product.sabor || "", product.toppings || "", product.notas || ""].join("|");
        const existing = items.find(item => item.clave === key);
        if (existing) existing.cantidad += product.cantidad;
        else items.push({ ...product, clave: key });
        saveCart(items);
        return true;
    }
    function available(activity, data = db()) {
        const booked = data.registros.filter(r => r.tipo === "Actividad" && r.itemId === activity.id && r.estado !== "Cancelada").length;
        return Math.max(0, activity.cupos - booked);
    }
    function activityOpen(activity) {
        return activity.estado === "Disponible" && activity.fecha >= today() && available(activity) > 0;
    }
    function occupiedDates(data = db()) {
        return data.registros.filter(r => r.tipo === "Reserva" && r.estado !== "Cancelada").map(r => r.fechaEvento);
    }
    function validateReservation(details) {
        if (!details.nombrePrincipal || !details.nombrePrincipal.trim()) throw new Error("Completa el nombre de la reserva.");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(details.fechaReserva || "") || details.fechaReserva < tomorrow() || Number.isNaN(Date.parse(details.fechaReserva))) throw new Error("La reserva debe hacerse con al menos un día de anticipación.");
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(details.horaReserva || "")) throw new Error("Selecciona una hora válida.");
        if (occupiedDates().includes(details.fechaReserva)) throw new Error("Esa fecha ya está ocupada. Elige otro día.");
    }
    function beginCheckout(details) {
        const current = requireUser();
        if (!current) return;
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
        if (!pending || !current || pending.userId !== current.id) throw new Error("Selecciona una compra antes de continuar al pago.");
        let items;
        if (pending.tipo === "pedido") {
            items = cart().map(item => {
                const product = Catalogo.productos.find(p => p.id === item.id);
                if (!product || !Number.isInteger(item.cantidad) || item.cantidad < 1) throw new Error("Revisa los productos de tu carrito.");
                return { ...item, nombre: product.nombre, precio: product.precio };
            });
            if (!items.length) throw new Error("Tu carrito está vacío.");
        } else if (pending.tipo === "actividad") {
            const activity = Catalogo.actividades.find(a => a.id === Number(pending.itemId));
            if (!activity || !activityOpen(activity)) throw new Error("Esta actividad ya no tiene cupos disponibles.");
            items = [{ ...activity, cantidad: 1 }];
        } else if (pending.tipo === "reserva") {
            const reservation = Catalogo.reservas.find(r => r.id === Number(pending.itemId));
            if (!reservation) throw new Error("La reserva seleccionada no existe.");
            validateReservation(pending);
            items = [{ ...reservation, cantidad: 1 }];
        } else throw new Error("Selecciona un tipo de compra válido.");
        const cents = items.reduce((sum, item) => sum + Math.round(item.precio * 100) * item.cantidad, 0);
        const pointsUsed = pending.tipo === "pedido" && pending.usarPuntos ? Math.min(current.puntos, Math.floor(cents / 10)) : 0;
        const discountCents = pointsUsed * 10;
        const taxCents = Math.round(cents * 0.07);
        return { items, subtotal: cents / 100, itbms: taxCents / 100, descuento: discountCents / 100, total: (cents + taxCents - discountCents) / 100, puntosUsados: pointsUsed, puntosGanados: pending.tipo === "pedido" ? Math.floor((cents - discountCents) / 100) : 0 };
    }
    function confirmCheckout() {
        const pending = pendingCheckout();
        const current = user();
        if (!pending || !current || pending.userId !== current.id) throw new Error("No hay una compra pendiente para esta cuenta.");
        const data = db();
        let records = data.registros.filter(r => r.checkoutId === pending.id);
        if (!records.length) {
            const totals = quote(pending);
            const type = { pedido: "Pedido", actividad: "Actividad", reserva: "Reserva" }[pending.tipo];
            let remainingDiscount = Math.round(totals.descuento * 100);
            let remainingTax = Math.round(totals.itbms * 100);
            records = totals.items.map((item, index) => {
                const cents = Math.round(item.precio * 100) * item.cantidad;
                const discount = Math.min(remainingDiscount, cents);
                const tax = index === totals.items.length - 1 ? remainingTax : Math.min(remainingTax, Math.round(cents * 0.07));
                remainingDiscount -= discount;
                remainingTax -= tax;
                return { id: uid(), checkoutId: pending.id, userId: current.id, itemId: item.id, tipo: type, nombre: item.nombre, cantidad: item.cantidad, total: (cents + tax - discount) / 100, estado: type === "Pedido" ? "Pendiente" : "Confirmada", fecha: today(), fechaEvento: pending.tipo === "reserva" ? pending.fechaReserva : item.fecha || "", hora: pending.horaReserva || item.hora || "", notas: item.notas || pending.decoracionDescripcion || "", nombrePrincipal: pending.nombrePrincipal || "", confirmacion: `${type.slice(0, 3).toUpperCase()}-${uid().slice(0, 8).toUpperCase()}` };
            });
            data.registros.push(...records);
            const storedUser = data.usuarios.find(u => u.id === current.id);
            storedUser.puntos = storedUser.puntos - totals.puntosUsados + totals.puntosGanados;
            if (pending.tipo === "pedido") data.carritos[current.id] = [];
            save(data);
        }
        sessionStorage.setItem("ellado_ultima_confirmacion", records[0].checkoutId);
        sessionStorage.removeItem(CHECKOUT_KEY);
        location.replace("pedido-confirmado.html");
    }
    function adminRecords() {
        const data = db();
        return data.registros.slice().reverse().map(record => {
            const owner = data.usuarios.find(u => u.id === record.userId) || {};
            return { ...record, cliente: `${owner.nombre || ""} ${owner.apellido || ""}`.trim(), cedula: "", celular: owner.telefono || "", correo: owner.correo || "", fecha: dateText(record.fechaEvento || record.fecha) + " " + record.hora, detalle: `${record.confirmacion}\n${record.nombre}\nCantidad: ${record.cantidad}\nTotal: ${money(record.total)}\n${record.nombrePrincipal}\n${record.notas}` };
        });
    }
    function updateStatus(id, status) {
        if (!user()) throw new Error("Inicia sesión para abrir el panel local.");
        if (!["Pendiente", "En proceso", "Listo", "Entregado"].includes(status)) throw new Error("Estado no válido.");
        const data = db();
        const record = data.registros.find(r => r.id === id && r.tipo === "Pedido");
        if (!record) throw new Error("No se encontró el pedido.");
        record.estado = status;
        save(data);
    }
    return { db, user, uid, money, escapeHTML, dateText, today, tomorrow, safeNext, requireUser, message, register, login, logout, cart, saveCart, addProduct, available, activityOpen, occupiedDates, validateReservation, beginCheckout, pendingCheckout, quote, confirmCheckout, adminRecords, updateStatus };
})();
