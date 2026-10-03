// Yarış sayfası: tur süreleri grafiği + sektör/tempo özeti
import { $, chips, axis, fit, readout, fmtLap, fmtSec, median, assignDash } from '/assets/js/core.js';
import { t } from '/assets/js/i18n.js';

const table = $('#lap-table');
const el = $('#lap-chart');
const cleanBox = $('#lap-clean');

let race;
try {
  const res = await fetch(table.dataset.src);
  if (!res.ok) throw new Error(res.status);
  race = await res.json();
} catch (e) {
  el.innerHTML = `<p class="muted loading">${t('Tur verisi yüklenemedi. Sayfayı yenileyin.', 'Could not load lap data. Please refresh.')}</p>`;
  throw e;
}

// Tur satırı: [tur, süre, s1, s2, s3, pitÇıkış, hızTuzağı]
const inLaps = {}; // pilot → pite girilen turlar
for (const p of race.pits) (inLaps[p.n] ||= new Set()).add(p.lap);
const all = Object.values(race.laps).flat().map((l) => l[1]).filter(Boolean);
const slowLimit = median(all) * 1.07; // güvenlik aracı / sanal güvenlik aracı / sorunlu turlar bunun üstünde kalır

const isClean = (n, l) => l[1] && l[0] > 1 && !l[5] && !inLaps[n]?.has(l[0]) && l[1] <= slowLimit;

const drivers = assignDash(race.drivers.filter((d) => race.laps[d.n]?.length).map((d) => ({ ...d, colour: d.colour || '#8a939e' })));
const maxLap = Math.max(...drivers.map((d) => race.laps[d.n].at(-1)[0]));
const x = Array.from({ length: maxLap }, (_, i) => i + 1);
const selected = new Set(drivers.slice(0, 5).map((d) => d.n));

function seriesData(clean) {
  return drivers.map((d) => {
    const arr = new Array(maxLap).fill(null);
    for (const l of race.laps[d.n]) if (l[1] && (!clean || isClean(d.n, l))) arr[l[0] - 1] = l[1];
    return arr;
  });
}

const opts = {
  width: el.clientWidth, height: 400,
  legend: { show: false },
  cursor: { points: { size: 7 }, drag: { x: true, y: false } },
  scales: { x: { time: false } },
  axes: [
    axis({ label: t('Tur', 'Lap'), labelSize: 20, labelFont: '600 12px Titillium Web', incrs: [1, 2, 5, 10, 20] }),
    axis({ size: 52, values: (u, ticks) => ticks.map((t) => fmtLap(t).replace(/\.\d+$/, '')) }),
  ],
  series: [{}, ...drivers.map((d) => ({ label: d.code, stroke: d.colour, width: 1.75, dash: d.dash || undefined, show: selected.has(d.n), spanGaps: false, points: { show: false } }))],
  hooks: {
    setCursor: [readout(el, (u, i) => {
      const rows = drivers.map((d, k) => ({ d, v: u.data[k + 1][i] })).filter((r) => selected.has(r.d.n) && r.v != null).sort((a, b) => a.v - b.v);
      if (!rows.length) return '';
      return `<b>${t(`${i + 1}. tur`, `Lap ${i + 1}`)}</b>${rows.map((r) => `<span><i style="background:${r.d.colour}"></i>${r.d.code}<em>${fmtLap(r.v)}</em></span>`).join('')}`;
    })],
  },
};
el.textContent = '';
const plot = new uPlot(opts, [x, ...seriesData(true)], el);
fit(plot, el);

chips($('#lap-chips'), drivers.map((d) => ({ key: d.n, label: d.code, colour: d.colour, title: d.name })), selected, () => {
  drivers.forEach((d, k) => plot.setSeries(k + 1, { show: selected.has(d.n) }));
});
cleanBox.addEventListener('change', () => { plot.setData([x, ...seriesData(cleanBox.checked)]); });

// Özet tablo
const rows = drivers.map((d) => {
  const laps = race.laps[d.n];
  const min = (i) => { const v = laps.map((l) => l[i]).filter((v) => v != null); return v.length ? Math.min(...v) : null; };
  const s = [min(2), min(3), min(4)];
  return {
    d, best: min(1), pace: median(laps.filter((l) => isClean(d.n, l)).map((l) => l[1])),
    s1: s[0], s2: s[1], s3: s[2], ideal: s.every((v) => v != null) ? s[0] + s[1] + s[2] : null,
    speed: Math.max(0, ...laps.map((l) => l[6] || 0)) || null,
  };
});
rows.splice(0, rows.length, ...rows.filter((r) => r.best != null));
const cols = ['best', 'pace', 's1', 's2', 's3', 'ideal', 'speed'];
const bestOf = Object.fromEntries(cols.map((c) => {
  const v = rows.map((r) => r[c]).filter((v) => v != null);
  return [c, c === 'speed' ? Math.max(...v) : Math.min(...v)];
}));
const cell = (r, c, f) => `<td class="num${r[c] != null && r[c] === bestOf[c] ? ' best' : ''}">${f(r[c])}</td>`;
table.tBodies[0].innerHTML = rows.map((r) => `<tr><td><span class="drv"><span class="tc" style="--tc:${r.d.colour}"></span><b class="code">${r.d.code}</b><span class="dname">${r.d.name}</span></span></td>${cell(r, 'best', fmtLap)}${cell(r, 'pace', fmtLap)}${cell(r, 's1', fmtSec)}${cell(r, 's2', fmtSec)}${cell(r, 's3', fmtSec)}${cell(r, 'ideal', fmtLap)}${cell(r, 'speed', (v) => (v == null ? '–' : v))}</tr>`).join('');
