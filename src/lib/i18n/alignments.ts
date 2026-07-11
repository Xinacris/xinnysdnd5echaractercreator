export const ALIGNMENT_NAME_TR: Record<string, string> = {
  "lawful-good": "Kanuni İyi",
  "neutral-good": "Tarafsız İyi",
  "chaotic-good": "Kaotik İyi",
  "lawful-neutral": "Kanuni Tarafsız",
  neutral: "Saf Tarafsız",
  "chaotic-neutral": "Kaotik Tarafsız",
  "lawful-evil": "Kanuni Kötü",
  "neutral-evil": "Tarafsız Kötü",
  "chaotic-evil": "Kaotik Kötü",
};

export const ALIGNMENT_NAME_EN: Record<string, string> = {
  "lawful-good": "Lawful Good",
  "neutral-good": "Neutral Good",
  "chaotic-good": "Chaotic Good",
  "lawful-neutral": "Lawful Neutral",
  neutral: "True Neutral",
  "chaotic-neutral": "Chaotic Neutral",
  "lawful-evil": "Lawful Evil",
  "neutral-evil": "Neutral Evil",
  "chaotic-evil": "Chaotic Evil",
};

export function alignmentName(slug: string, language: "en" | "tr"): string {
  return language === "tr" ? ALIGNMENT_NAME_TR[slug] : ALIGNMENT_NAME_EN[slug];
}
