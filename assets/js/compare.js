// Pilot karşılaştırma: #compare-data (compare.mjs) → iki pilotun sayıları, kafa kafaya, puan gidişatı (SVG), yarış yarış not.
// Seçim adrese yazılır (?a=&b=), sayfa yenilenince/paylaşılınca aynı karşılaştırma açılır.
import { t } from '/assets/js/i18n.js';

const data = JSON.parse(document.getElementById('compare-data')?.textContent || 'null');
const form = document.querySelector('[data-compare-form]');
const out = document.getElementById('compare-out');

if (data && form && out) {
  const byId = Object.fromEntries(data.drivers.map((d) => [d.id, d]));
  const num = (v, dg = 1) => (v == null ? '–' : v.toLocaleString(data.lang === 'tr' ? 'tr-TR' : 'en-GB', { minimumFractionDigits: dg, maximumFractionDigits: dg }));
  const isNum = (v) => typeof v === 'number';
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) if (k === 'style') n.style.cssText = v; else n.setAttribute(k, v);
    n.append(...kids.flat().filter((k) => k != null));
    return n;
  };

  function h2h(a, b) {
    const race = [0, 0], quali = [0, 0];
    for (const r of data.rounds) {
      const x = a.fin[r.round], y = b.fin[r.round];
      if (isNum(x) && isNum(y)) race[x < y ? 0 : 1]++;
      const qa = r.q[a.id], qb = r.q[b.id];
      if (qa && qb) quali[qa < qb ? 0 : 1]++;
    }
    return { race, quali };
  }

  const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const ratings = (d) => data.rounds.map((r) => r.rt[d.id]).filter((v) => v != null);

  function statRow(label, va, vb, better = 'high', fmt = (v) => v) {
    const win = va == null || vb == null || va === vb ? null : (better === 'high' ? va > vb : va < vb) ? 'a' : 'b';
    return el('tr', {}, el('td', { class: `num${win === 'a' ? ' cmp-win' : ''}` }, String(fmt(va))), el('th', { scope: 'row' }, label), el('td', { class: `num${win === 'b' ? ' cmp-win' : ''}` }, String(fmt(vb))));
  }

  function bar(label, [x, y], a, b) {
    const tot = x + y || 1;
    return el('div', { class: 'h2h-row' },
      el('span', { class: 'h2h-v' }, String(x)),
      // Takım arkadaşları aynı renkte → ikinci pilotun çubuğu soluk
      el('span', { class: 'h2h-bar' }, el('span', { style: `width:${(x / tot * 100).toFixed(1)}%;background:${a.colour}` }), el('span', { style: `width:${(y / tot * 100).toFixed(1)}%;background:${b.colour}${a.colour === b.colour ? ';opacity:.4' : ''}` })),
      el('span', { class: 'h2h-v' }, String(y)),
      el('span', { class: 'h2h-l' }, label));
  }

  // Puan gidişatı: iki kümülatif çizgi (aynı takım rengi olursa ikinci kesikli)
  function chart(a, b) {
    const n = Math.max(a.prog.length, b.prog.length);
    if (n < 2) return null;
    const W = 720, H = 220, pl = 40, pr = 10, pt = 10, pb = 26;
    const max = Math.max(1, ...a.prog, ...b.prog);
    const x = (i) => pl + i * (W - pl - pr) / (n - 1);
    const y = (v) => H - pb - v / max * (H - pt - pb);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', t('Puan gidişatı', 'Points progression'));
    const add = (tag, at) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); svg.append(e); return e; };
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      add('line', { x1: pl, x2: W - pr, y1: y(max * f), y2: y(max * f), class: 'fc-grid' });
      add('text', { x: pl - 6, y: y(max * f) + 4, 'text-anchor': 'end', class: 'fc-ax' }).textContent = Math.round(max * f);
    }
    for (let i = 0; i < n; i++) add('text', { x: x(i), y: H - 6, 'text-anchor': 'middle', class: 'fc-ax' }).textContent = i + 1;
    [[a, false], [b, a.colour === b.colour]].forEach(([d, dash]) => {
      add('polyline', { points: d.prog.map((v, i) => `${x(i)},${y(v)}`).join(' '), fill: 'none', stroke: d.colour, 'stroke-width': 2.5, 'stroke-dasharray': dash ? '6 4' : 'none' });
    });
    return el('figure', { class: 'finish-chart' }, svg, el('figcaption', { class: 'fc-legend' }, `${a.code} — ${b.code}${a.colour === b.colour ? t(' (kesikli)', ' (dashed)') : ''} · ${t('Yatay eksen: tur', 'Horizontal axis: round')}`));
  }

  function render() {
    const a = byId[form.a.value], b = byId[form.b.value];
    if (!a || !b) return;
    const h = h2h(a, b);
    const ra = avg(ratings(a)), rb = avg(ratings(b));
    const head = (d) => el('a', { class: 'cmp-head', href: d.url, style: `--tc:${d.colour}` }, el('b', {}, d.name), el('span', { class: 'muted small' }, `${d.team} · ${d.pos}. ${t('sırada', 'in standings')}`));
    const stats = el('table', { class: 'data compact cmp-table' }, el('tbody', {},
      statRow(t('Puan', 'Points'), a.points, b.points),
      statRow(t('Şampiyona sırası', 'Championship position'), a.pos, b.pos, 'low'),
      statRow(t('Galibiyet', 'Wins'), a.wins, b.wins),
      statRow(t('Podyum', 'Podiums'), a.podiums, b.podiums),
      statRow('Pole', a.poles, b.poles),
      statRow(t('En hızlı tur', 'Fastest laps'), a.fl, b.fl),
      statRow(t('Bitiremedi', 'DNFs'), a.dnf, b.dnf, 'low'),
      statRow(t('Ort. pilot notu', 'Avg. rating'), ra, rb, 'high', (v) => num(v)),
    ));
    const rows = data.rounds.map((r) => el('tr', {},
      el('td', { class: 'num' }, String(r.round)), el('td', {}, el('a', { href: `${r.url}#puanlar` }, r.name)),
      el('td', { class: 'num' }, a.fin[r.round] == null ? '–' : String(a.fin[r.round])), el('td', { class: 'num' }, num(r.rt[a.id])),
      el('td', { class: 'num' }, b.fin[r.round] == null ? '–' : String(b.fin[r.round])), el('td', { class: 'num' }, num(r.rt[b.id]))));
    out.replaceChildren(
      el('div', { class: 'cmp-heads' }, head(a), el('span', { class: 'muted' }, 'vs'), head(b)),
      el('div', { class: 'grid-2' },
        el('section', { class: 'card' }, el('h2', {}, t('Sezon sayıları', 'Season numbers')), el('div', { class: 'table-wrap' }, stats)),
        el('section', { class: 'card h2h' }, el('h2', {}, t('Kafa kafaya', 'Head to head')), bar(t('Yarışta önde', 'Race ahead'), h.race, a, b), bar(t('Sıralamada önde', 'Quali ahead'), h.quali, a, b), bar(t('Puan', 'Points'), [a.points, b.points], a, b))),
      el('section', { class: 'card' }, el('h2', {}, t('Puan gidişatı', 'Points progression')), chart(a, b)),
      el('section', { class: 'card' }, el('h2', {}, t('Yarış yarış', 'Race by race')), el('div', { class: 'table-wrap' }, el('table', { class: 'data compact' },
        el('thead', {}, el('tr', {}, el('th', { class: 'num' }, t('Tur', 'Rd')), el('th', {}, t('Yarış', 'Race')), el('th', { class: 'num' }, a.code), el('th', { class: 'num' }, t('Not', 'Rating')), el('th', { class: 'num' }, b.code), el('th', { class: 'num' }, t('Not', 'Rating')))),
        el('tbody', {}, rows)))),
    );
    const u = new URL(location.href);
    u.searchParams.set('a', a.id);
    u.searchParams.set('b', b.id);
    history.replaceState(null, '', u);
  }

  const q = new URLSearchParams(location.search);
  if (byId[q.get('a')]) form.a.value = q.get('a');
  if (byId[q.get('b')]) form.b.value = q.get('b');
  form.addEventListener('change', render);
  form.querySelector('[data-swap]')?.addEventListener('click', () => { [form.a.value, form.b.value] = [form.b.value, form.a.value]; render(); });
  render();
}
