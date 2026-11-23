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
        const reason = params.get("reason") === "compra" ? "&reason=compra" : "";
        if (form.id === "loginForm" && reason) {
            const caption = document.createElement("p");
            caption.className = "purchase-login-text";
            caption.textContent = "Inicia sesión antes de realizar una compra.";
            document.querySelector(".login-text").after(caption);
            const dismissPurchaseHint = event => {
                if (!event.target.matches('#usuario, #contrasena')) return;
                caption.remove();
                form.removeEventListener("focusin", dismissPurchaseHint);
            };
            form.addEventListener("focusin", dismissPurchaseHint);
        }
        if (other && params.has("next")) other.href += "?next=" + encodeURIComponent(next) + reason;
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
                    location.href = "login.html?registro=ok&next=" + encodeURIComponent(next) + reason;
                } else {
                    const account = await App.login(fields.usuario, fields.contrasena);
                    location.replace(account.rol === "admin" ? "admin.html" : next);
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
        const items = Catalogo.productos.filter(p => p.categoria === category);
        container.innerHTML = items.map(item => {
            const available = App.isAvailable(item.id);
            const content = `<img src="${html(item.imagen)}" alt="${html(item.nombre)}"><div class="cake-content"><h3>${html(item.nombre)}</h3><strong class="cake-price">${App.money(item.precio)}</strong><p class="pack-description">Bandeja de ${item.unidadesPorBandeja} unidades</p>${available ? "" : '<span class="unavailable-pill">No disponible</span>'}</div>`;
            return `<article class="cake-card${available ? "" : " is-unavailable"}">${available ? `<a class="catalog-product-link" href="detalle-boquita.html?id=${item.id}" aria-label="Ver ${html(item.nombre)}">${content}</a>` : `<div class="catalog-product-link" aria-disabled="true">${content}</div>`}</article>`;
        }).join("");
    }
    function initAccount(current) {
        if (page !== "mi-cuenta.html") return;
        const records = App.db().registros.filter(r => r.userId === current.id && r.tipo === "Pedido").reverse();
        const filters = document.getElementById("historyFilters");
        const search = document.getElementById("historySearch");
        const status = document.getElementById("historyStatus");
        const from = document.getElementById("historyFrom");
        const to = document.getElementById("historyTo");
        const previous = document.getElementById("historyPrevious");
        const next = document.getElementById("historyNext");
        const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const state = record => record.estado === "Pendiente" ? "En proceso" : record.estado;
        const pageSize = 5;
        let pageNumber = 1;
        function render() {
            const matches = records.filter(record => normalize(record.nombre).includes(normalize(search.value.trim()))
                && (!status.value || state(record) === status.value)
                && (!from.value || record.fecha >= from.value)
                && (!to.value || record.fecha <= to.value));
            const pages = Math.max(1, Math.ceil(matches.length / pageSize));
            pageNumber = Math.min(pageNumber, pages);
            const start = (pageNumber - 1) * pageSize;
            document.getElementById("historyRows").innerHTML = matches.slice(start, start + pageSize).map(record =>
                '<div class="table-row">' + [record.nombre, App.dateText(record.fecha), App.dateText(record.fechaEntrega), record.cantidad, App.money(record.total), state(record)].map(cell => `<span>${html(cell)}</span>`).join("") + '</div>'
            ).join("") || (records.length
                ? '<div class="empty-message" role="status"><strong>No hay pedidos con esos filtros</strong><p>Prueba otra búsqueda o limpia los filtros.</p></div>'
                : '<div class="empty-message" role="status"><img class="history-empty-icon" src="imagenes/carrito-vacio.svg" width="120" height="110" alt=""><strong class="history-empty-title">Aún no tienes pedidos</strong><p>Cuando realices una compra, tus pedidos aparecerán aquí.</p></div>');
            text("#historyCount", matches.length ? `Mostrando ${start + 1}–${Math.min(start + pageSize, matches.length)} de ${matches.length} pedidos` : "0 pedidos");
            text("#historyPage", `Página ${pageNumber} de ${pages}`);
            previous.disabled = pageNumber === 1;
            next.disabled = pageNumber === pages;
        }
        filters.addEventListener("submit", event => event.preventDefault());
        filters.addEventListener("input", () => { pageNumber = 1; render(); });
        filters.addEventListener("reset", event => {
            event.preventDefault();
            [search, status, from, to].forEach(field => { field.value = ""; });
            pageNumber = 1; render();
        });
        previous.addEventListener("click", () => { if (pageNumber > 1) { pageNumber--; render(); } });
        next.addEventListener("click", () => { pageNumber++; render(); });
        render();
    }

    function initPayment() {
        if (page !== "pago.html") return;
        const form = document.getElementById("pagoForm");
        const pending = App.pendingCheckout();
        let totals;
        try { totals = App.quote(pending); }
        catch (error) {
            document.querySelector(".payment-page").hidden = true;
            location.replace(App.cart().length ? "pantalla-de-carrito.html" : "index.html");
            return;
        }
        const descriptions = { pedido: "Resumen del pedido" };
        text(".summary-card h2", descriptions[pending.tipo]);
        const back = document.querySelector(".back-cart");
        back.href = "pantalla-de-carrito.html";
        document.querySelector(".summary-products").innerHTML = totals.items.map(item => `<div class="summary-product"><div><strong>${html(item.nombre)}</strong><span>${item.cantidad} bandeja${item.cantidad === 1 ? "" : "s"} de ${item.unidadesPorBandeja} unidades</span><span>Entrega: ${App.dateText(item.fechaEntrega)}</span>${pending.tipo === "reserva" ? `<span>${App.dateText(pending.fechaReserva)} | ${html(pending.horaReserva)}</span><span>${html(pending.nombrePrincipal)}</span>` : ""}</div><b>${App.money(item.precio * item.cantidad)}</b></div>`).join("");
        ["subtotal", "itbms", "total"].forEach(key => text("#pago-" + key, App.money(totals[key])));
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
        const cards = App.paymentCards();
        const select = document.getElementById("tarjetaGuardada");
        cards.forEach(c => select.add(new Option(`${c.nombre} •••• ${c.numero.slice(-4)}`, c.id)));
        select.addEventListener("change", () => {
            form.querySelector(".payment-error").textContent = "";
            const chosen = App.paymentCards().find(c => c.id === select.value);
            if (chosen) {
                document.getElementById("nombreTarjeta").value = App.user().nombre;
                card.value = chosen.numero.match(/.{4}/g).join(" ");
                expiry.value = chosen.vencimiento;
                cvv.value = "123";
            }
            text("#saldoTarjeta", chosen ? `Saldo ficticio: ${App.money(chosen.saldoCentavos / 100)}` : "");
        });
        const success = document.getElementById("compraExitosa");
        let invoiceLines = [];
        const close = () => { location.replace("index.html"); };
        document.getElementById("cerrarCompra").onclick = close;
        success.addEventListener("cancel", e => { e.preventDefault(); close(); });
        document.getElementById("verFactura").onclick = () => {
            const id = sessionStorage.getItem("ellado_ultima_confirmacion");
            const records = App.db().registros.filter(r => r.checkoutId === id && r.userId === App.user().id);
            invoiceLines = ["El Lado Dulce", "Factura " + id, "Fecha: " + App.dateText(records[0].fecha), "Cliente: " + App.user().nombre,
                ...records.map(r => `${r.nombre}: ${r.cantidad} bandeja(s) de ${r.unidadesPorBandeja} unidades | ${App.money(r.precioBandeja)} por bandeja | ${App.money(r.precioBandeja * r.cantidad)} | Entrega: ${App.dateText(r.fechaEntrega)}`),
                "Subtotal: " + App.money(totals.subtotal), "ITBMS: " + App.money(totals.itbms), "Total pagado: " + App.money(totals.total)];
            document.getElementById("facturaContenido").innerHTML = `<header class="receipt-heading"><h3>El Lado Dulce</h3><p>Factura ${html(id)}</p><p>Fecha: ${App.dateText(records[0].fecha)}<br>Cliente: ${html(App.user().nombre)}</p></header>
                <table class="receipt-table"><thead><tr><th>Producto</th><th>Bandejas</th><th>Precio</th><th>Importe</th></tr></thead><tbody>${records.map(r => `<tr><td>${html(r.nombre)}<small>${r.unidadesPorBandeja} unidades por bandeja<br>Entrega: ${App.dateText(r.fechaEntrega)}</small></td><td>${r.cantidad}</td><td>${App.money(r.precioBandeja)}</td><td>${App.money(r.precioBandeja * r.cantidad)}</td></tr>`).join("")}</tbody></table>
                <dl class="receipt-totals"><div><dt>Subtotal</dt><dd>${App.money(totals.subtotal)}</dd></div><div><dt>ITBMS</dt><dd>${App.money(totals.itbms)}</dd></div><div><dt>Total pagado</dt><dd>${App.money(totals.total)}</dd></div></dl>`;
            document.getElementById("confirmacionCompra").hidden = true;
            document.getElementById("verFactura").hidden = true;
            document.getElementById("vistaFactura").hidden = false;
            success.classList.add("showing-invoice");
            success.setAttribute("aria-labelledby", "tituloFactura");
            document.getElementById("descargarFactura").focus();
        };
        document.getElementById("descargarFactura").onclick = () => {
            // PDF de demostración, con líneas cortas y codificación ASCII para el archivo.
            const lines = invoiceLines.join("\n").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E\n]/g, " ").split("\n").flatMap(line => line.match(/.{1,75}/g) || [""]);
            const content = "BT /F1 12 Tf 40 790 Td " + lines.map((line, i) => (i ? "0 -22 Td " : "") + "(" + line.replace(/[\\()]/g, "\\$&") + ") Tj").join("\n") + " ET";
            const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
            let pdf = "%PDF-1.4\n"; const offsets = [0];
            objects.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i+1} 0 obj\n${o}\nendobj\n`; });
            const xref = pdf.length;
            pdf += `xref\n0 6\n0000000000 65535 f \n` + offsets.slice(1).map(o => `${String(o).padStart(10, "0")} 00000 n \n`).join("") + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
            const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
            const link = document.createElement("a"); link.href = url; link.download = `Factura_${sessionStorage.getItem("ellado_ultima_confirmacion")}.pdf`; link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        };
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
                App.confirmCheckout({ nombre: document.getElementById("nombreTarjeta").value, numero: card.value, vencimiento: expiry.value, cvv: cvv.value });
                form.querySelectorAll("input, select").forEach(el => el.disabled = true);
                const checkoutId = sessionStorage.getItem("ellado_ultima_confirmacion");
                const records = App.db().registros.filter(record => record.checkoutId === checkoutId && record.userId === App.user().id);
                text("#numeroPedido", "Confirmación del pedido: " + records.map(record => record.confirmacion).join(", "));
                success.showModal();
            } catch (error) {
                button.disabled = false;
                App.message(error.message, true, form);
            }
        });
    }
    window.addEventListener("pageshow", () => {
        if (page === "pago.html" && App.user() && !App.pendingCheckout() && !document.getElementById("compraExitosa").open) {
            document.querySelector(".payment-page").hidden = true;
            location.replace(App.cart().length ? "pantalla-de-carrito.html" : "index.html");
            return;
        }
        if (page !== "admin.html" && page !== "logout.html" && App.user()?.rol === "admin") {
            location.replace("admin.html");
        }
    });
    try {
        if (page === "logout.html") { App.logout(); return; }
        if (page !== "admin.html" && App.user()?.rol === "admin") {
            location.replace("admin.html");
            return;
        }
        const protectedPages = ["mi-cuenta.html", "pantalla-de-carrito.html", "pago.html", "pedido-confirmado.html", "admin.html"];
        const current = page === "admin.html" ? App.requireAdmin() : protectedPages.includes(page) ? App.requireUser() : App.user();
        if (protectedPages.includes(page) && !current) return;
        let values = { nombreCliente: current?.nombre || "" };
        const detailTypes = { "detalle-boquita.html": [Catalogo.productos, "boquitas-dulces.html"] };
        if (detailTypes[page]) {
            const [items, fallback] = detailTypes[page];
            const item = items.find(entry => entry.id === Number(params.get("id")));
            if (!item || !App.isAvailable(item.id)) { location.replace(item?.categoria === "Boquitas Saladas" ? "boquitas-saladas.html" : fallback); return; }
            values = { ...values, ...item, precioTexto: item.precio.toFixed(2), nombreWhatsapp: encodeURIComponent(item.nombre), paginaVolver: item.categoria === "Boquitas Saladas" ? "boquitas-saladas.html" : "boquitas-dulces.html", fechaTexto: App.dateText(item.fecha) };
            const orderForm = document.getElementById("orderForm");
            if (orderForm) orderForm.dataset.id = item.id;
        }
        if (!current) {
            const accountLink = document.querySelector('.navbar .menu a[href="mi-cuenta.html"]');
            if (accountLink) { accountLink.href = "login.html"; accountLink.textContent = "Iniciar sesión"; }
        }
        const adminLink = document.querySelector('.local-admin-link');
        if (adminLink) adminLink.hidden = true;
        bind(values);
        if (page === "admin.html") window.registrosAdmin = App.adminRecords();
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
