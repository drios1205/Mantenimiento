document.addEventListener("DOMContentLoaded", function () {
    if (!App.user()) return;
    const registros = Array.isArray(window.registrosAdmin) ? window.registrosAdmin : [];

    const buscarPor = document.getElementById("buscarPor");
    const busquedaCliente = document.getElementById("busquedaCliente");
    const buscarRegistro = document.getElementById("buscarRegistro");
    const estadoRegistro = document.getElementById("estadoRegistro");
    const rangoFechas = document.getElementById("rangoFechas");
    const btnBuscar = document.getElementById("btnBuscar");
    const btnLimpiar = document.getElementById("btnLimpiar");

    const tablaRegistros = document.getElementById("tablaRegistros");
    const contadorRegistros = document.getElementById("contadorRegistros");
    const textoCantidad = document.getElementById("textoCantidad");

    const btnPaginaAnterior = document.getElementById("btnPaginaAnterior");
    const btnPaginaSiguiente = document.getElementById("btnPaginaSiguiente");
    const paginaActualTexto = document.getElementById("paginaActual");

    let paginaActual = 1;
    const registrosPorPagina = 9;
    let listaActual = registros;

    function normalizarTexto(texto) {
        return (texto || "").toString().trim().toLowerCase();
    }

    function coincideRangoFecha(fechaRegistroTexto, rangoTexto) {
    if (!rangoTexto || rangoTexto.trim() === "") {
        return true;
    }

    const fechaRegistro = fechaRegistroTexto.split(" ")[0];

    return fechaRegistro.includes(rangoTexto.trim());
}

    function claseTipo(tipo) {
        const tipoNormalizado = normalizarTexto(tipo);

        if (tipoNormalizado === "pedido") {
            return "type-pedido";
        }

        if (tipoNormalizado === "actividad") {
            return "type-actividad";
        }

        if (tipoNormalizado === "reserva") {
            return "type-reserva";
        }

        return "";
    }

    function claseEstado(estado) {
        const estadoNormalizado = normalizarTexto(estado).replace(" ", "-");

        if (estadoNormalizado === "en-proceso") {
            return "status-en-proceso";
        }

        if (estadoNormalizado === "pendiente") {
            return "status-pendiente";
        }

        if (estadoNormalizado === "listo") {
            return "status-listo";
        }

        if (estadoNormalizado === "entregado") {
            return "status-entregado";
        }

        if (estadoNormalizado === "confirmado" || estadoNormalizado === "confirmada") {
            return "status-confirmado";
        }

        if (estadoNormalizado === "cancelado" || estadoNormalizado === "cancelada") {
            return "status-cancelado";
        }

        if (estadoNormalizado === "realizado" || estadoNormalizado === "realizada") {
            return "status-entregado";
        }

        return "status-pendiente";
    }

    function obtenerValorBusqueda(registro, filtro) {

        if (filtro === "cedula") return registro.cedula;

        if (filtro === "nombre") {
            return registro.cliente;
        }

        if (filtro === "celular") {
            return registro.celular;
        }

        if (filtro === "correo") {
            return registro.correo;
        }

        return registro.cliente + " " + registro.cedula + " " + registro.celular + " " + registro.correo;
    }

    function filtrarRegistros() {
        const filtroCliente = buscarPor.value;
        const textoBusqueda = normalizarTexto(busquedaCliente.value);
        const filtroRegistro = buscarRegistro.value;
        const filtroEstado = estadoRegistro.value;
        const filtroFecha = rangoFechas.value;

        return registros.filter(function (registro) {
            const textoBase = normalizarTexto(obtenerValorBusqueda(registro, filtroCliente));

            const coincideCliente =
                textoBusqueda === "" ||
                textoBase.includes(textoBusqueda);

            const coincideTipo =
                filtroRegistro === "todo" ||
                normalizarTexto(registro.tipo) === filtroRegistro;

            const coincideEstado =
            filtroEstado === "todo" ||
            normalizarTexto(registro.estado) === filtroEstado;

            const coincideFecha = coincideRangoFecha(registro.fecha, filtroFecha);

            return coincideCliente && coincideTipo && coincideEstado && coincideFecha;
        });
    }

    function crearCeldaEstado(registro) {
        const badge = `
            <span class="status-badge ${claseEstado(registro.estado)}">
                ${App.escapeHTML(registro.estado)}
            </span>
        `;

        if (registro.tipo !== "Pedido") {
            return badge;
        }

        return `
            <div class="pedido-status">
                ${badge}

                <select class="status-select" data-id="${App.escapeHTML(registro.id)}">
                    <option value="Pendiente" ${registro.estado === "Pendiente" ? "selected" : ""}>Pendiente</option>
                    <option value="En proceso" ${registro.estado === "En proceso" ? "selected" : ""}>En proceso</option>
                    <option value="Listo" ${registro.estado === "Listo" ? "selected" : ""}>Listo</option>
                    <option value="Entregado" ${registro.estado === "Entregado" ? "selected" : ""}>Entregado</option>
                </select>
            </div>
        `;
    }

    function mostrarRegistros(lista) {
        tablaRegistros.innerHTML = "";
        listaActual = lista;

        contadorRegistros.textContent = "(" + lista.length + ")";

        if (lista.length === 0) {
            tablaRegistros.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="sin-informacion">
                            <strong>Sin información</strong>
                            <p>No hay pedidos, actividades ni reservas con esos filtros.</p>
                        </div>
                    </td>
                </tr>
            `;

            textoCantidad.textContent = "No hay registros para mostrar";
            paginaActualTexto.textContent = "1";
            btnPaginaAnterior.disabled = true;
            btnPaginaSiguiente.disabled = true;

            return;
        }

        const totalPaginas = Math.ceil(lista.length / registrosPorPagina);

        if (paginaActual > totalPaginas) {
            paginaActual = totalPaginas;
        }

        const inicio = (paginaActual - 1) * registrosPorPagina;
        const fin = inicio + registrosPorPagina;
        const registrosPagina = lista.slice(inicio, fin);

        registrosPagina.forEach(function (registro) {
            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>
                    <span class="type-pill ${claseTipo(registro.tipo)}">
                        ${App.escapeHTML(registro.tipo)}
                    </span>
                </td>

                <td>${App.escapeHTML(registro.cliente)}</td>
                <td>${registro.cedula ? registro.cedula : "—"}</td>
                <td>${App.escapeHTML(registro.celular)}</td>
                <td>${App.escapeHTML(registro.correo)}</td>
                <td>${App.escapeHTML(registro.fecha)}</td>

                <td>
                    ${crearCeldaEstado(registro)}
                </td>

                <td>
                    <a href="#" class="action-btn btnDetalle" data-detalle="${App.escapeHTML(registro.detalle)}">
                        Ver detalle
                    </a>
                </td>
            `;

            tablaRegistros.appendChild(fila);
        });

        const registroInicio = inicio + 1;
        const registroFin = Math.min(fin, lista.length);

        textoCantidad.textContent =
            "Mostrando " + registroInicio + " a " + registroFin + " de " + lista.length + " registros";

        paginaActualTexto.textContent = paginaActual;

        btnPaginaAnterior.disabled = paginaActual === 1;
        btnPaginaSiguiente.disabled = paginaActual === totalPaginas;

        activarCambioEstadoPedidos();
        activarDetalle();
    }

    function activarDetalle() {
        const botonesDetalle = document.querySelectorAll(".btnDetalle");

        botonesDetalle.forEach(function (boton) {
            boton.addEventListener("click", function (event) {
                event.preventDefault();

                const detalle = boton.dataset.detalle || "Sin detalle disponible.";
                alert(detalle);
            });
        });
    }

    function activarCambioEstadoPedidos() {
        const selectsEstado = document.querySelectorAll(".status-select");

        selectsEstado.forEach(function (select) {
            select.addEventListener("change", function () {
                const idRegistro = select.dataset.id;
                const nuevoEstado = select.value;

                try {
                    App.updateStatus(idRegistro, nuevoEstado);
                    const registro = registros.find(item => item.id === idRegistro && item.tipo === "Pedido");
                    if (registro) registro.estado = nuevoEstado;
                    aplicarFiltros();
                } catch (error) {
                    App.message(error.message, true);
                    aplicarFiltros();
                }
            });
        });
    }

    function aplicarFiltros() {
        paginaActual = 1;
        const listaFiltrada = filtrarRegistros();
        mostrarRegistros(listaFiltrada);
    }

    btnBuscar.addEventListener("click", function () {
        aplicarFiltros();
    });

    busquedaCliente.addEventListener("input", function () {
        aplicarFiltros();
    });

    buscarPor.addEventListener("change", function () {
        aplicarFiltros();
    });

    buscarRegistro.addEventListener("change", function () {
        aplicarFiltros();
    });

    rangoFechas.addEventListener("input", function () {
    aplicarFiltros();
    });

    estadoRegistro.addEventListener("change", function () {
        aplicarFiltros();
    });

    btnLimpiar.addEventListener("click", function () {
    buscarPor.value = "todos";
    busquedaCliente.value = "";
    buscarRegistro.value = "todo";
    estadoRegistro.value = "todo";
    rangoFechas.value = "";
    paginaActual = 1;
    mostrarRegistros(registros);
    });

    btnPaginaAnterior.addEventListener("click", function () {
        if (paginaActual > 1) {
            paginaActual--;
            mostrarRegistros(listaActual);
        }
    });

    btnPaginaSiguiente.addEventListener("click", function () {
        const totalPaginas = Math.ceil(listaActual.length / registrosPorPagina);

        if (paginaActual < totalPaginas) {
            paginaActual++;
            mostrarRegistros(listaActual);
        }
    });

    mostrarRegistros(registros);
});