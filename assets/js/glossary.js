// Sözlük kategori filtresi: çip seçilince yalnızca o kategorideki terimler (data-group) görünür.
const chips = [...document.querySelectorAll('[data-gl-filter]')];
const items = [...document.querySelectorAll('.gl-item')];
for (const c of chips) {
  c.addEventListener('click', () => {
    const g = c.dataset.glFilter;
    for (const x of chips) x.setAttribute('aria-pressed', String(x === c));
    for (const it of items) it.hidden = Boolean(g) && it.dataset.group !== g;
  });
}
// Bağlantıyla gelinen terim vurgulanır (#terim)
const hit = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
if (hit?.classList.contains('gl-item')) hit.classList.add('is-target');
