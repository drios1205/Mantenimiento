(() => {
    "use strict";
    const page = location.pathname.split("/").pop() || "index.html";
    const params = new URLSearchParams(location.search);
    const html = App.escapeHTML;
    const text = (selector, value) => {
        const element = document.querySelector(selector);
        if (element) element.textContent = value;
    };
    function bind(values) {
        const replace = value => value.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? ""));
        const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) node.textContent = replace(node.textContent);
        }
        document.querySelectorAll("*").forEach(element => {
            [...element.attributes].forEach(attribute => {
                if (attribute.value.includes("{{")) element.setAttribute(attribute.name, replace(attribute.value));
            });
            if (element.hasAttribute("data-image")) element.src = element.dataset.image;
        });
    }
    function initAuth() {
        const form = document.querySelector("#loginForm, #registroForm");
        if (!form) return;
        const next = App.safeNext(params.get("next"));
        const other = form.querySelector('a[href="registro.html"], a[href="login.html"]');
        if (other && params.has("next")) other.href += "?next=" + encodeURIComponent(next);
        if (params.get("registro") === "ok") App.message("Cuenta creada. Ya puedes iniciar sesión.", false, form);
        form.addEventListener("submit", async event => {
            event.preventDefault();
            const button = form.querySelector('button[type="submit"]');
            if (button.disabled) return;
            button.disabled = true;
            try {
                const fields = Object.fromEntries(new FormData(form));
                if (form.id === "registroForm") {
                    await App.register(fields);
                    location.href = "login.html?registro=ok&next=" + encodeURIComponent(next);
                } else {
                    await App.login(fields.usuario, fields.contrasena);
                    location.href = next;
                }
            } catch (error) {
                App.message(error.message, true, form);
                button.disabled = false;
            }
        });
    }
    function initCatalog() {
        const container = document.querySelector("[data-catalogo]");
        if (!container) return;
        const category = container.dataset.catalogo;
        const activities = category === "actividades";
        const items = activities ? Catalogo.actividades : Catalogo.productos.filter(p => p.categoria === category);
        container.innerHTML = items.map(item => {
            const detail = activities ? "detalle-actividad" : category === "Pasteles" ? "detalle-pastel" : "detalle-boquita";
            const open = !activities || App.activityOpen(item);
            return `<article class="cake-card"><img src="${html(item.imagen)}" alt="${html(item.nombre)}"><div class="cake-content"><h3>${html(item.nombre)}</h3><strong class="cake-price">${App.money(item.precio)}</strong><p>${html(item.descripcion)}</p>${activities ? `<div class="tags"><span class="tag orange">${App.dateText(item.fecha)} - ${html(item.hora)}</span><span class="tag pink">${App.available(item)} cupos disponibles</span></div>` : ""}${open ? `<a href="${detail}.html?id=${item.id}">Ver ${activities ? "detalles" : "más"}</a>` : '<span class="tag">Actividad no disponible</span>'}</div></article>`;
        }).join("");
    }
    function initAccount(current) {
        if (page !== "mi-cuenta.html") return;
        const records = App.db().registros.filter(r => r.userId === current.id).reverse();
        const row = cells => '<div class="table-row">' + cells.map(cell => `<span>${html(cell)}</span>`).join("") + '</div>';
        const types = { actividades: "Actividad", ordenes: "Pedido", reservas: "Reserva" };
        Object.entries(types).forEach(([section, type]) => {
            const table = document.querySelector(`#${section}Section .history-table`);
            const filtered = records.filter(r => r.tipo === type);
            table.insertAdjacentHTML("beforeend", filtered.length ? filtered.map(record => {
                if (type === "Pedido") return row([record.nombre, record.cantidad, App.money(record.total), record.estado]);
                return row([record.nombre, App.dateText(record.fechaEvento) + " " + record.hora, type === "Actividad" ? record.confirmacion : App.money(record.total), record.estado]);
            }).join("") : '<div class="empty-message">Todavía no tienes registros en esta sección.</div>');
        });
        const select = document.getElementById("historySelect");
        const show = () => Object.keys(types).forEach(section => document.getElementById(section + "Section").classList.toggle("hidden", select.value !== section));
        select.addEventListener("change", show);
        show();
    }
    function initPayment() {
        if (page !== "pago.html") return;
        const form = document.getElementById("pagoForm");
        const pending = App.pendingCheckout();
        let totals;
        try { totals = App.quote(pending); }
        catch (error) {
            form.hidden = true;
            App.message(error.message, true);
            const link = document.createElement("a");
            link.href = "mi-cuenta.html";
            link.textContent = "Volver a mi cuenta";
            document.querySelector("main").append(link);
            return;
        }
        const descriptions = { pedido: "Resumen del pedido", actividad: "Resumen de la actividad", reserva: "Resumen de la reserva" };
        text(".summary-card h2", descriptions[pending.tipo]);
        const back = document.querySelector(".back-cart");
        back.href = { pedido: "pantalla-de-carrito.html", actividad: "actividades.html", reserva: "reservas.html" }[pending.tipo];
        document.querySelector(".summary-products").innerHTML = totals.items.map(item => `<div class="summary-product"><div><strong>${html(item.nombre)}</strong><span>Cantidad: ${item.cantidad}</span>${pending.tipo === "reserva" ? `<span>${App.dateText(pending.fechaReserva)} | ${html(pending.horaReserva)}</span><span>${html(pending.nombrePrincipal)}</span>` : ""}</div><b>${App.money(item.precio * item.cantidad)}</b></div>`).join("");
        ["subtotal", "itbms", "total"].forEach(key => text("#pago-" + key, App.money(totals[key])));
        document.getElementById("pago-descuento-line").hidden = totals.descuento === 0;
        text("#pago-descuento", "-" + App.money(totals.descuento));
        const card = document.getElementById("numeroTarjeta");
        const expiry = document.getElementById("fechaTarjeta");
        const cvv = document.getElementById("cvv");
        card.pattern = "[0-9]{4} [0-9]{4} [0-9]{4} [0-9]{4}";
        card.inputMode = expiry.inputMode = cvv.inputMode = "numeric";
        expiry.pattern = "(0[1-9]|1[0-2])/[0-9]{2}";
        cvv.pattern = "[0-9]{3,4}";
        card.addEventListener("input", () => { card.value = card.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); });
        expiry.addEventListener("input", () => {
            const value = expiry.value.replace(/\D/g, "").slice(0, 4);
            expiry.value = value.length > 2 ? value.slice(0, 2) + "/" + value.slice(2) : value;
        });
        form.addEventListener("submit", event => {
            event.preventDefault();
            const button = form.querySelector("button");
            if (button.disabled) return;
            try {
                const latest = App.quote(App.pendingCheckout());
                if (JSON.stringify(latest) !== JSON.stringify(totals)) {
                    App.message("La compra cambió. Recarga la página para revisar el resumen actualizado.", true, form);
                    return;
                }
                button.disabled = true;
                App.confirmCheckout();
            } catch (error) {
                button.disabled = false;
                App.message(error.message, true, form);
            }
        });
    }
    try {
        if (page === "logout.html") { App.logout(); return; }
        const protectedPages = ["mi-cuenta.html", "pantalla-de-carrito.html", "pago.html", "pedido-confirmado.html", "admin.html"];
        const current = protectedPages.includes(page) ? App.requireUser() : App.user();
        if (protectedPages.includes(page) && !current) return;
        let values = { nombreCliente: current?.nombre || "", puntosCliente: current?.puntos || 0, descuentoDisponible: ((current?.puntos || 0) / 10).toFixed(2) };
        const detailTypes = { "detalle-pastel.html": [Catalogo.productos.filter(p => p.categoria === "Pasteles"), "Pasteles.html"], "detalle-boquita.html": [Catalogo.productos.filter(p => p.categoria !== "Pasteles"), "boquitas-dulces.html"], "detalle-actividad.html": [Catalogo.actividades, "actividades.html"], "detalle-reserva.html": [Catalogo.reservas, "reservas.html"] };
        if (detailTypes[page]) {
            const [items, fallback] = detailTypes[page];
            const item = items.find(entry => entry.id === Number(params.get("id")));
            if (!item) { location.replace(fallback); return; }
            values = { ...values, ...item, precioTexto: item.precio.toFixed(2), nombreWhatsapp: encodeURIComponent(item.nombre), paginaVolver: item.categoria === "Boquitas Saladas" ? "boquitas-saladas.html" : "boquitas-dulces.html", fechaTexto: App.dateText(item.fecha) };
            if (page === "detalle-actividad.html") {
                values.cupos = App.available(item);
                values.estado = App.activityOpen(item) ? "Disponible" : "No disponible";
                const button = document.getElementById("comprarActividad");
                button.disabled = !App.activityOpen(item);
                button.textContent = button.disabled ? "Actividad no disponible" : "Comprar cupo";
                button.addEventListener("click", () => {
                    try { App.beginCheckout({ tipo: "actividad", itemId: item.id }); }
                    catch (error) { App.message(error.message, true); }
                });
            }
            if (page === "detalle-reserva.html") {
                document.querySelector(".include-list").innerHTML = item.incluye.map(value => `<li><span></span>${html(value)}</li>`).join("");
            }
            const orderForm = document.getElementById("orderForm");
            if (orderForm) orderForm.dataset.id = item.id;
        }
        bind(values);
        if (page === "admin.html") window.registrosAdmin = App.adminRecords();
        if (page === "reservas.html") {
            document.querySelectorAll(".event-card").forEach((card, index) => {
                const item = Catalogo.reservas[index];
                card.querySelector(".event-price").innerHTML = `${App.money(item.precio)} <span>/ ${item.horas} horas</span>`;
                card.querySelector("h3").textContent = item.nombre;
                card.querySelector(".event-description").textContent = item.descripcion;
            });
        }
        if (page === "pedido-confirmado.html") {
            const id = sessionStorage.getItem("ellado_ultima_confirmacion");
            const records = App.db().registros.filter(r => r.checkoutId === id && r.userId === current.id);
            if (!records.length) { location.replace("mi-cuenta.html"); return; }
            text("#confirmacion", "Confirmación: " + records.map(r => r.confirmacion).join(", "));
        }
        initAuth();
        initCatalog();
        initAccount(current);
        initPayment();
        document.querySelectorAll(".cart a").forEach(link => {
            const count = document.createElement("span");
            count.className = "cart-count";
            count.textContent = App.cart().reduce((total, item) => total + item.cantidad, 0);
            link.append(count);
        });
    } catch (error) {
        App.message("No se pudo abrir la demostración: " + error.message + " Comprueba que el navegador permita guardar datos locales.", true);
    }
})();
