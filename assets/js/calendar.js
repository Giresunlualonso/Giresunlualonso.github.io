// Takvim: sıradaki oturuma geri sayım (ziyaretçinin yerel saatiyle)
import { $ } from '/assets/js/core.js';
import { t } from '/assets/js/i18n.js';
import { zoneLabel } from '/assets/js/localtime.js';
import { loadSchedule, whenText, L } from '/assets/js/reminders.js';

const all = await loadSchedule();
const title = $('#ns-title'), count = $('#ns-count'), when = $('#ns-when');

function tick() {
  const now = Date.now();
  const live = all.find((s) => Date.parse(s.start) <= now && Date.parse(s.end) > now);
  const s = live || all.find((x) => Date.parse(x.start) > now);
  if (!s) { title.textContent = t('Sezon tamamlandı', 'Season complete'); count.textContent = ''; when.textContent = ''; return; }
  const x = L(s);
  title.innerHTML = `<a href="${x.url}">${x.gp}</a> · ${x.label}`;
  if (live) { count.textContent = t('Şu an devam ediyor', 'Happening now'); count.classList.add('live'); }
  else {
    const d = Date.parse(s.start) - now;
    const days = Math.floor(d / 864e5), h = Math.floor(d / 36e5) % 24, m = Math.floor(d / 6e4) % 60, sec = Math.floor(d / 1e3) % 60;
    const p = (v) => String(v).padStart(2, '0');
    count.textContent = t(`${days ? `${days} gün ` : ''}${p(h)} sa ${p(m)} dk ${p(sec)} sn`, `${days ? `${days}d ` : ''}${p(h)}h ${p(m)}m ${p(sec)}s`);
    count.classList.remove('live');
  }
  when.textContent = `${whenText(s.start)} (${zoneLabel()})`;
}
tick();
setInterval(tick, 1000);
