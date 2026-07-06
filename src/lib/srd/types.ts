// Type definitions for the 5e-bits SRD dataset (2014 "5e" and 2024 "5.5e" editions).
// Mirrors https://github.com/5e-bits/5e-database — MIT-licensed JSON built from the
// D&D 5th Edition System Reference Document (OGL/ORC).

export type SrdEdition = "2014" | "2024";

export interface SrdRef {
  index: string;
  name: string;
  url?: string;
}

export interface SrdCost {
  quantity: number;
  unit: string;
}

// ---------- Ability scores & skills ----------

export interface SrdAbilityScore extends SrdRef {
  full_name: string;
  desc: string[];
}

export interface SrdSkill extends SrdRef {
  desc: string[];
  ability_score: SrdRef;
}

// ---------- Proficiencies ----------

export interface SrdProficiency extends SrdRef {
  type: string;
  classes: SrdRef[];
  races: SrdRef[];
  reference?: SrdRef;
}

// ---------- Classes ----------

export interface SrdOptionSet {
  option_set_type: string;
  options?: unknown[];
  equipment_category?: SrdRef;
  resource_list_url?: string;
}

export interface SrdChoice {
  desc?: string;
  choose: number;
  type: string;
  from: SrdOptionSet;
}

export interface SrdStartingEquipment {
  equipment: SrdRef;
  quantity: number;
}

export interface SrdSpellcasting {
  level: number;
  spellcasting_ability: SrdRef;
  info: { name: string; desc: string[] }[];
}

export interface SrdClass extends SrdRef {
  hit_die: number;
  primary_ability?: { desc: string; ability_scores: SrdRef[] };
  proficiency_choices: SrdChoice[];
  proficiencies: SrdRef[];
  saving_throws: SrdRef[];
  starting_equipment?: SrdStartingEquipment[];
  starting_equipment_options: SrdChoice[];
  class_levels?: string;
  subclasses: SrdRef[];
  spellcasting?: SrdSpellcasting;
  spells?: SrdRef[];
  multi_classing?: {
    prerequisites?: { ability_score: SrdRef; minimum_score: number }[];
    proficiencies?: SrdRef[];
    proficiency_choices?: SrdChoice[];
  };
}

export interface SrdSubclass extends SrdRef {
  class: SrdRef;
  // 2014 SRD shape
  subclass_flavor?: string;
  desc?: string[];
  subclass_levels?: string;
  // 2024 SRD shape
  summary?: string;
  description?: string;
}

export interface SrdLevelSpellcasting {
  cantrips_known?: number;
  spells_known?: number;
  spell_slots_level_1?: number;
  spell_slots_level_2?: number;
  spell_slots_level_3?: number;
  spell_slots_level_4?: number;
  spell_slots_level_5?: number;
  spell_slots_level_6?: number;
  spell_slots_level_7?: number;
  spell_slots_level_8?: number;
  spell_slots_level_9?: number;
  [key: string]: number | undefined;
}

export interface SrdLevel {
  index: string;
  level: number;
  ability_score_bonuses: number;
  prof_bonus: number;
  features: SrdRef[];
  spellcasting?: SrdLevelSpellcasting;
  class_specific?: Record<string, unknown>;
  class: SrdRef;
  subclass?: SrdRef;
}

export interface SrdFeature extends SrdRef {
  // `level` is a plain number in the 2014 SRD, but a reference object
  // (e.g. { name: "Barbarian 3" }) in the 2024 SRD — use featureLevel() to normalize.
  level: number | SrdRef;
  desc?: string[];
  description?: string;
  class: SrdRef;
  subclass?: SrdRef;
}

// ---------- Races / Species ----------

export interface SrdAbilityBonus {
  ability_score: SrdRef;
  bonus: number;
}

