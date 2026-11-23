(() => {
    const form = document.getElementById("orderForm");
    const product = Catalogo.productos.find(p => p.id === Number(form?.dataset.id));
    if (!product) return;
    if (!App.user()) {
        const notice = document.createElement("p");
        notice.className = "signin-notice";
        notice.setAttribute("role", "status");
        notice.append("Para agregar productos al carrito, ");
        const link = document.createElement("a");
        link.href = "login.html?reason=compra&next=" + encodeURIComponent(location.pathname.split("/").pop() + location.search);
        link.textContent = "inicia sesión";
        notice.append(link, ". Puedes seguir consultando el catálogo sin iniciar sesión.");
        form.before(notice);
    }
    const delivery = DeliveryCalendar(form.querySelector("[data-delivery-date]"));
    let quantity = 1;
    const subtract = document.getElementById("btnRestar");
    const add = document.getElementById("btnSumar");
    const cartButton = document.getElementById("btnAgregarCarrito");
    const available = App.isAvailable(product.id);
    if (!available) {
        const unavailableNotice = document.createElement("p");
        unavailableNotice.className = "unavailable-notice";
        unavailableNotice.setAttribute("role", "status");
        unavailableNotice.textContent = "No disponible en este momento.";
        form.before(unavailableNotice);
        cartButton.disabled = true;
        cartButton.textContent = "No disponible";
        add.disabled = true;
        const notesInput = document.getElementById("notasEspecificas");
        if (notesInput) notesInput.disabled = true;
    }
    function render() {
        document.getElementById("cantidad").textContent = quantity;
        document.querySelector('.product-price').textContent = App.money(product.precio) + ' · Bandeja de ' + product.unidadesPorBandeja + ' unidades';
        document.getElementById("subtotalPrice").textContent = App.money(Math.round(product.precio * 100) * quantity / 100);
        subtract.disabled = !available || quantity === 1;
        add.disabled = !available;
    }
    subtract.addEventListener("click", () => { quantity = Math.max(1, quantity - 1); render(); });
    add.addEventListener("click", () => { quantity++; render(); });
    form.addEventListener("submit", event => event.preventDefault());
    document.getElementById("btnAgregarCarrito").addEventListener("click", () => {
        try {
            const added = App.addProduct({ id: product.id, nombre: product.nombre, categoria: product.categoria, precio: product.precio, imagen: product.imagen, cantidad: quantity, fechaEntrega: delivery.value, notas: document.getElementById("notasEspecificas").value.trim(), sabor: "", toppings: "" });
            if (added) location.href = "pantalla-de-carrito.html";
        } catch (error) { App.message(error.message, true, form); }
    });
    render();
})();
