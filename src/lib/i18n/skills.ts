// Turkish skill names, following the established community glossary used by
// 5eTürkçe (kanguen.github.io), the Turkish fork of 5etools. Ability score
// abbreviations (STR/DEX/CON/INT/WIS/CHA) and class names intentionally stay
// in English per project convention — only the 18 skills are localized.
export const SKILL_NAME_TR: Record<string, string> = {
  acrobatics: "Akrobasi",
  "animal-handling": "Hayvan İdaresi",
  arcana: "Arcana",
  athletics: "Atletizm",
  deception: "Aldatma",
  history: "Tarih",
  insight: "Sezgi",
  intimidation: "Gözdağı",
  investigation: "İnceleme",
  medicine: "Tıp",
  nature: "Doğa",
  perception: "Algı",
  performance: "Performans",
  persuasion: "İkna",
  religion: "Din",
  "sleight-of-hand": "El Çabukluğu",
  stealth: "Gizlenme",
  survival: "Hayatta Kalma",
};

export function translateSkill(index: string, fallbackName: string): string {
  return SKILL_NAME_TR[index] ?? fallbackName;
}
