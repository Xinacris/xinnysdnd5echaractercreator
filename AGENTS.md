<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# D&D 5e/5.5e Karakter Oluşturucu

Next.js (App Router, TypeScript, Tailwind, shadcn/ui) tabanlı bir D&D karakter oluşturucu. Karakterler `localStorage`'da tutulur; depolama bir `CharacterRepository` arayüzü arkasına gizlenmiştir, böylece ileride bir backend eklemek tek bir yeni implementasyon yazmak demektir (UI hiç değişmez).

## Veri kaynağı

SRD verisi `src/data/srd/2014/*.json` (D&D 5e) ve `src/data/srd/2024/*.json` (D&D 5.5e) altında, [5e-bits/5e-database](https://github.com/5e-bits/5e-database) (MIT) reposundan indirildi — Wizards of the Coast'un OGL/ORC ile yayınladığı Systems Reference Document içeriğinin JSON'a çevrilmiş hali. Dosyalar `src/lib/srd/loader.ts` üzerinden `import()` ile lazy/code-split olarak yükleniyor (büyük dosyalar — spells, magic-items — sadece ihtiyaç duyulduğunda indiriliyor).

**2014 ile 2024 SRD şemaları önemli ölçüde farklı.** Bunu atlarsan runtime crash alırsın; aşağıdaki uyumsuzluklar zaten tespit edilip normalize edildi, yeni alan eklerken aynı deseni ara:

| Alan | 2014 şekli | 2024 şekli | Nerede normalize edildi |
|---|---|---|---|
| Trait/Feature açıklaması | `desc: string[]` | `description: string` | `src/lib/srd/text.ts` (`traitDescription`, `featureDescription`, `subclassDescription`) |
| Feature seviyesi | `level: number` | `level: { name: "Barbarian 3" }` | `src/lib/srd/text.ts` (`featureLevel`, regex ile sayıyı çıkarır) |
| Equipment kategorisi | `equipment_category: {index}` | `equipment_categories: [{index}]` (çoğul!) | `src/lib/srd/equipment-adapter.ts` |
| Silah/zırh kategori index'i | `"weapon"`, `armor_category: "Shield"` | `"weapons"`, kategori `"shields"` | `src/lib/srd/equipment-adapter.ts` |
| Class `primary_ability` | yok | `{ desc, ability_scores: SrdRef[] }` (dizi değil, obje) | `step-class.tsx` |
| Skill proficiency ref index'i | `"skill-acrobatics"` (prefix'li) | `"acrobatics"` (bare) | `src/lib/character/proficiency-utils.ts` (`categorizeProficiencyIndex`, her ikisini de tanır) |
| Background yapısı | `feature`, `starting_equipment`, `starting_gold` | `feat`, `equipment_options`, `ability_scores` (üç yetenekten +2/+1 ya da +1/+1/+1 seç) | `src/lib/srd/background-adapter.ts` (`normalizeBackground`) |
| Race → ability bonus | `ability_bonuses` ırkta sabit | Yok — 2024'te bonus tamamen background'dan geliyor | `src/lib/character/ability-bonuses.ts` |
| Subclass seçim seviyesi | Cleric/Sorcerer/Warlock 1, diğerleri 2-3 | Hepsi 3 | Veriden hesaplanıyor: `getSubclassChoiceLevel()` (`levels.json`'da `subclass` alanı olan ilk seviye) — hardcode yok |
| 2024 spells.json | — | Bu veri setinde yok | `loader.ts`: 2024 için büyü açıklamaları 2014 dosyasından fallback yapılıyor (mekanikler — slot sayısı, kaç büyü bilindiği — yine 2024 `levels.json`'dan) |

Yeni bir SRD alanı kullanmadan önce **her iki edition'da da gerçek JSON'a bak** (`node -e "console.log(JSON.stringify(require('./src/data/srd/2024/X.json')[0], null, 2))"`), tip tanımına güvenme.

## Türkçe lokalizasyon

- 18 beceri (Animal Handling → Hayvan İdaresi, vb.) `src/lib/i18n/skills.ts` içinde, [5eTürkçe](https://kanguen.github.io) (5etools'un Türkçe forku) topluluk sözlüğünden alındı.
- Ability score kısaltmaları (STR/DEX/...) ve sınıf isimleri **kasıtlı olarak İngilizce** — kullanıcı talebi. Tam Türkçe adları (`Kuvvet`, `Çeviklik`...) `src/lib/i18n/abilities.ts`'te sadece yardımcı/tooltip metni olarak var.
- Alignment çevirileri (`src/lib/i18n/alignments.ts`) resmi bir kaynağa dayanmıyor, makul fan-çevirisi.
- Genel arayüz metinleri component'lerin içine doğrudan Türkçe yazıldı — ayrı bir i18n dictionary/çoklu dil sistemi yok (tek dil hedefi olduğu için gerek görülmedi).

## Mimari

```
src/lib/srd/           SRD şeması, loader (dynamic import + cache), adapter'lar
src/lib/character/     Character domain modeli, hesaplamalar (AC/HP/skill bonus), storage (localStorage repo)
src/lib/i18n/          Türkçe çeviri sözlükleri
src/components/character/wizard/   8 adımlı karakter oluşturma sihirbazı
src/components/character/sheet/    Karakter sayfası panelleri (abilities, combat, inventory, spells, features, notes, level-up dialog)
src/components/character/          Wizard+sheet arası paylaşılan (equipment-choice-picker, reference-choice-picker)
src/app/karakter/yeni/              Yeni karakter sihirbazı sayfası
src/app/karakter/[id]/              Karakter sayfası
```

**Karakter modeli** (`src/lib/character/types.ts`): `abilityScores` her zaman NİHAİ (ırk+background bonusları uygulanmış) değerleri tutar; `baseAbilityScores` bunun öncesindeki (dizi/point-buy/zar) ham değerlerdir. `computeFinalAbilityScores()` ikisini birleştirir. Sihirbazın herhangi bir adımı atlanıp doğrudan Özet'e gidilebildiği için (adım navigasyonu serbest), **Özet adımı bu hesaplamayı kendi başına tekrar yapar** — sadece Yetenek Puanları adımının state effect'ine güvenmez. Yeni bir "türetilmiş alan" eklersen aynı ilkeyi uygula: sihirbazın son adımı, ara adımların çalışmış olmasına güvenmeden doğru sonucu üretebilmeli.

**Equipment seçimleri** SRD'de iç içe geçmiş bir ağaç (`counted_reference` / `multiple` / `choice` / `money` node'ları — bkz. `equipment-choice-picker.tsx`). Recursive bir resolver ile çözülüyor; `money` node'ları `GOLD_SENTINEL_INDEX` ile "sahte eşya" olarak taşınıp tüketici tarafında (`step-equipment.tsx`) altına çevriliyor.

**Seviye atlama** (`level-up-dialog.tsx`) ASI seviyesini ve alt sınıf seçim seviyesini **veriden** tespit eder (feature isminde "Ability Score Improvement" geçen kayıt / `getSubclassChoiceLevel`), class'a göre hardcode yok — bu yüzden Fighter/Rogue'un ekstra ASI'ları veya 2024'ün "hepsi seviye 3" kuralı otomatik doğru çıkıyor.

## Bilinen sınırlamalar / kasıtlı basitleştirmeler

- Multiclass büyü yuvası birleştirme yok — büyü paneli sadece `character.classes[0]` (birincil sınıf) üzerinden hesaplıyor.
- Sınıfa özel AC kuralları (ör. Barbarian Unarmored Defense = 10+DEX+CON) uygulanmıyor; AC genel kural (zırh + DEX, zırh yoksa 10+DEX) ile hesaplanıyor. Kullanıcı "Manuel" AC alanına elle girebilir.
- Magic items envanterde eklenebilir/aranabilir ama mekanik bonusları (attunement, +X silah/zırh) otomatik AC/attack hesabına yansımıyor.
- Custom item oluşturma yok (kullanıcı talebiyle kapsam dışı bırakıldı) — sadece SRD'deki eşyalar seçilebilir.

## Komutlar

```bash
npm run dev      # geliştirme sunucusu
npm run build    # prod build + typecheck
npm run lint     # eslint
```
