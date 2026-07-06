import type { AbilityKey } from "@/lib/i18n/abilities";
import type { Character } from "./types";

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function totalCharacterLevel(character: Pick<Character, "classes">): number {
  return character.classes.reduce((sum, c) => sum + c.level, 0);
}

export function proficiencyBonus(totalLevel: number): number {
  return Math.floor((Math.max(totalLevel, 1) - 1) / 4) + 2;
}

export function skillBonus(
  abilityScore: number,
  profBonus: number,
  isProficient: boolean,
  hasExpertise: boolean
): number {
  const mod = abilityModifier(abilityScore);
  if (hasExpertise) return mod + profBonus * 2;
  if (isProficient) return mod + profBonus;
  return mod;
}

export function savingThrowBonus(abilityScore: number, profBonus: number, isProficient: boolean): number {
  const mod = abilityModifier(abilityScore);
  return isProficient ? mod + profBonus : mod;
}

export function passivePerception(perceptionBonus: number): number {
  return 10 + perceptionBonus;
}

export interface ClassHitDie {
  classIndex: string;
  hitDie: number;
}

/** Average hit points per level above 1st, per SRD fixed-HP rule (die/2 + 1, rounded down). */
export function averageHpForDie(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1;
}

export function maxHitPoints(
  character: Pick<Character, "classes" | "hitPointsMaxOverride">,
  hitDiceByClass: ClassHitDie[],
  conModifier: number
): number {
  if (character.hitPointsMaxOverride !== undefined) return character.hitPointsMaxOverride;

  let total = 0;
  let levelsSoFar = 0;
  for (const cls of character.classes) {
    const die = hitDiceByClass.find((h) => h.classIndex === cls.classIndex)?.hitDie ?? 8;
    for (let i = 0; i < cls.level; i++) {
      const isFirstCharacterLevel = levelsSoFar === 0;
      const roll = cls.hitPointRolls[i];
      const hpFromDie = isFirstCharacterLevel ? die : roll && roll > 0 ? roll : averageHpForDie(die);
      total += hpFromDie + conModifier;
      levelsSoFar++;
    }
  }
  return Math.max(1, total);
}

export interface ArmorClassInput {
  dexModifier: number;
  equippedArmorClass?: { base: number; dexBonus: boolean; maxDexBonus?: number };
  hasShield?: boolean;
  miscBonus?: number;
  /** Class feature that replaces the "no armor" base AC (e.g. Barbarian/Monk Unarmored Defense). */
  unarmoredDefense?: { abilityModifier: number; allowShield: boolean };
}

export function computeArmorClass({
  dexModifier,
  equippedArmorClass,
  hasShield,
  miscBonus = 0,
  unarmoredDefense,
}: ArmorClassInput): number {
  let ac: number;
  if (equippedArmorClass) {
    const dexBonus = equippedArmorClass.dexBonus
      ? equippedArmorClass.maxDexBonus !== undefined
        ? Math.min(dexModifier, equippedArmorClass.maxDexBonus)
        : dexModifier
      : 0;
    ac = equippedArmorClass.base + dexBonus;
  } else if (unarmoredDefense && !(hasShield && !unarmoredDefense.allowShield)) {
    ac = 10 + dexModifier + unarmoredDefense.abilityModifier;
  } else {
    ac = 10 + dexModifier;
  }
  if (hasShield) ac += 2;
  return ac + miscBonus;
}

/** Classes whose "Unarmored Defense" feature replaces the flat 10-base AC with an extra ability modifier. Not SRD data — a fixed 5e/5.5e rule, same across editions. */
const UNARMORED_DEFENSE_BY_CLASS: Partial<Record<string, { ability: AbilityKey; allowShield: boolean }>> = {
  barbarian: { ability: "con", allowShield: true },
  monk: { ability: "wis", allowShield: false },
};

export function unarmoredDefenseRule(classIndexes: string[]): { ability: AbilityKey; allowShield: boolean } | null {
  for (const classIndex of classIndexes) {
    const rule = UNARMORED_DEFENSE_BY_CLASS[classIndex];
    if (rule) return rule;
  }
  return null;
}

export function abilityScoreArray(character: Pick<Character, "abilityScores">): Record<AbilityKey, number> {
  return character.abilityScores;
}

export function spellSaveDc(profBonus: number, spellcastingAbilityMod: number): number {
  return 8 + profBonus + spellcastingAbilityMod;
}

export function spellAttackBonus(profBonus: number, spellcastingAbilityMod: number): number {
  return profBonus + spellcastingAbilityMod;
}

export function initiativeBonus(dexModifier: number): number {
  return dexModifier;
}

export function totalHitDice(character: Pick<Character, "classes">): number {
  return totalCharacterLevel(character);
}
