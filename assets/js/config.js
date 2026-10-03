// Site çalışma ayarları. Canlıya geçiş: KURULUM.md → "Üyelik ve bildirimler".
export const CONFIG = {
  // true: üyelik tarayıcıda (localStorage) tutulur, bildirim yalnızca site bir sekmede açıkken gelir.
  // false: Firebase Auth + Firestore + Cloud Messaging; bildirim tarayıcı kapalıyken de gelir.
  demoMode: true,
  // Firebase konsolu → Proje ayarları → Web uygulaması yapılandırması (demoMode:false için zorunlu)
  firebase: null, // { apiKey, authDomain, projectId, messagingSenderId, appId }
  // Firebase konsolu → Cloud Messaging → Web Push sertifikaları → anahtar çifti
  vapidKey: null,
  reminderMinutes: 15,
};
