(() => {
    const featured = document.getElementById('destacados');
    if (!featured) return;
    const ids = [16, 15, 11, 13];
    featured.innerHTML = ids.map(id => Catalogo.productos.find(p => p.id === id)).filter(Boolean).map(p => {
        const available = App.isAvailable(p.id);
        const content = `<div class="product-img"><img src="${App.escapeHTML(p.imagen)}" alt="${App.escapeHTML(p.nombre)}" loading="lazy"></div><h3>${App.escapeHTML(p.nombre)}</h3><p class="pack-description">Bandeja de ${p.unidadesPorBandeja} unidades</p><div class="product-card-bottom"><span class="price">${App.money(p.precio)}</span>${available ? '' : '<span class="unavailable-pill">No disponible</span>'}</div>`;
        return `<article class="product-card${available ? '' : ' is-unavailable'}">${available ? `<a class="featured-product-link" href="detalle-boquita.html?id=${p.id}" aria-label="Ver ${App.escapeHTML(p.nombre)}">${content}</a>` : `<div class="featured-product-link" aria-disabled="true">${content}</div>`}</article>`;
    }).join('');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const track = document.querySelector('.news-track');
    const scroll = direction => track.scrollBy({left: direction * (track.querySelector('.news-card').getBoundingClientRect().width + 24), behavior: reduced.matches ? 'instant' : 'smooth'});
    document.querySelector('[data-news-prev]').onclick = () => scroll(-1);
    document.querySelector('[data-news-next]').onclick = () => scroll(1);
})();
