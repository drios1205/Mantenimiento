/* Un solo calendario reutilizado para todos los productos y el carrito. */
window.DeliveryCalendar = (() => {
    function place(host) {
        const panel = host.querySelector('.delivery-picker'), anchor = host.querySelector('summary').getBoundingClientRect();
        const footer = document.querySelector('footer')?.getBoundingClientRect().top ?? innerHeight;
        const bottom = Math.min(innerHeight - 12, footer > 180 ? footer - 12 : innerHeight - 12);
        panel.style.width = Math.min(310, Math.max(280, anchor.width), innerWidth - 24) + 'px';
        panel.style.maxHeight = Math.max(140, bottom - 12) + 'px';
        const height = panel.getBoundingClientRect().height;
        const upward = bottom - anchor.bottom - 8 < height && anchor.top - 12 > bottom - anchor.bottom;
        const top = upward ? anchor.top - height - 8 : anchor.bottom + 8;
        panel.style.top = Math.max(12, Math.min(top, bottom - height)) + 'px';
        panel.style.left = Math.max(12, Math.min(anchor.left, innerWidth - panel.getBoundingClientRect().width - 12)) + 'px';
        panel.dataset.placement = upward ? 'above' : 'below';
    }
    const opened = () => document.querySelectorAll('.delivery-calendar details[open]');
    document.addEventListener('click',event => opened().forEach(details => {
        if (!details.contains(event.target)) details.open = false;
    }));
    document.addEventListener('focusin',event => opened().forEach(details => {
        if (!details.contains(event.target)) details.open = false;
    }));
    window.addEventListener('resize',()=>opened().forEach(d=>place(d.parentElement)));
    window.addEventListener('scroll',event=>{if(event.target===document) opened().forEach(d=>place(d.parentElement));},true);
    return (host, value = App.deliveryMin(), onChange = () => {}, options = {}) => {
    const unrestricted = Boolean(options.unrestricted);
    const labelText = options.label || 'Fecha de entrega';
    const placeholder = options.placeholder || 'día/mes/año';
    let min = App.deliveryMin();
    const baseMonth = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : (unrestricted ? App.today() : min);
    let selected = value, month = new Date((!unrestricted && baseMonth < min ? min : baseMonth).slice(0, 7) + '-01T12:00:00Z');
    host.classList.add('delivery-calendar');
    host.innerHTML = `<label>${App.escapeHTML(labelText)}</label><input type="hidden" name="fechaEntrega"><details><summary aria-label="Elegir fecha de entrega"><span class="calendar-value"></span><span class="calendar-icons">${unrestricted ? '<button type="button" class="calendar-clear-inline" data-clear-date hidden aria-label="Quitar fecha">×</button>' : ''}<span aria-hidden="true">▦</span></span></summary><div class="delivery-picker"><div class="delivery-month"><button type="button" data-prev aria-label="Mes anterior">←</button><strong aria-live="polite"></strong><button type="button" data-next aria-label="Mes siguiente">→</button></div><div class="delivery-week" aria-hidden="true">${['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map(d=>`<span>${d}</span>`).join('')}</div><div class="delivery-days"></div>${unrestricted ? '<button type="button" class="calendar-clear-btn" data-clear-date hidden>Quitar fecha</button>' : ''}</div></details>${unrestricted ? '' : `<small>Disponible a partir del ${App.dateText(min)}. Dos días de anticipación.</small>`}`;
    const input = host.querySelector('input'), details = host.querySelector('details');
    if (host.dataset.inputId) input.id = host.dataset.inputId;
    const label = host.querySelector('label');
    const summary = host.querySelector('summary');
    summary.id = App.uid(); label.htmlFor = summary.id;
    const format = date => date.toISOString().slice(0,10);
    function draw() {
        min = App.deliveryMin();
        const display = selected ? App.dateText(selected) : placeholder;
        summary.setAttribute('aria-label', 'Elegir fecha de entrega, ' + display);
        summary.classList.toggle('is-placeholder', !selected);
        input.value = selected;
        summary.querySelector('.calendar-value').textContent = display;
        host.querySelectorAll('[data-clear-date]').forEach(btn => { btn.hidden = !selected; });
        host.querySelector('.delivery-month strong').textContent = new Intl.DateTimeFormat('es-PA',{month:'long',year:'numeric',timeZone:'UTC'}).format(month);
        host.querySelector('[data-prev]').disabled = !unrestricted && format(month).slice(0,7) <= min.slice(0,7);
        const offset = (month.getUTCDay()+6)%7;
        const count = new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate();
        host.querySelector('.delivery-days').innerHTML = '<span></span>'.repeat(offset) + Array.from({length:count},(_,i)=>{
            const date = format(new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth(),i+1,12)));
            return `<button type="button" data-date="${date}" ${!unrestricted && date<min?'disabled':''} aria-label="${App.dateText(date)}" aria-pressed="${date===selected}">${i+1}</button>`;
        }).join('');
        if(details.open) place(host);
    }
    host.addEventListener('click',event=>{
        const clearBtn = event.target.closest('[data-clear-date]');
        if (clearBtn) {
            event.preventDefault();
            event.stopPropagation();
            selected = '';
            draw();
            details.open = false;
            onChange('');
            return;
        }
        const button=event.target.closest('button'); if(!button || button.disabled)return;
        if(button.dataset.date) {
            try {
                if (unrestricted && button.dataset.date === selected) {
                    selected = '';
                } else {
                    selected = unrestricted ? button.dataset.date : App.validateDeliveryDate(button.dataset.date);
                }
                draw(); details.open=false; summary.focus(); onChange(selected);
            }
            catch(error) { App.message(error.message, true, host); draw(); }
        } else {
            month.setUTCMonth(month.getUTCMonth()+(button.hasAttribute('data-prev')?-1:1)); draw();
        }
    });
    details.addEventListener('toggle',()=>{if(details.open){opened().forEach(other=>{if(other!==details)other.open=false;});draw();}});
    details.addEventListener('keydown',e=>{if(e.key==='Escape'){details.open=false;summary.focus();}});
    input.addEventListener('change',()=>{selected=input.value;if(selected && /^\d{4}-\d{2}-\d{2}$/.test(selected))month=new Date(selected.slice(0,7)+'-01T12:00:00Z');draw();onChange(selected);});
    draw();
    return input;
};
})();
