/**
 * Turkish translations for spell descriptions, keyed by SRD spell index.
 * Filled in incrementally — a spell missing here just falls back to the English SRD text.
 * Higher-level scaling text (if any) is folded into the same entry, matching how the
 * English description + `higher_level` text are already joined for display.
 */
export const SPELL_DESCRIPTIONS_TR: Record<string, string> = {
  "fire-bolt":
    "Menzil içindeki bir yaratığa veya nesneye bir ateş parçası fırlatırsın. Hedefe menzilli bir büyü saldırısı yap. Vurursan hedef 1d10 ateş hasarı alır. Üzerinde giyilmeyen veya taşınmayan yanıcı bir nesneye isabet ederse tutuşur. 5. seviyeye ulaştığında bu büyünün hasarı 1d10 artar (2d10), 11. seviyede (3d10) ve 17. seviyede (4d10).",
  "cure-wounds":
    "Dokunduğun bir yaratık, 1d8 + büyü yetkinlik değiştiricin kadar can puanı kazanır. Bu büyünün yaşayan ölülere veya yapay canlılara (construct) etkisi yoktur. 2. seviye veya üstü bir büyü yuvasıyla kullanılırsa, iyileştirme her yuva seviyesi için 1d8 artar.",
  "magic-missile":
    "Parlayan üç büyülü güç oku yaratırsın. Her ok, menzil içinde görebildiğin seçtiğin bir yaratığa isabet eder. Her ok hedefine 1d4 + 1 güç (force) hasarı verir. Oklar aynı anda çarpar; hepsini tek bir yaratığa yönlendirebilir ya da aralarında paylaştırabilirsin. 2. seviye veya üstü bir yuvayla kullanılırsa, 1. seviyenin üstündeki her yuva seviyesi için bir ok daha eklenir.",
  shield:
    "Görünmez, büyülü bir güç bariyeri belirir ve seni korur. Sıradaki turunun başlangıcına kadar AC'ne +5 bonus alırsın (bu bonus seni tetikleyen saldırıya karşı da geçerlidir) ve magic missile büyüsünden hasar almazsın.",
  "mage-armor":
    "İsteyerek dokunduğun, zırh giymeyen bir yaratığı büyü bozulana kadar koruyucu bir büyü gücü sarar. Hedefin temel AC'si 13 + Çeviklik değiştiricisi olur. Hedef zırh giyerse veya büyüyü bir aksiyonla iptal edersen büyü sona erer.",
  "mage-hand":
    "Menzil içinde seçtiğin bir noktada hayaletimsi, havada süzülen bir el belirir. El, süre boyunca ya da onu bir aksiyonla iptal edene kadar kalır. Senden 30 fitten uzaklaşırsa ya da büyüyü tekrar okursan kaybolur. Elini kontrol etmek için aksiyonunu kullanabilirsin: bir nesneyi hareket ettirebilir, kilitli olmayan bir kapı ya da kutuyu açabilir, açık bir kaptan eşya alıp koyabilir veya bir şişenin içeriğini dökebilirsin. El, saldıramaz, büyülü eşyaları aktive edemez ve 10 pounddan (~4,5 kg) fazla taşıyamaz.",
  "acid-splash":
    "Bir asit kabarcığı fırlatırsın. Menzildeki bir yaratığı, ya da birbirine 5 fit mesafede olan iki yaratığı hedef alabilirsin. Hedef, başarılı bir Çeviklik kurtarma zarı atamazsa 1d6 asit hasarı alır. 5. seviyeye ulaştığında hasar 1d6 artar (2d6), 11. seviyede (3d6) ve 17. seviyede (4d6).",
  "chill-touch":
    "Menzildeki bir yaratığın bulunduğu noktada hayaletimsi, iskelet bir el yaratırsın. Hedefe menzilli bir büyü saldırısı yap; vurursan hedef 1d8 nekrotik hasar alır ve sıradaki turunun başlangıcına kadar can puanı kazanamaz — el o süre boyunca hedefe yapışık kalır. Yaşayan ölü bir hedefe vurursan, hedef sıradaki turunun sonuna kadar sana karşı yaptığı saldırı zarlarında dezavantajlı olur. 5. seviyeye ulaştığında hasar 1d8 artar (2d8), 11. seviyede (3d8) ve 17. seviyede (4d8).",
  "burning-hands":
    "Başparmakların birbirine değecek, parmakların açık şekilde ellerini tuttuğunda, uzattığın parmak uçlarından ince bir alev tabakası fışkırır. 15 fitlik koni içindeki her yaratık bir Çeviklik kurtarma zarı atmalıdır. Başarısız olan yaratık 3d6 ateş hasarı alır, başarılı olan bunun yarısını alır. Alan içinde üzerinde giyilmeyen veya taşınmayan yanıcı nesneler tutuşur. 2. seviye veya üstü bir yuvayla kullanılırsa, hasar 1. seviyenin üstündeki her yuva seviyesi için 1d6 artar.",
  "healing-word":
    "Menzil içinde görebildiğin seçtiğin bir yaratık, 1d4 + büyü yetkinlik değiştiricin kadar can puanı kazanır. Bu büyünün yaşayan ölülere veya yapay canlılara etkisi yoktur. 2. seviye veya üstü bir yuvayla kullanılırsa, iyileştirme her yuva seviyesi için 1d4 artar.",
};
