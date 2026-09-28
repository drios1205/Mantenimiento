(() => {
    const form = document.getElementById("orderForm");
    const product = Catalogo.productos.find(p => p.id === Number(form?.dataset.id));
    if (!product) return;
    let quantity = 1;
    const subtract = document.getElementById("btnRestar");
    const add = document.getElementById("btnSumar");
    function render() {
        document.getElementById("cantidad").textContent = quantity;
        document.getElementById("subtotalPrice").textContent = App.money(product.precio * quantity);
        subtract.disabled = quantity === 1;
    }
    subtract.addEventListener("click", () => { quantity = Math.max(1, quantity - 1); render(); });
    add.addEventListener("click", () => { quantity++; render(); });
    form.addEventListener("submit", event => event.preventDefault());
    document.getElementById("btnAgregarCarrito").addEventListener("click", () => {
        try {
            const added = App.addProduct({ id: product.id, nombre: product.nombre, categoria: product.categoria, precio: product.precio, imagen: product.imagen, cantidad: quantity, notas: document.getElementById("notasEspecificas").value.trim(), sabor: "", toppings: "" });
            if (added) location.href = "pantalla-de-carrito.html";
        } catch (error) { App.message(error.message, true, form); }
    });
    render();
})();
