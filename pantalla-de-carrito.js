(() => {
    if (!App.user()) return;
    const container = document.getElementById("cartItems");
    const checkout = document.getElementById("checkoutBtn");
    const html = App.escapeHTML;
    function summary() {
        const items = App.cart();
        let totals = { subtotal: 0, itbms: 0, total: 0 };
        let valid = true;
        try { if (items.length) totals = App.quote({ tipo: "pedido", userId: App.user().id }); }
        catch(error) { valid = false; App.message(error.message, true); }
        if (valid) { const message = document.querySelector("main .app-message"); if (message) message.remove(); }
        document.getElementById("subtotalAmount").textContent = App.money(totals.subtotal);
        document.getElementById("itbmsAmount").textContent = App.money(totals.itbms);
        document.getElementById("totalAmount").textContent = App.money(totals.total);
        checkout.disabled = !items.length || !valid;
        document.querySelectorAll(".cart-count").forEach(counter => { counter.textContent = items.reduce((sum, item) => sum + item.cantidad, 0); });
    }
    function render() {
        const items = App.cart();
        document.getElementById("emptyCartMessage").classList.toggle("hidden", items.length > 0);
        container.innerHTML = items.map((item, index) => `<article class="cart-item"><div class="item-img-placeholder"><img src="${html(item.imagen)}" alt="${html(item.nombre)}"></div><div class="item-details"><h3>${html(item.nombre)}</h3>${item.notas ? `<p class="item-meta">Notas: ${html(item.notas)}</p>` : ""}<div data-cart-delivery="${index}"></div></div><div class="item-quantity"><button type="button" class="qty-btn" data-action="subtract" data-index="${index}" ${item.cantidad === 1 ? "disabled" : ""} aria-label="Restar cantidad">−</button><input type="text" value="${item.cantidad}" readonly aria-label="Cantidad de bandejas"><button type="button" class="qty-btn" data-action="add" data-index="${index}" aria-label="Sumar cantidad">+</button></div><strong class="item-total">${App.money(item.precio * item.cantidad)}</strong><button type="button" class="item-remove" data-action="remove" data-index="${index}" aria-label="Eliminar producto">×</button></article>`).join("");
        container.querySelectorAll('[data-cart-delivery]').forEach(host => {
            const index = Number(host.dataset.cartDelivery);
            DeliveryCalendar(host, items[index].fechaEntrega, value => {
                const current = App.cart(); current[index].fechaEntrega = value;
                current[index].clave = [value, current[index].id, current[index].sabor || "", current[index].toppings || "", current[index].notas || ""].join("|");
                App.saveCart(current); summary();
            });
        });
        summary();
    }
    container.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const items = App.cart();
        const index = Number(button.dataset.index);
        if (!items[index]) return;
        if (button.dataset.action === "add") items[index].cantidad++;
        if (button.dataset.action === "subtract") items[index].cantidad = Math.max(1, items[index].cantidad - 1);
        if (button.dataset.action === "remove") items.splice(index, 1);
        try { App.saveCart(items); render(); } catch (error) { App.message(error.message, true); }
    });
    document.getElementById("clearCartBtn").addEventListener("click", () => {
        try { App.saveCart([]); render(); } catch (error) { App.message(error.message, true); }
    });
    checkout.addEventListener("click", () => {
        try { App.beginCheckout({ tipo: "pedido" }); }
        catch (error) { App.message(error.message, true); }
    });
    render();
})();
