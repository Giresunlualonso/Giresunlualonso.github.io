// Bildirim yardımcıları: oturum listesi, tercihle eşleşen sıradaki oturumlar, bildirim gösterme.
// Saatler ziyaretçinin kendi saat dilimiyle, metinler sayfanın diliyle yazılır.
import { CONFIG } from '/assets/js/config.js';
import { lang, t } from '/assets/js/i18n.js';
import { fmt, zoneLabel } from '/assets/js/localtime.js';

export const MIN = CONFIG.reminderMinutes;

let cache;
export async function loadSchedule() {
  if (!cache) cache = fetch('/assets/data/schedule.json').then((r) => (r.ok ? r.json() : [])).catch(() => []);
  return cache;
}

// Oturumun bu dildeki adı / GP adı / adresi
export const L = (s) => ({ gp: lang === 'tr' ? s.gp : s.gpEn || s.gp, label: lang === 'tr' ? s.label : s.labelEn || s.label, url: lang === 'tr' ? s.url : s.urlEn || s.url });

// Tercihe uyan, henüz başlamamış oturumlar (en yakın önce)
export const upcoming = (schedule, prefs, now = Date.now()) =>
  schedule.filter((s) => prefs[s.type] && Date.parse(s.start) > now).sort((a, b) => a.start.localeCompare(b.start));

export function message(s, now = Date.now()) {
  const left = Math.max(1, Math.round((Date.parse(s.start) - now) / 60000));
  const x = L(s);
  return {
    title: t(`${x.label} ${left} dakika sonra başlıyor`, `${x.label} starts in ${left} minutes`),
    body: `${x.gp} · ${fmt(s.start, 'time')} (${zoneLabel()}). ${t('Sonuçlar ve canlı veri için dokunun.', 'Tap for results and live data.')}`,
    tag: `f1t-${s.key}`,
    url: x.url,
  };
}

export async function show({ title, body, tag, url }) {
  const opts = { body, tag, icon: '/assets/images/icon-192.png', badge: '/assets/images/icon-192.png', data: { url } };
  const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration('/') : null;
  if (reg) return reg.showNotification(title, opts);
  const n = new Notification(title, opts);
  n.onclick = () => { window.focus(); location.href = url; };
}

export const whenText = (iso) => fmt(iso, 'day');
