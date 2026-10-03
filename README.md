# F1 Telemetri

Formula 1 yarışlarını veriyle takip eden **gayriresmi hayran sitesi**. Türkçe (kök) ve İngilizce (`/en/`) olarak iki dilde,
tamamen statik HTML/CSS/JS — sunucu gerektirmez, GitHub Pages üzerinde doğrudan çalışır.

> Resmi Formula 1 sitesi değildir; Formula 1, FIA veya takımlarla bağlantısı yoktur. Resmi logo/marka kullanılmaz.

---

## Bölümler

| Bölüm | Adres (TR / EN) | İçerik |
|---|---|---|
| Ana sayfa | `/` · `/en/` | Şampiyona lideri, sıradaki yarış (geri sayım), son yarış podyumu, ilk 10 pilot ve takım |
| Sezon | `/sezon/2026/` · `/en/season/2026/` | Puan grafiği (pilot seçilebilir), pilot ve takım tabloları, yarış yarış sonuç ısı tablosu |
| Yarışlar | `/yaris/<yıl>/` · `/en/races/<yıl>/` | 2000–2026 arası sezonlar; her yarışın kendi sayfası |
| Yarış sayfası | `/yaris/2026/azerbaycan/` vb. | Hafta sonu programı, yarış sonucu, tur süreleri grafiği, lastik stratejisi, pit-stop'lar, sıralama (Q1–Q3), sprint, antrenmanlar (FP1–FP3), enerji yönetimi tahmini |
| Haberler | `/haberler/` · `/en/news/` | Veriden otomatik üretilen yarış/sıralama raporları + kaynaklı derleme haberler (pilotlar, FIA, teknik, takımlar) |
| Takvim | `/takvim/` · `/en/calendar/` | Tüm oturumlar, ziyaretçinin kendi saat diliminde; takvime eklemek için `.ics` dosyaları (15 dk önce hatırlatma) |
| Araçlar | `/araclar/` · `/en/cars/` | 11 takımın 2026 aracı: teknik özellikler, kural değişiklikleri, "araç nasıl?" performans puanları |
| Üyelik | `/hesap/` · `/en/account/` | Üye girişi, bildirim tercihleri (demo: tarayıcıda saklanır) |
| Mağaza | `/urunler/`, `/sepet/` · `/en/shop/`, `/en/basket/` | Taraftar ürünleri (deneme — satış yapılmaz) |

## Öne çıkan özellikler

- **İki dil:** Türkçe ve İngilizce, klasör adları dahil çevrili; `hreflang` bağlantıları.
- **Yerel saat:** Tüm oturum saatleri ziyaretçinin saat dilimine otomatik çevrilir.
- **Tur analizi:** Pit, güvenlik aracı ve yavaş turlar gizlenebilir; sektör ve tempo özeti.
- **Lastik stratejisi:** Stint çubukları, hamur türü, pit sayısı, en iyi pit şeridi süresi.
- **Bildirimler:** Oturumdan 15 dakika önce hatırlatma (demo modunda sekme açıkken).
- **SEO:** `sitemap.xml`, `robots.txt`, yapılandırılmış veri (schema.org), paylaşım kartları.

## Çalıştırma

Site statiktir; herhangi bir statik sunucuyla açılabilir:

```bash
npx serve .
# veya
python -m http.server 8000
```

GitHub Pages için: **Settings → Pages → Branch: `main` / root**. (`.nojekyll` dosyası mevcuttur.)

## Veri kaynakları ve lisanslar

- Yarış verileri: [OpenF1](https://openf1.org) ve [Jolpica F1](https://github.com/jolpica/jolpica-f1)
- Pilot ve araç fotoğrafları: [Wikimedia Commons](https://commons.wikimedia.org) (serbest lisanslı, ör. CC BY-SA 4.0); atıflar ilgili sayfalarda
- Bayraklar: [flag-icons](https://github.com/lipis/flag-icons) (MIT)
- Derleme haberler kendi cümlelerimizle yazılmıştır; her haberin altında kaynak bağlantıları vardır

---

*Bu depo sitenin derlenmiş (yayına hazır) halidir.*
