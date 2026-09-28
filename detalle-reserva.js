(() => {
    const form = document.getElementById("reservaDetalleForm");
    if (!form) return;
    const item = Catalogo.reservas.find(r => r.id === Number(form.elements.idTipoReserva.value));
    if (!item) return;
    const date = document.getElementById("fechaReserva");
    date.min = App.tomorrow();
    date.addEventListener("change", () => {
        date.setCustomValidity(App.occupiedDates().includes(date.value) ? "Esa fecha ya está ocupada. Elige otro día." : "");
        date.reportValidity();
    });
    document.getElementById("btnComprarReserva").addEventListener("click", () => form.requestSubmit());
    form.addEventListener("submit", event => {
        event.preventDefault();
        try {
            const values = Object.fromEntries(new FormData(form));
            App.validateReservation(values);
            App.beginCheckout({ tipo: "reserva", itemId: item.id, nombrePrincipal: values.nombrePrincipal.trim(), decoracionDescripcion: values.decoracionDescripcion.trim(), fechaReserva: values.fechaReserva, horaReserva: values.horaReserva });
        } catch (error) { App.message(error.message, true, form); }
    });
    document.getElementById("whatsappReserva").href = "https://wa.me/5073158752?text=" + encodeURIComponent(`Hola, quiero información sobre la reserva ${item.nombre}. Precio base: ${App.money(item.precio)} por ${item.horas} horas.`);
})();
