// Her sayfada: saatleri yerel saate çevirir, menüde "Üye girişi" → "Hesabım", demo modunda 15 dk önce bildirimi bu sekmeden planlar.
// Canlı modda bildirimi sunucu (Cloud Functions + FCM) gönderir, burada planlama yapılmaz.
import '/assets/js/localtime.js';
import '/assets/js/cart-store.js'; // menüdeki sepet sayısı
import { CONFIG } from '/assets/js/config.js';
import { t } from '/assets/js/i18n.js';
import { getUser } from '/assets/js/auth.js';
import { loadSchedule, upcoming, message, show, MIN } from '/assets/js/reminders.js';

// Telefonda menü düğmesi: menüyü açar/kapar (geniş ekranda düğme gizli, menü hep açık)
const menuBtn = document.querySelector('.menu-btn');
if (menuBtn) {
  const header = menuBtn.closest('.site-header');
  const set = (open) => { header.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', String(open)); };
  menuBtn.addEventListener('click', () => set(menuBtn.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && header.classList.contains('menu-open')) { set(false); menuBtn.focus(); } });
}

// Yarışlar açılır menüsü: dışarı tıklayınca / Esc ile kapanır; açılınca seçili yıl görünür
const drop = document.querySelector('.nav-drop');
if (drop) {
  drop.addEventListener('toggle', () => { if (drop.open) drop.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' }); });
  document.addEventListener('click', (e) => { if (drop.open && !drop.contains(e.target)) drop.open = false; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drop.open) { drop.open = false; drop.querySelector('summary').focus(); } });
}

const user = await getUser().catch(() => null);
const link = document.querySelector('.nav-account');
if (user && link) link.textContent = t('Hesabım', 'My account');

const DAY = 24 * 3600e3;
const sentKey = (s) => `f1t_notified:${s.key}`;
const wasSent = (s) => { try { return localStorage.getItem(sentKey(s)); } catch { return null; } };
const markSent = (s) => { try { localStorage.setItem(sentKey(s), '1'); } catch {} };

async function fire(s) {
  if (wasSent(s) || Date.parse(s.start) <= Date.now()) return;
  markSent(s);
  await show(message(s));
}

if (user && CONFIG.demoMode && 'Notification' in window && Notification.permission === 'granted') {
  for (const s of upcoming(await loadSchedule(), user.prefs)) {
    const wait = Date.parse(s.start) - MIN * 60e3 - Date.now();
    if (wait > DAY) break;
    // Hatırlatma zamanı geldiyse (sekme sonradan açıldıysa da) hemen, değilse zamanında
    if (wait <= 0) fire(s); else setTimeout(() => fire(s), wait);
  }
}
