// Canlı yarış ekranı DEMO: kaydedilmiş yarışın tur verisinden (OpenF1) her tur sonu anlık görüntüsü hesaplanır.
// Anlık görüntü = liderin L. turu bitirdiği an (t): her pilot t'ye kadar kaç tur tamamladı → sıralama (tur desc, toplam süre asc).
// Böylece tur farkı yiyenler "+N tur", bitiremeyenler "Çekildi" görünür. Süresi olmayan tur = pilotun medyan turu (tahmin).
import { t } from '/assets/js/i18n.js';

const cfg = JSON.parse(document.getElementById('live-data')?.textContent || 'null');
const form = document.querySelector('[data-live-ctrl]');
const body = document.querySelector('[data-live-body]');
const feedEl = document.querySelector('[data-live-feed]');

const TYRE = { SOFT: ['S', 'soft'], MEDIUM: ['M', 'medium'], HARD: ['H', 'hard'], INTERMEDIATE: ['I', 'intermediate'], WET: ['W', 'wet'] };
const fmt = (s) => (s == null ? '–' : s >= 60 ? `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, '0')}` : s.toFixed(3));
const median = (a) => { const v = a.filter((x) => x > 0).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : null; };

function build(meta, data) {
  const total = meta.laps;
  const D = meta.drivers.map((d) => {
    const raw = data.laps[d.n] || [];
    const byLap = {};
    for (const l of raw) byLap[l[0]] = l[1];
    const med = median(raw.map((l) => l[1]));
    const done = Math.min(d.laps || raw.length, total);
    const times = [], cum = [0];
    for (let k = 1; k <= done; k++) { const v = byLap[k] > 0 ? byLap[k] : med || 100; times[k] = v; cum[k] = cum[k - 1] + v; }
    const stints = data.stints.filter((x) => x.n === d.n).sort((a, b) => a.stint - b.stint);
    const pits = data.pits.filter((x) => x.n === d.n).map((x) => x.lap).sort((a, b) => a - b);
    return { ...d, times, cum, done, stints, pits, out: typeof d.pos !== 'number' };
  });
  const leaderAt = (L) => Math.min(...D.filter((d) => d.done >= L).map((d) => d.cum[L]));
  const snaps = [];
  for (let L = 0; L <= total; L++) {
    let rows;
    if (L === 0) {
      rows = D.map((d) => ({ d, laps: 0, at: 0 })).sort((a, b) => (a.d.grid || 99) - (b.d.grid || 99));
    } else {
      // Son turda herkesin bitirmesi beklenir (damalı bayraktan sonra kalanlar da çizgiyi geçer)
      const tt = L === total ? Infinity : leaderAt(L);
      rows = D.map((d) => {
        let k = 0;
        while (k < d.done && d.cum[k + 1] <= tt + 1e-6) k++;
        return { d, laps: k, at: d.cum[k], retired: d.out && k === d.done && d.done < L };
      }).sort((a, b) => (a.retired - b.retired) || (b.laps - a.laps) || (a.at - b.at));
    }
    const lead = rows[0];
    rows.forEach((r, i) => {
      r.pos = i + 1;
      const tyreLap = Math.max(1, r.laps + (r.laps < r.d.done ? 1 : 0));
      const st = r.d.stints.find((x) => tyreLap >= (x.from ?? 1) && tyreLap <= (x.to ?? 999)) || r.d.stints.at(-1);
      r.tyre = st?.compound;
      r.tyreAge = st ? tyreLap - (st.from ?? 1) + (st.age || 0) : null;
      r.pitN = r.d.pits.filter((p) => p <= r.laps).length;
      r.last = r.laps ? r.d.times[r.laps] : null;
      if (L === 0) { r.gap = ''; r.int = ''; return; }
      if (r.retired) { r.gap = t('Çekildi', 'OUT'); r.int = ''; return; }
      // Fark = aynı tur çizgisini geçiş zamanları farkı (r, o'nun tamamladığı tura ulaştıysa). Fark o'nun bir turundan
      // uzunsa ya da r o tura hiç ulaşmadıysa tur farkı yazılır.
      const gapTo = (o) => {
        if (o.laps === 0) return '';
        const g = r.d.done >= o.laps ? r.d.cum[o.laps] - o.d.cum[o.laps] : null;
        const lapT = o.d.times[o.laps] || 100;
        if (g != null && g >= 0 && g < lapT) return `+${g.toFixed(3)}`;
        const n = Math.max(1, o.laps - r.laps - (g != null && g < lapT * 2 ? 0 : 0));
        return `+${n} ${t('tur', n > 1 ? 'laps' : 'lap')}`;
      };
      r.gap = i === 0 ? t('Lider', 'Leader') : gapTo(lead);
      r.int = i === 0 ? '' : gapTo(rows[i - 1]);
    });
    snaps.push(rows);
  }
  // Son kare = resmi sonuç (yarış sonrası zaman cezaları dahil) ve resmi farklar; pist sırasından farklıysa akışta belirtilir
  if (total) {
    const track = snaps[total].map((r) => r.d.id).join();
    const byId = Object.fromEntries(snaps[total].map((r) => [r.d.id, r]));
    const official = meta.drivers.map((d) => byId[d.id]).filter(Boolean);
    official.forEach((r, i) => {
      r.pos = i + 1;
      if (!r.retired) { r.gap = i === 0 ? t('Kazanan', 'Winner') : (r.d.time || r.gap); r.int = ''; }
    });
    snaps[total] = official;
    snaps.officialDiffers = track !== official.map((r) => r.d.id).join();
  }
  // Akış olayları (tur tur): liderlik, pit, en hızlı tur, çekilme
  const events = [];
  let best = Infinity;
  for (let L = 1; L <= total; L++) {
    const a = snaps[L - 1], b = snaps[L];
    if (L > 1 && a[0].d.id !== b[0].d.id) events.push({ L, k: 'lead', txt: t(`${b[0].d.code} liderliği aldı`, `${b[0].d.code} takes the lead`) });
    for (const d of D) {
      if (d.pits.includes(L)) events.push({ L, k: 'pit', txt: t(`${d.code} pite girdi`, `${d.code} pits`) });
      if (d.times[L] && d.times[L] < best && L > 1) { best = d.times[L]; events.push({ L, k: 'fl', txt: t(`${d.code} en hızlı tur: ${fmt(d.times[L])}`, `${d.code} fastest lap: ${fmt(d.times[L])}`) }); }
      if (d.out && d.done === L - 1) events.push({ L, k: 'out', txt: t(`${d.code} yarıştan çekildi`, `${d.code} retires`) });
    }
  }
  if (total) events.push({ L: total, k: 'flag', txt: t(`Damalı bayrak! ${snaps[total][0].d.name} kazandı`, `Chequered flag! ${snaps[total][0].d.name} wins`) });
  if (snaps.officialDiffers) events.push({ L: total, k: 'flag', txt: t('Tablo resmi sonucu gösteriyor; pistteki sıradan farkı yarış sonrası cezalar ya da zamanlama ayrıntıları yaratıyor.', 'The table shows the official result; differences from the on-track order come from post-race penalties or timing details.') });
  return { snaps, events, total };
}

