// Üyelik: demo (localStorage) ve canlı (Firebase Auth + Firestore) aynı arayüzle.
//   getUser() → { uid, email, name, prefs } | null
//   register({ name, email, password }) · login({ email, password }) · logout() · savePrefs(prefs) · saveToken(token)
import { CONFIG } from '/assets/js/config.js';
import { t } from '/assets/js/i18n.js';

export const DEFAULT_PREFS = { race: true, quali: false, sprint: false, practice: false };
const fail = (msg) => { throw new Error(msg); };
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function check({ name, email, password }, isRegister) {
  if (isRegister && (!name || name.trim().length < 2)) fail(t('Adınızı yazın.', 'Please enter your name.'));
  if (!validEmail(email || '')) fail(t('Geçerli bir e-posta adresi yazın.', 'Please enter a valid email address.'));
  if (!password || password.length < 6) fail(t('Şifre en az 6 karakter olmalı.', 'Password must be at least 6 characters.'));
}

// ---------- Demo: tarayıcıda saklanır (yalnızca bu cihaz) ----------
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
async function hash(salt, password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const demo = {
  async getUser() {
    const email = store.get('f1t_session', null);
    const u = email && store.get('f1t_users', {})[email];
    return u ? { uid: email, email, name: u.name, prefs: { ...DEFAULT_PREFS, ...u.prefs } } : null;
  },
  async register({ name, email, password }) {
    check({ name, email, password }, true);
    email = email.trim().toLowerCase();
    const users = store.get('f1t_users', {});
    if (users[email]) fail(t('Bu e-posta ile zaten üye olunmuş. Giriş yapın.', 'An account with this email already exists. Please sign in.'));
    const salt = crypto.randomUUID();
    users[email] = { name: name.trim(), salt, hash: await hash(salt, password), prefs: DEFAULT_PREFS, created: new Date().toISOString() };
    store.set('f1t_users', users); store.set('f1t_session', email);
  },
  async login({ email, password }) {
    check({ email, password });
    email = email.trim().toLowerCase();
    const u = store.get('f1t_users', {})[email];
    if (!u || u.hash !== await hash(u.salt, password)) fail(t('E-posta veya şifre hatalı.', 'Incorrect email or password.'));
    store.set('f1t_session', email);
  },
  async logout() { store.del('f1t_session'); },
  async savePrefs(prefs) {
    const email = store.get('f1t_session', null);
    const users = store.get('f1t_users', {});
    if (!users[email]) fail(t('Oturum bulunamadı.', 'Session not found.'));
    users[email].prefs = prefs; store.set('f1t_users', users);
  },
  async saveToken() {},
  async saveMeta(meta) {
    const email = store.get('f1t_session', null);
    const users = store.get('f1t_users', {});
    if (users[email]) { Object.assign(users[email], meta); store.set('f1t_users', users); }
  },
};

// ---------- Canlı: Firebase (yalnızca demoMode:false iken yüklenir) ----------
const V = '10.14.1';
let fb;
async function firebase() {
  if (fb) return fb;
  if (!CONFIG.firebase) fail(t('Firebase ayarları eksik (config.js).', 'Firebase settings missing (config.js).'));
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const app = initializeApp(CONFIG.firebase);
  fb = { app, auth, fs, a: auth.getAuth(app), db: fs.getFirestore(app) };
  await fb.a.authStateReady();
  return fb;
}
const AUTH_MSG = {
  'auth/email-already-in-use': ['Bu e-posta ile zaten üye olunmuş. Giriş yapın.', 'An account with this email already exists. Please sign in.'],
  'auth/invalid-credential': ['E-posta veya şifre hatalı.', 'Incorrect email or password.'], 'auth/wrong-password': ['E-posta veya şifre hatalı.', 'Incorrect email or password.'],
  'auth/user-not-found': ['E-posta veya şifre hatalı.', 'Incorrect email or password.'], 'auth/too-many-requests': ['Çok fazla deneme. Biraz sonra tekrar deneyin.', 'Too many attempts. Please try again later.'],
  'auth/network-request-failed': ['Bağlantı hatası. İnternetinizi kontrol edin.', 'Network error. Check your connection.'],
};
const tr = (e) => new Error(AUTH_MSG[e.code] ? t(...AUTH_MSG[e.code]) : e.message);
const live = {
  async getUser() {
    const { a, fs, db } = await firebase();
    const u = a.currentUser;
    if (!u) return null;
    const snap = await fs.getDoc(fs.doc(db, 'users', u.uid));
    const d = snap.exists() ? snap.data() : {};
    return { uid: u.uid, email: u.email, name: d.name || u.displayName || '', prefs: { ...DEFAULT_PREFS, ...d.prefs } };
  },
  async register({ name, email, password }) {
    check({ name, email, password }, true);
    const { a, auth, fs, db } = await firebase();
    try {
      const { user } = await auth.createUserWithEmailAndPassword(a, email.trim(), password);
      await auth.updateProfile(user, { displayName: name.trim() });
      await fs.setDoc(fs.doc(db, 'users', user.uid), { name: name.trim(), prefs: DEFAULT_PREFS, tokens: [], created: fs.serverTimestamp() });
    } catch (e) { throw tr(e); }
  },
  async login({ email, password }) {
    check({ email, password });
    const { a, auth } = await firebase();
    try { await auth.signInWithEmailAndPassword(a, email.trim(), password); } catch (e) { throw tr(e); }
  },
  async logout() { const { a, auth } = await firebase(); await auth.signOut(a); },
  async savePrefs(prefs) { const { a, fs, db } = await firebase(); await fs.setDoc(fs.doc(db, 'users', a.currentUser.uid), { prefs }, { merge: true }); },
  async saveToken(token) { const { a, fs, db } = await firebase(); await fs.setDoc(fs.doc(db, 'users', a.currentUser.uid), { tokens: fs.arrayUnion(token) }, { merge: true }); },
  async saveMeta(meta) { const { a, fs, db } = await firebase(); await fs.setDoc(fs.doc(db, 'users', a.currentUser.uid), meta, { merge: true }); },
  async messagingToken(registration) {
    const { app } = await firebase();
    const m = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-messaging.js`);
    if (!(await m.isSupported())) fail(t('Bu tarayıcı anlık bildirimleri desteklemiyor.', 'This browser does not support push notifications.'));
    return m.getToken(m.getMessaging(app), { vapidKey: CONFIG.vapidKey, serviceWorkerRegistration: registration });
  },
};

const impl = CONFIG.demoMode ? demo : live;
export const { getUser, register, login, logout, savePrefs, saveToken, saveMeta } = impl;
export const messagingToken = (reg) => (impl.messagingToken ? impl.messagingToken(reg) : null);
