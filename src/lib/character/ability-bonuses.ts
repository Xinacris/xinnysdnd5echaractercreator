import type { AbilityKey } from "@/lib/i18n/abilities";
import type { SrdRace, SrdSubrace } from "@/lib/srd/types";
import type { AbilityScoreBlock } from "./types";

export function computeFinalAbilityScores(
  base: AbilityScoreBlock,
  race: SrdRace | undefined,
  subrace: SrdSubrace | undefined,
  raceAbilityBonusChoices: AbilityKey[] | undefined,
  backgroundAbilityScoreChoices: Partial<AbilityScoreBlock> | undefined
): AbilityScoreBlock {
  const result: AbilityScoreBlock = { ...base };

  for (const bonus of race?.ability_bonuses ?? []) {
    const key = bonus.ability_score.index as AbilityKey;
    result[key] += bonus.bonus;
  }
  for (const bonus of subrace?.ability_bonuses ?? []) {
    const key = bonus.ability_score.index as AbilityKey;
    result[key] += bonus.bonus;
  }
  for (const key of raceAbilityBonusChoices ?? []) {
    result[key] += 1;
  }
  for (const [key, value] of Object.entries(backgroundAbilityScoreChoices ?? {})) {
    result[key as AbilityKey] += value ?? 0;
  }

  return result;
}
