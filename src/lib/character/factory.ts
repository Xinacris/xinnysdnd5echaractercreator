import type { SrdEdition } from "@/lib/srd/types";
import { DEFAULT_ABILITY_SCORES, type Character } from "./types";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `char_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createBlankCharacter(edition: SrdEdition = "2014"): Character {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    schemaVersion: 1,
    edition,
    name: "",
    raceIndex: "",
    classes: [],
    baseAbilityScores: { ...DEFAULT_ABILITY_SCORES },
    abilityScores: { ...DEFAULT_ABILITY_SCORES },
    abilityScoreMethod: "standard",
    skillProficiencies: [],
    skillExpertise: [],
    savingThrowProficiencies: [],
    languages: ["common"],
    toolProficiencies: [],
    armorProficiencies: [],
    weaponProficiencies: [],
    currentHitPoints: 0,
    temporaryHitPoints: 0,
    hitDiceUsed: 0,
    rageUsed: 0,
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    spellcasting: { known: [], prepared: [], slotsUsed: {} },
    notes: {
      personalityTraits: "",
      ideals: "",
      bonds: "",
      flaws: "",
      backstory: "",
      alliesAndOrganizations: "",
      additionalFeatures: "",
    },
    inspiration: false,
    exhaustionLevel: 0,
    deathSaves: { successes: 0, failures: 0 },
    createdAt: now,
    updatedAt: now,
  };
}