export interface SrdRace extends SrdRef {
  speed: number;
  size: string;
  traits: SrdRef[];
  subraces: SrdRef[];
  // 2014 SRD only — absent from the 2024 species schema
  ability_bonuses?: SrdAbilityBonus[];
  ability_bonus_options?: SrdChoice;
  alignment?: string;
  age?: string;
  size_description?: string;
  starting_proficiencies?: SrdRef[];
  starting_proficiency_options?: SrdChoice;
  languages?: SrdRef[];
  language_desc?: string;
  // 2024 species only
  type?: string;
  subspecies?: SrdRef[];
}

export interface SrdSubrace extends SrdRef {
  // 2014 SRD shape
  race?: SrdRef;
  desc?: string;
  ability_bonuses?: SrdAbilityBonus[];
  starting_proficiencies?: SrdRef[];
  racial_traits?: SrdRef[];
  // 2024 SRD shape (subspecies)
  species?: SrdRef;
  traits?: SrdRef[];
  damage_type?: SrdRef;
}

export interface SrdTrait extends SrdRef {
  // 2014 SRD shape
  races?: SrdRef[];
  subraces?: SrdRef[];
  desc?: string[];
  proficiencies?: SrdRef[];
  proficiency_choices?: SrdChoice;
  // 2024 SRD shape
  species?: SrdRef[];
  description?: string;
}

// ---------- Backgrounds ----------

export interface SrdBackground extends SrdRef {
  // 2014 SRD shape
  starting_proficiencies?: SrdRef[];
  language_options?: SrdChoice;
  starting_equipment?: SrdStartingEquipment[];
  starting_equipment_options?: SrdChoice[];
  starting_gold?: { quantity: number; unit: string };
  feature?: { name: string; desc: string[] };
  personality_traits?: SrdChoice;
  ideals?: SrdChoice;
  bonds?: SrdChoice;
  flaws?: SrdChoice;
  // 2024 SRD shape
  ability_scores?: SrdRef[];
  feat?: SrdRef;
  proficiencies?: SrdRef[];
  equipment_options?: SrdChoice[];
}

// ---------- Equipment ----------

export interface SrdDamage {
  damage_dice: string;
  damage_type: SrdRef;
}

export interface SrdEquipment extends SrdRef {
  // 2014 SRD shape
  equipment_category?: SrdRef;
  // 2024 SRD shape
  equipment_categories?: SrdRef[];
  gear_category?: SrdRef;
  weapon_category?: string;
  weapon_range?: string;
  category_range?: string;
  cost: SrdCost;
  damage?: SrdDamage;
  two_handed_damage?: SrdDamage;
  range?: { normal: number; long?: number };
  weight?: number;
  properties?: SrdRef[];
  armor_category?: string;
  armor_class?: { base: number; dex_bonus: boolean; max_bonus?: number };
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  contents?: { item: SrdRef; quantity: number }[];
  desc?: string[];
  special?: string[];
}

export interface SrdEquipmentCategory extends SrdRef {
  equipment: SrdRef[];
}

export interface SrdMagicItem extends SrdRef {
  equipment_category: SrdRef;
  rarity: { name: string };
  variants?: SrdRef[];
  variant?: boolean;
  desc: string[];
}

// ---------- Spells ----------

export interface SrdSpell extends SrdRef {
  desc: string[];
  higher_level?: string[];
  range: string;
  components: string[];
  material?: string;
  ritual: boolean;
  duration: string;
  concentration: boolean;
  casting_time: string;
  level: number;
  attack_type?: string;
  damage?: {
    damage_type?: SrdRef;
    damage_at_slot_level?: Record<string, string>;
    damage_at_character_level?: Record<string, string>;
  };
  dc?: { dc_type: SrdRef; dc_success: string };
  school: SrdRef;
  classes: SrdRef[];
  subclasses: SrdRef[];
}

export interface SrdFeat extends SrdRef {
  prerequisites?: unknown[];
  desc: string[];
}

export interface SrdLanguage extends SrdRef {
  type: string;
  typical_speakers: string[];
  script?: string;
}