if (cfg && form && body && cfg.races.length) {
  let race = null, lap = 0, timer = null;
  const range = form.lap;
  const playBtn = form.querySelector('[data-play]');

  const tyre = (c, age) => { const x = TYRE[c]; return x ? `<span class="tyre-pill c-${x[1]}" title="${c}${age != null ? ` · ${age} ${t('tur', 'laps')}` : ''}">${x[0]}</span>${age != null ? ` <span class="muted small">${age}</span>` : ''}` : '–'; };
  function render() {
    const rows = race.snaps[lap];
    body.innerHTML = rows.map((r) => `<tr class="${r.retired ? 'is-out' : ''}" style="--tc:${r.d.colour}"><td>${r.pos}</td><td><span class="drv"><span class="tc"></span><b class="code">${r.d.code}</b><span class="dname hide-sm">${r.d.name}</span></span></td><td class="num">${r.gap}</td><td class="num">${r.int}</td><td class="num hide-sm">${fmt(r.last)}</td><td>${r.retired ? '' : tyre(r.tyre, r.tyreAge)}</td><td class="num hide-sm">${r.pitN}</td></tr>`).join('');
    form.querySelector('[data-lap-label]').textContent = lap;
    range.value = lap;
    const ev = race.events.filter((e) => e.L <= lap).slice(-25).reverse();
    feedEl.innerHTML = ev.map((e) => `<li class="ev-${e.k}"><span class="muted small">${t('Tur', 'Lap')} ${e.L}</span> ${e.txt}</li>`).join('') || `<li class="muted">${t('Start bekleniyor', 'Waiting for the start')}</li>`;
  }
  const stop = () => { clearInterval(timer); timer = null; playBtn.textContent = t('Oynat', 'Play'); };
  const play = () => {
    if (lap >= race.total) lap = 0;
    playBtn.textContent = t('Duraklat', 'Pause');
    timer = setInterval(() => { lap++; render(); if (lap >= race.total) stop(); }, Number(form.speed.value));
  };
  async function load(i) {
    stop();
    const meta = cfg.races[i];
    body.innerHTML = `<tr><td colspan="7" class="muted">${t('Yükleniyor…', 'Loading…')}</td></tr>`;
    const data = await fetch(meta.data).then((r) => r.json());
    race = build(meta, data);
    lap = 0;
    range.max = race.total;
    form.querySelector('[data-lap-total]').textContent = race.total;
    render();
  }
  playBtn.addEventListener('click', () => (timer ? stop() : play()));
  form.race.addEventListener('change', () => load(Number(form.race.value)));
  form.speed.addEventListener('change', () => { if (timer) { stop(); play(); } });
  range.addEventListener('input', () => { stop(); lap = Number(range.value); render(); });
  // ?yaris=<tur no>&tur=<L> ile doğrudan bir yarışın bir turu açılır
  const q = new URLSearchParams(location.search);
  const ri = Math.max(0, cfg.races.findIndex((m) => String(m.round) === q.get('yaris')));
  form.race.value = String(ri);
  load(ri).then(() => { const L = Number(q.get('tur')); if (L > 0) { lap = Math.min(L, race.total); render(); } }).catch(() => { body.innerHTML = `<tr><td colspan="7">${t('Veri yüklenemedi.', 'Could not load data.')}</td></tr>`; });
}
