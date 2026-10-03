// Ana sayfa: yarış haftasındaysak (yarışın olduğu haftanın pazartesisi 00:00 → yarış başlangıcı + 3 saat, ziyaretçinin yerel saatiyle)
// üstte "Yarış haftası · Malezya'da" şeridini gösterir. Veri sayfaya gömülü (#race-weeks), build gerekmeden her gün doğru hafta seçilir.
import { t, locale } from '/assets/js/i18n.js';

const box = document.querySelector('[data-race-week]');
let weeks = [];
try { weeks = JSON.parse(document.getElementById('race-weeks')?.textContent || '[]'); } catch {}

function weekStart(d) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); // pazartesi
  return m;
}

const now = new Date();
const hit = weeks.find((w) => {
  const race = new Date(w.start);
  return now >= weekStart(race) && now <= new Date(race.getTime() + 3 * 3600e3);
});

if (box && hit) {
  const race = new Date(hit.start);
  const live = now >= race;
  const when = race.toLocaleString(locale, { weekday: 'long', hour: '2-digit', minute: '2-digit' });
  const where = hit.where || hit.gp;
  const title = document.createElement('a');
  title.href = hit.url;
  title.className = 'rw-title';
  title.textContent = hit.where ? t(`Yarış haftası ${where}`, `Race week ${where}`) : t(`Yarış haftası: ${where}`, `Race week: ${where}`);
  const label = document.createElement('span');
  label.className = 'rw-label';
  label.textContent = live ? t('Yarış şu an', 'Racing now') : t('Bu hafta sonu', 'This weekend');
  const info = document.createElement('span');
  info.className = 'rw-info';
  info.textContent = `${hit.gp} · ${hit.round}. ${t('tur', 'round')}${hit.sprint ? ' · Sprint' : ''} · ${t('Yarış', 'Race')}: ${when}`;
  box.replaceChildren(label, title, info);
  box.hidden = false;
}
