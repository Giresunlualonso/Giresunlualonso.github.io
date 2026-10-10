// Video kartına tıklayınca YouTube oynatıcısı (youtube-nocookie, gelişmiş gizlilik) <dialog> içinde açılır.
// Oynatıcı ancak tıklamada yüklenir; kapatınca iframe kaldırılır (ses durur). JS yoksa kart YouTube'a gider.
const box = document.querySelector('[data-video-box]');
if (box && typeof box.showModal === 'function') {
  const frame = box.querySelector('.vb-frame');
  const close = () => box.close();
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-video]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.dataset.video;
    if (!/^[\w-]{11}$/.test(id)) return;
    e.preventDefault();
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    f.title = a.querySelector('.vc-title')?.textContent || 'YouTube';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    frame.replaceChildren(f);
    box.classList.toggle('is-short', a.classList.contains('is-short'));
    box.showModal();
  });
  box.querySelector('[data-vb-close]')?.addEventListener('click', close);
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  box.addEventListener('close', () => frame.replaceChildren());
}
