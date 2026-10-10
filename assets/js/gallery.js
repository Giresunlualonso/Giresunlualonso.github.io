// Galeri büyük görünümü: kareye tıklayınca <dialog> açılır; ← → ile aynı albümde gezinir, Esc/× kapatır.
// JS yoksa kare doğrudan büyük dosyaya gider (gallery.mjs bağlantısı).
const box = document.querySelector('[data-lightbox]');
const links = [...document.querySelectorAll('a.g-open')];

if (box && typeof box.showModal === 'function') {
  const img = box.querySelector('img');
  const cap = box.querySelector('.lb-cap');
  const cred = box.querySelector('.lb-credit');
  let album = [], i = 0;

  const show = () => {
    const a = album[i];
    img.src = a.href;
    img.alt = a.querySelector('img')?.alt || '';
    cap.textContent = a.dataset.caption || '';
    cred.innerHTML = a.dataset.credit || ''; // build'de kaçışlanmış atıf HTML'i
  };
  const move = (d) => { i = (i + d + album.length) % album.length; show(); };

  for (const a of links) {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      album = links.filter((x) => x.dataset.gallery === a.dataset.gallery);
      i = album.indexOf(a);
      show();
      box.showModal();
    });
  }
  box.addEventListener('click', (e) => {
    const act = e.target.closest('[data-lb]')?.dataset.lb;
    if (act === 'close' || e.target === box) box.close();
    else if (act === 'prev') move(-1);
    else if (act === 'next') move(1);
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') move(-1);
    else if (e.key === 'ArrowRight') move(1);
  });
  box.addEventListener('close', () => { img.removeAttribute('src'); });
}
