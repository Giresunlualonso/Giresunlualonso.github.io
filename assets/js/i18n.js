// Tarayıcı tarafı dil: sayfanın <html lang> değerinden. t('türkçe', 'english')
export const lang = document.documentElement.lang === 'en' ? 'en' : 'tr';
export const t = (tr, en) => (lang === 'tr' ? tr : en);
export const locale = lang === 'tr' ? 'tr-TR' : 'en-GB';
