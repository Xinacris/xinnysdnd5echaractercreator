# D&D 5e / 5.5e Karakter Oluşturucu

D&D Beyond / zindanlar.com tarzı, tarayıcıda çalışan bir Dungeons & Dragons karakter oluşturucu. Karakterler tarayıcının `localStorage`'ında saklanır; depolama katmanı ileride bir backend'e bağlanabilecek şekilde soyutlanmıştır.

Hem **D&D 5e (2014 SRD)** hem **D&D 5.5e (2024 SRD)** kural setini destekler — karakter oluştururken hangisini kullanacağını seçersin.

## Özellikler

- **Karakter oluşturma sihirbazı**: ırk/tür, sınıf (+ gerektiğinde alt sınıf), yetenek puanı ataması (standart dizi / puan alışverişi / zar / manuel), beceriler, başlangıç ekipmanı (SRD'nin iç içe seçim kurallarını — "(a) zincir zırh ya da (b) deri zırh + uzun yay" gibi — tam destekler), 1. seviyede büyü seçimi.
- **Karakter sayfası**: yetenek puanları, beceriler, kurtulma zarları, can puanı/zırh sınıfı/inisiyatif, vuruş zarları ve kısa/uzun dinlenme, ölüm kurtarma zarları, envanter (arama ile eşya ekleme + para birimi), büyüler (yuva takibi), ırk/sınıf/alt sınıf/background özellikleri, oyuncu notları.
- **Seviye atlama**: can puanı artışı (ortalama ya da zar), yetenek puanı artışı (ASI) ve alt sınıf seçimi doğru seviyelerde otomatik olarak devreye girer; çoklu sınıf (multiclass) eklenebilir.
- **Türkçe arayüz**: genel arayüz ve 18 beceri ismi (Animal Handling → Hayvan İdaresi gibi) Türkçe; sınıf isimleri ve yetenek puanı kısaltmaları (STR/DEX/...) İngilizce bırakıldı.
- **Dışa/içe aktarma**: her karakter JSON olarak indirilebilir ve başka bir tarayıcıya aktarılabilir.

## Başlarken

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresini aç.

```bash
npm run build   # production build
npm run lint    # eslint
```

## Teknoloji

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui (Radix) · localStorage

Oyun verisi [5e-bits/5e-database](https://github.com/5e-bits/5e-database) (MIT lisanslı) üzerinden alınmıştır — Wizards of the Coast'un OGL/ORC ile yayınladığı Systems Reference Document (SRD) 5.1 ve 5.2 içeriğinin yapılandırılmış JSON hali. Bu proje bir SRD türevidir; resmi D&D Beyond veya Wizards of the Coast ürünü değildir.

Geliştirici/AI ajan notları için [AGENTS.md](./AGENTS.md) dosyasına bakabilirsin — özellikle 2014 ve 2024 SRD veri şemaları arasındaki farklar ve mimari kararlar orada belgelendi.
