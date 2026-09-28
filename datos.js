/* Catálogo de ejemplo. Edita aquí precios, descripciones, fechas y cupos.
   Los nombres y las imágenes proceden de los archivos del proyecto.
   Las reservas conservan los precios que mostraba la página original. */
window.Catalogo = {
    productos: [
        { id: 5, nombre: "Pastel Frutas", categoria: "Pasteles", precio: 28, descripcion: "Pastel suave con una selección de frutas.", imagen: "imagenes/Pasteles/Pastel Frutas-5.png" },
        { id: 6, nombre: "Pastel de Chocolate", categoria: "Pasteles", precio: 30, descripcion: "Pastel de chocolate para compartir en tus celebraciones.", imagen: "imagenes/Pasteles/Pastel de Chocolate-6.png" },
        { id: 7, nombre: "Pastel Infantil", categoria: "Pasteles", precio: 38, descripcion: "Un pastel especial para los más pequeños.", imagen: "imagenes/Pasteles/Pastel Infantil-7.png" },
        { id: 8, nombre: "Pastel Red Velvet", categoria: "Pasteles", precio: 32, descripcion: "Pastel Red Velvet con cobertura cremosa.", imagen: "imagenes/Pasteles/Pastel Red Velvet-8.png" },
        { id: 9, nombre: "Pastel de Cumpleaños", categoria: "Pasteles", precio: 35, descripcion: "Celebra un nuevo año con un detalle dulce.", imagen: "imagenes/Pasteles/Pastel de Cumpleaños-9.png" },
        { id: 10, nombre: "Pastel de Vainilla", categoria: "Pasteles", precio: 25, descripcion: "El clásico sabor de vainilla para cualquier ocasión.", imagen: "imagenes/Pasteles/Pastel de Vainilla-10.png" },
        { id: 11, nombre: "Mini Donas", categoria: "Boquitas Dulces", precio: 8, descripcion: "Porción de mini donas para compartir.", imagen: "imagenes/Productos/Mini Donas-11.png" },
        { id: 12, nombre: "Cupcakes Tradicionales", categoria: "Boquitas Dulces", precio: 12, descripcion: "Cupcakes con una dulce decoración.", imagen: "imagenes/Productos/Cupcakes Tradicionales-12.png" },
        { id: 13, nombre: "Brownies de Fudge", categoria: "Boquitas Dulces", precio: 10, descripcion: "Bocados de chocolate de textura suave.", imagen: "imagenes/Productos/Brownies de Fudge-13.png" },
        { id: 14, nombre: "Alfajores de Maicena", categoria: "Boquitas Dulces", precio: 9, descripcion: "Alfajores rellenos para acompañar tus momentos dulces.", imagen: "imagenes/Productos/Alfajores de Maicena-14.png" },
        { id: 15, nombre: "Mini Empanaditas", categoria: "Boquitas Saladas", precio: 10, descripcion: "Empanaditas para reuniones y eventos.", imagen: "imagenes/Productos/Mini Empanaditas-15.png" },
        { id: 16, nombre: "Tequeños Venezolanos", categoria: "Boquitas Saladas", precio: 12, descripcion: "Tequeños de queso, ideales para compartir.", imagen: "imagenes/Productos/Tequeños Venezolanos-16.png" },
        { id: 17, nombre: "Canapés Gourmet Surtidos", categoria: "Boquitas Saladas", precio: 15, descripcion: "Una selección de pequeños bocados salados.", imagen: "imagenes/Productos/Canapés Gourmet Surtidos-17.png" },
        { id: 18, nombre: "Mini Quiches", categoria: "Boquitas Saladas", precio: 14, descripcion: "Mini quiches para acompañar tus celebraciones.", imagen: "imagenes/Productos/Mini Quiches-18.png" }
    ],
    actividades: [
        { id: 1, nombre: "Crochet", precio: 20, descripcion: "Aprende los puntos básicos del crochet.", fecha: "2026-12-05", hora: "15:00", cupos: 12, estado: "Disponible", imagen: "imagenes/actividades/Crochet-1.png" },
        { id: 2, nombre: "Dibujo", precio: 18, descripcion: "Explora tu creatividad con un taller de dibujo.", fecha: "2026-12-06", hora: "15:00", cupos: 15, estado: "Disponible", imagen: "imagenes/actividades/Dibujo-2.png" },
        { id: 3, nombre: "Decoración de cupcakes", precio: 25, descripcion: "Decora cupcakes y crea tus propias combinaciones.", fecha: "2026-12-12", hora: "14:00", cupos: 10, estado: "Disponible", imagen: "imagenes/actividades/Decoración de cupcakes-3.png" },
        { id: 4, nombre: "Decoración de galletas", precio: 22, descripcion: "Dale color y personalidad a tus galletas.", fecha: "2026-12-13", hora: "14:00", cupos: 10, estado: "Disponible", imagen: "imagenes/actividades/Decoración de galletas-4.png" },
        { id: 5, nombre: "Origami", precio: 15, descripcion: "Descubre figuras creativas doblando papel.", fecha: "2026-12-19", hora: "15:00", cupos: 15, estado: "Disponible", imagen: "imagenes/actividades/Origami-5.png" }
    ],
    reservas: [
        { id: 1, nombre: "Cumpleaños Dulce", precio: 75, horas: 2, descripcion: "Te preparamos para que celebres en grande con todos los detalles.", imagen: "imagenes/reserva/Cumpleaños Dulce-1.png", campoPrincipal: "Nombre del cumpleañero", ejemploPrincipal: "Ej: Sofía", campoDecoracion: "Tipo de decoración deseada", ejemploDecoracion: "Temática, colores, globos, flores...", incluye: ["Local del evento por 2 horas", "Decoración básica de cumpleaños", "Mesa principal decorada", "Espacio para pastel", "Área para fotos", "Atención básica durante el evento"] },
        { id: 2, nombre: "Evento Corporativo", precio: 85, horas: 2, descripcion: "Perfecto para reuniones, team buildings y lanzamientos.", imagen: "imagenes/reserva/Evento Corporativo-2.png", campoPrincipal: "Nombre de la empresa", ejemploPrincipal: "Ej: Tech Solutions S.A.", campoDecoracion: "Detalles de decoración corporativa", ejemploDecoracion: "Logos, colores corporativos, pantallas, banner...", incluye: ["Local del evento", "Montaje formal del espacio", "Mesa para refrigerio", "Decoración corporativa estándar", "Menú básico", "Opción de agregar café o boquitas"] }
    ]
};
