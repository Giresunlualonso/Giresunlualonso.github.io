// Sepet sayfası: adet değiştirme, indirim/kargo özeti, teslimat formu, ön bilgilendirme onayı, sipariş kaydı.
// Ödeme altyapısı (iyzico vb.) bağlanana kadar sipariş tarayıcıda kaydedilir, karttan çekim yapılmaz.
import { $ } from '/assets/js/core.js';
import { lang, t, locale } from '/assets/js/i18n.js';
import { loadShop, read, setQty, write, priced, totals } from '/assets/js/cart-store.js';
import { getUser } from '/assets/js/auth.js';

const shop = await loadShop();
const R = shop.rules;
const money = (v) => `${v.toLocaleString(locale, { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })} TL`;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const maxOf = (p) => p.stock || 10;

function render() {
  const lines = priced(read(), shop);
  const empty = !lines.length;
  $('#cart-empty').hidden = !empty;
  $('#cart-full').hidden = empty;
  if (empty) return;
  $('#cart-lines').innerHTML = lines.map((l, i) => `<li class="cart-line" style="--tc:${l.product.colour}">
    <img src="${l.product.photo ? `/assets/images/shop/photos/${l.product.id}-w480.jpg` : l.product.img}" width="120" height="90" alt="">
    <div><b>${esc(l.product.name[lang])}</b>${l.signer ? `<span class="muted small">${t('İmza', 'Signed by')}: ${esc(l.signer)} · COA</span>` : ''}${l.product.sizes.length > 1 ? `<span class="muted small">${t('Beden', 'Size')}: ${esc(l.size)}</span>` : ''}<span class="muted small">${money(l.price)}</span></div>
    <div class="qty" role="group" aria-label="${t('Adet', 'Quantity')}">
      <button type="button" data-d="-1" data-i="${i}" aria-label="${t('Azalt', 'Decrease')}">−</button>
      <output>${l.qty}</output>
      <button type="button" data-d="1" data-i="${i}" aria-label="${t('Artır', 'Increase')}"${l.qty >= maxOf(l.product) ? ' disabled' : ''}>+</button>
    </div>
    <b class="line-total">${money(l.price * l.qty)}</b>
  </li>`).join('');
  const x = totals(lines, R);
  $('#cart-sum').innerHTML = `
    <dt>${t(`Ara toplam (${x.qty} ürün)`, `Subtotal (${x.qty} item${x.qty > 1 ? 's' : ''})`)}</dt><dd>${money(x.subtotal)}</dd>
    ${x.discount ? `<dt class="ok">${t('2 ürüne %10 indirim', '10% multi-buy discount')}</dt><dd class="ok">−${money(x.discount)}</dd>` : ''}
    <dt>${t('Kargo', 'Shipping')}</dt><dd>${x.shipping ? money(x.shipping) : `<span class="ok">${t('Bedava', 'Free')}</span>`}</dd>
    <dt class="grand">${t('Toplam (KDV dahil)', 'Total (incl. VAT)')}</dt><dd class="grand" data-total="${x.total}">${money(x.total)}</dd>`;
  const left = R.freeShippingMin - (x.subtotal - x.discount);
  $('#cart-hint').textContent = x.qty < R.multiDiscount.minQty
    ? t('Bir ürün daha eklerseniz tüm sepette %10 indirim kazanırsınız.', 'Add one more item to get 10% off your whole basket.')
    : left > 0 ? t(`Kargo bedava için ${money(left)} daha ekleyin.`, `Add ${money(left)} more for free shipping.`) : t('Kargo bedava.', 'Free shipping.');
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('.qty button');
  if (!b) return;
  const lines = priced(read(), shop);
  const l = lines[Number(b.dataset.i)];
  if (l) { setQty(l, Math.min(maxOf(l.product), l.qty + Number(b.dataset.d))); render(); }
});

// Teslimat formu: giriş yapmış üyenin adı/e-postası önceden dolar
const form = $('#checkout-form');
const user = await getUser().catch(() => null);
if (user) { form.name.value = user.name; form.email.value = user.email; }
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const err = form.querySelector('.form-error');
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  const bad = [...form.elements].find((el) => el.willValidate && !el.checkValidity());
  if (bad) {
    err.textContent = bad.name === 'consent'
      ? t('Siparişi onaylamak için ön bilgilendirme formunu ve mesafeli satış sözleşmesini kabul etmeniz gerekir.', 'Please accept the pre-information form and the distance sales agreement to confirm your order.')
      : t('Lütfen işaretli alanı doğru doldurun.', 'Please fill in the highlighted field correctly.');
    err.hidden = false; bad.focus(); bad.setAttribute('aria-invalid', 'true');
    return;
  }
  err.hidden = true;
  const lines = priced(read(), shop);
  const x = totals(lines, R);
  const no = `F1T-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const customer = Object.fromEntries(new FormData(form));
  try {
    const orders = JSON.parse(localStorage.getItem('f1t_orders') || '[]');
    orders.push({ no, at: new Date().toISOString(), consentAt: new Date().toISOString(), lines: lines.map(({ sku, size, signer, qty, price }) => ({ sku, size, signer, qty, price })), ...x, customer });
    localStorage.setItem('f1t_orders', JSON.stringify(orders));
  } catch {}
  write([]);
  $('#cart-full').hidden = true;
  const done = $('#order-done');
  done.innerHTML = `<h2>${t('Siparişiniz alındı', 'Order received')}</h2>
    <p>${t('Sipariş numarası', 'Order number')}: <b>${no}</b> · ${t('Toplam', 'Total')}: <b>${money(x.total)}</b></p>
    <p>${t(`Sipariş özeti ve mesafeli satış sözleşmenizin bir örneği ${esc(customer.email)} adresine gönderilecek. Teslimden itibaren 14 gün içinde ücretsiz iade hakkınız vardır.`, `Your order summary and a copy of the distance sales agreement will be sent to ${esc(customer.email)}. You can return your order free of charge within 14 days of delivery.`)}</p>
    <p class="muted">${t('Ödeme altyapısı bağlanana kadar kartınızdan çekim yapılmaz; sipariş onayı için sizinle iletişime geçilecek.', 'Until online payment is connected your card is not charged; we will contact you to confirm the order.')}</p>`;
  done.hidden = false;
  done.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

render();
