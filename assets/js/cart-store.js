// Sepet: localStorage'da [{ sku, size, signer?, qty }] (imzalı üründe signer = imzalayan pilot). Kurallar ve ürünler /assets/data/shop.json'dan (build, src/shop.mjs'ten yazar).
// totals() src/shop.mjs'teki ile birebir aynı olmalı (check-browser iki hesabı karşılaştırır).
const KEY = 'f1t_cart';

let data;
export async function loadShop() {
  if (!data) data = fetch('/assets/data/shop.json').then((r) => r.json());
  return data;
}

export function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
export function write(lines) {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {}
  if (typeof document !== 'undefined') updateBadges(lines);
}
const same = (a, b) => a.sku === b.sku && a.size === b.size && (a.signer || '') === (b.signer || '');
// max: ürün başına üst sınır (imzalı ürünlerde stok), yoksa 10
export function add(item, max = 10) {
  const lines = read();
  const hit = lines.find((l) => same(l, item));
  if (hit) hit.qty = Math.min(max, hit.qty + 1); else lines.push({ ...item, qty: 1 });
  write(lines);
  return { lines, capped: hit && hit.qty >= max };
}
export function setQty(item, qty) {
  const lines = read().map((l) => (same(l, item) ? { ...l, qty } : l)).filter((l) => l.qty > 0);
  write(lines);
  return lines;
}

export function totals(lines, rules) {
  const qty = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const discount = qty >= rules.multiDiscount.minQty ? Math.round(subtotal * rules.multiDiscount.rate * 100) / 100 : 0;
  const after = subtotal - discount;
  const shipping = qty === 0 || after >= rules.freeShippingMin ? 0 : rules.shippingFee;
  return { qty, subtotal, discount, shipping, total: Math.round((after + shipping) * 100) / 100 };
}

// Sepet satırlarını ürün bilgisiyle birleştir (bilinmeyen/eskimiş/tükenmiş ürün düşer)
export function priced(lines, shop) {
  const by = Object.fromEntries(shop.products.filter((p) => !p.soldOut).map((p) => [p.sku, p]));
  return lines.filter((l) => by[l.sku]).map((l) => ({ ...l, product: by[l.sku], price: by[l.sku].price }));
}

export function updateBadges(lines = read()) {
  const n = lines.reduce((s, l) => s + l.qty, 0);
  for (const el of document.querySelectorAll('[data-cart-count]')) { el.textContent = n; el.hidden = n === 0 && el.closest('.nav'); }
}
if (typeof document !== "undefined") updateBadges();
