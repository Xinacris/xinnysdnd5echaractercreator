import type { SrdBackground, SrdChoice, SrdRef, SrdStartingEquipment } from "./types";

/**
 * The 2024 SRD restructured backgrounds significantly (ability score choices
 * instead of racial bonuses, an Origin Feat, no flavor "feature" text). This
 * normalizes both shapes so the wizard steps don't need edition branching.
 */
export interface NormalizedBackground {
  index: string;
  name: string;
  proficiencyRefs: SrdRef[];
  languageChoice?: SrdChoice;
  fixedEquipment: SrdStartingEquipment[];
  equipmentChoices: SrdChoice[];
  startingGold?: { quantity: number; unit: string };
  featureName?: string;
  featureDesc?: string[];
  abilityScoreOptions?: SrdRef[];
  grantedFeat?: SrdRef;
}

export function normalizeBackground(bg: SrdBackground): NormalizedBackground {
  return {
    index: bg.index,
    name: bg.name,
    proficiencyRefs: bg.starting_proficiencies ?? bg.proficiencies ?? [],
    languageChoice: bg.language_options,
    fixedEquipment: bg.starting_equipment ?? [],
    equipmentChoices: bg.starting_equipment_options ?? bg.equipment_options ?? [],
    startingGold: bg.starting_gold,
    featureName: bg.feature?.name,
    featureDesc: bg.feature?.desc,
    abilityScoreOptions: bg.ability_scores,
    grantedFeat: bg.feat,
  };
}
