// Sezon sayfası: yarış yarış kümülatif puan grafiği
import { $, chips, axis, fit, readout, assignDash } from '/assets/js/core.js';

const el = $('#progress-chart');
const data = JSON.parse($('#progress-data').textContent);
const drivers = assignDash(data.drivers.map((d) => ({ ...d })));
const selected = new Set(drivers.slice(0, 8).map((d) => d.code));

const x = data.labels.map((_, i) => i + 1);
const opts = {
  width: el.clientWidth, height: 340,
  legend: { show: false },
  cursor: { points: { size: 7 }, drag: { x: false, y: false } },
  scales: { x: { time: false }, y: { range: (u, min, max) => [0, Math.max(10, Math.ceil(max / 25) * 25)] } },
  axes: [
    axis({ values: (u, ticks) => ticks.map((t) => (Number.isInteger(t) ? data.labels[t - 1]?.slice(0, 3) ?? '' : '')), space: 34 }),
    axis({ size: 44 }),
  ],
  series: [{}, ...drivers.map((d) => ({ label: d.code, stroke: d.colour, width: 2, dash: d.dash || undefined, show: selected.has(d.code), points: { show: false } }))],
  hooks: {
    setCursor: [readout(el, (u, i) => {
      const rows = drivers.map((d, k) => ({ d, v: u.data[k + 1][i] })).filter((r) => selected.has(r.d.code)).sort((a, b) => b.v - a.v);
      if (!rows.length) return '';
      return `<b>${i + 1}. ${data.labels[i]}</b>${rows.map((r) => `<span><i style="background:${r.d.colour}"></i>${r.d.code}<em>${r.v}</em></span>`).join('')}`;
    })],
  },
};
el.textContent = '';
const plot = new uPlot(opts, [x, ...drivers.map((d) => d.pts)], el);
fit(plot, el);

chips($('#progress-chips'), drivers.map((d) => ({ key: d.code, label: d.code, colour: d.colour, title: d.name })), selected, () => {
  drivers.forEach((d, k) => plot.setSeries(k + 1, { show: selected.has(d.code) }));
});
