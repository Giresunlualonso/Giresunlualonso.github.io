// Saatleri ziyaretçinin kendi saat dilimine çevirir. Sunucu <time datetime="UTC" data-lt="time|date|day"> yazar
// (Türkiye saatiyle yedek metin); burada tarayıcının saat dilimi ve sayfa diliyle yeniden yazılır.
import { t, locale } from '/assets/js/i18n.js';

export const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const offset = (d = new Date()) => new Intl.DateTimeFormat(locale, { timeZoneName: 'shortOffset' }).formatToParts(d).find((p) => p.type === 'timeZoneName')?.value || '';
export const zoneLabel = () => `${zone.split('/').at(-1).replace(/_/g, ' ')}, ${offset()}`;

const F = {
  time: { hour: '2-digit', minute: '2-digit' },
  date: { weekday: 'long', day: 'numeric', month: 'short' },
  day: { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
};
export const fmt = (iso, style = 'day') => new Date(iso).toLocaleString(locale, F[style] || F.day);

export function localizeTimes(root = document) {
  for (const el of root.querySelectorAll('time[data-lt]')) {
    el.textContent = fmt(el.getAttribute('datetime'), el.dataset.lt);
    el.title = zoneLabel();
  }
  for (const el of root.querySelectorAll('[data-tz-note]')) {
    el.textContent = t(`Saatler bulunduğunuz yerin saatiyle (${zoneLabel()}).`, `Times shown in your local time (${zoneLabel()}).`);
  }
}
localizeTimes();
