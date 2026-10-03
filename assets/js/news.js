// Haber listesi: tür filtresi (Tümü / Yarış / Pilotlar / FIA / Teknik / Takımlar)
const list = document.getElementById('news-list');
const buttons = document.querySelectorAll('[data-news-filter]');
for (const b of buttons) {
  b.addEventListener('click', () => {
    const g = b.dataset.newsFilter;
    buttons.forEach((x) => x.setAttribute('aria-pressed', x === b));
    for (const li of list.children) li.hidden = Boolean(g) && li.dataset.group !== g;
  });
}
