// Compatibilidad para botones que agreguen productos desde otras páginas.
function agregarAlCarrito(nombre) {
    const product = Catalogo.productos.find(item => item.nombre === nombre);
    if (!product) return;
    try {
        if (App.addProduct({ ...product, cantidad: 1, notas: "" })) actualizarContadorCarrito();
    } catch (error) { App.message(error.message, true); }
}
function actualizarContadorCarrito() {
    const count = App.cart().reduce((sum, item) => sum + item.cantidad, 0);
    document.querySelectorAll(".cart-count").forEach(element => { element.textContent = count; });
}
