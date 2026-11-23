document.addEventListener("DOMContentLoaded", function () {
    if (App.user()?.rol !== "admin") return;
    const registros = Array.isArray(window.registrosAdmin) ? window.registrosAdmin : [];

    const buscarPor = document.getElementById("buscarPor");
    const busquedaCliente = document.getElementById("busquedaCliente");
    const estadoRegistro = document.getElementById("estadoRegistro");
    const filtroFechaHost = document.getElementById("filtroFechaHost");
    const rangoFechas = filtroFechaHost && window.DeliveryCalendar
        ? DeliveryCalendar(filtroFechaHost, "", function () { aplicarFiltros(); }, { unrestricted: true, label: "Fecha", placeholder: "día/mes/año" })
        : document.getElementById("rangoFechas");
    const btnBuscar = document.getElementById("btnBuscar");
    const btnLimpiar = document.getElementById("btnLimpiar");

    const tablaRegistros = document.getElementById("tablaRegistros");
    const contadorRegistros = document.getElementById("contadorRegistros");
    const textoCantidad = document.getElementById("textoCantidad");

    const btnPaginaAnterior = document.getElementById("btnPaginaAnterior");
    const btnPaginaSiguiente = document.getElementById("btnPaginaSiguiente");
    const paginaActualTexto = document.getElementById("paginaActual");
    const listaProductosAdmin = document.getElementById("listaProductosAdmin");
    const contadorProductosAdmin = document.getElementById("contadorProductosAdmin");
    const textoCantidadProductos = document.getElementById("textoCantidadProductos");
    const btnProdAnterior = document.getElementById("btnProdAnterior");
    const btnProdSiguiente = document.getElementById("btnProdSiguiente");
    const paginaActualProductosTexto = document.getElementById("paginaActualProductos");

    let paginaProductosActual = 1;
    const productosPorPagina = 4;

    function mostrarProductosAdmin() {
        if (!listaProductosAdmin || !window.Catalogo) return;
        const productos = Array.isArray(Catalogo.productos) ? Catalogo.productos : [];
        if (contadorProductosAdmin) contadorProductosAdmin.textContent = "(" + productos.length + ")";

        const totalPaginasProd = Math.max(1, Math.ceil(productos.length / productosPorPagina));
        if (paginaProductosActual > totalPaginasProd) paginaProductosActual = totalPaginasProd;

        const inicioProd = (paginaProductosActual - 1) * productosPorPagina;
        const finProd = inicioProd + productosPorPagina;
        const productosPagina = productos.slice(inicioProd, finProd);

        listaProductosAdmin.innerHTML = productosPagina.map(function (producto) {
            const disponible = App.isAvailable(producto.id);
            return `
                <button type="button" class="admin-product-item ${disponible ? "is-available" : "is-unavailable"}" data-product-card="${producto.id}" data-product-id="${producto.id}" data-next-available="${disponible ? "false" : "true"}" aria-pressed="${disponible ? "true" : "false"}">
                    <img src="${App.escapeHTML(producto.imagen)}" alt="${App.escapeHTML(producto.nombre)}" class="admin-product-thumb">
                    <div class="admin-product-info">
                        <h3>${App.escapeHTML(producto.nombre)}</h3>
                        <p>${App.escapeHTML(producto.categoria)} · ${App.money(producto.precio)} · Bandeja de ${producto.unidadesPorBandeja} uds.</p>
                    </div>
                    <div class="admin-product-actions">
                        <span class="status-badge ${disponible ? "status-listo" : "status-cancelado"}">
                            ${disponible ? "Disponible" : "No disponible"}
                        </span>
                    </div>
                </button>
            `;
        }).join("");

        if (textoCantidadProductos) {
            textoCantidadProductos.textContent = productos.length
                ? "Mostrando " + (inicioProd + 1) + " a " + Math.min(finProd, productos.length) + " de " + productos.length + " productos"
                : "No hay productos para mostrar";
        }
        if (paginaActualProductosTexto) paginaActualProductosTexto.textContent = paginaProductosActual;
        if (btnProdAnterior) btnProdAnterior.disabled = paginaProductosActual <= 1;
        if (btnProdSiguiente) btnProdSiguiente.disabled = paginaProductosActual >= totalPaginasProd;
    }

    if (listaProductosAdmin) {
        listaProductosAdmin.addEventListener("click", function (event) {
            const tarjeta = event.target.closest("[data-product-card]");
            if (!tarjeta) return;
            try {
                App.setProductAvailability(Number(tarjeta.dataset.productId), tarjeta.dataset.nextAvailable === "true");
                mostrarProductosAdmin();
            } catch (error) {
                App.message(error.message, true);
            }
        });
        if (btnProdAnterior) {
            btnProdAnterior.addEventListener("click", function () {
                if (paginaProductosActual > 1) {
                    paginaProductosActual--;
                    mostrarProductosAdmin();
                }
            });
        }
        if (btnProdSiguiente) {
            btnProdSiguiente.addEventListener("click", function () {
                const total = Math.ceil((Catalogo.productos?.length || 0) / productosPorPagina);
                if (paginaProductosActual < total) {
                    paginaProductosActual++;
                    mostrarProductosAdmin();
                }
            });
        }
        mostrarProductosAdmin();
    }

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

        const limpio = rangoTexto.trim();
        const buscado = /^\d{4}-\d{2}-\d{2}$/.test(limpio) ? App.dateText(limpio) : limpio;
        const fechaRegistro = (fechaRegistroTexto || "").split(" ")[0];

        return fechaRegistro.includes(buscado);
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
        const filtroEstado = estadoRegistro.value;
        const filtroFecha = rangoFechas.value;

        return registros.filter(function (registro) {
            const textoBase = normalizarTexto(obtenerValorBusqueda(registro, filtroCliente));

            const coincideCliente =
                textoBusqueda === "" ||
                textoBase.includes(textoBusqueda);

            const coincideEstado =
            filtroEstado === "todo" ||
            normalizarTexto(registro.estado) === filtroEstado;

            const coincideFecha = coincideRangoFecha(registro.fecha, filtroFecha);

            return coincideCliente && coincideEstado && coincideFecha;
        });
    }

    function crearCeldaEstado(registro) {
        const estadoActual = registro.estado === "Pendiente" ? "En proceso" : registro.estado;
        const badge = `
            <span class="status-badge ${claseEstado(estadoActual)}">
                ${App.escapeHTML(estadoActual)}
            </span>
        `;

        if (registro.tipo !== "Pedido") {
            return badge;
        }

        return `
            <div class="pedido-status">
                ${badge}

                <select class="status-select" data-id="${App.escapeHTML(registro.id)}">
                    <option value="En proceso" ${estadoActual === "En proceso" ? "selected" : ""}>En proceso</option>
                    <option value="Listo" ${estadoActual === "Listo" ? "selected" : ""}>Listo</option>
                    <option value="Entregado" ${estadoActual === "Entregado" ? "selected" : ""}>Entregado</option>
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
                    <td colspan="6">
                        <div class="sin-informacion">
                            <strong>Sin información</strong>
                            <p>No hay pedidos con esos filtros.</p>
                        </div>
                    </td>
                </tr>
            `;

            textoCantidad.textContent = "No hay pedidos para mostrar";
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
                <td>${App.escapeHTML(registro.cliente)}</td>
                <td>${registro.cedula ? registro.cedula : "—"}</td>
                <td>${App.escapeHTML(registro.celular)}</td>
                <td>${App.escapeHTML(registro.correo)}</td>
                <td>${App.escapeHTML(registro.fecha)}</td>

                <td>
                    ${crearCeldaEstado(registro)}
                </td>

            `;

            tablaRegistros.appendChild(fila);
        });

        const registroInicio = inicio + 1;
        const registroFin = Math.min(fin, lista.length);

        textoCantidad.textContent =
            "Mostrando " + registroInicio + " a " + registroFin + " de " + lista.length + " pedidos";

        paginaActualTexto.textContent = paginaActual;

        btnPaginaAnterior.disabled = paginaActual === 1;
        btnPaginaSiguiente.disabled = paginaActual === totalPaginas;

        activarCambioEstadoPedidos();
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

    if (btnBuscar) {
        btnBuscar.addEventListener("click", function () {
            aplicarFiltros();
        });
    }

    busquedaCliente.addEventListener("input", function () {
        aplicarFiltros();
    });

    buscarPor.addEventListener("change", function () {
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
    estadoRegistro.value = "todo";
    rangoFechas.value = "";
    rangoFechas.dispatchEvent(new Event("change"));
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
