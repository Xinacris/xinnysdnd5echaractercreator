export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

// English abbreviation stays as the primary label (project convention);
// Turkish full name is shown as supporting text only.
export const ABILITY_FULL_TR: Record<AbilityKey, string> = {
  str: "Kuvvet",
  dex: "Çeviklik",
  con: "Dayanıklılık",
  int: "Zeka",
  wis: "Akıl",
  cha: "Karizma",
};

export const ABILITY_FULL_EN: Record<AbilityKey, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export const ABILITY_ABBR: Record<AbilityKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

export function abilityFullName(key: AbilityKey, language: "en" | "tr"): string {
  return language === "tr" ? ABILITY_FULL_TR[key] : ABILITY_FULL_EN[key];
}
