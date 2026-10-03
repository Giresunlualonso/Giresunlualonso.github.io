// Ortak yardımcılar: süre biçimleri, pilot seçici çipler, uPlot koyu tema ve boyutlandırma.

export const $ = (sel, root = document) => root.querySelector(sel);

export function fmtLap(sec) {
  if (sec == null || !isFinite(sec)) return '–';
  const m = Math.floor(sec / 60);
  const s = (sec - m * 60).toFixed(3).padStart(6, '0');
  return m ? `${m}:${s}` : (+s).toFixed(3);
}
export const fmtSec = (sec, d = 3) => (sec == null || !isFinite(sec) ? '–' : sec.toFixed(d));

export function median(arr) {
  const a = arr.filter((v) => v != null).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

// Aynı takımın ikinci pilotu kesikli çizgiyle ayrılır (renkler takım rengidir)
export function assignDash(items) {
  const seen = new Set();
  for (const it of items) { it.dash = seen.has(it.team) ? [6, 4] : null; seen.add(it.team); }
  return items;
}

// items: [{ key, label, colour, title }]; selected: Set(key)
export function chips(container, items, selected, onChange) {
  container.innerHTML = '';
  const btns = [];
  const allBtn = document.createElement('button');
  allBtn.type = 'button'; allBtn.className = 'chip all';
  const en = document.documentElement.lang === 'en';
  const syncAll = () => { allBtn.textContent = selected.size === items.length ? (en ? 'Clear' : 'Temizle') : (en ? 'All' : 'Tümü'); };
  allBtn.addEventListener('click', () => {
    if (selected.size === items.length) selected.clear(); else items.forEach((i) => selected.add(i.key));
    btns.forEach((b) => b.setAttribute('aria-pressed', selected.has(b.dataset.key)));
    syncAll(); onChange();
  });
  for (const it of items) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.key = it.key;
    b.style.setProperty('--tc', it.colour);
    b.textContent = it.label;
    if (it.title) b.title = it.title;
    b.setAttribute('aria-pressed', selected.has(it.key));
    b.addEventListener('click', () => {
      selected.has(it.key) ? selected.delete(it.key) : selected.add(it.key);
      b.setAttribute('aria-pressed', selected.has(it.key));
      syncAll(); onChange();
    });
    btns.push(b); container.append(b);
  }
  container.append(allBtn); syncAll();
}

const css = getComputedStyle(document.documentElement);
const tok = (n) => css.getPropertyValue(n).trim();

export function axis(extra = {}) {
  return { stroke: tok('--muted'), grid: { stroke: tok('--grid'), width: 1 }, ticks: { stroke: tok('--grid'), width: 1 }, font: `12px ${tok('--font')}`, ...extra };
}

// Grafiği kapsayıcı genişliğine uydurur; mobilde yüksekliği azaltır
export function fit(plot, el) {
  const size = () => {
    const w = el.clientWidth;
    plot.setSize({ width: w, height: w < 600 ? 280 : el.classList.contains('tall') ? 400 : 340 });
  };
  new ResizeObserver(size).observe(el);
  size();
}

// Fareyle üzerine gelince değerleri gösteren küçük kutu (uPlot'un yerleşik açıklamasının yerine)
export function readout(el, format) {
  const box = document.createElement('div');
  box.className = 'readout';
  box.hidden = true;
  el.append(box);
  return (u) => {
    const i = u.cursor.idx;
    if (i == null) { box.hidden = true; return; }
    const html = format(u, i);
    if (!html) { box.hidden = true; return; }
    box.innerHTML = html; box.hidden = false;
    const left = u.valToPos(u.data[0][i], 'x') + u.over.offsetLeft;
    const flip = left > el.clientWidth - 200;
    box.style.left = flip ? '' : `${left + 14}px`;
    box.style.right = flip ? `${el.clientWidth - left + 14}px` : '';
  };
}
