import type { AbilityKey } from "@/lib/i18n/abilities";
import type { SrdEdition } from "@/lib/srd/types";

export type AbilityScoreMethod = "standard" | "pointbuy" | "manual" | "roll";

export type AbilityScoreBlock = Record<AbilityKey, number>;

export interface CharacterClassLevel {
  classIndex: string;
  subclassIndex?: string;
  level: number;
  hitPointRolls: number[]; // one die roll recorded per level gained in this class
}

export interface InventoryItem {
  id: string;
  equipmentIndex?: string;
  magicItemIndex?: string;
  name: string;
  quantity: number;
  equipped: boolean;
  notes?: string;
}

export interface Currency {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface SpellcastingState {
  known: string[]; // spell indices
  prepared: string[]; // spell indices currently prepared (subset of known, for prepared casters)
  slotsUsed: Record<number, number>; // spell level -> slots expended
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface CharacterNotes {
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
  alliesAndOrganizations: string;
  additionalFeatures: string;
}

export interface Character {
  id: string;
  schemaVersion: 1;
  edition: SrdEdition;
  name: string;
  playerName?: string;
  raceIndex: string;
  subraceIndex?: string;
  raceAbilityBonusChoices?: AbilityKey[];
  backgroundIndex?: string;
  customBackgroundName?: string;
  backgroundAbilityScoreChoices?: Partial<AbilityScoreBlock>;
  grantedFeatIndex?: string;
  alignment?: string;
  classes: CharacterClassLevel[];
  /** Scores from array/point-buy/manual/roll assignment, before racial or background bonuses. */
  baseAbilityScores: AbilityScoreBlock;
  /** Final scores (base + racial/background bonuses) — everything else reads from this. */
  abilityScores: AbilityScoreBlock;
  abilityScoreMethod: AbilityScoreMethod;
  skillProficiencies: string[];
  skillExpertise: string[];
  savingThrowProficiencies: string[];
  languages: string[];
  toolProficiencies: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  hitPointsMaxOverride?: number;
  currentHitPoints: number;
  temporaryHitPoints: number;
  hitDiceUsed: number;
  /** Uses of a class's non-spell per-long-rest resource (e.g. Barbarian Rage) spent since the last long rest. */
  rageUsed?: number;
  /** Hit points spent from the Paladin's Lay on Hands pool since the last long rest. */
  layOnHandsUsed?: number;
  /** Uses of Druid Wild Shape spent since the last short or long rest. */
  wildShapeUsed?: number;
  inventory: InventoryItem[];
  currency: Currency;
  spellcasting: SpellcastingState;
  notes: CharacterNotes;
  armorClassOverride?: number;
  inspiration: boolean;
  exhaustionLevel: number;
  deathSaves: DeathSaves;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_ABILITY_SCORES: AbilityScoreBlock = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
};

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const POINT_BUY_BUDGET = 27;
