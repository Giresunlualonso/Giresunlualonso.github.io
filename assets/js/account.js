// Üye sayfası: giriş/kayıt, bildirim tercihleri, bildirim izni, test bildirimi.
import { $ } from '/assets/js/core.js';
import { CONFIG } from '/assets/js/config.js';
import { lang, t } from '/assets/js/i18n.js';
import { zone, zoneLabel } from '/assets/js/localtime.js';
import { getUser, register, login, logout, savePrefs, saveToken, saveMeta, messagingToken } from '/assets/js/auth.js';
import { loadSchedule, upcoming, show, whenText, message, L, MIN } from '/assets/js/reminders.js';

const guest = $('#acc-guest');
const member = $('#acc-member');
const status = $('#notify-status');
const home = lang === 'tr' ? '/' : '/en/';

function bindForm(form, action) {
  const err = form.querySelector('.form-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    const btn = form.querySelector('button');
    btn.disabled = true;
    try {
      await action(Object.fromEntries(new FormData(form)));
      location.reload();
    } catch (ex) {
      err.textContent = ex.message; err.hidden = false;
    } finally { btn.disabled = false; }
  });
}

const supported = 'Notification' in window && 'serviceWorker' in navigator;

function renderStatus() {
  if (!supported) { status.textContent = t('Bu tarayıcı bildirimleri desteklemiyor. Takvime ekleme seçeneğini kullanabilirsiniz.', 'This browser does not support notifications. You can add the calendar file instead.'); status.dataset.state = 'off'; return; }
  const p = Notification.permission;
  status.dataset.state = p === 'granted' ? 'on' : 'off';
  status.textContent = p === 'granted' ? t('Bildirimler açık.', 'Notifications are on.') : p === 'denied'
    ? t('Bildirimler tarayıcı ayarlarından engellenmiş. Adres çubuğundaki kilit simgesinden izin verebilirsiniz.', 'Notifications are blocked in your browser settings. Allow them via the lock icon in the address bar.')
    : t('Bildirim almak için izin verin.', 'Allow notifications to receive reminders.');
  $('#notify-enable').hidden = p === 'granted';
  $('#notify-test').hidden = p !== 'granted';
}

async function renderNext(prefs) {
  const next = upcoming(await loadSchedule(), prefs)[0];
  const x = next && L(next);
  $('#next-reminder').textContent = next
    ? t(`Sıradaki bildirim: ${x.gp} ${x.label}, ${whenText(new Date(Date.parse(next.start) - MIN * 60e3).toISOString())} (${zoneLabel()}).`,
      `Next reminder: ${x.gp} ${x.label}, ${whenText(new Date(Date.parse(next.start) - MIN * 60e3).toISOString())} (${zoneLabel()}).`)
    : Object.values(prefs).some(Boolean) ? t('Seçtiğiniz türde yaklaşan oturum yok.', 'No upcoming sessions of the selected types.') : t('Hiçbir bildirim türü seçili değil.', 'No notification types selected.');
}

const user = await getUser().catch(() => null);
if (!user) {
  guest.hidden = false;
  bindForm($('#login-form'), login);
  bindForm($('#register-form'), register);
} else {
  guest.hidden = true;
  member.hidden = false;
  $('#acc-title').textContent = t(`Merhaba, ${user.name.split(' ')[0]}`, `Hello, ${user.name.split(' ')[0]}`);
  $('#acc-lead').textContent = t('Bildirim tercihlerinizi buradan yönetin.', 'Manage your notification preferences here.');
  $('#acc-info').textContent = `${user.name} · ${user.email}`;
  $('#demo-note').hidden = !CONFIG.demoMode;
  // Sunucu bildirimleri üyenin dilinde ve saat diliminde yazsın
  saveMeta({ lang, tz: zone }).catch(() => {});

  const form = $('#prefs-form');
  for (const [k, v] of Object.entries(user.prefs)) if (form.elements[k]) form.elements[k].checked = v;
  form.addEventListener('change', async () => {
    const prefs = Object.fromEntries(['race', 'quali', 'sprint', 'practice'].map((k) => [k, form.elements[k].checked]));
    await savePrefs(prefs);
    renderNext(prefs);
  });

  $('#notify-enable').addEventListener('click', async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;
        if (!CONFIG.demoMode) { const token = await messagingToken(reg); if (token) await saveToken(token); }
        await show({ title: t('Bildirimler açıldı', 'Notifications enabled'), body: t(`Seçtiğiniz oturumlardan ${MIN} dakika önce haber vereceğiz.`, `We will remind you ${MIN} minutes before the sessions you chose.`), tag: 'f1t-welcome', url: location.pathname });
      }
    } catch (ex) { status.textContent = `${t('Bildirim açılamadı', 'Could not enable notifications')}: ${ex.message}`; return; }
    renderStatus();
  });
  $('#notify-test').addEventListener('click', async () => {
    const next = upcoming(await loadSchedule(), { race: true })[0];
    const m = next ? message({ ...next, start: new Date(Date.now() + MIN * 60e3).toISOString() }) : null;
    await show({ title: t('Test bildirimi', 'Test notification'), body: m ? `${t('Örnek', 'Example')}: ${m.title}. ${m.body}` : t('Bildirimler çalışıyor.', 'Notifications are working.'), tag: 'f1t-test', url: m?.url || home });
  });
  $('#logout').addEventListener('click', async () => { await logout(); location.href = home; });

  if (supported && Notification.permission === 'granted') navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  renderStatus();
  renderNext(user.prefs);
}
