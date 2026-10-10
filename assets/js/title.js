// Şampiyonluk senaryo hesaplayıcısı (/sampiyonluk/): #title-data (src/pages/title.mjs) + seçilen sıralar → iki pilotun sezon sonu puanı.
// Puan tabloları sayfadaki veriden gelir (src/title.mjs ile aynı); diğer pilotların sonuçları hesaba katılmaz.
// Eşit puanda galibiyet sayısı (mevcut + senaryodaki yarış birincilikleri; sprint galibiyeti sayılmaz) karşılaştırılır.
import { t } from '/assets/js/i18n.js';

const box = document.getElementById('title-sim');
const raw = document.getElementById('title-data');
if (box && raw) {
  const D = JSON.parse(raw.textContent);
  const out = document.getElementById('sim-out');
  const rivalSel = document.getElementById('sim-rival');
  const rivalHead = document.getElementById('sim-rival-h');
  const last = (n) => n.split(' ').at(-1);
  const pts = (type, pos) => (pos > 0 ? ((type === 'sprint' ? D.sprint : D.race)[pos - 1] || 0) : 0);
  const sel = (who, i) => box.querySelector(`[data-sim="${who}"][data-i="${i}"]`);
  const line = (html, cls) => { const p = document.createElement('p'); if (cls) p.className = cls; p.innerHTML = html; out.append(p); };

  function calc() {
    const rival = D.rivals.find((r) => r.id === rivalSel.value) || D.rivals[0];
    rivalHead.textContent = last(rival.name);
    out.innerHTML = '';
    const picks = D.events.map((e, i) => ({ e, l: Number(sel('l', i).value), r: Number(sel('r', i).value) }));
    // İki pilot aynı sırada bitemez: hesaplamak yerine hangi etkinlikte çakıştığını göster
    const clash = picks.filter((p) => p.l && p.l === p.r);
    box.querySelectorAll('.sim-clash').forEach((x) => x.classList.remove('sim-clash'));
    if (clash.length) {
      picks.forEach((p, i) => { if (clash.includes(p)) { sel('l', i).classList.add('sim-clash'); sel('r', i).classList.add('sim-clash'); } });
      line(t(`İki pilot aynı sırada bitemez: ${clash.map((p) => p.e.label).join(', ')}. Birinin sırasını değiştir.`, `Two drivers cannot finish in the same position: ${clash.map((p) => p.e.label).join(', ')}. Change one of them.`), 'sim-err');
      return;
    }
    let l = D.leader.points;
    let r = rival.points;
    let lw = D.leader.wins || 0;
    let rw = rival.wins || 0;
    let left = D.events.reduce((a, e) => a + (e.type === 'sprint' ? D.sprint[0] : D.race[0]), 0);
    let decided = null;
    for (const p of picks) {
      l += pts(p.e.type, p.l);
      r += pts(p.e.type, p.r);
      if (p.e.type === 'race') { lw += p.l === 1 ? 1 : 0; rw += p.r === 1 ? 1 : 0; }
      left -= p.e.type === 'sprint' ? D.sprint[0] : D.race[0];
      if (!decided && Math.abs(l - r) > left) decided = p.e;
    }
    if (l === r) {
      const w = lw === rw ? null : lw > rw ? D.leader : rival;
      line(w
        ? t(`Sezon ${l}–${r} eşit biter; <b>${last(w.name)}</b> daha çok galibiyetle (${Math.max(lw, rw)}–${Math.min(lw, rw)}) şampiyon olur.`, `The season ends level on ${l}; <b>${last(w.name)}</b> takes the title on wins (${Math.max(lw, rw)}–${Math.min(lw, rw)}).`)
        : t(`Sezon ${l}–${r} eşit biter ve galibiyetler de eşit (${lw}); şampiyonu ikincilik sayısı belirler.`, `The season ends level on ${l} with equal wins (${lw}); second places decide the title.`));
    } else {
      const [w, a, b] = l > r ? [D.leader, l, r] : [rival, r, l];
      line(t(`<b>${last(w.name)}</b> şampiyon olur: ${a}–${b}, ${a - b} puan fark.`, `<b>${last(w.name)}</b> wins the title: ${a}–${b}, a ${a - b}-point margin.`));
      if (decided) line(t(`Bu senaryoda şampiyonluk ${decided.label} sonunda kesinleşir.`, `In this scenario the title is decided at the ${decided.label}.`), 'muted');
    }
  }
  box.hidden = false;
  box.addEventListener('change', calc);
  calc();
}
