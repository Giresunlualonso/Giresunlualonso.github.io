// Ürün listesi: tür/takım filtresi, fotoğraf galerisi, sepete ekleme
import { $ } from '/assets/js/core.js';
import { t } from '/assets/js/i18n.js';
import { add, loadShop, read, priced, totals } from '/assets/js/cart-store.js';

const grid = document.querySelector('.product-grid');
const msg = $('.added-msg');
let type = '';

function filter() {
  const team = $('#team-filter').value;
  for (const li of grid.children) li.hidden = (type && li.dataset.type !== type) || (team && li.dataset.team !== team);
}
for (const b of document.querySelectorAll('[data-filter-type]')) {
  b.addEventListener('click', () => {
    type = b.dataset.filterType;
    document.querySelectorAll('[data-filter-type]').forEach((x) => x.setAttribute('aria-pressed', x === b));
    filter();
  });
}
$('#team-filter').addEventListener('change', filter);

// Galeri: kaydırma yerel (scroll-snap); oklar/noktalar kaydırır, nokta görünür fotoğrafı izler
for (const g of document.querySelectorAll('.gallery')) {
  const track = g.querySelector('.g-track');
  const dots = [...g.querySelectorAll('.g-dots button')];
  const go = (i) => track.scrollTo({ left: Math.max(0, Math.min(dots.length - 1, i)) * track.clientWidth, behavior: 'smooth' });
  const cur = () => Math.round(track.scrollLeft / track.clientWidth);
  g.querySelector('.prev').addEventListener('click', () => go(cur() - 1));
  g.querySelector('.next').addEventListener('click', () => go(cur() + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
  track.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); go(cur() + (e.key === 'ArrowRight' ? 1 : -1)); } });
  track.addEventListener('scroll', () => { const i = cur(); dots.forEach((d, k) => (k === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current'))); }, { passive: true });
}

const shop = await loadShop();
for (const form of document.querySelectorAll('.add-form')) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const size = fd.get('size');
    const signer = fd.get('signer') || undefined;
    const product = shop.products.find((p) => p.sku === form.dataset.sku);
    if (!product || product.soldOut) return;
    const { lines, capped } = add({ sku: form.dataset.sku, size, signer }, product?.stock || 10);
    const tot = totals(priced(lines, shop), shop.rules);
    const name = form.closest('.product').querySelector('h2').textContent;
    const left = shop.rules.freeShippingMin - (tot.subtotal - tot.discount);
    msg.textContent = (capped ? t('Stok sınırına ulaşıldı. ', 'Stock limit reached. ') : '') + `${t('Sepete eklendi', 'Added to basket')}: ${name}${signer ? ` · ${signer}` : ''}${size !== 'Standart' ? ` (${size})` : ''}. `
      + (tot.qty < shop.rules.multiDiscount.minQty ? t('Bir ürün daha ekleyin, %10 indirim kazanın.', 'Add one more item for 10% off.')
        : left > 0 ? t(`Kargo bedava için ${left.toFixed(2).replace('.', ',')} TL kaldı.`, `${left.toFixed(2)} TL more for free shipping.`)
          : t('%10 indirim ve ücretsiz kargo uygulandı.', '10% off and free shipping applied.'));
    msg.hidden = false;
    form.querySelector('button').textContent = t('Eklendi ✓', 'Added ✓');
    setTimeout(() => { form.querySelector('button').textContent = t('Sepete ekle', 'Add to basket'); }, 1500);
  });
}
read();
